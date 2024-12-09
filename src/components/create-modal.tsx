'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui'
import CardEditor from '@/components/card-editor'
import ColumnEditor from '@/components/column-editor'
import { Layout, Plus } from 'lucide-react'

interface CreateModalProps {
  isOpen: boolean
  onClose: () => void
  columns: Array<{ id: string; name: string }>
  onCreateCard: (columnId: string, data: {
    title: string
    description: string
    color: string | null
    due_date: string | null
  }) => Promise<void>
  onCreateColumn: (name: string) => Promise<void>
}

export function CreateModal({
  isOpen,
  onClose,
  columns,
  onCreateCard,
  onCreateColumn
}: CreateModalProps) {
  const [mode, setMode] = useState<'select' | 'card' | 'column'>('select')
  const [selectedColumnId, setSelectedColumnId] = useState<string>('')

  const handleClose = () => {
    setMode('select')
    setSelectedColumnId('')
    onClose()
  }

  if (mode === 'card') {
    return (
      <CardEditor
        isOpen={isOpen}
        onClose={handleClose}
        onSave={async (data) => {
          await onCreateCard(selectedColumnId, data)
          handleClose()
        }}
        columnName={columns.find(c => c.id === selectedColumnId)?.name}
      />
    )
  }

  if (mode === 'column') {
    return (
      <ColumnEditor
        isOpen={isOpen}
        onClose={handleClose}
        onSave={async (name: string) => {
          await onCreateColumn(name)
          handleClose()
        }}
      />
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New">
      <div className="space-y-6">
        {/* Card Creation Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Plus className="w-5 h-5" />
            <h3 className="font-medium">Create a Card</h3>
          </div>
          
          <div className="space-y-3">
            <select
              value={selectedColumnId}
              onChange={(e) => setSelectedColumnId(e.target.value)}
              className="w-full px-3 py-2 bg-transparent border rounded-lg 
                dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-100
                focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/20 
                focus:border-blue-500 dark:focus:border-blue-500
                outline-none transition-all"
            >
              <option value="" className="dark:bg-gray-800">Select a column...</option>
              {columns?.map((column) => (
                <option key={column.id} value={column.id} className="dark:bg-gray-800">
                  {column.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => setMode('card')}
              disabled={!selectedColumnId}
              className="w-full px-4 py-2 text-sm font-medium
                bg-white dark:bg-gray-800 
                text-gray-900 dark:text-gray-100
                border border-gray-200 dark:border-gray-700
                rounded-lg 
                hover:bg-gray-50 dark:hover:bg-gray-700/50
                disabled:opacity-50 disabled:cursor-not-allowed 
                transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/20"
            >
              Create Card
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-700/50"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
              or
            </span>
          </div>
        </div>

        {/* Column Creation Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Layout className="w-5 h-5" />
            <h3 className="font-medium">Create a Column</h3>
          </div>

          <button
            onClick={() => setMode('column')}
            className="w-full px-4 py-2 text-sm font-medium
              bg-gray-50 dark:bg-gray-800/50
              text-gray-900 dark:text-gray-100
              border border-gray-200 dark:border-gray-700
              rounded-lg 
              hover:bg-gray-100 dark:hover:bg-gray-700
              transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/20"
          >
            Create Column
          </button>
        </div>
      </div>
    </Modal>
  )
}