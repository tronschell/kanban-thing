'use client'

import { useState, useEffect, useRef } from 'react'
import { Ban } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Button, IconButton, Input, Modal, ModalFooter, Textarea } from '@/components/ui'
import DueDatePicker from '@/components/due-date-picker'
import { dayToDueDate, dueDateToDay } from '@/lib/date-utils'
import { LABEL_COLORS, LABEL_COLOR_NAMES } from '@/lib/colors'
import { cn } from '@/lib/utils'

const CUSTOM_COLOR_PATTERN = /^#(?:[A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/

interface CardEditorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: {
    title: string
    description: string
    color: string | null
    due_date: string | null
  }) => void
  columnName?: string
  initialData?: {
    title: string
    description: string
    color: string | null
    due_date: string | null
  }
  isEditing?: boolean
}

export default function CardEditor({
  isOpen,
  onClose,
  onSave,
  columnName,
  initialData,
  isEditing,
}: CardEditorProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [isPreview, setIsPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [titleError, setTitleError] = useState('')
  const [colorError, setColorError] = useState('')
  const titleRef = useRef<HTMLInputElement>(null)
  const colorRef = useRef<HTMLInputElement>(null)

  // initialData is rebuilt by the parent on every render, so opening is the only safe trigger.
  useEffect(() => {
    if (!isOpen) return

    setTitle(initialData?.title || '')
    setDescription(initialData?.description || '')
    setColor(initialData?.color || '')
    setDueDate(initialData?.due_date ? dueDateToDay(initialData.due_date) : '')
    setIsPreview(false)
    setTitleError('')
    setColorError('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      setTitleError('Title is required')
      titleRef.current?.focus()
      return
    }

    const normalizedColor = color.trim()
    if (normalizedColor && !CUSTOM_COLOR_PATTERN.test(normalizedColor)) {
      setColorError('Colour must be a 3- or 6-digit hex value')
      colorRef.current?.focus()
      return
    }

    setIsSaving(true)
    try {
      await onSave({
        title: title.trim(),
        description,
        color: normalizedColor || null,
        due_date: dueDate ? dayToDueDate(dueDate) : null,
      })
      onClose()
    } catch (error) {
      console.error('Failed to save card:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const modalTitle = isEditing ? 'Edit card' : columnName ? `Add card to ${columnName}` : 'Add card'

  return (
    <Modal open={isOpen} onClose={onClose} title={modalTitle} size="lg">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="card-title" className="block text-xs font-medium text-muted mb-1.5">
              Title
            </label>
            <Input
              id="card-title"
              ref={titleRef}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (titleError) setTitleError('')
              }}
              placeholder="Card title"
              aria-invalid={Boolean(titleError)}
              aria-describedby="card-title-error"
              autoFocus
            />
            <p id="card-title-error" role="alert" className="mt-1 min-h-4 text-xs text-danger">
              {titleError}
            </p>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="card-description" className="block text-xs font-medium text-muted">
                Description
              </label>
              <Button
                variant="link"
                size="sm"
                className="h-auto px-0"
                onClick={() => setIsPreview(!isPreview)}
              >
                {isPreview ? 'Edit' : 'Preview'}
              </Button>
            </div>
            {isPreview ? (
              <div className="prose min-h-24 max-w-none rounded-control border border-subtle bg-surface px-2.5 py-2 text-sm">
                <ReactMarkdown>{description}</ReactMarkdown>
              </div>
            ) : (
              <Textarea
                id="card-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Supports markdown formatting"
              />
            )}
          </div>

          <div>
            <label htmlFor="card-color" className="block text-xs font-medium text-muted mb-1.5">
              Colour
            </label>
            <div role="radiogroup" aria-label="Card colour" className="flex items-center gap-1">
              <IconButton
                role="radio"
                aria-checked={color === ''}
                label="No colour"
                size="sm"
                onClick={() => {
                  setColor('')
                  setColorError('')
                }}
                className={cn(color === '' && 'bg-surface-active')}
                icon={<Ban />}
              />
              {LABEL_COLORS.map((swatch) => (
                <IconButton
                  key={swatch}
                  role="radio"
                  aria-checked={color === swatch}
                  label={LABEL_COLOR_NAMES[swatch]}
                  size="sm"
                  onClick={() => {
                    setColor(swatch)
                    setColorError('')
                  }}
                  className={cn(color === swatch && 'bg-surface-active')}
                  icon={
                    <span
                      className="size-3.5 rounded-full"
                      style={{ backgroundColor: swatch }}
                    />
                  }
                />
              ))}
            </div>
            <Input
              id="card-color"
              ref={colorRef}
              value={color}
              onChange={(e) => {
                setColor(e.target.value)
                if (colorError) setColorError('')
              }}
              className="mt-1.5"
              placeholder="Custom colour, e.g. #30a46c. Leave empty for none"
              aria-invalid={Boolean(colorError)}
              aria-describedby="card-color-error"
            />
            <p id="card-color-error" role="alert" className="mt-1 min-h-4 text-xs text-danger">
              {colorError}
            </p>
          </div>

          <div>
            <label htmlFor="card-due-date" className="block text-xs font-medium text-muted mb-1.5">
              Due date
            </label>
            <DueDatePicker id="card-due-date" value={dueDate} onChange={setDueDate} />
          </div>

        </div>

        <ModalFooter>
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSaving}>
            {isSaving ? 'Saving' : 'Save card'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
