import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { timeLeft } from './board-library'
import {
  forgetBoards,
  readLibrary,
  rememberBoard,
  restoreBoards,
  writeLibrary,
} from '../lib/board-library'

const NOW = new Date('2026-03-09T12:00:00.000Z')

const inMs = (ms: number) => new Date(NOW.getTime() + ms).toISOString()

const MINUTE = 60000
const HOUR = 3600000
const DAY = 86400000

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
  localStorage.clear()
  sessionStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('timeLeft', () => {
  it('never claims zero hours while an hour of life remains', () => {
    expect(timeLeft(inMs(59 * MINUTE)).label).toBe('59m left')
  })

  it('never claims a zero quantity in the last minute', () => {
    expect(timeLeft(inMs(30 * 1000)).label).toBe('1m left')
  })

  it('floors whole days so the card agrees with the lifespan modal', () => {
    expect(timeLeft(inMs(13.6 * DAY)).label).toBe('13d left')
  })

  it('still reports whole hours below a day', () => {
    expect(timeLeft(inMs(5 * HOUR)).label).toBe('5h left')
  })

  it('marks a week or less as urgent and anything longer as calm', () => {
    expect(timeLeft(inMs(13.6 * DAY)).urgent).toBe(false)
    expect(timeLeft(inMs(7 * DAY)).urgent).toBe(true)
    expect(timeLeft(inMs(5 * HOUR)).urgent).toBe(true)
    expect(timeLeft(inMs(30 * 1000)).urgent).toBe(true)
  })

  it('reports an expired board as expired', () => {
    expect(timeLeft(inMs(0))).toEqual({ label: 'Expired', urgent: true })
    expect(timeLeft(inMs(-3 * DAY))).toEqual({ label: 'Expired', urgent: true })
  })
})

describe('board library privacy and recovery', () => {
  it('stores only content-free counts in a board preview', () => {
    rememberBoard({
      id: 'board-1',
      name: 'Private planning',
      expiresAt: inMs(10 * DAY),
      columns: [
        { id: 'column-1', name: 'Sensitive workstream' },
        { id: 'column-2', name: 'Done' },
      ],
      cards: [
        { column_id: 'column-1', color: '#ff0000' },
        { column_id: 'column-2', color: '#00ff00' },
      ],
    })

    expect(readLibrary().entries[0].preview).toEqual([{ cardCount: 1 }, { cardCount: 1 }])
  })

  it('forgets and restores the board entry and tab credential through undo', () => {
    const entry = {
      id: 'board-1',
      name: 'Private planning',
      expiresAt: inMs(10 * DAY),
      openedAt: NOW.toISOString(),
      preview: [{ cardCount: 2 }],
    }
    writeLibrary({ version: 1, exportedAt: null, entries: [entry] })
    sessionStorage.setItem('board_password_board-1', 'secret')
    sessionStorage.setItem('board_access_board-1', 'true')

    const forgotten = forgetBoards(['board-1'])

    expect(forgotten.library.entries).toEqual([])
    expect(sessionStorage.getItem('board_password_board-1')).toBeNull()
    expect(forgotten.forgotten).toEqual([{ entry, password: 'secret' }])

    const restored = restoreBoards(forgotten.forgotten)

    expect(restored.entries).toEqual([entry])
    expect(sessionStorage.getItem('board_password_board-1')).toBe('secret')
    expect(sessionStorage.getItem('board_access_board-1')).toBe('true')
  })
})
