import { describe, expect, it } from 'vitest'
import { downloadCount, isCliVersion } from './cli'

describe('isCliVersion', () => {
  it('accepts a plain semver release', () => {
    expect(isCliVersion('0.1.0')).toBe(true)
  })

  it('accepts a prerelease suffix', () => {
    expect(isCliVersion('1.2.3-beta.4')).toBe(true)
  })

  it('rejects a missing param', () => {
    expect(isCliVersion(null)).toBe(false)
  })

  it('rejects a partial version', () => {
    expect(isCliVersion('1.2')).toBe(false)
  })

  it('rejects a build suffix the CLI never publishes', () => {
    expect(isCliVersion('1.2.3+build_9')).toBe(false)
  })

  it('rejects padding that would reach the database as a fresh row', () => {
    expect(isCliVersion(' 0.1.0 ')).toBe(false)
  })

  it('rejects a string long enough to bloat the usage table', () => {
    expect(isCliVersion('0.1.0'.padEnd(500, 'x'))).toBe(false)
  })

  it('rejects an injection attempt', () => {
    expect(isCliVersion("0.1.0'); drop table cli_usage; --")).toBe(false)
  })
})

describe('downloadCount', () => {
  it('reads the count npm returns', () => {
    expect(downloadCount({ downloads: 4210, start: '2026-07-27', package: 'kanbanthing' })).toBe(
      4210
    )
  })

  it('returns zero for the 404 body npm sends for an unpublished package', () => {
    expect(downloadCount({ error: 'package kanbanthing not found' })).toBe(0)
  })

  it('returns zero when the fetch failed and nothing was parsed', () => {
    expect(downloadCount(null)).toBe(0)
  })

  it('returns zero when npm answers with a non-numeric count', () => {
    expect(downloadCount({ downloads: '4210' })).toBe(0)
  })

  it('returns zero rather than a negative or non-finite count', () => {
    expect(downloadCount({ downloads: -5 })).toBe(0)
    expect(downloadCount({ downloads: Number.NaN })).toBe(0)
  })
})
