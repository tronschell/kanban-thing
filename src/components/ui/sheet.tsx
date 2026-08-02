"use client"

import * as React from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { IconButton } from "./icon-button"

const sides = {
  left: "inset-y-0 left-0 w-[19rem] border-r data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left",
  right:
    "inset-y-0 right-0 w-[19rem] border-l data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
  bottom:
    "inset-x-0 bottom-0 max-h-[85vh] rounded-t-panel border-t data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
}

interface SheetProps {
  open: boolean
  onClose: () => void
  title: string
  side?: keyof typeof sides
  className?: string
  children: React.ReactNode
}

export function Sheet({ open, onClose, title, side = "right", className, children }: SheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-overlay data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
        <Dialog.Content
          aria-describedby={undefined}
          className={cn(
            "fixed z-50 flex flex-col border-subtle bg-surface shadow-modal duration-slow ease-out data-[state=open]:animate-in data-[state=closed]:animate-out",
            sides[side],
            className
          )}
        >
          <div className="flex items-center justify-between gap-4 border-b border-subtle px-4 py-3">
            <Dialog.Title className="truncate text-sm font-semibold text-fg">{title}</Dialog.Title>
            <Dialog.Close asChild>
              <IconButton label="Close" size="sm" icon={<X />} className="-mr-1" />
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
