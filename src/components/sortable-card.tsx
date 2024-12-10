'use client'

import { useState } from 'react'
import { Draggable } from 'react-beautiful-dnd'
import { Trash2 } from 'lucide-react'
import CardEditor from './card-editor'
import { Modal } from '@/components/ui'

interface Card {
  id: string
  title: string
  description: string | null
  color: string | null
  position: number
  due_date: string | null
}

interface SortableCardProps {
  card: Card
  index: number
  onDelete: (cardId: string) => void
  onUpdate?: (cardId: string, data: {
    title: string
    description: string
    color: string | null
    due_date: string | null
  }) => Promise<void>
}

const formatDueDate = (dueDate: string) => {
  // Create date object from PostgreSQL timestamp and adjust for timezone
  const due = new Date(dueDate);
  const dueUTC = new Date(due.getTime() + due.getTimezoneOffset() * 60000);
  
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

  // Reset all times to start of day in local timezone
  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  dayAfterTomorrow.setHours(0, 0, 0, 0);
  dueUTC.setHours(0, 0, 0, 0);

  if (dueUTC.getTime() === today.getTime()) return 'today';
  if (dueUTC.getTime() === tomorrow.getTime()) return 'tomorrow';
  if (dueUTC.getTime() === dayAfterTomorrow.getTime()) return 'in 2 days';
  
  return dueUTC.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const getDueDateColor = (dueDate: string) => {
  const due = new Date(dueDate);
  const dueUTC = new Date(due.getTime() + due.getTimezoneOffset() * 60000);
  
  const today = new Date();
  const twoDaysFromNow = new Date(today);
  twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
  twoDaysFromNow.setHours(23, 59, 59, 999);

  return dueUTC.getTime() <= twoDaysFromNow.getTime()
    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
};

export function SortableCard({ card, index, onDelete, onUpdate }: SortableCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  let clickTimeout: NodeJS.Timeout

  const handleClick = () => {
    // Don't open editor if we're dragging
    if (!isDragging) {
      setIsEditing(true)
    }
  }

  const handleDragStart = () => {
    setIsDragging(true)
    // Clear any pending click
    if (clickTimeout) clearTimeout(clickTimeout)
  }

  const handleDragEnd = () => {
    // Reset drag state after a short delay to prevent click event
    setTimeout(() => {
      setIsDragging(false)
    }, 100)
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowDeleteConfirm(true)
  }

  return (
    <>
      <Draggable draggableId={card.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            onClick={handleClick}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            className={`
              group relative
              bg-white dark:bg-gray-900 p-3 rounded-lg
              border border-gray-200/50 dark:border-gray-700/50
              shadow-sm hover:shadow-md
              ${snapshot.isDragging ? 'shadow-xl ring-2 ring-blue-500/20' : ''}
              transition-all duration-200
              cursor-grab active:cursor-grabbing
            `}
          >
            {card.color && (
              <div 
                className="absolute top-0 left-0 right-0 h-1 rounded-t-lg"
                style={{ backgroundColor: card.color }}
              />
            )}

            <div className={`${card.color ? 'pt-2' : ''}`}>
              <div className="flex justify-between items-start gap-2">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {card.title}
                </h4>
                <button
                  onClick={handleDeleteClick}
                  className="p-1 opacity-0 group-hover:opacity-100 
                    text-gray-400 hover:text-red-500 
                    hover:bg-red-50 dark:hover:bg-red-900/20
                    rounded transition-all duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {card.description && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2 break-words">
                  {card.description}
                </p>
              )}
              
              {card.due_date && (
                <div className="mt-2">
                  <span className={`
                    inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                    ${getDueDateColor(card.due_date)}
                  `}>
                    {formatDueDate(card.due_date)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </Draggable>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Card"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Are you sure you want to delete "{card.title}"? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 
                hover:bg-gray-100 dark:hover:bg-gray-800 
                rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onDelete(card.id)
                setShowDeleteConfirm(false)
              }}
              className="px-4 py-2 text-sm text-white bg-red-500 
                hover:bg-red-600 rounded-lg transition-colors"
            >
              Delete Card
            </button>
          </div>
        </div>
      </Modal>

      {/* Card Editor Modal */}
      {isEditing && (
        <CardEditor
          isOpen={isEditing}
          onClose={() => setIsEditing(false)}
          onSave={async (data) => {
            if (onUpdate) {
              await onUpdate(card.id, data)
            }
            setIsEditing(false)
          }}
          initialData={{
            title: card.title,
            description: card.description || '',
            color: card.color,
            due_date: card.due_date || null
          }}
        />
      )}
    </>
  )
}