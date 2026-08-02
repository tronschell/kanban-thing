import type { createClient } from '@/lib/supabase/client'
import type { BoardRead, Card, Column } from '@/types'

type SupabaseClient = ReturnType<typeof createClient>

export type WriteResult = 'ok' | 'wrong_password' | 'not_found'

export const boardPassword = (boardId: string) =>
  localStorage.getItem(`board_password_${boardId}`) ?? ''

export const rememberBoardPassword = (boardId: string, password: string) => {
  localStorage.setItem(`board_password_${boardId}`, password)
  localStorage.setItem(`board_access_${boardId}`, 'true')
}

export const forgetBoardPassword = (boardId: string) => {
  localStorage.removeItem(`board_password_${boardId}`)
  localStorage.removeItem(`board_access_${boardId}`)
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
