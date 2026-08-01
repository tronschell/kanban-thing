const LIBRARY_KEY = 'kanbanthing.library.v1'

const MAX_PREVIEW_COLUMNS = 6
const MAX_PREVIEW_CARDS = 12

export interface PreviewColumn {
  name: string
  cardColors: (string | null)[]
}

export interface LibraryEntry {
  id: string
  name: string
  expiresAt: string
  openedAt: string
  preview: PreviewColumn[]
}

export interface Library {
  version: 1
  exportedAt: string | null
  entries: LibraryEntry[]
}

const EMPTY_LIBRARY: Library = { version: 1, exportedAt: null, entries: [] }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const parsePreview = (value: unknown): PreviewColumn[] =>
  Array.isArray(value)
    ? value.slice(0, MAX_PREVIEW_COLUMNS).flatMap((column) =>
        isRecord(column) && typeof column.name === 'string' && Array.isArray(column.cardColors)
          ? [
              {
                name: column.name,
                cardColors: column.cardColors
                  .slice(0, MAX_PREVIEW_CARDS)
                  .map((color) => (typeof color === 'string' ? color : null)),
              },
            ]
          : []
      )
    : []

const isTimestamp = (value: unknown): value is string =>
  typeof value === 'string' && Number.isFinite(Date.parse(value))

const parseEntry = (value: unknown): LibraryEntry[] =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.name === 'string' &&
  isTimestamp(value.expiresAt) &&
  isTimestamp(value.openedAt)
    ? [
        {
          id: value.id,
          name: value.name,
          expiresAt: value.expiresAt,
          openedAt: value.openedAt,
          preview: parsePreview(value.preview),
        },
      ]
    : []

export const parseEntries = (value: unknown): LibraryEntry[] =>
  Array.isArray(value) ? value.flatMap(parseEntry) : []

export function readLibrary(): Library {
  try {
    const stored = localStorage.getItem(LIBRARY_KEY)
    const parsed: unknown = stored === null ? null : JSON.parse(stored)
    if (!isRecord(parsed) || parsed.version !== 1) return EMPTY_LIBRARY

    return {
      version: 1,
      exportedAt: isTimestamp(parsed.exportedAt) ? parsed.exportedAt : null,
      entries: parseEntries(parsed.entries),
    }
  } catch {
    return EMPTY_LIBRARY
  }
}

export function writeLibrary(library: Library) {
  try {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(library))
  } catch {
    /* private mode or a full quota: the list simply stops growing rather than breaking the board */
  }
}

export function rememberBoard(board: {
  id: string
  name: string
  expiresAt: string
  columns: { id: string; name: string }[]
  cards: { column_id: string; color: string | null }[]
}) {
  const entry: LibraryEntry = {
    id: board.id,
    name: board.name,
    expiresAt: board.expiresAt,
    openedAt: new Date().toISOString(),
    preview: board.columns.slice(0, MAX_PREVIEW_COLUMNS).map((column) => ({
      name: column.name,
      cardColors: board.cards
        .filter((card) => card.column_id === column.id)
        .slice(0, MAX_PREVIEW_CARDS)
        .map((card) => card.color),
    })),
  }

  const library = readLibrary()
  writeLibrary({
    ...library,
    entries: [entry, ...library.entries.filter((existing) => existing.id !== entry.id)],
  })
}

export function forgetBoards(ids: string[]): Library {
  const forgotten = new Set(ids)
  const library = readLibrary()
  const next = {
    ...library,
    entries: library.entries.filter((entry) => !forgotten.has(entry.id)),
  }

  writeLibrary(next)
  for (const id of ids) {
    localStorage.removeItem(`board_password_${id}`)
    localStorage.removeItem(`board_access_${id}`)
  }
  return next
}
