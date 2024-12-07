'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { GripVertical, Pencil, Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Column {
  id: string
  name: string
  position: number
  board_id: string
  created_at: string
}

interface ColumnReorderModalProps {
  isOpen: boolean
  onClose: () => void
  columns: Column[]
  onReorder: (newColumns: Column[]) => void
}

export function ColumnReorderModal({ 
  isOpen, 
  onClose, 
  columns, 
  onReorder 
}: ColumnReorderModalProps) {
  const [orderedColumns, setOrderedColumns] = useState(columns)
  const [draggedNodeWidth, setDraggedNodeWidth] = useState<number | null>(null)
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const supabase = createClient()

  const handleDragStart = (start: any) => {
    const draggedNode = document.getElementById(`column-${start.draggableId}`)
    if (draggedNode) {
      setDraggedNodeWidth(draggedNode.offsetWidth)
    }
  }

  const handleDragEnd = (result: any) => {
    setDraggedNodeWidth(null)
    if (!result.destination) return

    const items = Array.from(orderedColumns)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    const updatedColumns = items.map((col, index) => ({
      ...col,
      position: index
    }))

    setOrderedColumns(updatedColumns)
  }

  const handleStartEditing = (column: Column) => {
    setEditingColumnId(column.id)
    setEditingName(column.name)
  }

  const handleSaveColumnName = (columnId: string) => {
    if (!editingName.trim()) return

    setOrderedColumns(current =>
      current.map(col =>
        col.id === columnId
          ? { ...col, name: editingName.trim() }
          : col
      )
    )
    setEditingColumnId(null)
  }

  const handleCancelEditing = () => {
    setEditingColumnId(null)
    setEditingName('')
  }

  const handleSaveOrder = async () => {
    try {
      const updates = orderedColumns.map(column => ({
        id: column.id,
        position: column.position,
        board_id: column.board_id,
        name: column.name
      }))

      const { error } = await supabase
        .from('columns')
        .upsert(updates, {
          onConflict: 'id',
          defaultToNull: false
        })
        .select()

      if (error) throw error

      onReorder(orderedColumns)
      onClose()
    } catch (error) {
      console.error('Error updating columns:', error)
      setOrderedColumns(columns)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Columns" isDragContext>
      <div className="relative">
        <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <Droppable droppableId="columns" direction="vertical">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2 min-h-[200px]"
              >
                {orderedColumns.map((column, index) => (
                  <Draggable 
                    key={column.id} 
                    draggableId={column.id} 
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        id={`column-${column.id}`}
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`
                          flex items-center gap-3 p-3 rounded-lg
                          ${snapshot.isDragging 
                            ? 'bg-gray-100 dark:bg-gray-800 shadow-lg' 
                            : 'bg-white dark:bg-gray-900'
                          }
                          border border-gray-200 dark:border-gray-700
                          transform-none
                        `}
                        style={{
                          ...provided.draggableProps.style,
                          position: snapshot.isDragging ? 'fixed' : 'relative',
                          width: snapshot.isDragging && draggedNodeWidth 
                            ? `${draggedNodeWidth}px` 
                            : '100%',
                          zIndex: snapshot.isDragging ? 9999 : 'auto',
                        }}
                      >
                        <div 
                          {...provided.dragHandleProps}
                          className="text-gray-400 dark:text-gray-600 cursor-grab active:cursor-grabbing"
                        >
                          <GripVertical className="w-5 h-5" />
                        </div>
                        
                        {editingColumnId === column.id ? (
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="flex-1 px-2 py-1 text-sm bg-white dark:bg-gray-800 
                                border border-gray-200 dark:border-gray-700 rounded"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveColumnName(column.id)
                                if (e.key === 'Escape') handleCancelEditing()
                              }}
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveColumnName(column.id)}
                              className="p-1 text-green-500 hover:bg-green-500/10 rounded"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleCancelEditing}
                              className="p-1 text-red-500 hover:bg-red-500/10 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex-1 flex items-center justify-between">
                            <span className="font-medium">
                              {column.name}
                            </span>
                            <button
                              onClick={() => handleStartEditing(column)}
                              className="p-1 text-gray-400 hover:text-gray-600 
                                dark:text-gray-600 dark:hover:text-gray-400 
                                hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border rounded hover:bg-gray-100 
              dark:border-gray-700 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveOrder}
            className="px-4 py-2 text-sm bg-white text-gray-900 rounded 
              hover:bg-gray-100"
          >
            Save Order
          </button>
        </div>
      </div>
    </Modal>
  )
} 