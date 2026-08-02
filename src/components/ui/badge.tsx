import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-tag border px-1.5 py-0.5 text-2xs font-medium leading-none",
  {
    variants: {
      variant: {
        neutral: "border-subtle bg-surface text-muted",
        accent: "border-transparent bg-accent-soft text-accent",
        danger: "border-transparent bg-danger-soft text-danger",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Hex swatch rendered as a leading dot. Keeps label contrast independent of the colour. */
  dot?: string
}

export function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <span
      data-badge={variant ?? "neutral"}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    >
      {dot && (
        <span
          aria-hidden
          className="size-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: dot }}
        />
      )}
      {children}
    </span>
  )
}
