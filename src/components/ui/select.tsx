import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { fieldClass } from "./input"

const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={cn(fieldClass, "h-8 appearance-none pl-2.5 pr-8 text-sm", className)}
      {...props}
    >
      {children}
    </select>
    <ChevronDown
      aria-hidden
      className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-subtle"
    />
  </div>
))
Select.displayName = "Select"

export { Select }
