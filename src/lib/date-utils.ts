const startOfLocalDay = (date: Date) => {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

/** The calendar day a stored due date stands for, as `yyyy-MM-dd`. */
export const dueDateToDay = (dueDate: string) => dueDate.slice(0, 10)

/** Store a `yyyy-MM-dd` day as UTC midnight so every timezone reads back that same day. */
export const dayToDueDate = (day: string) => `${day}T00:00:00.000Z`

const parseDueDate = (dueDate: string) => {
  const [year, month, day] = dueDateToDay(dueDate).split('-').map(Number)
  return new Date(year, month - 1, day)
}

const daysUntilDue = (dueDate: string) => {
  const due = parseDueDate(dueDate)
  const today = startOfLocalDay(new Date())
  return Math.round((due.getTime() - today.getTime()) / 86400000)
}

export const formatDueDate = (dueDate: string) => {
  const days = daysUntilDue(dueDate)

  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days === -1) return 'Yesterday'
  if (days < 0) return `${Math.abs(days)} days ago`
  if (days === 2) return 'In 2 days'

  return parseDueDate(dueDate).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

export const isDueSoon = (dueDate: string) => daysUntilDue(dueDate) <= 2
