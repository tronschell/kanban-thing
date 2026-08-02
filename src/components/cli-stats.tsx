'use client'

import { useEffect, useState } from 'react'

interface CliStats {
  lastWeek: number
  lastMonth: number
  latest: string
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

function parseStats(value: unknown): CliStats | null {
  if (!isRecord(value) || !isRecord(value.downloads)) return null

  const { lastWeek, lastMonth } = value.downloads
  if (typeof lastWeek !== 'number' || typeof lastMonth !== 'number') return null
  if (typeof value.latest !== 'string') return null
  if (lastWeek === 0 && lastMonth === 0) return null

  return { lastWeek, lastMonth, latest: value.latest }
}

export function CliStats() {
  const [stats, setStats] = useState<CliStats | null>(null)

  useEffect(() => {
    fetch('/api/cli/stats')
      .then((response) => response.json())
      .then((data: unknown) => setStats(parseStats(data)))
      .catch(() => {})
  }, [])

  if (!stats) return null

  return (
    <dl className="mt-6 grid gap-6 border-y border-subtle py-6 sm:grid-cols-3">
      <Stat label="Downloads last week" value={stats.lastWeek.toLocaleString()} />
      <Stat label="Downloads last month" value={stats.lastMonth.toLocaleString()} />
      <Stat label="Current version" value={stats.latest} />
    </dl>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-subtle">{label}</dt>
      <dd className="mt-1 font-mono text-2xl tabular-nums text-fg">{value}</dd>
    </div>
  )
}
