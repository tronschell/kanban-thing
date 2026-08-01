'use client'

import { useEffect, useState } from 'react'
import { Button, Input, Modal, ModalFooter } from '@/components/ui'

interface ColumnEditorProps {
  isOpen: boolean
  initialName?: string
  onClose: () => void
  onSave: (name: string) => void | Promise<void>
}

export default function ColumnEditor({
  isOpen,
  initialName = '',
  onClose,
  onSave,
}: ColumnEditorProps) {
  const [name, setName] = useState(initialName)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isOpen) setName(initialName)
  }, [isOpen, initialName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return

    setIsSaving(true)
    try {
      await onSave(trimmed)
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={initialName ? 'Rename column' : 'Add column'}
      size="sm"
    >
      <form onSubmit={handleSubmit}>
        <label htmlFor="column-name" className="block text-xs font-medium text-muted mb-1.5">
          Name
        </label>
        <Input
          id="column-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Column name"
          autoFocus
        />
        <ModalFooter>
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSaving || !name.trim()}>
            {initialName ? 'Rename' : 'Add column'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
