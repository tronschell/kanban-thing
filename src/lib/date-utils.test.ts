import { describe, expect, it } from 'vitest'
import { dayToDueDate, dueDateToDay } from './date-utils'

describe('due date storage round-trip', () => {
  it('reads back the same calendar day it stored', () => {
    expect(dueDateToDay(dayToDueDate('2026-03-09'))).toBe('2026-03-09')
  })

  it('stores a day as UTC midnight', () => {
    expect(dayToDueDate('2026-03-09')).toBe('2026-03-09T00:00:00.000Z')
  })
})
