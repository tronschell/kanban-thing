import type { createClient } from '@/lib/supabase/client'
import type { BoardRead, Card, Column } from '@/types'

type SupabaseClient = ReturnType<typeof createClient>

export type WriteResult = 'ok' | 'wrong_password' | 'not_found'

const passwordKey = (boardId: string) => `board_password_${boardId}`
const accessKey = (boardId: string) => `board_access_${boardId}`
const inMemoryPasswords = new Map<string, string>()

const getStorage = (kind: 'local' | 'session'): Storage | null => {
  if (typeof window === 'undefined') return null

  try {
    return kind === 'session' ? window.sessionStorage : window.localStorage
  } catch {
    return null
  }
}

/**
 * Passwords are tab-scoped now. A legacy localStorage value is migrated the
 * first time it is read so existing boards keep working without leaving the
 * credential origin-wide and persistent. If sessionStorage is unavailable,
 * newly entered passwords stay in this page's memory only; they are never
 * written to persistent localStorage as a fallback.
 */
export const boardPassword = (boardId: string) => {
  const inMemory = inMemoryPasswords.get(boardId)
  if (inMemory !== undefined) return inMemory

  const key = passwordKey(boardId)
  const session = getStorage('session')
  const local = getStorage('local')

  try {
    const current = session?.getItem(key)
    if (current !== null && current !== undefined) {
      inMemoryPasswords.set(boardId, current)
      return current
    }
  } catch {
    /* fall through to the legacy storage below */
  }

  let legacy: string | null = null
  try {
    legacy = local?.getItem(key) ?? null
  } catch {
    return ''
  }

  if (legacy === null) return ''

  if (session) {
    try {
      session.setItem(key, legacy)
      session.setItem(accessKey(boardId), 'true')
      local?.removeItem(key)
      local?.removeItem(accessKey(boardId))
      inMemoryPasswords.set(boardId, legacy)
      return legacy
    } catch {
      // If session storage is unavailable, keep the legacy value usable.
    }
  }

  inMemoryPasswords.set(boardId, legacy)
  return legacy
}

export const rememberBoardPassword = (boardId: string, password: string) => {
  inMemoryPasswords.set(boardId, password)

  const key = passwordKey(boardId)
  const session = getStorage('session')
  const local = getStorage('local')

  if (session) {
    try {
      session.setItem(key, password)
      session.setItem(accessKey(boardId), 'true')
      local?.removeItem(key)
      local?.removeItem(accessKey(boardId))
      return
    } catch {
      // Keep the new credential in memory only when session storage is blocked.
    }
  }

  try {
    // Remove any legacy copy rather than persisting the new credential there.
    local?.removeItem(key)
    local?.removeItem(accessKey(boardId))
  } catch {
    /* private mode or a full quota: the in-memory value still serves this page */
  }
}

export const forgetBoardPassword = (boardId: string) => {
  inMemoryPasswords.delete(boardId)

  for (const storage of [getStorage('session'), getStorage('local')]) {
    try {
      storage?.removeItem(passwordKey(boardId))
      storage?.removeItem(accessKey(boardId))
    } catch {
      /* storage may be unavailable in private browsing */
    }
  }
}

export const writeMessage = (result: WriteResult, fallback: string) => {
  if (result === 'wrong_password') {
    return 'The board password is no longer correct. Reload the board and unlock it again.'
  }
  if (result === 'not_found') return 'This board no longer exists.'
  return fallback
}

const call = async (
  supabase: SupabaseClient,
  fn: string,
  args: Record<string, unknown>
): Promise<WriteResult> => {
  const { data, error } = await supabase.rpc(fn, args)
  if (error) throw error
  return data as WriteResult
}

type CardRow = Pick<
  Card,
  'id' | 'column_id' | 'title' | 'description' | 'color' | 'due_date' | 'position'
>
type ColumnRow = Pick<Column, 'id' | 'name' | 'position'>

export const cardRow = (card: Card): CardRow => ({
  id: card.id,
  column_id: card.column_id,
  title: card.title,
  description: card.description ?? null,
  color: card.color ?? null,
  due_date: card.due_date ?? null,
  position: card.position,
})

export const columnRow = (column: Column): ColumnRow => ({
  id: column.id,
  name: column.name,
  position: column.position,
})

export const readBoard = async (
  supabase: SupabaseClient,
  boardId: string,
  includeHistory = false
): Promise<BoardRead> => {
  const { data, error } = await supabase.rpc('board_read', {
    board_id_param: boardId,
    password_attempt: boardPassword(boardId),
    include_history: includeHistory,
  })
  if (error) throw error
  return data as BoardRead
}

export const saveCards = (
  supabase: SupabaseClient,
  boardId: string,
  cards: CardRow[],
  deleteIds: string[] = []
) =>
  call(supabase, 'board_save_cards', {
    board_id_param: boardId,
    password_attempt: boardPassword(boardId),
    cards_param: cards,
    delete_ids: deleteIds,
  })

export const saveColumns = (
  supabase: SupabaseClient,
  boardId: string,
  columns: ColumnRow[],
  deleteIds: string[] = []
) =>
  call(supabase, 'board_save_columns', {
    board_id_param: boardId,
    password_attempt: boardPassword(boardId),
    columns_param: columns,
    delete_ids: deleteIds,
  })

export const renameBoard = (supabase: SupabaseClient, boardId: string, name: string) =>
  call(supabase, 'board_rename', {
    board_id_param: boardId,
    password_attempt: boardPassword(boardId),
    new_name: name,
  })

export const deleteBoard = (supabase: SupabaseClient, boardId: string) =>
  call(supabase, 'board_delete', {
    board_id_param: boardId,
    password_attempt: boardPassword(boardId),
  })

export const setBoardPassword = (
  supabase: SupabaseClient,
  boardId: string,
  currentPassword: string,
  newPassword: string
) =>
  call(supabase, 'board_set_password', {
    board_id_param: boardId,
    current_password: currentPassword,
    new_password: newPassword,
  })

export const createBoard = async (
  supabase: SupabaseClient,
  name: string,
  password: string,
  extraColumns: string[],
  days: number
): Promise<string> => {
  const { data, error } = await supabase.rpc('board_create', {
    name_param: name,
    password_param: password || null,
    extra_columns: extraColumns,
    days_param: days,
  })
  if (error || !data) throw error ?? new Error('Board creation failed')
  return data as string
}
