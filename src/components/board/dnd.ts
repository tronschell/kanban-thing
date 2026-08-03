import {
  closestCorners,
  pointerWithin,
  rectIntersection,
  type Active,
  type CollisionDetection,
  type KeyboardCoordinateGetter,
  type Over,
} from '@dnd-kit/core'
import { getEventCoordinates } from '@dnd-kit/utilities'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import type { Card } from '@/types'

const LIST_PREFIX = 'list:'

export const columnKeyboardTargetId = (
  columnIds: readonly string[],
  activeId: string,
  code: string
) => {
  if (code !== 'ArrowLeft' && code !== 'ArrowRight') return null

  const activeIndex = columnIds.indexOf(activeId)
  if (activeIndex === -1) return null

  const targetIndex = activeIndex + (code === 'ArrowRight' ? 1 : -1)
  return columnIds[targetIndex] ?? null
}

const currentColumnId = (columns: readonly HTMLElement[], currentX: number) => {
  let closest: { id: string; distance: number } | null = null

  for (const column of columns) {
    const id = column.dataset.columnId
    if (!id) continue

    const distance = Math.abs(column.getBoundingClientRect().left - currentX)
    if (!closest || distance < closest.distance) closest = { id, distance }
  }

  return closest?.id ?? null
}

export const boardKeyboardCoordinates: KeyboardCoordinateGetter = (event, args) => {
  const { active: activeDrag } = args.context
  const { currentCoordinates } = args
  if (activeDrag?.data.current?.type !== 'column') return sortableKeyboardCoordinates(event, args)
  if (event.code !== 'ArrowLeft' && event.code !== 'ArrowRight') return undefined

  event.preventDefault()
  if (typeof document === 'undefined') return currentCoordinates

  const columns = Array.from(
    document.querySelectorAll<HTMLElement>('[data-column-sortable]')
  )
  const columnIds = columns
    .map((column) => column.dataset.columnId)
    .filter((id): id is string => Boolean(id))
  const activeId = currentColumnId(columns, currentCoordinates.x) ?? String(args.active)
  const targetId = columnKeyboardTargetId(columnIds, activeId, event.code)
  const target = targetId
    ? columns.find((column) => column.dataset.columnId === targetId)
    : undefined

  if (!target) return currentCoordinates

  const rect = target.getBoundingClientRect()
  return { x: rect.left, y: rect.top }
}

export const listDroppableId = (columnId: string) => `${LIST_PREFIX}${columnId}`

export const boardCollisionDetection: CollisionDetection = (args) => {
  if (args.active.data.current?.type === 'column') {
    return closestCorners({
      ...args,
      droppableContainers: args.droppableContainers.filter(
        (container) => container.data.current?.type === 'column'
      ),
    })
  }

  const underPointer = pointerWithin(args)
  if (underPointer.length > 0) return underPointer

  const intersecting = rectIntersection(args)
  if (intersecting.length > 0) return intersecting

  return closestCorners(args)
}

export const cardsIn = (cards: Card[], columnId: string) =>
  cards.filter((card) => card.column_id === columnId)

export const columnOf = (cards: Card[], id: string, columnIds: string[]) => {
  if (id.startsWith(LIST_PREFIX)) return id.slice(LIST_PREFIX.length)
  if (columnIds.includes(id)) return id
  return cards.find((card) => card.id === id)?.column_id ?? null
}

export const numbered = (cards: Card[]) => cards.map((card, position) => ({ ...card, position }))

export const moveCard = (
  cards: Card[],
  cardId: string,
  toColumnId: string,
  toIndex: number
): Card[] => {
  const moved = cards.find((card) => card.id === cardId)
  if (!moved) return cards

  const remaining = cards.filter((card) => card.id !== cardId)
  const target = cardsIn(remaining, toColumnId)
  target.splice(toIndex, 0, { ...moved, column_id: toColumnId })

  const source = moved.column_id === toColumnId ? [] : cardsIn(remaining, moved.column_id)
  const untouched = remaining.filter(
    (card) => card.column_id !== toColumnId && card.column_id !== moved.column_id
  )

  return [...untouched, ...numbered(source), ...numbered(target)]
}

export const touchedColumns = (next: Card[], previous: Card[]) => {
  const slotOf = (card: Card) => `${card.column_id}:${card.position}`
  const before = new Map(previous.map((card) => [card.id, slotOf(card)]))

  return Array.from(
    new Set(
      next.filter((card) => before.get(card.id) !== slotOf(card)).map((card) => card.column_id)
    )
  )
}

const midpointY = (rect: { top: number; height: number }) => rect.top + rect.height / 2

// `over` is picked by the pointer, so above/below must be judged by the pointer too.
const dropPointY = (active: Active, activatorEvent: Event) => {
  const { initial, translated } = active.rect.current
  if (!translated) return null

  const grabY = getEventCoordinates(activatorEvent)?.y
  if (grabY === undefined || !initial) return midpointY(translated)

  return grabY + translated.top - initial.top
}

export const dropIndex = (
  cards: Card[],
  toColumnId: string,
  active: Active,
  over: Over,
  activatorEvent: Event
) => {
  const target = cardsIn(cards, toColumnId)
  const overIndex = target.findIndex((card) => card.id === over.id)

  if (overIndex === -1) {
    const activeIndex = target.findIndex((card) => card.id === active.id)
    return activeIndex === -1 ? target.length : activeIndex
  }
  if (target.some((card) => card.id === active.id)) return overIndex

  const pointY = dropPointY(active, activatorEvent)
  const belowMidpoint = pointY !== null && pointY > midpointY(over.rect)
  return overIndex + (belowMidpoint ? 1 : 0)
}
