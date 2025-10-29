'use client'

import { useState, useEffect } from 'react'
import { Calendar, X, Plus } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Modal } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'

const DEFAULT_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#3b82f6', // blue
]

interface Tag {
  id: string
  name: string
  color: string | null
}

interface CardEditorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: {
    title: string
    description: string
    color: string | null
    due_date: string | null
    tags: string[]
  }) => void
  columnName?: string
  initialData?: {
    title: string
    description: string
    color: string | null
    due_date: string | null
    tags?: string[]
  }
  availableTags?: Tag[]
  onCreateTag?: (name: string) => Promise<Tag>
  isEditing?: boolean
  boardId?: string
}

function formatDateForInput(dateString: string | null | undefined): string {
  if (!dateString) return ''
  return new Date(dateString).toISOString().split('T')[0]
}

const ensureBoardPassword = async (supabase: any, boardId: string) => {
  const storedPassword = localStorage.getItem(`board_password_${boardId}`)
  if (!storedPassword) return false

  try {
    await supabase.rpc('verify_and_set_board_password', {
      board_id_param: boardId,
      password_attempt: storedPassword
    })
    return true
  } catch (error) {
    console.error('Error setting board password:', error)
    return false
  }
}

export default function CardEditor({
  isOpen,
  onClose,
  onSave,
  columnName,
  initialData,
  availableTags = [],
  onCreateTag,
  isEditing,
  boardId,
}: CardEditorProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [color, setColor] = useState(initialData?.color || '')
  const [dueDate, setDueDate] = useState(formatDateForInput(initialData?.due_date))
  const [isPreview, setIsPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.tags || [])
  const [newTagName, setNewTagName] = useState('')
  const supabase = createClient()

  useEffect(() => {
    if (isOpen) {
      setTitle(initialData?.title || '')
      setDescription(initialData?.description || '')
      setColor(initialData?.color || '')
      setDueDate(formatDateForInput(initialData?.due_date))
      setIsPreview(false)
      setSelectedTags(initialData?.tags || [])
      setNewTagName('')
    }
  }, [isOpen, initialData])

  const handleAddTag = async () => {
    if (!newTagName.trim() || !onCreateTag) return

    try {
      const newTag = await onCreateTag(newTagName.trim())
      setSelectedTags(prev => [...prev, newTag.id])
      setNewTagName('')
    } catch (error) {
      console.error('Failed to create tag:', error)
    }
  }

  const handleRemoveTag = (tagId: string) => {
    setSelectedTags(prev => prev.filter(id => id !== tagId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    try {
      // Ensure password is set before saving
      if (boardId) {
        await ensureBoardPassword(supabase, boardId)
      }

      await onSave({
        title,
        description,
        color: color || null,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        tags: selectedTags,
      })
      onClose()
    } catch (error) {
      console.error('Failed to save card:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={isEditing ? 'Edit Card' : columnName ? `Add Card to ${columnName}` : 'Add Card'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="card-title" className="block text-sm font-medium mb-1">Title</label>
          <input
            id="card-title"
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
            <label htmlFor="card-description" className="block text-sm font-medium">Description</label>
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
              id="card-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border rounded dark:border-gray-700 dark:bg-gray-900 min-h-[100px]"
              placeholder="Supports markdown formatting"
            />
          )}
        </div>

        <div>
          <label htmlFor="card-color" className="block text-sm font-medium mb-1">Color</label>
          <div className="flex gap-2 mb-2">
            {DEFAULT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full ${
                  color === c ? 'ring-2 ring-offset-2 bg-gray-100' : ''
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <input
            id="card-color"
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full p-2 border rounded dark:border-gray-700 dark:bg-gray-900"
            placeholder="Custom color (hex)"
            pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
          />
        </div>

        <div>
          <label htmlFor="card-due-date" className="block text-sm font-medium mb-1">Due Date</label>
          <input
            id="card-due-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full p-2 border rounded dark:border-gray-700 dark:bg-gray-900"
          />
        </div>

        <div>
          <label htmlFor="card-tags" className="block text-sm font-medium mb-1">Tags</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedTags.map(tagId => {
              const tag = availableTags.find(t => t.id === tagId)
              if (!tag) return null
              
              return (
                <div 
                  key={tag.id}
                  className="flex items-center gap-1 px-2 py-1 rounded-full text-sm"
                  style={{ 
                    backgroundColor: tag.color || '#e5e7eb',
                    color: tag.color ? 'white' : 'black'
                  }}
                >
                  {tag.name}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag.id)}
                    className="p-0.5 hover:bg-black/10 rounded-full"
                    aria-label={`Remove ${tag.name} tag`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )
            })}
          </div>
          
          <div className="flex gap-2">
            <input
              id="card-tags"
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              className="flex-1 p-2 border rounded dark:border-gray-700 dark:bg-gray-900"
              placeholder="Add new tag"
            />
            <button
              type="button"
              onClick={handleAddTag}
              disabled={!newTagName.trim()}
              className="px-3 py-2 border rounded hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-700"
              aria-label="Add tag"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          {availableTags.length > 0 && (
            <div className="mt-2">
              <div className="text-sm text-gray-500 mb-1">Available tags:</div>
              <div className="flex flex-wrap gap-1">
                {availableTags
                  .filter(tag => !selectedTags.includes(tag.id))
                  .map(tag => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => setSelectedTags(prev => [...prev, tag.id])}
                      className="px-2 py-1 rounded-full text-sm"
                      style={{ 
                        backgroundColor: tag.color || '#e5e7eb',
                        color: tag.color ? 'white' : 'black'
                      }}
                    >
                      {tag.name}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm border rounded hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-700 font-medium"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm bg-white text-gray-900 rounded hover:bg-gray-300 disabled:opacity-50 font-medium"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Card'}
          </button>
        </div>
      </form>
    </Modal>
  )
} 