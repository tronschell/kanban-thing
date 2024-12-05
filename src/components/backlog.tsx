'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/types'
import { DndContext, DragOverlay, closestCenter, useSensor, useSensors, PointerSensor } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, GripVertical, Trash2, Pencil } from 'lucide-react'
import CardEditor from './card-editor'
import { ContextMenu } from '@/components/ui/context-menu'

interface SortableBacklogCardProps {
  card: Card
  onDelete: (cardId: string) => void
  columns: Array<{ id: string; name: string }>
  onMoveToColumn: (cardId: string, columnId: string) => void
}

function SortableBacklogCard({ 
  card, 
  onDelete, 
  columns, 
  onMoveToColumn
}: SortableBacklogCardProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: 'card',
      card,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onContextMenu={handleContextMenu}
        className={`
          group flex items-center gap-3 bg-white dark:bg-gray-800 p-4 rounded-lg 
          border border-gray-200/50 dark:border-gray-700/50
          ${isDragging ? 'shadow-lg ring-2 ring-blue-400 dark:ring-blue-500' : ''}
        `}
      >
        <div className="text-gray-400 dark:text-gray-600 cursor-grab active:cursor-grabbing">
          <GripVertical className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
            {card.title}
          </h3>
          {card.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
              {card.description}
            </p>
          )}
        </div>
        {card.color && (
          <div 
            className="w-2 h-2 rounded-full flex-shrink-0" 
            style={{ backgroundColor: card.color }} 
          />
        )}
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(card.id)
            }}
            className="p-1.5 text-gray-400 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          columns={columns}
          onSelect={(columnId) => {
            onMoveToColumn(card.id, columnId)
            setContextMenu(null)
          }}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  )
}

function BacklogDropIndicator({ isOver }: { isOver: boolean }) {
  return (
    <div
      className={`
        h-16 rounded-lg border-2 border-dashed transition-colors mb-2
        ${isOver 
          ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/20' 
          : 'border-gray-200/50 dark:border-gray-700/50'
        }
      `}
    />
  )
}

export default function Backlog({ 
  boardId, 
  cards,
  setCards,
  columns,
  onMoveCard,
  activeId,
}: { 
  boardId: string, 
  cards: Card[],
  setCards: React.Dispatch<React.SetStateAction<Card[]>>,
  columns: Array<{ id: string; name: string }>,
  onMoveCard: (cardId: string, columnId: string) => Promise<void>,
  activeId: string | null
}) {
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [editingCard, setEditingCard] = useState<Card | null>(null)
  const [backlogColumnId, setBacklogColumnId] = useState<string | null>(null)
  const supabase = createClient()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  useEffect(() => {
    const initializeBacklog = async () => {
      // Get or create backlog column using correct query structure
      const { data: columns, error: fetchError } = await supabase
        .from('columns')
        .select('id, name, board_id')
        .eq('board_id', boardId)
        .eq('name', 'Backlog')

      if (fetchError) {
        console.error('Error fetching backlog column:', fetchError)
        return
      }

      if (columns && columns.length > 0) {
        setBacklogColumnId(columns[0].id)
      } else {
        // Create backlog column if it doesn't exist
        const { data: newColumn, error: createError } = await supabase
          .from('columns')
          .insert({
            board_id: boardId,
            name: 'Backlog',
            position: -1
          })
          .select('id')
          .single()

        if (createError) {
          console.error('Error creating backlog column:', createError)
          return
        }

        if (newColumn) {
          setBacklogColumnId(newColumn.id)
        }
      }
    }

    initializeBacklog()
  }, [boardId])

  useEffect(() => {
    if (!backlogColumnId) return

    const fetchBacklogCards = async () => {
      // Fetch cards using correct query structure based on metadata
      const { data: cards, error } = await supabase
        .from('cards')
        .select(`
          id,
          title,
          description,
          color,
          due_date,
          position,
          created_at,
          column_id
        `)
        .eq('column_id', backlogColumnId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching backlog cards:', error)
        return
      }

      if (cards) {
        setCards(cards)
      }
    }

    fetchBacklogCards()

    // Set up subscription with correct filter
    const channel = supabase
      .channel('backlog_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cards',
          filter: `column_id=eq.${backlogColumnId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setCards(currentCards => [payload.new as Card, ...currentCards])
          } else if (payload.eventType === 'DELETE') {
            setCards(currentCards => 
              currentCards.filter(card => card.id !== payload.old.id)
            )
          } else if (payload.eventType === 'UPDATE') {
            setCards(currentCards =>
              currentCards.map(card =>
                card.id === payload.new.id ? { ...card, ...payload.new } : card
              )
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [backlogColumnId])

  const handleAddCard = async (cardData: {
    title: string
    description: string
    color: string | null
    due_date: string | null
  }) => {
    if (!backlogColumnId) return

    try {
      const { data: card, error } = await supabase
        .from('cards')
        .insert({
          title: cardData.title,
          description: cardData.description || null,
          color: cardData.color || null,
          due_date: cardData.due_date ? new Date(cardData.due_date).toISOString() : null,
          column_id: backlogColumnId,
          position: cards.length
        })
        .select()
        .single()

      if (error) throw error
      setIsAddingCard(false)
    } catch (error) {
      console.error('Error adding card to backlog:', error)
    }
  }

  const handleDeleteCard = async (cardId: string) => {
    try {
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', cardId)

      if (error) throw error

      // Update local state immediately
      setCards(currentCards => currentCards.filter(card => card.id !== cardId))
    } catch (error) {
      console.error('Error deleting card:', error)
    }
  }

  const handleEditCard = async (cardData: {
    title: string
    description: string
    color: string | null
    due_date: string | null
  }) => {
    if (!editingCard) return

    try {
      // Update local state immediately for instant feedback
      setCards(currentCards =>
        currentCards.map(card =>
          card.id === editingCard.id
            ? {
                ...card,
                title: cardData.title,
                description: cardData.description || null,
                color: cardData.color || null,
                due_date: cardData.due_date ? new Date(cardData.due_date).toISOString() : null,
              }
            : card
        )
      )

      // Then update in database
      const { error } = await supabase
        .from('cards')
        .update({
          title: cardData.title,
          description: cardData.description || null,
          color: cardData.color || null,
          due_date: cardData.due_date ? new Date(cardData.due_date).toISOString() : null,
        })
        .eq('id', editingCard.id)

      if (error) throw error
      setEditingCard(null)
    } catch (error) {
      console.error('Error updating card:', error)
      // Revert local state on error by refetching
      const { data } = await supabase
        .from('cards')
        .select('*')
        .eq('column_id', backlogColumnId)
        .order('created_at', { ascending: false })

      if (data) setCards(data)
    }
  }

  const handleMoveToColumn = async (cardId: string, columnId: string) => {
    await onMoveCard(cardId, columnId)
  }

  const handleDragEnd = async ({ active, over }: any) => {
    if (!over || active.id === over.id) return

    const oldIndex = cards.findIndex((card: Card) => card.id === active.id)
    const newIndex = cards.findIndex((card: Card) => card.id === over.id)

    const newCards = arrayMove(cards, oldIndex, newIndex)
    setCards(newCards)

    // Update positions in database
    try {
      await Promise.all(
        newCards.map((card: Card, index: number) =>
          supabase
            .from('cards')
            .update({ position: index })
            .eq('id', card.id)
        )
      )
    } catch (error) {
      console.error('Error updating card positions:', error)
    }
  }

  return (
    <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Backlog
        </h2>
        <button
          onClick={() => setIsAddingCard(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add card
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={cards.map(card => card.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {cards.map((card, index) => (
              <div key={card.id} className="relative">
                {activeId && index === 0 && (
                  <BacklogDropIndicator isOver={false} />
                )}
                <SortableBacklogCard 
                  card={card} 
                  onDelete={handleDeleteCard}
                  columns={columns}
                  onMoveToColumn={handleMoveToColumn}
                />
                {activeId && (
                  <BacklogDropIndicator isOver={false} />
                )}
              </div>
            ))}
            {cards.length === 0 && activeId && (
              <BacklogDropIndicator isOver={false} />
            )}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeId && cards.find(card => card.id === activeId) && (
            <div className="w-full bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-700/50 rotate-[-1deg]">
              <div className="flex items-center gap-3">
                <div className="text-gray-400 dark:text-gray-600">
                  <GripVertical className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    {cards.find(card => card.id === activeId)?.title}
                  </h3>
                  {cards.find(card => card.id === activeId)?.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                      {cards.find(card => card.id === activeId)?.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {(isAddingCard || editingCard) && (
        <CardEditor
          isOpen={true}
          onClose={() => {
            setIsAddingCard(false)
            setEditingCard(null)
          }}
          onSave={editingCard ? handleEditCard : handleAddCard}
          columnName="Backlog"
          initialData={editingCard || undefined}
        />
      )}
    </div>
  )
}