'use client'

import { useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { Check, Copy, Terminal, X } from 'lucide-react'
import { IconButton } from '@/components/ui'

const DISMISSED_KEY = 'kanbanthing.cli-banner.v1'
const INSTALL_COMMAND = 'npm i -g kanbanthing'

const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function readDismissed() {
  try {
    return localStorage.getItem(DISMISSED_KEY) === '1'
  } catch {
    return true
  }
}

function dismiss() {
  try {
    localStorage.setItem(DISMISSED_KEY, '1')
  } catch {
    /* private mode: the banner stays gone for this page view only */
  }
  for (const listener of listeners) listener()
}

export function CliBanner() {
  const [hasCopied, setHasCopied] = useState(false)
  const isDismissed = useSyncExternalStore(subscribe, readDismissed, () => true)

  if (isDismissed) return null

  const copyInstallCommand = async () => {
    try {
      await navigator.clipboard.writeText(INSTALL_COMMAND)
      setHasCopied(true)
      setTimeout(() => setHasCopied(false), 2500)
    } catch (error) {
      console.error('Failed to copy the install command:', error)
    }
  }

  return (
    <section aria-label="Command line client" className="border-t border-subtle">
      <div className="mx-auto flex w-full max-w-4xl items-start gap-3 px-6 py-4 sm:items-center">
        <Terminal aria-hidden className="mt-1 size-4 shrink-0 text-subtle sm:mt-0" />
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <p className="text-sm text-muted">
            There is a terminal client now. Add and move cards from a shell or an AI agent.{' '}
            <Link
              href="/cli"
              className="focus-ring rounded text-fg underline underline-offset-4 transition-colors duration-fast hover:text-accent"
            >
              Read the docs
            </Link>
          </p>
          <div className="flex items-center gap-1.5 sm:ml-auto">
            <code className="whitespace-nowrap rounded-control border border-subtle bg-surface px-2 py-1 font-mono text-xs text-fg">
              {INSTALL_COMMAND}
            </code>
            <IconButton
              label={hasCopied ? 'Install command copied' : 'Copy install command'}
              size="sm"
              icon={hasCopied ? <Check /> : <Copy />}
              onClick={copyInstallCommand}
            />
          </div>
        </div>
        <IconButton
          label="Dismiss"
          size="sm"
          className="mt-0.5 shrink-0 sm:mt-0"
          icon={<X />}
          onClick={dismiss}
        />
      </div>
    </section>
  )
}
