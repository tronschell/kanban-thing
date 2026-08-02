import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Visual-only hover/focus label. The trigger must carry its own accessible name
 * (`aria-label` or visible text); the bubble is hidden from assistive tech.
 */
export function Tooltip({
  content,
  side = "bottom",
  children,
}: {
  content: string
  side?: "top" | "bottom"
  children: React.ReactNode
}) {
  return (
    <span className="group/tooltip relative inline-flex">
      {children}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-control border border-subtle bg-surface-raised px-2 py-1 text-2xs text-fg opacity-0 shadow-popover transition-opacity duration-fast ease-out group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100",
          side === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5"
        )}
      >
        {content}
      </span>
    </span>
  )
}
