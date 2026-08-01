'use client'

import { useEffect, useState } from 'react'
import { Button, Modal, ModalFooter, Select, Textarea } from '@/components/ui'

const MAX_BULK_CARDS = 200
const MAX_TITLE_LENGTH = 200
const LIST_MARKER = /^(?:[-*+]\s+|\d+[.)]\s+)/
const CHECKBOX = /^\[[ xX]\]\s+/

export const parseCardTitles = (text: string) =>
  text
    .split('\n')
    .map((line) => line.trim().replace(LIST_MARKER, '').replace(CHECKBOX, '').trim())
    .filter((title) => title.length > 0)
    .map((title) => title.slice(0, MAX_TITLE_LENGTH))

interface BulkAddProps {
  isOpen: boolean
  onClose: () => void
  columns: Array<{ id: string; name: string }>
  onSave: (columnId: string, titles: string[]) => Promise<void>
}

export default function BulkAdd({ isOpen, onClose, columns, onSave }: BulkAddProps) {
  const defaultColumnId =
    columns.find((column) => column.name === 'Backlog')?.id ?? columns[0]?.id ?? ''
  const [columnId, setColumnId] = useState(defaultColumnId)
  const [text, setText] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setColumnId(defaultColumnId)
    setText('')
  }, [isOpen, defaultColumnId])

  const parsed = parseCardTitles(text)
  const titles = parsed.slice(0, MAX_BULK_CARDS)
  const columnName = columns.find((column) => column.id === columnId)?.name ?? ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (titles.length === 0 || isSaving) return

    setIsSaving(true)
    try {
      await onSave(columnId, titles)
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Paste a list"
      description="One card per line. Bullets, numbering and checkboxes are stripped."
    >
      <form onSubmit={handleSubmit}>
        <label htmlFor="bulk-column" className="block text-xs font-medium text-muted mb-1.5">
          Column
        </label>
        <Select
          id="bulk-column"
          value={columnId}
          onChange={(e) => setColumnId(e.target.value)}
        >
          {columns.map((column) => (
            <option key={column.id} value={column.id}>
              {column.name}
            </option>
          ))}
        </Select>

        <label htmlFor="bulk-lines" className="mt-4 block text-xs font-medium text-muted mb-1.5">
          Cards
        </label>
        <Textarea
          id="bulk-lines"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="One card per line"
          rows={6}
          aria-describedby="bulk-summary"
          autoFocus
        />

        <p id="bulk-summary" role="status" aria-live="polite" className="mt-1 text-xs text-subtle">
          {titles.length === 0 ? (
            'Blank lines are skipped.'
          ) : (
            <>
              <span className="font-mono tabular-nums">{titles.length}</span>
              {titles.length === 1 ? ' card' : ' cards'} will be added to {columnName}.
            </>
          )}
          {parsed.length > MAX_BULK_CARDS && (
            <span className="text-danger"> Only the first {MAX_BULK_CARDS} lines will be added.</span>
          )}
        </p>

        <ModalFooter>
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSaving || titles.length === 0}>
            {titles.length === 1 ? 'Add 1 card' : `Add ${titles.length} cards`}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
