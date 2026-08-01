import * as React from "react"

import { cn } from "@/lib/utils"
import { fieldClass } from "./input"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, rows = 4, ...props }, ref) => (
  <textarea
    ref={ref}
    rows={rows}
    className={cn(fieldClass, "resize-y px-2.5 py-2 text-sm leading-relaxed", className)}
    {...props}
  />
))
Textarea.displayName = "Textarea"

export { Textarea }
