'use client'

import { useState } from 'react'
import { ClipboardList } from 'lucide-react'
import { Button, Modal, Select } from '@/components/ui'
import BulkAdd from '@/components/bulk-add'
import CardEditor from '@/components/card-editor'
import ColumnEditor from '@/components/column-editor'

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
  onCreateCards: (columnId: string, titles: string[]) => Promise<void>
}

export function CreateModal({
  isOpen,
  onClose,
  columns,
  onCreateCard,
  onCreateColumn,
  onCreateCards,
}: CreateModalProps) {
  const [mode, setMode] = useState<'select' | 'card' | 'column' | 'bulk'>('select')
  const [selectedColumnId, setSelectedColumnId] = useState('')

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
        columnName={columns.find((column) => column.id === selectedColumnId)?.name}
      />
    )
  }

  if (mode === 'bulk') {
    return (
      <BulkAdd
        isOpen={isOpen}
        onClose={handleClose}
        columns={columns}
        onSave={onCreateCards}
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
    <Modal
      open={isOpen}
      onClose={handleClose}
      title="Create"
      description="Add a card to a column, paste a list of cards, or add a new column."
      size="sm"
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="create-column" className="block text-xs font-medium text-muted mb-1.5">
            Column
          </label>
          <Select
            id="create-column"
            value={selectedColumnId}
            onChange={(e) => setSelectedColumnId(e.target.value)}
          >
            <option value="">Select a column</option>
            {columns.map((column) => (
              <option key={column.id} value={column.id}>
                {column.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex gap-2">
          <Button
            variant="primary"
            className="flex-1"
            disabled={!selectedColumnId}
            onClick={() => setMode('card')}
          >
            Add card
          </Button>
          <Button className="flex-1" onClick={() => setMode('column')}>
            Add column
          </Button>
        </div>

        <Button className="w-full" onClick={() => setMode('bulk')}>
          <ClipboardList />
          Paste a list
        </Button>
      </div>
    </Modal>
  )
}
