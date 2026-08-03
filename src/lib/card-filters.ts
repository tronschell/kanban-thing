import { dueDateToDay } from '@/lib/date-utils'

export const ALL_COLUMNS = '__all_columns__'
export const ANY_COLOR = '__any_color__'
export const NO_COLOR = '__no_color__'

export type CardDueFilter = 'all' | 'scheduled' | 'unscheduled' | 'overdue'

export interface CardFilters {
  search: string
  columnId: string
  due: CardDueFilter
  color: string
}

export const DEFAULT_CARD_FILTERS: CardFilters = {
  search: '',
  columnId: ALL_COLUMNS,
  due: 'all',
  color: ANY_COLOR,
}

export interface FilterableCard {
  title: string
  description?: string | null
  color: string | null
  due_date: string | null
  column_id: string
}

const localDay = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const hasCardFilters = (filters: CardFilters) =>
  filters.search.trim().length > 0 ||
  filters.columnId !== ALL_COLUMNS ||
  filters.due !== 'all' ||
  filters.color !== ANY_COLOR

export function filterCards<T extends FilterableCard>(
  cards: readonly T[],
  filters: CardFilters,
  now = new Date()
): T[] {
  const query = filters.search.trim().toLowerCase()
  const today = localDay(now)

  return cards.filter((card) => {
    if (query) {
      const haystack = `${card.title} ${card.description ?? ''}`.toLowerCase()
      if (!haystack.includes(query)) return false
    }

    if (filters.columnId !== ALL_COLUMNS && card.column_id !== filters.columnId) return false

    if (filters.color === NO_COLOR && card.color !== null) return false
    if (
      filters.color !== ANY_COLOR &&
      filters.color !== NO_COLOR &&
      card.color !== filters.color
    ) {
      return false
    }

    const dueDay = card.due_date ? dueDateToDay(card.due_date) : null
    if (filters.due === 'scheduled' && dueDay === null) return false
    if (filters.due === 'unscheduled' && dueDay !== null) return false
    if (filters.due === 'overdue' && (dueDay === null || dueDay >= today)) return false

    return true
  })
}
