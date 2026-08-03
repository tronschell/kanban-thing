"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { IconButton } from "@/components/ui/icon-button"

export function CopyButton({
  value,
  className,
}: {
  value: string
  className?: string
}) {
  const [hasCopied, setHasCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setHasCopied(true)
      setTimeout(() => setHasCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy to the clipboard:", error)
    }
  }

  return (
    <IconButton
      label={hasCopied ? "Copied" : "Copy to clipboard"}
      size="sm"
      variant="secondary"
      className={className}
      icon={hasCopied ? <Check /> : <Copy />}
      onClick={copy}
    />
  )
}
