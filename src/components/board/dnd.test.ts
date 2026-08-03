import { afterEach, describe, expect, it } from 'vitest'
import type { Active, Over } from '@dnd-kit/core'
import { boardKeyboardCoordinates, columnKeyboardTargetId, dropIndex } from './dnd'
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

const B1_TOP = 100
const B1_HEIGHT = 40
const B1_MIDPOINT = B1_TOP + B1_HEIGHT / 2
const GRABBED_AT = 500

const droppableOver = (id: string, top: number, height: number) =>
  ({ id, rect: { top, height } }) as unknown as Over

const b1 = droppableOver('b1', B1_TOP, B1_HEIGHT)
const listOfB = droppableOver('list:b', 0, 600)

const activatorEvent = new MouseEvent('mousedown', { clientY: GRABBED_AT })

// A card grabbed grabOffsetY below its own top starts at GRABBED_AT - grabOffsetY and
// tracks the pointer, so its top is always pointerY - grabOffsetY.
const grabbed = (id: string, pointerY: number, grabOffsetY: number, height: number) =>
  ({
    id,
    rect: {
      current: {
        initial: { top: GRABBED_AT - grabOffsetY, height },
        translated: { top: pointerY - grabOffsetY, height },
      },
    },
  }) as unknown as Active

const dropOnB1 = (pointerY: number, grabOffsetY: number, height: number) =>
  dropIndex(cards, 'b', grabbed('a1', pointerY, grabOffsetY, height), b1, activatorEvent)

describe('dropIndex', () => {
  it('lands below b1 when a tall card grabbed by its middle is dropped on b1 lower half', () => {
    expect(dropOnB1(B1_MIDPOINT + 8, 45, 90)).toBe(1)
  })

  it('lands above b1 when a tall card grabbed near its top is dropped on b1 upper half', () => {
    expect(dropOnB1(B1_MIDPOINT - 8, 0, 90)).toBe(0)
    expect(dropOnB1(B1_MIDPOINT - 8, 5, 90)).toBe(0)
  })

  it('flips at the b1 midpoint for every pointer position inside b1 and every grab offset', () => {
    const pointers = Array.from({ length: B1_HEIGHT }, (_, offset) => B1_TOP + offset)
    const expected = pointers.map((pointerY) => (pointerY > B1_MIDPOINT ? 1 : 0))

    for (const height of [40, 90]) {
      for (let grabOffsetY = 0; grabOffsetY < height; grabOffsetY++) {
        const indices = pointers.map((pointerY) => dropOnB1(pointerY, grabOffsetY, height))

        expect({ height, grabOffsetY, indices }).toEqual({ height, grabOffsetY, indices: expected })
      }
    }
  })

  it('appends when the drop target is the column list rather than a card', () => {
    expect(
      dropIndex(cards, 'b', grabbed('a1', 300, 20, 90), listOfB, activatorEvent)
    ).toBe(2)
  })

  it('keeps a card in place when the column list is the drop target', () => {
    expect(
      dropIndex(cards, 'b', grabbed('b2', 300, 20, 90), listOfB, activatorEvent)
    ).toBe(1)
  })

  it('returns the over index when the dragged rect has not been translated yet', () => {
    const active = {
      id: 'a1',
      rect: { current: { initial: null, translated: null } },
    } as unknown as Active

    expect(dropIndex(cards, 'b', active, b1, activatorEvent)).toBe(0)
  })

  it('returns the over index for a same-column reorder no matter where the pointer is', () => {
    expect(dropIndex(cards, 'b', grabbed('b2', 139, 0, 40), b1, activatorEvent)).toBe(0)
  })

  it('returns the over index when a card is dropped on itself', () => {
    expect(dropIndex(cards, 'b', grabbed('b1', 139, 0, 40), b1, activatorEvent)).toBe(0)
  })
})

describe('column keyboard movement', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('tracks repeated ArrowRight movement and reverses with ArrowLeft', () => {
    const columns = ['todo', 'doing', 'done'].map((id) => {
      const column = document.createElement('section')
      column.dataset.columnId = id
      column.dataset.columnSortable = ''
      return column
    })
    document.body.append(...columns)

    columns.forEach((column, index) => {
      Object.defineProperty(column, 'getBoundingClientRect', {
        value: () => ({ left: index * 220, top: 10, width: 180, height: 400 }),
      })
    })

    const active = {
      id: 'todo',
      data: { current: { type: 'column' } },
    } as unknown as Active
    const coordinates = (event: KeyboardEvent, currentCoordinates: { x: number; y: number }) =>
      boardKeyboardCoordinates(event, {
        active: 'todo',
        currentCoordinates,
        context: { active } as never,
      })

    const firstRight = new KeyboardEvent('keydown', { code: 'ArrowRight', cancelable: true })
    const secondRight = new KeyboardEvent('keydown', { code: 'ArrowRight', cancelable: true })
    const reverseLeft = new KeyboardEvent('keydown', { code: 'ArrowLeft', cancelable: true })
    const firstPosition = coordinates(firstRight, { x: 0, y: 10 })
    const secondPosition = coordinates(secondRight, firstPosition ?? { x: 0, y: 10 })
    const reversePosition = coordinates(reverseLeft, secondPosition ?? { x: 0, y: 10 })

    expect(firstPosition).toEqual({ x: 220, y: 10 })
    expect(secondPosition).toEqual({ x: 440, y: 10 })
    expect(reversePosition).toEqual({ x: 220, y: 10 })
    expect(firstRight.defaultPrevented).toBe(true)
    expect(secondRight.defaultPrevented).toBe(true)
    expect(reverseLeft.defaultPrevented).toBe(true)
  })

  it('does not move beyond the first or last sortable column', () => {
    expect(columnKeyboardTargetId(['todo', 'doing', 'done'], 'todo', 'ArrowLeft')).toBe(null)
    expect(columnKeyboardTargetId(['todo', 'doing', 'done'], 'done', 'ArrowRight')).toBe(null)
    expect(columnKeyboardTargetId(['todo', 'doing', 'done'], 'doing', 'ArrowRight')).toBe('done')
  })
})
