'use client'

import { useEffect, useRef, useState } from 'react'
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
  const [nameError, setNameError] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setName(initialName)
      setNameError('')
    }
  }, [isOpen, initialName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setNameError('Column name is required')
      nameRef.current?.focus()
      return
    }

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
          ref={nameRef}
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (nameError) setNameError('')
          }}
          placeholder="Column name"
          aria-invalid={Boolean(nameError)}
          aria-describedby="column-name-error"
          autoFocus
        />
        <p id="column-name-error" role="alert" className="mt-1 min-h-4 text-xs text-danger">
          {nameError}
        </p>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSaving}>
            {initialName ? 'Rename' : 'Add column'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
