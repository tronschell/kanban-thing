import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { MoreVertical, Plus, ChevronDown } from 'lucide-react'
import { SortableCard } from './sortable-card'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

interface Column {
  id: string
  name: string
  board_id: string
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

interface SortableColumnProps {
  column: Column
  cards: Card[]
  onAddCard: () => void
  onDeleteCard: (cardId: string) => void
}

const CARDS_TO_SHOW = 5

export function SortableColumn({ column, cards, onAddCard, onDeleteCard }: SortableColumnProps) {
  const [showAll, setShowAll] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    over,
  } = useSortable({
    id: column.id,
    data: {
      type: 'column',
      column: column,
      droppable: {
        accepts: ['card']
      }
    },
  })

  console.log('Column drop state:', {
    columnId: column.id,
    isOver: over,
    columnName: column.name
  });

  const sortedCards = [...cards].sort((a, b) => a.position - b.position)
  const visibleCards = showAll ? sortedCards : sortedCards.slice(0, CARDS_TO_SHOW)
  const hasMoreCards = sortedCards.length > CARDS_TO_SHOW

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`w-80 flex-shrink-0 ${isDragging ? 'opacity-50' : ''}`}
    >
      <div 
        className={`
          bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 h-full 
          border border-gray-200/50 dark:border-gray-700/50
          ${over ? 'ring-2 ring-blue-500/50 bg-blue-50/20' : ''}
          transition-all duration-200
        `}
      >
        <div
          {...attributes}
          {...listeners}
          className="flex justify-between items-center mb-6 cursor-grab active:cursor-grabbing"
        >
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              {column.name}
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {cards.length}
            </span>
          </div>
          <button className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        <div 
          className={`
            space-y-2 min-h-[100px]
            ${over ? 'bg-blue-50/50 dark:bg-blue-900/10 rounded-lg transition-colors duration-200 p-2' : ''}
          `}
        >
          <SortableContext
            items={sortedCards.map(card => card.id)}
            strategy={verticalListSortingStrategy}
          >
            {visibleCards.map((card) => (
              <SortableCard
                key={card.id}
                card={card}
                containerId={column.id}
                onDelete={onDeleteCard}
              />
            ))}
          </SortableContext>
        </div>

        {hasMoreCards && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full mt-2 p-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors flex items-center gap-1 justify-center"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${showAll ? 'rotate-180' : ''}`} />
            {showAll ? 'Show less' : `Show ${sortedCards.length - CARDS_TO_SHOW} more`}
          </button>
        )}

        <button
          onClick={onAddCard}
          className="w-full mt-4 p-2.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors flex items-center gap-2 justify-center font-medium"
        >
          <Plus className="w-4 h-4" />
          Add a card
        </button>
      </div>
    </div>
  )
} 