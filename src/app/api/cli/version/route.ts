import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cliVersionInfo, isCliVersion } from '@/lib/cli'

async function recordCheck(version: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.rpc('bump_cli_check', { version_param: version })
    if (error) throw error
  } catch (error) {
    console.error('Error recording CLI check:', error)
  }
}

export async function GET(request: Request) {
  const version = new URL(request.url).searchParams.get('v')

  if (isCliVersion(version)) {
    await recordCheck(version)
  }

  return NextResponse.json(cliVersionInfo(), {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' },
  })
}
