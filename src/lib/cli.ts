const FALLBACK_VERSION = '0.1.0'

export type CliVersionInfo = {
  latest: string
  minimum: string
  message: string | null
}

/** Env-driven so a version bump or an urgent notice ships by editing a Vercel env var, no deploy. */
export function cliVersionInfo(): CliVersionInfo {
  return {
    latest: process.env.CLI_LATEST_VERSION || FALLBACK_VERSION,
    minimum: process.env.CLI_MINIMUM_VERSION || FALLBACK_VERSION,
    message: process.env.CLI_MESSAGE || null,
  }
}

export function isCliVersion(value: string | null): value is string {
  return value !== null && /^\d+\.\d+\.\d+(-[a-z0-9.]+)?$/i.test(value)
}

export function downloadCount(payload: unknown): number {
  const count = (payload as { downloads?: unknown } | null)?.downloads
  return typeof count === 'number' && Number.isFinite(count) && count > 0 ? count : 0
}
