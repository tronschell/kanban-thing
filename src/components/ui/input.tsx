import * as React from "react"

import { cn } from "@/lib/utils"

export const fieldClass =
  "focus-ring w-full rounded-control border border-subtle bg-surface-raised text-fg placeholder:text-subtle transition-colors duration-fast ease-out disabled:cursor-not-allowed disabled:opacity-45 aria-[invalid=true]:border-danger"

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(fieldClass, "h-8 px-2.5 text-sm", className)}
      {...props}
    />
  )
)
Input.displayName = "Input"

export { Input }
