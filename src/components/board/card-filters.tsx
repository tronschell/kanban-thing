'use client'

import { Search, X } from 'lucide-react'
import { Button, Input, Select } from '@/components/ui'
import { LABEL_COLOR_NAMES } from '@/lib/colors'
import {
  ALL_COLUMNS,
  ANY_COLOR,
  DEFAULT_CARD_FILTERS,
  hasCardFilters,
  NO_COLOR,
  type CardDueFilter,
  type CardFilters as CardFiltersState,
} from '@/lib/card-filters'
import type { Column } from '@/types'

interface CardFiltersProps {
  columns: Column[]
  colors: string[]
  filters: CardFiltersState
  totalCount: number
  visibleCount: number
  onChange: (filters: CardFiltersState) => void
}

const plural = (count: number, noun: string) => `${noun}${count === 1 ? '' : 's'}`

const colorLabel = (color: string) =>
  LABEL_COLOR_NAMES[color as keyof typeof LABEL_COLOR_NAMES] ?? color

export default function CardFilters({
  columns,
  colors,
  filters,
  totalCount,
  visibleCount,
  onChange,
}: CardFiltersProps) {
  const active = hasCardFilters(filters)
  const resultText =
    totalCount === 0
      ? 'No cards on this board yet.'
      : active
        ? visibleCount === 0
          ? 'No cards match these filters.'
          : `${visibleCount} of ${totalCount} ${plural(totalCount, 'card')} shown`
        : `${totalCount} ${plural(totalCount, 'card')} on this board`

  const setFilter = <Key extends keyof CardFiltersState>(
    key: Key,
    value: CardFiltersState[Key]
  ) => {
    onChange({ ...filters, [key]: value })
  }

  return (
    <section
      role="search"
      aria-label="Card search and filters"
      className="mx-3 mb-2 rounded-panel border border-subtle bg-surface px-2.5 py-2"
    >
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[14rem] flex-[2]">
          <label htmlFor="card-search" className="mb-1 block text-2xs font-medium text-muted">
            Search cards
          </label>
          <div className="relative">
            <Search aria-hidden className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-subtle" />
            <Input
              id="card-search"
              value={filters.search}
              onChange={(event) => setFilter('search', event.target.value)}
              placeholder="Title or description"
              className="pl-8"
              aria-describedby="card-filter-help"
            />
          </div>
        </div>

        <div className="min-w-[9rem] flex-1">
          <label htmlFor="card-filter-column" className="mb-1 block text-2xs font-medium text-muted">
            Column
          </label>
          <Select
            id="card-filter-column"
            value={filters.columnId}
            onChange={(event) => setFilter('columnId', event.target.value)}
            aria-describedby="card-filter-help"
          >
            <option value={ALL_COLUMNS}>All columns</option>
            {columns.map((column) => (
              <option key={column.id} value={column.id}>
                {column.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="min-w-[9rem] flex-1">
          <label htmlFor="card-filter-due" className="mb-1 block text-2xs font-medium text-muted">
            Due date
          </label>
          <Select
            id="card-filter-due"
            value={filters.due}
            onChange={(event) => setFilter('due', event.target.value as CardDueFilter)}
            aria-describedby="card-filter-help"
          >
            <option value="all">Any due state</option>
            <option value="scheduled">Has due date</option>
            <option value="unscheduled">No due date</option>
            <option value="overdue">Overdue</option>
          </Select>
        </div>

        <div className="min-w-[9rem] flex-1">
          <label htmlFor="card-filter-color" className="mb-1 block text-2xs font-medium text-muted">
            Colour
          </label>
          <Select
            id="card-filter-color"
            value={filters.color}
            onChange={(event) => setFilter('color', event.target.value)}
            aria-describedby="card-filter-help"
          >
            <option value={ANY_COLOR}>Any colour</option>
            <option value={NO_COLOR}>No colour</option>
            {colors.map((color) => (
              <option key={color} value={color}>
                {colorLabel(color)}
              </option>
            ))}
          </Select>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(DEFAULT_CARD_FILTERS)}
          disabled={!active}
          className="shrink-0"
        >
          <X aria-hidden />
          Clear filters
        </Button>
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-2xs text-subtle">
        <p role="status" aria-live="polite">
          {resultText}
        </p>
        <span aria-hidden>&middot;</span>
        <p id="card-filter-help">Search titles and descriptions. Filters only change what is shown.</p>
      </div>
    </section>
  )
}
