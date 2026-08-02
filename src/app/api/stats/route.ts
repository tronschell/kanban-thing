import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('global_stats')
    .select('boards_created, cards_created, cards_moved')
    .single()

  if (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }

  return NextResponse.json({
    boardsCreated: data.boards_created,
    cardsCreated: data.cards_created,
    cardsMoved: data.cards_moved,
  })
}
