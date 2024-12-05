'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Trash2 } from 'lucide-react'

interface Card {
  id: string
  title: string
  description: string | null
  color: string | null
  due_date: string | null
}

interface SortableCardProps {
  card: Card
  containerId: string
  onDelete: (cardId: string) => void
}

export function SortableCard({ card, containerId, onDelete }: SortableCardProps) {
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
      parent: {
        type: 'column',
        id: containerId
      }
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        group
        bg-white dark:bg-gray-700/50 
        p-4 rounded-lg shadow-sm
        border border-gray-100 dark:border-gray-600/50
        ${isDragging ? 'shadow-xl ring-2 ring-blue-500/20 opacity-50' : ''}
        cursor-grab active:cursor-grabbing
        transform-gpu
      `}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="min-w-0 flex-1">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
            {card.title}
          </h4>
          {card.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {card.description}
            </p>
          )}
          {card.due_date && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Due: {new Date(card.due_date).toLocaleDateString()}
            </div>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            onDelete(card.id)
          }}
          className="p-1.5 text-gray-400 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      {card.color && (
        <div
          className="mt-2 w-full h-1 rounded-full"
          style={{ backgroundColor: card.color }}
        />
      )}
    </div>
  )
} 