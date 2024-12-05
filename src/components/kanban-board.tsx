'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DndContext, DragOverlay, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, verticalListSortingStrategy, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { Plus, MoreVertical, Pencil, Check, X } from 'lucide-react'
import { Modal } from '@/components/ui'
import { SortableColumn } from './sortable-column'
import { SortableCard } from './sortable-card'
import CardEditor from './card-editor'

interface Board {
  id: string
  name: string
  created_at: string
}

interface Column {
  id: string
  board_id: string
  name: string
  position: number
  created_at: string
}

interface Card {
  id: string
  column_id: string
  title: string
  description: string | null
  color: string | null
  due_date: string | null
  position: number
  created_at: string
}

interface CardHistory {
  id: string
  card_id: string
  from_column: string
  to_column: string
  timestamp: string
}

interface ColumnEditorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string) => void
}

function ColumnEditor({ isOpen, onClose, onSave }: ColumnEditorProps) {
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(name)
    setName('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Column">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Column Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded dark:border-gray-700 dark:bg-gray-900"
            required
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm border rounded hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Column
          </button>
        </div>
      </form>
    </Modal>
  )
}

function ColumnDropArea({ columnId, isOver }: { columnId: string; isOver: boolean }) {
  return (
    <div 
      className={`h-24 rounded-lg border-2 border-dashed transition-colors mb-2
        ${isOver 
          ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/20' 
          : 'border-gray-200 dark:border-gray-700'
        }`}
    />
  )
}

function CardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2"></div>
    </div>
  )
}

function Column({ column, cards, onAddCard, onDeleteCard, isDraggingCard }: {
  column: Column
  cards: Card[]
  onAddCard: () => void
  onDeleteCard: (id: string) => void
  isDraggingCard: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: 'column',
      column,
    },
  })

  return (
    <div
      ref={setNodeRef}
      className="w-80 flex-shrink-0 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 
        border border-gray-200/50 dark:border-gray-700/50"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-gray-900 dark:text-gray-100">
          {column.name}
        </h3>
        <button
          onClick={onAddCard}
          className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2">
        {isDraggingCard && cards.length === 0 && (
          <ColumnDropArea columnId={column.id} isOver={isOver} />
        )}
        
        {cards.map((card, index) => (
          <SortableCard
            key={card.id}
            card={card}
            onDelete={() => onDeleteCard(card.id)}
          />
        ))}
        
        {isDraggingCard && cards.length > 0 && (
          <ColumnDropArea columnId={column.id} isOver={isOver} />
        )}
      </div>
    </div>
  )
}

export default function KanbanBoard({ 
  boardId, 
  cards,
  setCards,
  activeId,
  activeType,
  setActiveId,
  setActiveType
}: { 
  boardId: string
  cards: Card[]
  setCards: React.Dispatch<React.SetStateAction<Card[]>>
  activeId: string | null
  activeType: 'column' | 'card' | null
  setActiveId: (id: string | null) => void
  setActiveType: (type: 'column' | 'card' | null) => void
}) {
  const [boardData, setBoardData] = useState<Board | null>(null)
  const [isEditingName, setIsEditingName] = useState(false)
  const [newBoardName, setNewBoardName] = useState('')
  const boardNameInputRef = useRef<HTMLInputElement>(null)
  const [columns, setColumns] = useState<Column[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddingColumn, setIsAddingColumn] = useState(false)
  const [addingCardToColumn, setAddingCardToColumn] = useState<string | null>(null)
  const cardListRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    const fetchBoardData = async () => {
      setLoading(true)
      
      // Fetch board data
      const { data: board } = await supabase
        .from('boards')
        .select('id, name')
        .eq('id', boardId)
        .single()

      if (board) {
        setBoardData({
          id: board.id,
          name: board.name,
          created_at: new Date().toISOString()
        })
        setNewBoardName(board.name)
      }

      // Fetch columns and cards, excluding Backlog column
      const { data: columnsData } = await supabase
        .from('columns')
        .select('*')
        .eq('board_id', boardId)
        .neq('name', 'Backlog')
        .order('position')

      const { data: cardsData } = await supabase
        .from('cards')
        .select()
        .in('column_id', (columnsData || []).map(col => col.id))
        .order('position')

      if (columnsData) setColumns(columnsData)
      if (cardsData) setCards(cardsData)
      setLoading(false)
    }

    fetchBoardData()
  }, [boardId])

  useEffect(() => {
    // Set up real-time subscription for card changes
    const channel = supabase
      .channel('card_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cards',
          filter: `column_id=neq.null`
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setCards(currentCards => 
              currentCards.filter(card => card.id !== payload.old.id)
            )
          } else if (payload.eventType === 'INSERT') {
            setCards(currentCards => [...currentCards, payload.new as Card])
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
  }, [boardId])

  const handleBoardNameEdit = () => {
    setIsEditingName(true)
    setTimeout(() => {
      boardNameInputRef.current?.focus()
      boardNameInputRef.current?.select()
    }, 0)
  }

  const handleBoardNameSave = async () => {
    if (!newBoardName.trim() || !boardData) return
    
    const { error } = await supabase
      .from('boards')
      .update({ name: newBoardName.trim() })
      .eq('id', boardId)

    if (!error) {
      setBoardData({ ...boardData, name: newBoardName.trim() })
      setIsEditingName(false)
    }
  }

  const handleBoardNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBoardNameSave()
    } else if (e.key === 'Escape') {
      setNewBoardName(boardData?.name || '')
      setIsEditingName(false)
    }
  }

  const handleDragStart = ({ active }: any) => {
    setActiveId(active.id)
    setActiveType(active.data.current?.type)
  }

  const handleDragEnd = async ({ active, over }: any) => {
    if (!over) {
      setActiveId(null)
      setActiveType(null)
      return
    }

    if (activeType === 'column' && active.id !== over.id) {
      const oldIndex = columns.findIndex((col) => col.id === active.id)
      const newIndex = columns.findIndex((col) => col.id === over.id)
      
      const updatedColumns = arrayMove(columns, oldIndex, newIndex)
      setColumns(updatedColumns)

      // Update positions in database
      await Promise.all(
        updatedColumns.map((col, index) =>
          supabase
            .from('columns')
            .update({ position: index })
            .eq('id', col.id)
        )
      )
    } else if (activeType === 'card') {
      const activeCard = active.data.current.card
      if (!activeCard) return

      // Get the destination column ID
      let destColumnId: string | undefined

      // If dropping on a card, use its column ID
      const overCard = cards.find(card => card.id === over.id)
      if (overCard) {
        destColumnId = overCard.column_id
      } else {
        // If dropping in a column directly
        const overColumn = columns.find(col => col.id === over.id)
        if (overColumn) {
          destColumnId = overColumn.id
        }
      }

      // Validate destination column
      if (!destColumnId || !columns.find(col => col.id === destColumnId)) {
        console.error('Invalid destination column')
        return
      }

      // Get all cards in the destination column
      const destColumnCards = cards.filter(card => card.column_id === destColumnId)
      
      // Calculate new position
      const newPosition = destColumnCards.length

      try {
        // Update the card in the database
        const { error } = await supabase
          .from('cards')
          .update({
            column_id: destColumnId,
            position: newPosition
          })
          .eq('id', activeCard.id)

        if (error) throw error

        // Update local state
        setCards(currentCards => {
          // If card is from backlog, add it to the board
          if (!currentCards.find(c => c.id === activeCard.id)) {
            return [...currentCards, { ...activeCard, column_id: destColumnId, position: newPosition }]
          }
          // Otherwise update existing card
          return currentCards.map(card =>
            card.id === activeCard.id
              ? { ...card, column_id: destColumnId, position: newPosition }
              : card
          )
        })

        // Record history
        const sourceCol = activeCard.column_id ? columns.find(col => col.id === activeCard.column_id)?.name : 'Backlog'
        const destCol = columns.find(col => col.id === destColumnId)
        
        if (destCol) {
          await supabase
            .from('card_history')
            .insert({
              card_id: activeCard.id,
              from_column: sourceCol,
              to_column: destCol.name
            })
        }
      } catch (error) {
        console.error('Error updating card positions:', error)
      }
    }

    setActiveId(null)
    setActiveType(null)
  }

  const handleAddColumn = async (name: string) => {
    const newPosition = columns.length
    const { data: column } = await supabase
      .from('columns')
      .insert({
        board_id: boardId,
        name,
        position: newPosition,
      })
      .select()
      .single()

    if (column) {
      setColumns([...columns, column])
    }
  }

  const handleAddCard = async (columnId: string, cardData: {
    title: string
    description: string
    color: string | null
    due_date: string | null
  }) => {
    const newPosition = cards.filter(card => card.column_id === columnId).length

    const { data: card } = await supabase
      .from('cards')
      .insert({
        column_id: columnId,
        title: cardData.title,
        description: cardData.description,
        color: cardData.color,
        due_date: cardData.due_date,
        position: newPosition,
      })
      .select()
      .single()

    if (card) {
      setCards([...cards, card])
      
      // Scroll the new card into view
      setTimeout(() => {
        const cardElement = document.getElementById(`card-${card.id}`)
        cardElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 100)
    }
  }

  const handleDeleteCard = async (cardId: string) => {
    try {
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', cardId)

      if (error) throw error

      // Update local state
      setCards(currentCards => currentCards.filter(card => card.id !== cardId))
    } catch (error) {
      console.error('Error deleting card:', error)
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading board...</div>
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-8 flex items-center gap-4">
        {isEditingName ? (
          <div className="flex items-center gap-2">
            <input
              ref={boardNameInputRef}
              type="text"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              onKeyDown={handleBoardNameKeyDown}
              className="text-2xl font-semibold bg-transparent border-b-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 outline-none px-1 py-0.5"
              placeholder="Board name"
            />
            <button
              onClick={handleBoardNameSave}
              className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
            >
              <Check className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                setNewBoardName(boardData?.name || '')
                setIsEditingName(false)
              }}
              className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {boardData?.name || 'Untitled Board'}
            </h1>
            <button
              onClick={handleBoardNameEdit}
              className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={columns.map(col => col.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div 
            className="flex gap-4 overflow-x-auto pb-4 relative snap-x scrollbar-hide"
            data-type="board"
          >
            <div 
              className="flex gap-4 flex-nowrap min-w-fit"
              data-type="columns-container"
            >
              {columns.map((column) => (
                <Column
                  key={column.id}
                  column={column}
                  cards={cards.filter(card => card.column_id === column.id)}
                  onAddCard={() => setAddingCardToColumn(column.id)}
                  onDeleteCard={handleDeleteCard}
                  isDraggingCard={activeType === 'card'}
                />
              ))}

              <button
                onClick={() => setIsAddingColumn(true)}
                className="h-fit self-start w-48 flex-shrink-0 p-3 bg-gray-100/50 dark:bg-gray-800/50 rounded-lg 
                  hover:bg-gray-200 dark:hover:bg-gray-700/50 snap-start border border-gray-200/50 dark:border-gray-700/50
                  text-gray-600 dark:text-gray-400 text-sm transition-colors"
              >
                <span className="flex items-center justify-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  Add column
                </span>
              </button>
            </div>
          </div>
        </SortableContext>

        <DragOverlay dropAnimation={{
          duration: 200,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}>
          {activeId && activeType === 'column' && (
            <div className="w-80 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
              {columns.find(col => col.id === activeId)?.name}
            </div>
          )}
          {activeId && activeType === 'card' && (
            <div className="w-80">
              {cards.find(card => card.id === activeId) && (
                <div className="bg-white dark:bg-gray-700/50 p-4 rounded-lg shadow-lg border border-gray-100 dark:border-gray-600/50 rotate-[-2deg]">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    {cards.find(card => card.id === activeId)?.title}
                  </h4>
                  {cards.find(card => card.id === activeId)?.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {cards.find(card => card.id === activeId)?.description}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {addingCardToColumn && (
        <CardEditor
          isOpen={true}
          onClose={() => setAddingCardToColumn(null)}
          onSave={(cardData) => handleAddCard(addingCardToColumn, cardData)}
          columnName={columns.find(col => col.id === addingCardToColumn)?.name || ''}
        />
      )}

      <ColumnEditor
        isOpen={isAddingColumn}
        onClose={() => setIsAddingColumn(false)}
        onSave={handleAddColumn}
      />
    </div>
  )
} 