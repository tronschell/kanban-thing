import type { Column } from '@/types'

export const BACKLOG_NAME = 'Backlog'

export const splitBacklog = (columns: Column[]) => {
  const backlog =
    columns
      .filter((column) => column.name === BACKLOG_NAME)
      .sort((a, b) => a.id.localeCompare(b.id))[0] ?? null

  return {
    backlog,
    columns: columns.filter((column) => column.id !== backlog?.id),
  }
}
