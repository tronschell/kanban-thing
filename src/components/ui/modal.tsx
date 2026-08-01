"use client"

import * as React from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { IconButton } from "./icon-button"

const sizes = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
}

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  /** Screen-reader context and, when set, visible sub-heading. */
  description?: string
  size?: keyof typeof sizes
  className?: string
  children: React.ReactNode
}

export function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  className,
  children,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-overlay data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
        <Dialog.Content
          {...(description ? {} : { "aria-describedby": undefined })}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-panel border border-subtle bg-surface-raised shadow-modal duration-base data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
            sizes[size],
            className
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-subtle px-5 py-3.5">
            <div className="min-w-0">
              <Dialog.Title className="truncate text-md font-semibold text-fg">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="mt-0.5 text-xs text-muted">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <IconButton label="Close" size="sm" icon={<X />} className="-mr-1 mt-0.5" />
            </Dialog.Close>
          </div>
          <div className="max-h-[70vh] overflow-y-auto px-5 py-4 scrollbar-thin">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export const ModalFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("mt-5 flex items-center justify-end gap-2 border-t border-subtle pt-4", className)}
    {...props}
  />
)
