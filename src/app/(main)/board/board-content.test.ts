import { describe, it, expect } from 'vitest'
import type { Card, Column } from '@/types'
import { splitBacklog } from '@/lib/backlog'

const column = (id: string, name: string): Column => ({
  id,
  board_id: 'board-1',
  name,
  position: 0,
  created_at: '2026-01-01T00:00:00.000Z',
})

const card = (id: string, columnId: string): Card => ({
  id,
  title: id,
  description: null,
  color: null,
  due_date: null,
  position: 0,
  column_id: columnId,
  created_at: '2026-01-01T00:00:00.000Z',
})

describe('splitBacklog', () => {
  const columns = [column('a', 'Backlog'), column('b', 'Backlog'), column('c', 'Doing')]

  it('promotes the lowest-id Backlog and keeps every other column', () => {
    const split = splitBacklog(columns)

    expect(split.backlog?.id).toBe('a')
    expect(split.columns.map((item) => item.id)).toEqual(['b', 'c'])
  })

  it('leaves no card unreachable when a board has duplicate Backlog columns', () => {
    const cards = [card('card-1', 'a'), card('card-2', 'b'), card('card-3', 'c')]
    const split = splitBacklog(columns)
    const rendered = split.backlog ? [split.backlog, ...split.columns] : split.columns
    const renderedIds = rendered.map((item) => item.id)

    const unreachable = cards.filter((item) => !renderedIds.includes(item.column_id))
    expect(unreachable.map((item) => item.id)).toEqual([])
  })
})
