'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DragDropContext, Droppable } from 'react-beautiful-dnd'
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

function Column({ 
  column, 
  cards, 
  onAddCard, 
  onDeleteCard, 
  isDraggingCard,
  activeDropIndex 
}: {
  column: Column
  cards: Card[]
  onAddCard: () => void
  onDeleteCard: (id: string) => void
  isDraggingCard: boolean
  activeDropIndex: number | null
}) {
  return (
    <div className="w-80 flex-shrink-0 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 
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
        {cards.map((card, index) => (
          <div 
            key={card.id}
            className={`
              transition-transform duration-200
              ${activeDropIndex !== null && isDraggingCard ? `
                ${index >= activeDropIndex ? 'translate-y-8' : ''}
                ${index < activeDropIndex ? '-translate-y-8' : ''}
              ` : 'translate-y-0'}
            `}
          >
            <SortableCard
              card={card}
              containerId={column.id}
              onDelete={() => onDeleteCard(card.id)}
              index={index}
            />
          </div>
        ))}

        {/* Drop indicator */}
        {isDraggingCard && activeDropIndex !== null && (
          <div 
            className={`
              absolute left-4 right-4 h-16
              transition-all duration-200
              pointer-events-none
            `}
            style={{
              top: `${activeDropIndex * 40 + 64}px`, // Adjust based on card height
            }}
          >
            <div className="h-1 w-full bg-blue-500/50 rounded-full" />
          </div>
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
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null)
  const [activeDropInfo, setActiveDropInfo] = useState<{
    columnId: string | null;
    index: number | null;
  }>({ columnId: null, index: null });
  const [draggingCard, setDraggingCard] = useState<Card | null>(null);
  const [draggedCard, setDraggedCard] = useState<Card | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isDraggingBetweenColumns, setIsDraggingBetweenColumns] = useState(false);
  const [url, setUrl] = useState<string>('')

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

  useEffect(() => {
    // Set URL after component mounts
    setUrl(`${window.location.origin}/board?id=${boardId}`)

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingBetweenColumns) {
        setMousePosition({ x: e.clientX, y: e.clientY })
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [boardId, isDraggingBetweenColumns])

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

  const handleDragStart = (start: any) => {
    const card = cards.find(c => c.id === start.draggableId);
    if (card) {
      setDraggedCard(card);
    }
  };

  const handleDragUpdate = (update: any) => {
    if (update.destination?.droppableId !== update.source.droppableId) {
      setMousePosition({
        x: update.clientX,
        y: update.clientY
      })
    }
  };

  const handleDragEnd = (result: any) => {
    // Clean up preview
    setDraggedCard(null);

    const { source, destination, draggableId } = result;

    // Dropped outside or same position
    if (!destination) return;
    
    // Find the moved card
    const card = cards.find(c => c.id === draggableId);
    if (!card) return;

    // Create new array and remove card from old position
    const newCards = [...cards];
    const cardIndex = newCards.findIndex(c => c.id === draggableId);
    newCards.splice(cardIndex, 1);

    // Get cards in destination column
    const columnCards = newCards.filter(c => c.column_id === destination.droppableId);
    
    // Calculate new position
    const newPosition = destination.index * 1000;
    
    // Create updated card
    const updatedCard = {
      ...card,
      column_id: destination.droppableId,
      position: newPosition
    };

    // Insert card at new position
    if (destination.droppableId === source.droppableId) {
      // Same column - insert at exact index
      const sameColumnCards = newCards.filter(c => c.column_id === source.droppableId);
      sameColumnCards.splice(destination.index, 0, updatedCard);
      
      // Update all positions in the column
      const updatedColumnCards = sameColumnCards.map((c, index) => ({
        ...c,
        position: index * 1000
      }));

      // Replace old column cards with updated ones
      const finalCards = newCards.filter(c => c.column_id !== source.droppableId)
        .concat(updatedColumnCards);

      // Update UI immediately
      setCards(finalCards);

      // Update database
      try {
        const updates = updatedColumnCards.map(c => ({
          id: c.id,
          column_id: c.column_id,
          position: c.position
        }));

        supabase
          .from('cards')
          .upsert(updates, { onConflict: 'id' });
      } catch (error) {
        console.error('Error updating card positions:', error);
      }
    } else {
      // Different column - handle cross-column movement
      newCards.splice(destination.index, 0, updatedCard);
      
      // Update UI immediately
      setCards(newCards);

      // Update database
      try {
        supabase
          .from('cards')
          .update({ 
            column_id: destination.droppableId,
            position: newPosition
          })
          .eq('id', card.id)
          .then(() => {
            // Update positions of all cards in destination column
            const columnCards = newCards.filter(c => c.column_id === destination.droppableId);
            updateCardPositions(destination.droppableId, columnCards);
          });
      } catch (error) {
        console.error('Error updating card positions:', error);
      }
    }
  };

  const updateCardPositions = async (columnId: string, columnCards: Card[]) => {
    if (!columnId) return

    try {
      const updates = columnCards.map((card, index) => ({
        id: card.id,
        title: card.title,
        column_id: columnId,
        position: index * 1000,
        created_at: card.created_at
      }))

      const { error } = await supabase
        .from('cards')
        .upsert(updates, {
          onConflict: 'id'
        })

      if (error) throw error
    } catch (error) {
      console.error('Error updating card positions:', error)
    }
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

  const handleUpdateCard = async (cardId: string, data: {
    title: string
    description: string
    color: string | null
    due_date: string | null
  }) => {
    try {
      const { error } = await supabase
        .from('cards')
        .update({
          title: data.title,
          description: data.description || null,
          color: data.color,
          due_date: data.due_date
        })
        .eq('id', cardId)

      if (error) throw error

      // Update local state
      setCards(currentCards =>
        currentCards.map(card =>
          card.id === cardId
            ? { ...card, ...data }
            : card
        )
      )
    } catch (error) {
      console.error('Error updating card:', error)
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading board...</div>
  }

  return (
    <div className="flex flex-col gap-6 py-6">
      {/* Board Header */}
      <div className="flex items-center gap-4">
        {isEditingName ? (
          <div className="flex items-center gap-2">
            <input
              ref={boardNameInputRef}
              type="text"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              onBlur={handleBoardNameSave}
              onKeyDown={handleBoardNameKeyDown}
              className="text-2xl font-bold bg-transparent border-b-2 border-blue-500 outline-none text-gray-900 dark:text-white px-1"
              autoFocus
            />
            <button
              onClick={handleBoardNameSave}
              className="p-1 text-green-500 hover:bg-green-500/10 rounded"
            >
              <Check className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                setNewBoardName(boardData?.name || '')
                setIsEditingName(false)
              }}
              className="p-1 text-red-500 hover:bg-red-500/10 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="group flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {boardData?.name || 'Untitled Board'}
            </h1>
            <button
              onClick={handleBoardNameEdit}
              className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-all duration-200"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Board Content */}
      <div className="flex gap-4">
        {columns.map((column) => (
          <SortableColumn
            key={column.id}
            column={column}
            cards={cards.filter(card => card.column_id === column.id)}
            onAddCard={() => setAddingCardToColumn(column.id)}
            onDeleteCard={handleDeleteCard}
          />
        ))}
        
        <button
          onClick={() => setIsAddingColumn(true)}
          className="flex-shrink-0 w-80 h-12 flex items-center justify-center gap-2 
            text-gray-500 dark:text-gray-400
            bg-gray-100/50 dark:bg-gray-800/30 
            hover:bg-gray-200/50 dark:hover:bg-gray-700/30
            rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Column
        </button>
      </div>

      {/* Column Editor Modal */}
      <ColumnEditor
        isOpen={isAddingColumn}
        onClose={() => setIsAddingColumn(false)}
        onSave={async (name) => {
          await handleAddColumn(name)
          setIsAddingColumn(false)
        }}
      />

      {/* Card Editor Modal */}
      {addingCardToColumn && (
        <CardEditor
          isOpen={true}
          onClose={() => setAddingCardToColumn(null)}
          onSave={async (data) => {
            if (addingCardToColumn) {
              await handleAddCard(addingCardToColumn, data)
              setAddingCardToColumn(null)
            }
          }}
          columnName={columns.find(c => c.id === addingCardToColumn)?.name}
        />
      )}
    </div>
  )
} 