import { cn } from "@/lib/utils"

const sizes = {
  sm: "size-3.5 border",
  md: "size-5 border-2",
  lg: "size-8 border-2",
}

export function Spinner({
  size = "md",
  label = "Loading",
  className,
}: {
  size?: keyof typeof sizes
  /** Accessible name announced while the spinner is visible. */
  label?: string
  className?: string
}) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "inline-block animate-spin rounded-full border-strong border-t-transparent",
        sizes[size],
        className
      )}
    />
  )
}
