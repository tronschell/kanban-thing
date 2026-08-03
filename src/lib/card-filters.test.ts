import { describe, expect, it } from 'vitest'
import {
  ALL_COLUMNS,
  ANY_COLOR,
  DEFAULT_CARD_FILTERS,
  filterCards,
  NO_COLOR,
  type CardFilters,
} from './card-filters'

const cards = [
  {
    id: 'ship',
    title: 'Ship the digest',
    description: 'Send the weekly summary',
    color: '#30a46c',
    due_date: '2026-08-01T00:00:00.000Z',
    column_id: 'doing',
  },
  {
    id: 'notes',
    title: 'Write release notes',
    description: null,
    color: null,
    due_date: null,
    column_id: 'backlog',
  },
  {
    id: 'design',
    title: 'Review the new card design',
    description: 'Check the blue accent',
    color: '#3e63dd',
    due_date: '2026-08-05T00:00:00.000Z',
    column_id: 'review',
  },
]

const filters = (overrides: Partial<CardFilters>): CardFilters => ({
  ...DEFAULT_CARD_FILTERS,
  ...overrides,
})

describe('filterCards', () => {
  it('searches titles and descriptions without changing card order', () => {
    expect(filterCards(cards, filters({ search: 'WEEKLY' })).map((card) => card.id)).toEqual(['ship'])
    expect(filterCards(cards, filters({ search: 'design' })).map((card) => card.id)).toEqual(['design'])
  })

  it('combines column and colour filters', () => {
    expect(
      filterCards(cards, filters({ columnId: 'doing', color: '#30a46c' })).map((card) => card.id)
    ).toEqual(['ship'])
    expect(filterCards(cards, filters({ color: NO_COLOR })).map((card) => card.id)).toEqual(['notes'])
    expect(filterCards(cards, filters({ columnId: ALL_COLUMNS, color: ANY_COLOR }))).toHaveLength(3)
  })

  it('supports scheduled, unscheduled, and overdue due-date states', () => {
    const now = new Date('2026-08-02T12:00:00.000Z')

    expect(filterCards(cards, filters({ due: 'scheduled' }), now).map((card) => card.id)).toEqual([
      'ship',
      'design',
    ])
    expect(filterCards(cards, filters({ due: 'unscheduled' }), now).map((card) => card.id)).toEqual([
      'notes',
    ])
    expect(filterCards(cards, filters({ due: 'overdue' }), now).map((card) => card.id)).toEqual([
      'ship',
    ])
  })

  it('does not mutate the board card collection', () => {
    const original = [...cards]
    filterCards(cards, filters({ search: 'ship' }))
    expect(cards).toEqual(original)
  })
})
