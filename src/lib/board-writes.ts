import type { createClient } from '@/lib/supabase/client'

type SupabaseClient = ReturnType<typeof createClient>

export const ensureBoardPassword = async (supabase: SupabaseClient, boardId: string) => {
  const storedPassword = localStorage.getItem(`board_password_${boardId}`)
  if (!storedPassword) return

  try {
    await supabase.rpc('verify_and_set_board_password', {
      board_id_param: boardId,
      password_attempt: storedPassword,
    })
  } catch (error) {
    console.error('Error setting board password:', error)
  }
}

export const recordCardHistory = async (
  supabase: SupabaseClient,
  cardId: string,
  fromColumn: string,
  toColumn: string
) => {
  await supabase.from('card_history').insert({
    card_id: cardId,
    from_column: fromColumn,
    to_column: toColumn,
    timestamp: new Date().toISOString(),
  })
}
