'use client'

import { useState } from 'react'
import { Copy, Check, LinkIcon, Menu, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { BoardExpirationTimer } from '@/components/board-expiration-timer'
import { useBoardExpiration } from '@/hooks/use-board-expiration'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui'

interface NavbarProps {
  boardId?: string
}

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const mainNav: NavItem[] = []

const shareButtonVariants = {
  initial: { opacity: 0, y: -4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.15, ease: 'easeOut' }
}

const iconVariants = {
  initial: { scale: 1 },
  animate: { scale: [1, 1.2, 1] },
  transition: { duration: 0.2 }
}

export default function Navbar({ boardId }: NavbarProps) {
  const [copied, setCopied] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const url = boardId ? `${window.location.origin}/board?id=${boardId}` : ''
  const displayUrl = url ? url.replace(/^https?:\/\//, '').slice(0, 24) + '...' : ''
  const expiresAt = useBoardExpiration(boardId)
  const supabase = createClient()

  const handleCopy = async () => {
    if (!url) return;
    
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleDeleteBoard = async () => {
    if (!boardId || isDeleting) return

    setIsDeleting(true)
    try {
      const { error } = await supabase
        .rpc('delete_board_cascade', {
          board_id_param: boardId
        })

      if (error) throw error

      router.push('/')
    } catch (error) {
      console.error('Error deleting board:', error)
      // You might want to show an error toast here
    } finally {
      setIsDeleting(false)
      setIsDeleteModalOpen(false)
    }
  }

  return (
    <>
      <div className="sticky top-0 z-50 pt-4">
        <div className="flex mx-auto w-full h-14 sm:h-12 items-center justify-between rounded-lg bg-gray-950/95 backdrop-blur supports-[backdrop-filter]:bg-gray-950/60 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
          {/* Logo/Brand */}
          <Link 
            href="/"
            className="mx-4 flex items-center gap-2 text-lg font-semibold"
          >
            KanbanThing
          </Link>

          {/* Share Section with Timer and Delete Button */}
          {boardId && (
            <div className="flex items-center gap-1 sm:gap-2 mr-2">
              <motion.button
                onClick={() => setIsDeleteModalOpen(true)}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg 
                  bg-red-500/10 hover:bg-red-500/20
                  border border-red-500/20 
                  transition-colors group cursor-pointer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                title="Delete Board"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </motion.button>

              {/* Existing share button */}
              <motion.button
                onClick={handleCopy}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg 
                  bg-white/50 dark:bg-gray-800/50 
                  border border-gray-200/50 dark:border-gray-700/50 
                  hover:bg-gray-50 dark:hover:bg-gray-700/50 
                  transition-colors group cursor-pointer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                title="Click to copy URL"
              >
                <motion.div
                  initial="initial"
                  animate={copied ? "animate" : "initial"}
                  variants={iconVariants}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <LinkIcon className="h-4 w-4 text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300" />
                  )}
                </motion.div>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={copied ? 'copied' : 'url'}
                    variants={shareButtonVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 select-none hidden xs:block"
                  >
                    {copied ? 'Copied!' : displayUrl}
                  </motion.span>
                </AnimatePresence>
              </motion.button>

              {/* Board Expiration Timer */}
              {expiresAt && (
                <BoardExpirationTimer expiresAt={expiresAt} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Board"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Are you sure you want to delete this board? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => setIsDeleteModalOpen(false)}
              variant="outline"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteBoard}
              variant="destructive"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Board'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}