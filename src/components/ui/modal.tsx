'use client'

import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  isDragContext?: boolean
}

export function Modal({ isOpen, onClose, title, children, isDragContext }: ModalProps) {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
    >
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel 
          className={`
            w-full max-w-md rounded-xl bg-white dark:bg-gray-900 shadow-xl 
            ${isDragContext ? 'transform-none' : 'transform'}
          `}
        >
          {title && (
            <Dialog.Title className="text-lg font-semibold p-4 border-b border-gray-200 dark:border-gray-800">
              {title}
            </Dialog.Title>
          )}
          <div className="p-4">
            {children}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
} 