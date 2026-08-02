import { createServerClient } from '@supabase/ssr'
import type { BoardRead, Card } from '@/types'

/** The MCP endpoint is authless, so it must never adopt a caller's cookies and outrank a visitor. */
export const anonClient = () =>
  createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [] } }
  )

export type SupabaseClient = ReturnType<typeof anonClient>

export type WriteResult = 'ok' | 'wrong_password' | 'not_found'

type CardRow = Pick<
  Card,
  'id' | 'column_id' | 'title' | 'description' | 'color' | 'due_date' | 'position'
>

/** Supabase errors carry table names, SQL and hints; none of that may reach an MCP client. */
const unavailable = (error: unknown) => {
  console.error('MCP Supabase call failed:', error)
  return new Error('The board service is unavailable. Try again in a moment.')
}

export const createBoard = async (
  supabase: SupabaseClient,
  name: string,
  password: string,
  extraColumns: string[],
  days: number
): Promise<string> => {
  const { data, error } = await supabase.rpc('board_create', {
    name_param: name,
    password_param: password,
    extra_columns: extraColumns,
    days_param: days,
  })
  if (error || !data) throw unavailable(error ?? 'board_create returned no id')
  return data as string
}

export const readBoard = async (
  supabase: SupabaseClient,
  boardId: string,
  password: string
): Promise<BoardRead> => {
  const { data, error } = await supabase.rpc('board_read', {
    board_id_param: boardId,
    password_attempt: password,
    include_history: false,
  })
  if (error) throw unavailable(error)
  return data as BoardRead
}

export const saveCards = async (
  supabase: SupabaseClient,
  boardId: string,
  password: string,
  cards: CardRow[],
  deleteIds: string[] = []
): Promise<WriteResult> => {
  const { data, error } = await supabase.rpc('board_save_cards', {
    board_id_param: boardId,
    password_attempt: password,
    cards_param: cards,
    delete_ids: deleteIds,
  })
  if (error) throw unavailable(error)
  return data as WriteResult
}
