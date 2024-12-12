import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const columnId = params.id
    const supabase = createClient()

    // Delete all cards in the column first
    const { error: cardsError } = await supabase
      .from('cards')
      .delete()
      .eq('column_id', columnId)

    if (cardsError) {
      throw cardsError
    }

    // Then delete the column
    const { error: deleteError } = await supabase
      .from('columns')
      .delete()
      .eq('id', columnId)

    if (deleteError) {
      throw deleteError
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Failed to delete column:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}