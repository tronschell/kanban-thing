import type { Active, Announcements, Over } from '@dnd-kit/core'
import type { Card, Column } from '@/types'

const LIST_PREFIX = 'list:'

type AnnouncementCard = Pick<Card, 'id' | 'title' | 'column_id'>
type AnnouncementColumn = Pick<Column, 'id' | 'name'>

export interface BoardAnnouncementData {
  cards: AnnouncementCard[]
  columns: AnnouncementColumn[]
}

const quote = (value: string) => `"${value}"`

const dragKind = (active: Active): 'card' | 'column' =>
  active.data.current?.type === 'column' ? 'column' : 'card'

const columnIdForTarget = (
  id: string,
  cards: AnnouncementCard[],
  columns: AnnouncementColumn[]
) => {
  if (id.startsWith(LIST_PREFIX)) return id.slice(LIST_PREFIX.length)
  if (columns.some((column) => column.id === id)) return id
  return cards.find((card) => card.id === id)?.column_id ?? null
}

export const createBoardAnnouncements = ({ cards, columns }: BoardAnnouncementData): Announcements => {
  const cardById = new Map(cards.map((card) => [card.id, card]))
  const columnById = new Map(columns.map((column) => [column.id, column]))

  const activeLabel = (active: Active) => {
    const kind = dragKind(active)
    if (kind === 'column') {
      return { kind, name: columnById.get(String(active.id))?.name ?? 'column' }
    }

    return { kind, name: cardById.get(String(active.id))?.title ?? 'card' }
  }

  const columnNameFor = (id: string | null) => (id ? columnById.get(id)?.name : null) ?? 'another column'

  const targetDetails = (over: Over) => {
    const id = String(over.id)
    const targetCard = cardById.get(id)
    const columnId = columnIdForTarget(id, cards, columns)

    return {
      cardTitle: targetCard?.title ?? null,
      columnName: columnNameFor(columnId),
    }
  }

  return {
    onDragStart({ active }) {
      const item = activeLabel(active)
      return `Picked up ${item.kind} ${quote(item.name)}.`
    },
    onDragOver({ active, over }) {
      const item = activeLabel(active)
      if (!over) {
        return `${item.kind[0].toUpperCase()}${item.kind.slice(1)} ${quote(item.name)} has no drop target.`
      }

      const target = targetDetails(over)
      if (item.kind === 'card') {
        return target.cardTitle
          ? `Card ${quote(item.name)} moved over card ${quote(target.cardTitle)} in column ${quote(target.columnName)}.`
          : `Card ${quote(item.name)} moved to column ${quote(target.columnName)}.`
      }

      return `Column ${quote(item.name)} moved over column ${quote(target.columnName)}.`
    },
    onDragEnd({ active, over }) {
      const item = activeLabel(active)
      if (!over) {
        return `${item.kind[0].toUpperCase()}${item.kind.slice(1)} ${quote(item.name)} was dropped without a destination.`
      }

      const target = targetDetails(over)
      if (item.kind === 'column') {
        return `Column ${quote(item.name)} was dropped near column ${quote(target.columnName)}.`
      }

      return `Card ${quote(item.name)} was dropped in column ${quote(target.columnName)}.`
    },
    onDragCancel({ active }) {
      const item = activeLabel(active)
      return `Cancelled dragging ${item.kind} ${quote(item.name)}.`
    },
  }
}

export const boardScreenReaderInstructions = {
  draggable:
    'To pick up a card or column, press the space bar. While dragging a card, use the arrow keys to move it. While dragging a column, use ArrowLeft and ArrowRight to reorder it. Press space again to drop, or press escape to cancel.',
}

export interface DeletionFocusTarget {
  cardId: string | null
  columnId: string
}

export const focusTargetForDeletedCard = (
  cards: AnnouncementCard[],
  deletedCard: Pick<Card, 'id' | 'column_id'>
): DeletionFocusTarget => {
  const siblings = cards.filter((card) => card.column_id === deletedCard.column_id)
  const deletedIndex = siblings.findIndex((card) => card.id === deletedCard.id)

  if (deletedIndex === -1) return { cardId: null, columnId: deletedCard.column_id }

  return {
    cardId:
      siblings[deletedIndex + 1]?.id ??
      siblings[deletedIndex - 1]?.id ??
      null,
    columnId: deletedCard.column_id,
  }
}

export const deletedCardAnnouncement = (title: string) => `Deleted card ${quote(title)}.`

export const restoreFocusAfterDeletion = (target: DeletionFocusTarget) => {
  if (typeof document === 'undefined') return false

  const card = Array.from(document.querySelectorAll<HTMLElement>('[data-card-id]')).find(
    (element) => element.dataset.cardId === target.cardId
  )
  const fallback = Array.from(
    document.querySelectorAll<HTMLElement>('[data-add-card-for]')
  ).find((element) => element.dataset.addCardFor === target.columnId)
  const element = card ?? fallback

  element?.focus()
  return element !== undefined
}
