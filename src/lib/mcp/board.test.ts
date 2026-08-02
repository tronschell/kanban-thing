import { describe, expect, it } from 'vitest'
import type { Card, Column } from '@/types'
import {
  cardIdInput,
  cardTitleInput,
  colorInput,
  columnRefInput,
  dueDateInput,
  findColumn,
  limitInput,
  nextPosition,
  parseBoardId,
  publicBoard,
  publicCard,
  publicColumn,
} from './board'

const BOARD_ID = '3f7c1e2a-9b4d-4c8e-a1f6-2d5b8e7c0a91'

const card = (overrides: Partial<Card> = {}): Card => ({
  id: 'c1',
  title: 'Write the spec',
  description: null,
  color: null,
  due_date: null,
  position: 0,
  column_id: 'col-1',
  created_at: '2026-08-01T00:00:00.000Z',
  ...overrides,
})

const column = (overrides: Partial<Column> = {}): Column => ({
  id: 'col-1',
  board_id: BOARD_ID,
  name: 'Backlog',
  position: -1,
  created_at: '2026-08-01T00:00:00.000Z',
  ...overrides,
})

describe('parseBoardId', () => {
  it('accepts a bare uuid', () => {
    expect(parseBoardId(BOARD_ID)).toBe(BOARD_ID)
  })

  it('accepts the board url a user would paste', () => {
    expect(parseBoardId(`https://www.kanbanthing.com/board?id=${BOARD_ID}`)).toBe(BOARD_ID)
  })

  it('accepts a read-only link and keeps only the board id', () => {
    expect(parseBoardId(`https://www.kanbanthing.com/board?id=${BOARD_ID}&view=abc`)).toBe(BOARD_ID)
  })

  it('lowercases so the same board is one handle', () => {
    expect(parseBoardId(BOARD_ID.toUpperCase())).toBe(BOARD_ID)
  })

  it('tolerates padding from a copy and paste', () => {
    expect(parseBoardId(`  ${BOARD_ID}\n`)).toBe(BOARD_ID)
  })

  it('rejects anything that is not a uuid', () => {
    expect(parseBoardId('my-board')).toBeNull()
    expect(parseBoardId('')).toBeNull()
    expect(parseBoardId(BOARD_ID.slice(0, -1))).toBeNull()
  })

  it('rejects an id that smuggles sql or a path alongside the uuid', () => {
    expect(parseBoardId(`${BOARD_ID}'; drop table boards; --`)).toBeNull()
    expect(parseBoardId(`/board?id=${BOARD_ID}x`)).toBeNull()
  })
})

describe('field whitelisting', () => {
  it('drops password_hash and anything else the rpc might start returning', () => {
    const row = { ...card(), password_hash: '$2a$10$leaked', view_token: 'secret' }

    expect(publicCard(row as Card)).toEqual({
      id: 'c1',
      column_id: 'col-1',
      title: 'Write the spec',
      description: null,
      color: null,
      due_date: null,
      position: 0,
      created_at: '2026-08-01T00:00:00.000Z',
    })
  })

  it('keeps a column to its id, name and position', () => {
    const row = { ...column(), board_id: BOARD_ID, password_hash: '$2a$10$leaked' }

    expect(publicColumn(row as Column)).toEqual({ id: 'col-1', name: 'Backlog', position: -1 })
  })

  it('never puts a credential field on a board result', () => {
    const row = {
      id: BOARD_ID,
      name: 'Roadmap',
      created_at: '2026-08-01T00:00:00.000Z',
      expires_at: '2026-09-30T00:00:00.000Z',
      requires_password: true,
      password_hash: '$2a$10$leaked',
      view_token: 'secret',
    }

    const result = publicBoard(row)

    expect(Object.keys(result).sort()).toEqual([
      'created_at',
      'expires_at',
      'id',
      'name',
      'requires_password',
      'url',
    ])
    expect(JSON.stringify(result)).not.toContain('leaked')
    expect(JSON.stringify(result)).not.toContain('secret')
  })
})

describe('input validation', () => {
  it('requires a card id to be a uuid so it cannot carry a filter or a path', () => {
    expect(cardIdInput.safeParse(BOARD_ID).success).toBe(true)
    expect(cardIdInput.safeParse('c1').success).toBe(false)
    expect(cardIdInput.safeParse(`${BOARD_ID} or 1=1`).success).toBe(false)
  })

  it('bounds a card title and rejects a blank one', () => {
    expect(cardTitleInput.parse('  Ship it  ')).toBe('Ship it')
    expect(cardTitleInput.safeParse('   ').success).toBe(false)
    expect(cardTitleInput.safeParse('x'.repeat(201)).success).toBe(false)
  })

  it('bounds a column reference', () => {
    expect(columnRefInput.safeParse('In Progress').success).toBe(true)
    expect(columnRefInput.safeParse('').success).toBe(false)
    expect(columnRefInput.safeParse('x'.repeat(101)).success).toBe(false)
  })

  it('accepts only a real calendar day as a due date', () => {
    expect(dueDateInput.safeParse('2026-08-02').success).toBe(true)
    expect(dueDateInput.safeParse('2026-02-30').success).toBe(false)
    expect(dueDateInput.safeParse('2026-13-01').success).toBe(false)
    expect(dueDateInput.safeParse('tomorrow').success).toBe(false)
  })

  it('accepts only a six digit hex colour', () => {
    expect(colorInput.safeParse('#A1B2C3').success).toBe(true)
    expect(colorInput.safeParse('#abc').success).toBe(false)
    expect(colorInput.safeParse('red').success).toBe(false)
  })

  it('bounds a list size so one call cannot drag the whole board back', () => {
    expect(limitInput.safeParse(200).success).toBe(true)
    expect(limitInput.safeParse(201).success).toBe(false)
    expect(limitInput.safeParse(0).success).toBe(false)
    expect(limitInput.safeParse(1.5).success).toBe(false)
  })
})

describe('findColumn', () => {
  const columns = [column(), column({ id: 'col-2', name: 'In Progress', position: 1 })]

  it('matches an id', () => {
    expect(findColumn(columns, 'col-2')?.name).toBe('In Progress')
  })

  it('matches a name regardless of case or padding', () => {
    expect(findColumn(columns, '  in progress ')?.id).toBe('col-2')
  })

  it('returns null for a column that is not on the board', () => {
    expect(findColumn(columns, 'Done')).toBeNull()
  })
})

describe('nextPosition', () => {
  it('lands a new card after the last one in its column', () => {
    const cards = [card({ position: 0 }), card({ id: 'c2', position: 4 })]
    expect(nextPosition(cards, 'col-1')).toBe(5)
  })

  it('ignores cards in other columns', () => {
    const cards = [card({ id: 'c2', column_id: 'col-2', position: 9 })]
    expect(nextPosition(cards, 'col-1')).toBe(0)
  })
})
