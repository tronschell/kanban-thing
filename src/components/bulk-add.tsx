'use client'

import { useRef, useState } from 'react'
import { Button, Modal, ModalFooter, Select, Textarea } from '@/components/ui'

const MAX_BULK_CARDS = 200
const MAX_TITLE_LENGTH = 200
const LIST_MARKER = /^(?:[-*+•–]|\d+[.)])(?:\s+|$)/
const CHECKBOX = /^\[[ xX]\]\s+/

const parseCardTitles = (text: string) =>
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
  const [selectedColumnId, setSelectedColumnId] = useState('')
  const [text, setText] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [listError, setListError] = useState('')
  const textRef = useRef<HTMLTextAreaElement>(null)

  const columnId = columns.some((column) => column.id === selectedColumnId)
    ? selectedColumnId
    : defaultColumnId

  const parsed = parseCardTitles(text)
  const titles = parsed.slice(0, MAX_BULK_CARDS)
  const columnName = columns.find((column) => column.id === columnId)?.name ?? ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!columnId || isSaving) return
    if (titles.length === 0) {
      setListError('Enter at least one card')
      textRef.current?.focus()
      return
    }

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
          onChange={(e) => setSelectedColumnId(e.target.value)}
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
          ref={textRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            if (listError) setListError('')
          }}
          placeholder="One card per line"
          rows={6}
          aria-invalid={Boolean(listError)}
          aria-describedby="bulk-summary bulk-lines-error"
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
        <p id="bulk-lines-error" role="alert" className="mt-1 min-h-4 text-xs text-danger">
          {listError}
        </p>

        <ModalFooter>
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSaving || !columnId}>
            {titles.length === 1 ? 'Add 1 card' : `Add ${titles.length} cards`}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
