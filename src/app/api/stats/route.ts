import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { data, error } = await supabase
      .from('global_stats')
      .select('boards_created, cards_created, cards_moved')
      .single();

    if (error) throw error;

    return NextResponse.json({
      boardsCreated: data.boards_created,
      cardsCreated: data.cards_created,
      cardsMoved: data.cards_moved,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
} 