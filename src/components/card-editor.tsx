'use client'

import { useState, useEffect } from 'react'
import { Calendar } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Modal } from '@/components/ui'

const DEFAULT_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#3b82f6', // blue
]

interface CardEditorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (card: {
    title: string
    description: string
    color: string | null
    due_date: string | null
  }) => Promise<void>
  columnName: string
  initialCard?: {
    title: string
    description: string
    color: string | null
    due_date: string | null
  }
}

export default function CardEditor({
  isOpen,
  onClose,
  onSave,
  columnName,
  initialCard,
}: CardEditorProps) {
  const [title, setTitle] = useState(initialCard?.title || '')
  const [description, setDescription] = useState(initialCard?.description || '')
  const [color, setColor] = useState(initialCard?.color || '')
  const [dueDate, setDueDate] = useState(initialCard?.due_date || '')
  const [isPreview, setIsPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setTitle(initialCard?.title || '')
      setDescription(initialCard?.description || '')
      setColor(initialCard?.color || '')
      setDueDate(initialCard?.due_date || '')
      setIsPreview(false)
    }
  }, [isOpen, initialCard])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await onSave({
        title,
        description,
        color: color || null,
        due_date: dueDate || null,
      })
      onClose()
    } catch (error) {
      console.error('Failed to save card:', error)
      // You might want to show an error message to the user here
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add Card to ${columnName}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded dark:border-gray-700 dark:bg-gray-900"
            required
            autoFocus
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium">Description</label>
            <button
              type="button"
              onClick={() => setIsPreview(!isPreview)}
              className="text-sm text-blue-500 hover:text-blue-600"
            >
              {isPreview ? 'Edit' : 'Preview'}
            </button>
          </div>
          {isPreview ? (
            <div className="prose dark:prose-invert max-w-none p-2 border rounded dark:border-gray-700 min-h-[100px]">
              <ReactMarkdown>{description}</ReactMarkdown>
            </div>
          ) : (
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border rounded dark:border-gray-700 dark:bg-gray-900 min-h-[100px]"
              placeholder="Supports markdown formatting"
              required
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Color</label>
          <div className="flex gap-2 mb-2">
            {DEFAULT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full ${
                  color === c ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <input
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full p-2 border rounded dark:border-gray-700 dark:bg-gray-900"
            placeholder="Custom color (hex)"
            pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Due Date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full p-2 border rounded dark:border-gray-700 dark:bg-gray-900"
            required
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm border rounded hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-700"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Card'}
          </button>
        </div>
      </form>
    </Modal>
  )
} 