import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cliVersionInfo, downloadCount } from '@/lib/cli'

type CliStats = {
  downloads: { lastWeek: number; lastMonth: number }
  checks: { total: number; last30Days: number }
  latest: string
}

async function npmDownloads(period: 'last-week' | 'last-month'): Promise<number> {
  try {
    const response = await fetch(`https://api.npmjs.org/downloads/point/${period}/kanbanthing`, {
      signal: AbortSignal.timeout(3000),
    })
    if (!response.ok) return 0
    return downloadCount(await response.json())
  } catch (error) {
    console.error('Error fetching npm downloads:', error)
    return 0
  }
}

async function cliChecks(): Promise<CliStats['checks']> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('cli_usage_totals')
    if (error) throw error
    const totals = data as { total_checks?: number; checks_30d?: number } | null
    return { total: totals?.total_checks ?? 0, last30Days: totals?.checks_30d ?? 0 }
  } catch (error) {
    console.error('Error fetching CLI usage totals:', error)
    return { total: 0, last30Days: 0 }
  }
}

export async function GET() {
  const [lastWeek, lastMonth, checks] = await Promise.all([
    npmDownloads('last-week'),
    npmDownloads('last-month'),
    cliChecks(),
  ])

  const body: CliStats = {
    downloads: { lastWeek, lastMonth },
    checks,
    latest: cliVersionInfo().latest,
  }

  return NextResponse.json(body, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  })
}
