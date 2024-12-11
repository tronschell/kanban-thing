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
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        {/* Modal Container */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
            {/* Modal Panel */}
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel 
                className={`
                  w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 
                  shadow-xl ring-1 ring-gray-200/20 dark:ring-gray-800/50
                  ${isDragContext ? 'transform-none' : 'transform'}
                `}
              >
                {/* Header */}
                {title && (
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/50 dark:border-gray-800/50">
                    <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {title}
                    </Dialog.Title>
                    <button
                      onClick={onClose}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 
                        dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 
                        transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}

                {/* Content */}
                <div className="px-6 py-5 sm:py-6">
                  {children}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
} 