import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const iconButtonVariants = cva(
  "focus-ring inline-flex items-center justify-center rounded-control transition-colors duration-fast ease-out disabled:pointer-events-none disabled:opacity-45 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        ghost: "text-subtle hover:bg-surface-hover hover:text-fg",
        secondary:
          "bg-surface-raised text-muted border border-subtle hover:bg-surface-hover hover:text-fg",
        danger: "text-subtle hover:bg-danger-soft hover:text-danger",
      },
      size: {
        sm: "h-6 w-6 [&_svg]:size-3.5",
        md: "h-8 w-8 [&_svg]:size-4",
      },
    },
    defaultVariants: {
      variant: "ghost",
      size: "md",
    },
  }
)

export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">,
    VariantProps<typeof iconButtonVariants> {
  /** Accessible name. Required: the button has no visible text. */
  label: string
  icon: React.ReactNode
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant, size, label, icon, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      className={cn(iconButtonVariants({ variant, size }), className)}
      {...props}
    >
      {icon}
    </button>
  )
)
IconButton.displayName = "IconButton"

export { IconButton, iconButtonVariants }
