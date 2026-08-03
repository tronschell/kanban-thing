import {
  boardPassword,
  forgetBoardPassword,
  rememberBoardPassword,
} from '@/lib/board-writes'

const LIBRARY_KEY = 'kanbanthing.library.v1'

const MAX_PREVIEW_COLUMNS = 6
const MAX_PREVIEW_CARDS = 12

export interface PreviewColumn {
  /** Deliberately content-free: board labels and card colors do not belong in the library preview. */
  cardCount: number
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

const parsePreviewColumn = (value: unknown): PreviewColumn[] => {
  if (!isRecord(value)) return []

  const cardCount =
    typeof value.cardCount === 'number' && Number.isFinite(value.cardCount) && value.cardCount >= 0
      ? Math.min(MAX_PREVIEW_CARDS, Math.floor(value.cardCount))
      : Array.isArray(value.cardColors)
        ? Math.min(MAX_PREVIEW_CARDS, value.cardColors.length)
        : null

  return cardCount === null ? [] : [{ cardCount }]
}

const parsePreview = (value: unknown): PreviewColumn[] =>
  Array.isArray(value) ? value.slice(0, MAX_PREVIEW_COLUMNS).flatMap(parsePreviewColumn) : []

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
      cardCount: Math.min(
        MAX_PREVIEW_CARDS,
        board.cards.filter((card) => card.column_id === column.id).length
      ),
    })),
  }

  const library = readLibrary()
  writeLibrary({
    ...library,
    entries: [entry, ...library.entries.filter((existing) => existing.id !== entry.id)],
  })
}

export interface ForgottenBoard {
  entry: LibraryEntry
  password: string | null
}

export interface ForgetBoardsResult {
  library: Library
  forgotten: ForgottenBoard[]
}

export function forgetBoards(ids: string[]): ForgetBoardsResult {
  const forgotten = new Set(ids)
  const library = readLibrary()
  const forgottenEntries = library.entries
    .filter((entry) => forgotten.has(entry.id))
    .map((entry) => ({ entry, password: boardPassword(entry.id) || null }))
  const next = {
    ...library,
    entries: library.entries.filter((entry) => !forgotten.has(entry.id)),
  }

  writeLibrary(next)
  for (const id of forgotten) forgetBoardPassword(id)
  return { library: next, forgotten: forgottenEntries }
}

/**
 * Restores only entries that are still absent. The password is held in memory
 * by the caller for the short undo window and is never added to the library
 * export or another recovery store.
 */
export function restoreBoards(forgotten: ForgottenBoard[]): Library {
  const library = readLibrary()
  const present = new Set(library.entries.map((entry) => entry.id))
  const additions = forgotten
    .filter(({ entry }) => !present.has(entry.id))
    .map(({ entry }) => entry)
  const next = {
    ...library,
    entries: [...additions, ...library.entries],
  }

  writeLibrary(next)
  for (const { entry, password } of forgotten) {
    if (!present.has(entry.id) && password) rememberBoardPassword(entry.id, password)
  }
  return next
}
