import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { error } = await supabase.from('columns').delete().eq('id', id)

  if (error) {
    console.error('Failed to delete column:', error)
    return new NextResponse('Internal error', { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
