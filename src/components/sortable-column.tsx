import { Droppable } from 'react-beautiful-dnd';
import { SortableCard } from './sortable-card';
import { Plus, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react'
import { css } from '@emotion/css'

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
  position: number
  created_at: string
  due_date: string | null
}

interface SortableColumnProps {
  column: Column
  cards: Card[]
  onAddCard: () => void
  onDeleteCard: (id: string) => void
  onUpdateCard: (cardId: string, data: {
    title: string
    description: string
    color: string | null
    due_date: string | null
  }) => Promise<void>
  onEdit: () => void
}

// Add this CSS class to prevent transform animations on non-dragging items
const noTransformClass = css`
  & > div[data-rbd-draggable-context-id] {
    transform: none !important;
  }
`

export function SortableColumn({ column, cards, onAddCard, onDeleteCard, onUpdateCard, onEdit }: SortableColumnProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const COLLAPSED_CARD_COUNT = 4
  const hasMoreCards = cards.length > COLLAPSED_CARD_COUNT

  const visibleCards = isExpanded ? cards : cards.slice(0, COLLAPSED_CARD_COUNT)

  return (
    <div className="w-80 flex-shrink-0 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 touch-none border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">{column.name}</h3>
          {cards.length > 0 && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {cards.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onAddCard}
            className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={onEdit}
            className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      <Droppable 
        droppableId={column.id} 
        type="card"
        direction="vertical"
      >
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              min-h-[8rem] rounded-lg p-2 touch-none
              ${snapshot.isDraggingOver ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}
              ${noTransformClass}
            `}
          >
            <div className="grid gap-2">
              {visibleCards.map((card, index) => (
                <SortableCard
                  key={card.id}
                  card={card}
                  index={index}
                  onDelete={() => onDeleteCard(card.id)}
                  onUpdate={onUpdateCard}
                />
              ))}
            </div>
            {provided.placeholder}

            {hasMoreCards && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full py-2 px-3 mt-2 text-sm text-gray-600 dark:text-gray-400 
                  hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg
                  flex items-center justify-center gap-1 transition-colors"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Show {cards.length - COLLAPSED_CARD_COUNT} more
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
} 