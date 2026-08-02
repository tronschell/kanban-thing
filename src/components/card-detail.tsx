'use client'

import { Pencil, Trash2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Badge, Button, Modal, ModalFooter } from '@/components/ui'
import { formatDueDate, isDueSoon } from '@/lib/date-utils'
import { parseChecklist, toggleChecklistItem, withoutChecklist } from '@/lib/checklist'
import type { Card } from '@/types'

interface CardDetailProps {
  card: Card
  columnName: string
  onClose: () => void
  onEdit: (card: Card) => void
  onDelete: (card: Card) => void
  onSaveDescription: (card: Card, description: string) => Promise<void>
}

export default function CardDetail({
  card,
  columnName,
  onClose,
  onEdit,
  onDelete,
  onSaveDescription,
}: CardDetailProps) {
  const description = card.description ?? ''
  const checklist = parseChecklist(description)
  const done = checklist.filter((item) => item.checked).length
  const prose = withoutChecklist(description).trim()

  return (
    <Modal open onClose={onClose} title={card.title} size="lg">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge dot={card.color ?? undefined}>{columnName}</Badge>
          {card.due_date && (
            <Badge variant={isDueSoon(card.due_date) ? 'danger' : 'neutral'}>
              {formatDueDate(card.due_date)}
            </Badge>
          )}
        </div>

        {checklist.length > 0 && (
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="text-xs font-medium text-muted">Checklist</span>
              <span className="font-mono text-2xs tabular-nums text-subtle">
                {done}/{checklist.length}
              </span>
            </div>
            <ul aria-label="Checklist" className="space-y-0.5">
              {checklist.map((item) => (
                <li key={item.index}>
                  <label className="flex cursor-pointer items-start gap-2 rounded-control px-1.5 py-1 text-sm text-fg hover:bg-surface-hover">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() =>
                        onSaveDescription(card, toggleChecklistItem(description, item.index))
                      }
                      className="focus-ring mt-0.5 size-3.5 shrink-0 accent-accent"
                    />
                    <span className={item.checked ? 'text-subtle line-through' : undefined}>
                      {item.text}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}

        {prose ? (
          <div className="prose max-w-none text-sm">
            <ReactMarkdown>{prose}</ReactMarkdown>
          </div>
        ) : (
          checklist.length === 0 && <p className="text-sm text-subtle">No description.</p>
        )}
      </div>

      <ModalFooter>
        <Button variant="danger" onClick={() => onDelete(card)} className="mr-auto">
          <Trash2 />
          Delete card
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
        <Button variant="primary" onClick={() => onEdit(card)}>
          <Pencil />
          Edit
        </Button>
      </ModalFooter>
    </Modal>
  )
}
