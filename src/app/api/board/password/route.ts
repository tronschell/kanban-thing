import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const { boardId, password, action } = await request.json()

  if (!boardId || !password) {
    return NextResponse.json(
      { error: 'Board ID and password are required' },
      { status: 400 }
    )
  }

  if (action !== 'verify' && action !== 'set') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data, error } =
    action === 'verify'
      ? await supabase.rpc('verify_and_set_board_password', {
          board_id_param: boardId,
          password_attempt: password,
        })
      : await supabase.rpc('set_board_password', {
          board_id_param: boardId,
          new_password: password,
        })

  if (error) {
    console.error(`Board password ${action} failed:`, error.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  return NextResponse.json({ success: Boolean(data) })
}
