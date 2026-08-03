import { afterEach, describe, expect, it } from 'vitest'
import type { Active, Over } from '@dnd-kit/core'
import type { Card } from '@/types'
import {
  cardScreenReaderInstructions,
  createBoardAnnouncements,
  deletedCardAnnouncement,
  focusTargetForDeletedCard,
  restoreFocusAfterDeletion,
} from './accessibility'

const cards = [
  { id: 'card-uuid-1', title: 'Write release notes', column_id: 'todo' },
  { id: 'card-uuid-2', title: 'Ship keyboard repair', column_id: 'todo' },
] satisfies Pick<Card, 'id' | 'title' | 'column_id'>[]

const columns = [
  { id: 'todo', name: 'To Do' },
  { id: 'doing', name: 'In Progress' },
]

const active = (id: string, type: 'card' | 'column') =>
  ({ id, data: { current: { type } } }) as unknown as Active

const over = (id: string) => ({ id }) as unknown as Over

describe('board drag accessibility', () => {
  const announcements = createBoardAnnouncements({ cards, columns })

  it('keeps card-only demo instructions truthful', () => {
    expect(cardScreenReaderInstructions.draggable).toContain('card')
    expect(cardScreenReaderInstructions.draggable).not.toContain('column')
  })

  it('uses card titles and column names instead of identifiers', () => {
    const card = active('card-uuid-1', 'card')
    const start = announcements.onDragStart({ active: card })
    const move = announcements.onDragOver({ active: card, over: over('list:doing') })
    const end = announcements.onDragEnd({ active: card, over: over('list:doing') })

    expect(start).toBe('Picked up card "Write release notes".')
    expect(move).toBe('Card "Write release notes" moved to column "In Progress".')
    expect(end).toBe('Card "Write release notes" was dropped in column "In Progress".')
    expect(`${start} ${move} ${end}`).not.toContain('card-uuid-1')
  })

  it('announces column names during keyboard column reordering', () => {
    const column = active('todo', 'column')
    const message = announcements.onDragOver({ active: column, over: over('doing') })
    const end = announcements.onDragEnd({ active: column, over: over('doing') })

    expect(message).toBe('Column "To Do" moved over column "In Progress".')
    expect(end).toBe('Column "To Do" was dropped near column "In Progress".')
    expect(message).not.toContain('todo')
    expect(message).not.toContain('doing')
  })

  it('provides a deletion live-region string without the card identifier', () => {
    expect(deletedCardAnnouncement('Ship keyboard repair')).toBe(
      'Deleted card "Ship keyboard repair".'
    )
    expect(deletedCardAnnouncement('Ship keyboard repair')).not.toContain('card-uuid-2')
  })
})

describe('card deletion focus restoration', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('targets the next card, then the previous card at the end of a column', () => {
    expect(focusTargetForDeletedCard(cards, cards[0])).toEqual({
      cardId: 'card-uuid-2',
      columnId: 'todo',
    })
    expect(focusTargetForDeletedCard(cards, cards[1])).toEqual({
      cardId: 'card-uuid-1',
      columnId: 'todo',
    })
  })

  it('focuses the surviving card or the column add-card control', () => {
    const next = document.createElement('li')
    next.dataset.cardId = 'card-uuid-2'
    next.tabIndex = 0
    const addCard = document.createElement('button')
    addCard.dataset.addCardFor = 'doing'
    document.body.append(next, addCard)

    expect(restoreFocusAfterDeletion({ cardId: 'card-uuid-2', columnId: 'todo' })).toBe(true)
    expect(document.activeElement).toBe(next)

    expect(restoreFocusAfterDeletion({ cardId: null, columnId: 'doing' })).toBe(true)
    expect(document.activeElement).toBe(addCard)
  })
})
