'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/types'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { Plus, GripVertical, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import CardEditor from './card-editor'
import dynamic from 'next/dynamic'

// Dynamic import for ContextMenu with no SSR
const ContextMenu = dynamic(
  () => import('@/components/ui/context-menu'),
  { ssr: false }
)

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
  onMoveToColumn,
  index
}: SortableBacklogCardProps & { index: number }) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (columns && columns.length > 0) {
      setContextMenu({ x: e.clientX, y: e.clientY })
    }
  }

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <>
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            onContextMenu={handleContextMenu}
            className={`
              group flex items-center gap-3 p-4 rounded-lg 
              ${snapshot.isDragging 
                ? 'bg-white/90 dark:bg-gray-800/90 shadow-lg ring-2 ring-blue-400 dark:ring-blue-500' 
                : 'bg-white dark:bg-gray-800 border border-gray-200/50 dark:border-gray-700/50'
              }
              cursor-pointer
            `}
            style={provided.draggableProps.style}
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
                className={`
                  p-1.5 text-gray-400 hover:text-red-500 dark:text-gray-600 
                  dark:hover:text-red-400 rounded-lg hover:bg-gray-100 
                  dark:hover:bg-gray-700/50 transition-all
                  ${snapshot.isDragging ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}
                `}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <AnimatePresence>
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
          </AnimatePresence>
        </>
      )}
    </Draggable>
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

// Add proper type for the payload
interface ColumnPayload {
  eventType: 'INSERT' | 'DELETE' | 'UPDATE'
  new: { id: string; name: string }
  old: { id: string }
}

export default function Backlog({ 
  boardId, 
  cards,
  setCards,
  activeId,
}: { 
  boardId: string
  cards: Card[]
  setCards: React.Dispatch<React.SetStateAction<Card[]>>
  activeId: string | null
}) {
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [backlogColumnId, setBacklogColumnId] = useState<string | null>(null)
  const [boardColumns, setBoardColumns] = useState<Array<{ id: string; name: string }>>([])
  const supabase = createClient()

  // First, initialize or fetch the backlog column
  useEffect(() => {
    const initializeBacklog = async () => {
      // Try to find existing backlog column
      const { data: columns, error: fetchError } = await supabase
        .from('columns')
        .select('id, name')
        .eq('board_id', boardId)
        .eq('name', 'Backlog')
        .single()

      if (fetchError && fetchError.code === 'PGRST116') {
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
      } else if (columns) {
        setBacklogColumnId(columns.id)
      }
    }

    initializeBacklog()
  }, [boardId])

  // Then fetch cards when we have the backlog column ID
  useEffect(() => {
    if (!backlogColumnId) return

    const fetchBacklogCards = async () => {
      const { data: backlogCards, error } = await supabase
        .from('cards')
        .select(`
          id,
          title,
          description,
          color,
          position,
          created_at,
          column_id,
          due_date
        `)
        .eq('column_id', backlogColumnId)
        .order('position', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching backlog cards:', error)
        return
      }

      if (backlogCards) {
        setCards(backlogCards)
      }
    }

    fetchBacklogCards()

    // Set up realtime subscription
    const channel = supabase
      .channel('backlog_cards')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cards',
          filter: `column_id=eq.${backlogColumnId}`
        },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            setCards(current => [...current, payload.new])
          } else if (payload.eventType === 'DELETE') {
            setCards(current => current.filter(card => card.id !== payload.old.id))
          } else if (payload.eventType === 'UPDATE') {
            setCards(current =>
              current.map(card =>
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

  // Add effect to fetch board columns for context menu
  useEffect(() => {
    const fetchBoardColumns = async () => {
      const { data: columns, error } = await supabase
        .from('columns')
        .select('id, name')
        .eq('board_id', boardId)
        .neq('name', 'Backlog') // Exclude backlog from move options
        .order('position')

      if (error) {
        console.error('Error fetching board columns:', error)
        return
      }

      if (columns) {
        setBoardColumns(columns)
      }
    }

    fetchBoardColumns()

    // Subscribe to column changes
    const channel = supabase
      .channel('board_columns')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'columns',
          filter: `board_id=eq.${boardId}`
        },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            setBoardColumns(current => [...current, payload.new])
          } else if (payload.eventType === 'DELETE') {
            setBoardColumns(current => 
              current.filter(col => col.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [boardId])

  const handleAddCard = async (cardData: {
    title: string
    description: string
    color: string | null
    due_date: string | null
  }) => {
    if (!backlogColumnId) return

    try {
      const { data: newCard, error } = await supabase
        .from('cards')
        .insert({
          title: cardData.title,
          description: cardData.description || null,
          color: cardData.color || null,
          due_date: cardData.due_date ? new Date(cardData.due_date).toISOString() : null,
          column_id: backlogColumnId,
          position: cards.length
        })
        .select('*')  // Select all fields to get the complete card data
        .single()

      if (error) throw error

      // Update local state with the new card
      if (newCard) {
        setCards(currentCards => [...currentCards, newCard])
      }
      
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

  const handleMoveToColumn = async (cardId: string, columnId: string) => {
    try {
      // Update the card's column
      const { error } = await supabase
        .from('cards')
        .update({ 
          column_id: columnId,
          position: 0 // Put at the top of the new column
        })
        .eq('id', cardId)

      if (error) throw error

      // Update local state
      setCards(current => current.filter(card => card.id !== cardId))
    } catch (error) {
      console.error('Error moving card:', error)
    }
  }

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return

    const oldIndex = result.source.index
    const newIndex = result.destination.index

    const newCards = Array.from(cards)
    const [removed] = newCards.splice(oldIndex, 1)
    newCards.splice(newIndex, 0, removed)
    
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
    <div>
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

      <Droppable 
          droppableId="backlog" 
          direction="vertical"
          type="card"
        >
          {(provided, snapshot) => (
            <div 
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="space-y-2 rbd-draggable-context"
            >
              {cards.map((card, index) => (
                <SortableBacklogCard
                  key={card.id}
                  card={card}
                  index={index}
                  onDelete={handleDeleteCard}
                  columns={boardColumns}
                  onMoveToColumn={handleMoveToColumn}
                />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>

        {isAddingCard && (
          <CardEditor
            isOpen={true}
            onClose={() => setIsAddingCard(false)}
            onSave={handleAddCard}
          columnName="Backlog"
        />
      )}
    </div>
  )
}