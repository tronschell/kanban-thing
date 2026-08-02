// The trailing \r is captured, not stripped, so a CRLF description round-trips byte-for-byte.
const TASK_LINE = /^(\s*)- \[([ xX])\] (.*\r?)$/
const FENCE = /^\s*(```|~~~)/

export interface ChecklistItem {
  index: number
  checked: boolean
  text: string
}

const taskMatches = (description: string) => {
  let inFence = false
  return description.split('\n').map((line) => {
    if (FENCE.test(line)) {
      inFence = !inFence
      return null
    }
    return inFence ? null : TASK_LINE.exec(line)
  })
}

export const parseChecklist = (description: string): ChecklistItem[] =>
  taskMatches(description).flatMap((match, index) =>
    match ? [{ index, checked: match[2] !== ' ', text: match[3] }] : []
  )

export const toggleChecklistItem = (description: string, index: number) => {
  const match = taskMatches(description)[index]
  if (!match) return description
  const lines = description.split('\n')
  lines[index] = `${match[1]}- [${match[2] === ' ' ? 'x' : ' '}] ${match[3]}`
  return lines.join('\n')
}

export const withoutChecklist = (description: string) => {
  const matches = taskMatches(description)
  return description
    .split('\n')
    .filter((_, index) => !matches[index])
    .join('\n')
}

export const checklistProgress = (description: string) => {
  const items = parseChecklist(description)
  if (items.length === 0) return null
  return { done: items.filter((item) => item.checked).length, total: items.length }
}
