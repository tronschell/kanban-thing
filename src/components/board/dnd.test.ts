import { describe, expect, it } from 'vitest'
import type { Active, Over } from '@dnd-kit/core'
import { dropIndex } from './dnd'
import type { Card } from '@/types'

const card = (id: string, columnId: string, position: number): Card => ({
  id,
  title: id,
  description: null,
  color: null,
  due_date: null,
  position,
  column_id: columnId,
  created_at: '2026-01-01T00:00:00.000Z',
})

const cards = [card('a1', 'a', 0), card('b1', 'b', 0), card('b2', 'b', 1)]

const dragged = (id: string, pointerY: number, grabOffsetY: number, height: number) =>
  ({
    id,
    rect: { current: { translated: { top: pointerY - grabOffsetY, height } } },
  }) as unknown as Active

const droppedOn = (id: string, top: number, height: number) =>
  ({ id, rect: { top, height } }) as unknown as Over

const B1_TOP = 180
const B1_HEIGHT = 38
const B1_MIDPOINT = B1_TOP + B1_HEIGHT / 2

describe('dropIndex', () => {
  it('lands below a short target when a tall card is grabbed by its middle', () => {
    const active = dragged('a1', B1_MIDPOINT + 11, 45, 90)
    const over = droppedOn('b1', B1_TOP, B1_HEIGHT)

    expect(dropIndex(cards, 'b', active, over)).toBe(1)
  })

  it('flips at the target midpoint regardless of where the card was grabbed', () => {
    const height = 90
    const over = droppedOn('b1', B1_TOP, B1_HEIGHT)

    for (const grabOffsetY of [0, 10, 45, 80, 89]) {
      const pointerFor = (draggedMidpoint: number) => draggedMidpoint + grabOffsetY - height / 2

      const below = dragged('a1', pointerFor(B1_MIDPOINT + 1), grabOffsetY, height)
      const above = dragged('a1', pointerFor(B1_MIDPOINT - 1), grabOffsetY, height)

      expect(dropIndex(cards, 'b', below, over)).toBe(1)
      expect(dropIndex(cards, 'b', above, over)).toBe(0)
    }
  })
})
