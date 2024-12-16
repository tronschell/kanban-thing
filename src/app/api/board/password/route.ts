import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { boardId, password, action } = await request.json()
    const supabase = createRouteHandlerClient({ cookies })

    if (!boardId) {
      return NextResponse.json(
        { error: 'Board ID is required' },
        { status: 400 }
      )
    }

    if (action === 'verify') {
      console.log('Verifying password for board:', boardId)
      const { data, error } = await supabase
        .rpc('verify_and_set_board_password', {
          board_id_param: boardId,
          password_attempt: password
        })

      console.log('Verification result:', { data, error })

      if (error) throw error

      if (data) {
        return NextResponse.json({ 
          success: true,
          password: password
        })
      }

      return NextResponse.json({ success: false })
    }

    if (action === 'set') {
      const { data, error } = await supabase
        .rpc('set_board_password', {
          board_id_param: boardId,
          new_password: password
        })

      if (error) throw error

      return NextResponse.json({ success: data })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Password API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 