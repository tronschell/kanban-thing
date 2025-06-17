'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DragDropContext, Droppable } from 'react-beautiful-dnd'
import { Plus, MoreVertical, Pencil, Check, X, Settings } from 'lucide-react'
import { Modal } from '@/components/ui'
import { SortableColumn } from './sortable-column'
import { SortableCard } from './sortable-card'
import CardEditor from './card-editor'
import { ColumnReorderModal } from './column-reorder-modal'

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
  tags?: Tag[]
}

interface Tag {
  id: string
  board_id: string
  name: string
  color: string
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
            className="px-4 py-2 text-sm bg-white text-gray-900 rounded hover:bg-gray-100"
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
  onUpdateCard,
  isDraggingCard,
  activeDropIndex 
}: {
  column: Column
  cards: Card[]
  onAddCard: () => void
  onDeleteCard: (id: string) => void
  onUpdateCard: (cardId: string, data: any) => Promise<void>
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
              index={index}
              onDelete={() => onDeleteCard(card.id)}
              onUpdate={onUpdateCard}
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
  setActiveType,
  columns,
  setColumns
}: { 
  boardId: string
  cards: Card[]
  setCards: React.Dispatch<React.SetStateAction<Card[]>>
  activeId: string | null
  activeType: 'column' | 'card' | null
  setActiveId: (id: string | null) => void
  setActiveType: (type: 'column' | 'card' | null) => void
  columns: Column[]
  setColumns: React.Dispatch<React.SetStateAction<Column[]>>
}) {
  const [boardData, setBoardData] = useState<Board | null>(null)
  const [isEditingName, setIsEditingName] = useState(false)
  const [newBoardName, setNewBoardName] = useState('')
  const boardNameInputRef = useRef<HTMLInputElement>(null)
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
  const [isReorderingColumns, setIsReorderingColumns] = useState(false)
  const [availableTags, setAvailableTags] = useState<Tag[]>([])

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

      // Fetch cards with their tags
      const { data: cardsData } = await supabase
        .from('cards')
        .select(`
          *,
          card_tags (
            tag_id,
            tags (
              id,
              name,
              color,
              board_id,
              created_at
            )
          )
        `)
        .in('column_id', (columnsData || []).map(col => col.id))
        .order('position')

      // Fetch all tags for this board
      const { data: tagsData } = await supabase
        .from('tags')
        .select('*')
        .eq('board_id', boardId)
        .order('name')

      if (columnsData) setColumns(columnsData)
      if (tagsData) setAvailableTags(tagsData)
      
      if (cardsData) {
        // Transform the cards data to include tags array
        const cardsWithTags = cardsData.map((card: any) => ({
          ...card,
          tags: card.card_tags?.map((ct: any) => ct.tags).filter(Boolean) || []
        }))
        setCards(cardsWithTags)
      }
      setLoading(false)
    }

    fetchBoardData()
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

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const sourceColumnId = source.droppableId;
    const destColumnId = destination.droppableId;

    // Create a new array of cards
    const newCards = Array.from(cards);
    
    // Find all cards in the source column
    const sourceColumnCards = newCards.filter(card => card.column_id === sourceColumnId);
    // Find all cards in the destination column
    const destColumnCards = sourceColumnId === destColumnId 
      ? sourceColumnCards 
      : newCards.filter(card => card.column_id === destColumnId);

    // Remove the dragged card from its source position
    const [movedCard] = sourceColumnCards.splice(source.index, 1);
    
    // If moving to a different column, update the column_id
    if (sourceColumnId !== destColumnId) {
      movedCard.column_id = destColumnId;
    }

    // Insert the card in its new position
    destColumnCards.splice(destination.index, 0, movedCard);

    // Update positions for all affected cards
    const updatedCards = newCards.map(card => {
      if (card.column_id === sourceColumnId) {
        const index = sourceColumnCards.findIndex(c => c.id === card.id);
        return index !== -1 ? { ...card, position: index } : card;
      }
      if (card.column_id === destColumnId) {
        const index = destColumnCards.findIndex(c => c.id === card.id);
        return index !== -1 ? { ...card, position: index } : card;
      }
      return card;
    });

    // Update local state
    setCards(updatedCards);

    // Update database
    try {
      const updates = updatedCards
        .filter(card => 
          card.column_id === sourceColumnId || 
          card.column_id === destColumnId
        )
        .map(card => ({
          id: card.id,
          position: card.position,
          column_id: card.column_id
        }));

      const { error } = await supabase
        .from('cards')
        .upsert(updates, { onConflict: 'id' });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating card positions:', error);
      // Optionally revert the state if the update fails
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
    // Generate a temporary ID for optimistic update
    const tempId = `temp-${Date.now()}`
    const newPosition = columns.length

    // Create new column object
    const newColumn: Column = {
      id: tempId,
      board_id: boardId,
      name,
      position: newPosition,
      created_at: new Date().toISOString()
    }

    // Update local state immediately (optimistic update)
    setColumns(prevColumns => [...prevColumns, newColumn])

    try {
      // Then update the database
      const { data: persistedColumn, error } = await supabase
        .from('columns')
        .insert({
          board_id: boardId,
          name,
          position: newPosition,
        })
        .select()
        .single()

      if (error) throw error

      if (persistedColumn) {
        // Update the local state again with the real ID and data from the database
        setColumns(prevColumns => 
          prevColumns.map(col => 
            col.id === tempId ? persistedColumn : col
          )
        )
      }
    } catch (error) {
      console.error('Error creating column:', error)
      // Rollback optimistic update on error
      setColumns(prevColumns => 
        prevColumns.filter(col => col.id !== tempId)
      )
      // Optionally show an error message to the user
      alert('Failed to create column. Please try again.')
    }
  }

  const handleCreateTag = async (name: string): Promise<Tag> => {
    const { data: tag, error } = await supabase
      .from('tags')
      .insert({
        board_id: boardId,
        name,
        color: '#3b82f6' // Default blue color
      })
      .select()
      .single()

    if (error) throw error
    if (!tag) throw new Error('Failed to create tag')

    // Update local state
    setAvailableTags(prev => [...prev, tag])
    return tag
  }

  const handleAddCard = async (columnId: string, cardData: {
    title: string
    description: string
    color: string | null
    due_date: string | null
    tags: string[]
  }) => {
    const newPosition = cards.filter(card => card.column_id === columnId).length

    const { data: card, error } = await supabase
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

    if (error) throw error

    if (card && cardData.tags.length > 0) {
      // Add tag relationships
      const tagRelations = cardData.tags.map(tagId => ({
        card_id: card.id,
        tag_id: tagId
      }))

      const { error: tagError } = await supabase
        .from('card_tags')
        .insert(tagRelations)

      if (tagError) {
        console.error('Error adding tags to card:', tagError)
      }
    }

    if (card) {
      // Get the tags for the new card
      const cardTags = availableTags.filter(tag => cardData.tags.includes(tag.id))
      const cardWithTags = { ...card, tags: cardTags }
      
      setCards([...cards, cardWithTags])
      
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
    tags?: string[]
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

      // Update card tags
      if (data.tags) {
        // First, remove all existing tags for this card
        await supabase
          .from('card_tags')
          .delete()
          .eq('card_id', cardId)

        // Then add the new tags
        if (data.tags.length > 0) {
          const tagRelations = data.tags.map(tagId => ({
            card_id: cardId,
            tag_id: tagId
          }))

          const { error: tagError } = await supabase
            .from('card_tags')
            .insert(tagRelations)

          if (tagError) {
            console.error('Error updating card tags:', tagError)
          }
        }
      }

      // Update local state
      const cardTags = availableTags.filter(tag => data.tags?.includes(tag.id))
      setCards(currentCards =>
        currentCards.map(card =>
          card.id === cardId
            ? {
                ...card,
                title: data.title,
                description: data.description,
                color: data.color,
                due_date: data.due_date,
                tags: cardTags
              }
            : card
        )
      )
    } catch (error) {
      console.error('Error updating card:', error)
    }
  }

  const handleReorderColumns = async (newColumns: Column[]) => {
    // Update local state first
    setColumns(newColumns)

    // Then update the database
    try {
      const updates = newColumns.map(column => ({
        id: column.id,
        position: column.position
      }))

      const { error } = await supabase
        .from('columns')
        .upsert(updates, { onConflict: 'id' })

      if (error) throw error
    } catch (error) {
      console.error('Error updating column positions:', error)
      // Optionally revert the state if the update fails
    }
  }

  const handleDeleteColumn = async (columnId: string) => {
    // Optimistic update - remove from UI immediately
    setColumns(prevColumns => prevColumns.filter(col => col.id !== columnId))
    setCards(prevCards => prevCards.filter(card => card.column_id !== columnId))

    try {
      // Background API call
      const response = await fetch(`/api/columns/${columnId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete column')
      }
    } catch (error) {
      console.error('Error deleting column:', error)
      // Rollback on error
      setColumns(prevColumns => [...prevColumns])
      setCards(prevCards => [...prevCards])
      alert('Failed to delete column. Please try again.')
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
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {boardData?.name || 'Untitled Board'}
            </h1>
            <button
              onClick={handleBoardNameEdit}
              className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
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
            onUpdateCard={handleUpdateCard}
            onEdit={() => {
              setIsReorderingColumns(true)
            }}
            availableTags={availableTags}
            onCreateTag={handleCreateTag}
            boardId={boardId}
          />
        ))}
        
        <div className="hidden md:block flex-shrink-0 w-80" />
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
          availableTags={availableTags}
          onCreateTag={handleCreateTag}
          boardId={boardId}
        />
      )}

      {/* Add the reorder modal */}
      <ColumnReorderModal
        isOpen={isReorderingColumns}
        onClose={() => setIsReorderingColumns(false)}
        columns={columns}
        onReorder={handleReorderColumns}
        onDelete={handleDeleteColumn}
      />
    </div>
  )
} 