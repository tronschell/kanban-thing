"use client"

import { useEffect, useSyncExternalStore } from "react"
import Link from "next/link"
import { ArrowRight, Terminal, X } from "lucide-react"
import { Badge, IconButton } from "@/components/ui"
import { CopyButton } from "@/components/copy-button"

const DISMISSED_KEY = "kanbanthing.cli-banner.v1"
const INSTALL_COMMAND = "npm i -g kanbanthing"

const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function readDismissed() {
  try {
    return localStorage.getItem(DISMISSED_KEY) === "1"
  } catch {
    return true
  }
}

function dismiss() {
  try {
    localStorage.setItem(DISMISSED_KEY, "1")
  } catch {
    /* private mode: the notification stays gone for this page view only */
  }
  for (const listener of listeners) listener()
}

export function CliBanner() {
  const isDismissed = useSyncExternalStore(subscribe, readDismissed, () => true)

  useEffect(() => {
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss()
    }
    window.addEventListener("keydown", dismissOnEscape)
    return () => window.removeEventListener("keydown", dismissOnEscape)
  }, [])

  if (isDismissed) return null

  return (
    <aside
      aria-label="New: command line client"
      className="fixed inset-x-4 top-20 z-50 rounded-panel border border-accent bg-surface-raised p-4 shadow-modal duration-base ease-out animate-in fade-in-0 slide-in-from-top-2 motion-reduce:animate-none sm:inset-x-auto sm:right-6 sm:w-[21rem]"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="flex size-8 shrink-0 items-center justify-center rounded-control bg-accent-soft text-accent"
        >
          <Terminal className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-fg">Terminal client</p>
            <Badge variant="accent">New</Badge>
          </div>
          <p className="mt-1 text-sm text-muted">
            Add and move cards from a shell, a script or an AI agent.
          </p>
        </div>
        <IconButton
          label="Dismiss"
          size="sm"
          className="-mr-1 -mt-1 shrink-0"
          icon={<X />}
          onClick={dismiss}
        />
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        <code className="min-w-0 flex-1 truncate rounded-control border border-subtle bg-surface px-2 py-1.5 font-mono text-xs text-fg">
          {INSTALL_COMMAND}
        </code>
        <CopyButton value={INSTALL_COMMAND} />
      </div>

      <Link
        href="/cli"
        className="focus-ring mt-3 inline-flex items-center gap-1 rounded text-sm text-accent transition-colors duration-fast hover:text-accent-hover"
      >
        Read the docs
        <ArrowRight className="size-3.5" />
      </Link>
    </aside>
  )
}
