// The trailing \r is captured, not stripped, so a CRLF description round-trips byte-for-byte.
const TASK_LINE = /^(\s*)- \[([ xX])\] (.*\r?)$/

export interface ChecklistItem {
  index: number
  checked: boolean
  text: string
}

export const parseChecklist = (description: string): ChecklistItem[] =>
  description.split('\n').flatMap((line, index) => {
    const match = TASK_LINE.exec(line)
    return match ? [{ index, checked: match[2] !== ' ', text: match[3] }] : []
  })

export const toggleChecklistItem = (description: string, index: number) => {
  const lines = description.split('\n')
  const match = TASK_LINE.exec(lines[index] ?? '')
  if (!match) return description
  lines[index] = `${match[1]}- [${match[2] === ' ' ? 'x' : ' '}] ${match[3]}`
  return lines.join('\n')
}

export const withoutChecklist = (description: string) =>
  description
    .split('\n')
    .filter((line) => !TASK_LINE.test(line))
    .join('\n')

export const checklistProgress = (description: string) => {
  const items = parseChecklist(description)
  if (items.length === 0) return null
  return { done: items.filter((item) => item.checked).length, total: items.length }
}
