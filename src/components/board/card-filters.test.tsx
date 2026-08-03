import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import CardFilters from './card-filters'
import { DEFAULT_CARD_FILTERS, type CardFilters as CardFiltersState } from '@/lib/card-filters'

const columns = [
  { id: 'doing', board_id: 'board-1', name: 'Doing', position: 0, created_at: '' },
  { id: 'done', board_id: 'board-1', name: 'Done', position: 1, created_at: '' },
]

describe('CardFilters', () => {
  afterEach(cleanup)

  it('exposes labeled native controls and lightweight guidance', () => {
    render(
      <CardFilters
        columns={columns}
        colors={['#30a46c']}
        filters={DEFAULT_CARD_FILTERS}
        totalCount={3}
        visibleCount={3}
        onChange={vi.fn()}
      />
    )

    expect(screen.getByRole('search', { name: 'Card search and filters' })).toBeTruthy()
    expect(screen.getByRole('textbox', { name: 'Search cards' })).toBeTruthy()
    expect(screen.getByRole('combobox', { name: 'Column' })).toBeTruthy()
    expect(screen.getByRole('combobox', { name: 'Due date' })).toBeTruthy()
    expect(screen.getByRole('combobox', { name: 'Colour' })).toBeTruthy()
    expect(screen.getByText('Search titles and descriptions. Filters only change what is shown.')).toBeTruthy()
  })

  it('updates filters and resets them with the keyboard-visible clear action', () => {
    const onChange = vi.fn<(filters: CardFiltersState) => void>()
    const activeFilters: CardFiltersState = { ...DEFAULT_CARD_FILTERS, search: 'digest' }

    render(
      <CardFilters
        columns={columns}
        colors={[]}
        filters={activeFilters}
        totalCount={3}
        visibleCount={1}
        onChange={onChange}
      />
    )

    fireEvent.change(screen.getByRole('textbox', { name: 'Search cards' }), {
      target: { value: 'release' },
    })
    expect(onChange).toHaveBeenLastCalledWith({ ...activeFilters, search: 'release' })

    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(onChange).toHaveBeenLastCalledWith(DEFAULT_CARD_FILTERS)
    expect(screen.getByRole('status').textContent).toBe('1 of 3 cards shown')
  })
})
