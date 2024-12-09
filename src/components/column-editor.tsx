'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui'

interface ColumnEditorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string) => Promise<void>
}

export default function ColumnEditor({ isOpen, onClose, onSave }: ColumnEditorProps) {
  const [name, setName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSaving(true)
    try {
      await onSave(name.trim())
      setName('')
      onClose()
    } catch (error) {
      console.error('Error saving column:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Column">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label 
            htmlFor="columnName" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Column Name
          </label>
          <input
            id="columnName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            placeholder="Enter column name"
            required
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={isSaving}
          >
            {isSaving ? 'Adding...' : 'Add Column'}
          </button>
        </div>
      </form>
    </Modal>
  )
}