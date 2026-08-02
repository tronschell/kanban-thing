import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { daysUntil, expiryDateFor, formatExpiryDate } from './board-lifespan'

const ORIGINAL_TZ = process.env.TZ
process.env.TZ = 'Europe/Berlin'

const BERLIN_DST_CLOCK = new Date('2026-08-31T22:30:00Z')
const hoursFromNow = (hours: number) => new Date(Date.now() + hours * 3600000).toISOString()

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(BERLIN_DST_CLOCK)
})

afterEach(() => {
  vi.useRealTimers()
})

afterAll(() => {
  if (ORIGINAL_TZ === undefined) delete process.env.TZ
  else process.env.TZ = ORIGINAL_TZ
})

describe('daysUntil', () => {
  it('reports zero whole days with 13 hours left', () => {
    expect(daysUntil(hoursFromNow(13))).toBe(0)
  })

  it('reports zero whole days with 23h59m left', () => {
    expect(daysUntil(hoursFromNow(23 + 59 / 60))).toBe(0)
  })

  it('never rounds up to a day the board does not have', () => {
    expect(daysUntil(hoursFromNow(59.6 * 24))).toBe(59)
  })

  it('reports a whole span exactly', () => {
    expect(daysUntil(hoursFromNow(60 * 24))).toBe(60)
  })
})

describe('expiryDateFor', () => {
  it('runs under Europe/Berlin so the DST case below is meaningful', () => {
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('Europe/Berlin')
  })

  it('matches the absolute 24h-per-day expiry the server stores', () => {
    expect(expiryDateFor(60)).toBe(formatExpiryDate(new Date(Date.now() + 60 * 86400000)))
  })

  it('previews the same date the lifespan modal renders across a DST change', () => {
    expect(expiryDateFor(60)).toBe('30 October 2026')
  })
})
