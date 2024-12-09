'use client'

import { useState, useEffect } from 'react'
import { Copy, Check, LinkIcon, Menu, Trash2, Terminal as TerminalIcon, Plus, Settings, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { BoardExpirationTimer } from '@/components/board-expiration-timer'
import { useBoardExpiration } from '@/hooks/use-board-expiration'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui'
import { TerminalInterface } from '@/components/terminal-interface'
import { Card } from '@/types'
import { CreateModal } from '@/components/create-modal'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface NavbarProps {
  boardId?: string
  setBoardCards?: React.Dispatch<React.SetStateAction<Card[]>>
  setBacklogCards?: React.Dispatch<React.SetStateAction<Card[]>>
  backlogColumnId?: string | null
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

interface CommandResponse {
  success: boolean
  message: string
}

const DEFAULT_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#3b82f6', // blue
  '#a855f7', // purple
  '#ec4899', // pink
]

// Helper function to get a random color
const getRandomColor = () => {
  return DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)]
}

export default function Navbar({ boardId, setBoardCards, setBacklogCards, backlogColumnId }: NavbarProps) {
  const [copied, setCopied] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isTerminalOpen, setIsTerminalOpen] = useState(false)
  const [boardColumns, setBoardColumns] = useState<Array<{ id: string; name: string }>>([])
  const router = useRouter()
  const url = boardId ? `${window.location.origin}/board?id=${boardId}` : ''
  const displayUrl = url ? url.replace(/^https?:\/\//, '').slice(0, 24) + '...' : ''
  const expiresAt = useBoardExpiration(boardId)
  const supabase = createClient()
  const [allCards, setAllCards] = useState<Card[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [timeLeft, setTimeLeft] = useState<string>('')

  // Add effect to calculate time left
  useEffect(() => {
    if (!expiresAt) return

    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const expirationDate = new Date(expiresAt).getTime()
      const difference = expirationDate - now

      if (difference <= 0) {
        return 'Expired'
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

      return `${days}d ${hours}h`
    }

    setTimeLeft(calculateTimeLeft())
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000 * 60) // Update every minute

    return () => clearInterval(timer)
  }, [expiresAt])

  // Preload columns when the component mounts or boardId changes
  useEffect(() => {
    const loadColumns = async () => {
      if (!boardId) return

      const { data: columns, error } = await supabase
        .from('columns')
        .select('id, name')
        .eq('board_id', boardId)
        .order('position')

      if (!error && columns) {
        setBoardColumns(columns)
      }
    }

    loadColumns()
  }, [boardId])

  // Load all cards when component mounts
  useEffect(() => {
    const loadCards = async () => {
      if (!boardId) return

      const { data: cards } = await supabase
        .from('cards')
        .select(`
          id,
          title,
          column_id,
          description,
          color,
          due_date,
          position,
          created_at,
          columns!inner (
            board_id
          )
        `)
        .eq('columns.board_id', boardId)
        .order('title')

      if (cards) {
        console.log('Loaded cards:', cards)
        setAllCards(cards as Card[])
      }
    }

    loadCards()
  }, [boardId])

  // Helper function to find column by name (case-insensitive)
  const findColumnByName = (name: string) => {
    return boardColumns.find(col => 
      col.name.toLowerCase() === name.toLowerCase()
    )
  }

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

  const handleTerminalCommand = async (command: string): Promise<CommandResponse> => {
    if (!boardId) {
      return {
        success: false,
        message: 'No board selected'
      }
    }

    const parts = command.toLowerCase().split(' ')
    const action = parts[0]

    // Command aliases mapping
    const commandAliases: Record<string, string> = {
      'cr': 'create',
      'dl': 'delete',
      'mv': 'move',
      'l': 'list',
      'h': 'help'
    }

    // Resolve alias to full command
    const resolvedAction = commandAliases[action] || action

    try {
      switch (resolvedAction) {
        case 'create': {
          // create/cr {Task name} [in {Column name}]
          const inIndex = parts.findIndex(part => part === 'in')
          
          // Extract the title - if 'in' is not found, take all parts after the command
          const title = inIndex === -1 
            ? parts.slice(1).join(' ').split('--')[0].trim()
            : parts.slice(1, inIndex).join(' ')

          // If no column specified, use Backlog
          let columnName = 'Backlog'
          if (inIndex !== -1 && inIndex < parts.length - 1) {
            columnName = parts.slice(inIndex + 1).join(' ').split('--')[0].trim()
          }

          // Find column using our helper function
          const column = findColumnByName(columnName)
          if (!column) {
            const availableColumns = boardColumns
              .map(col => `"${col.name}"`)
              .join(', ')
            return {
              success: false,
              message: `Column "${columnName}" not found. Available columns: ${availableColumns}`
            }
          }

          // Parse optional arguments
          const fullCommand = command.toLowerCase()
          let description = ''
          let color = getRandomColor()

          // Extract description if provided
          const descMatch = fullCommand.match(/--desc\s+"([^"]+)"/)
          if (descMatch) {
            description = descMatch[1]
          }

          // Extract color if provided
          const colorMatch = fullCommand.match(/--color\s+(#[0-9a-f]{6}|#[0-9a-f]{3})/i)
          if (colorMatch) {
            color = colorMatch[1]
          }

          // Create the card
          const { data: card, error } = await supabase
            .from('cards')
            .insert({
              column_id: column.id,
              title: title,
              description: description || null,
              color: color,
              position: 0
            })
            .select('*')
            .single()

          if (error) throw error

          // Update the appropriate state based on which column the card was created in
          if (card) {
            if (column.id === backlogColumnId && setBacklogCards) {
              setBacklogCards(prev => [...prev, card])
            } else if (setBoardCards) {
              setBoardCards(prev => [...prev, card])
            }
          }

          // Build success message
          let successMessage = `Created card "${title}" in column "${column.name}"`
          if (description) {
            successMessage += `\nDescription: ${description}`
          }
          successMessage += `\nColor: ${color}`

          return {
            success: true,
            message: successMessage
          }
        }

        case 'move': {
          // move/mv {Task name} to {Column name}
          const toIndex = parts.findIndex(part => part === 'to')
          if (toIndex === -1 || toIndex === 1 || toIndex === parts.length - 1) {
            return {
              success: false,
              message: 'Invalid command format. Use: move {Task name} to {Column name}'
            }
          }

          const cardTitle = parts.slice(1, toIndex).join(' ')
          const columnName = parts.slice(toIndex + 1).join(' ')

          // Find column using our helper function
          const column = findColumnByName(columnName)
          if (!column) {
            const availableColumns = boardColumns
              .map(col => `"${col.name}"`)
              .join(', ')
            return {
              success: false,
              message: `Column "${columnName}" not found. Available columns: ${availableColumns}`
            }
          }

          // Find the card by title
          const { data: card } = await supabase
            .from('cards')
            .select('*')
            .eq('title', cardTitle)
            .single()

          if (!card) {
            return {
              success: false,
              message: `Card "${cardTitle}" not found`
            }
          }

          const { error } = await supabase
            .from('cards')
            .update({ column_id: column.id })
            .eq('id', card.id)

          if (error) throw error

          // Update states based on source and destination columns
          if (setBoardCards && setBacklogCards) {
            const isFromBacklog = card.column_id === backlogColumnId
            const isToBacklog = column.id === backlogColumnId

            if (isFromBacklog && !isToBacklog) {
              // Moving from backlog to board
              setBacklogCards(prev => prev.filter(c => c.id !== card.id))
              setBoardCards(prev => [...prev, { ...card, column_id: column.id }])
            } else if (!isFromBacklog && isToBacklog) {
              // Moving from board to backlog
              setBoardCards(prev => prev.filter(c => c.id !== card.id))
              setBacklogCards(prev => [...prev, { ...card, column_id: column.id }])
            } else if (!isFromBacklog && !isToBacklog) {
              // Moving within board
              setBoardCards(prev => prev.map(c => 
                c.id === card.id ? { ...c, column_id: column.id } : c
              ))
            } else {
              // Moving within backlog (shouldn't happen, but handle anyway)
              setBacklogCards(prev => prev.map(c => 
                c.id === card.id ? { ...c, column_id: column.id } : c
              ))
            }
          }

          return {
            success: true,
            message: `Moved card "${cardTitle}" to column "${column.name}"`
          }
        }

        case 'list': {
          // list/l - shows both cards and columns
          // First get all columns in this board
          const { data: columns } = await supabase
            .from('columns')
            .select('id, name')
            .eq('board_id', boardId)
            .order('position')

          if (!columns?.length) {
            return {
              success: true,
              message: 'No columns found in this board'
            }
          }

          // Get column IDs for this board
          const columnIds = columns.map(col => col.id)

          // List all cards in the board's columns
          const { data: cards, error } = await supabase
            .from('cards')
            .select(`
              id,
              title,
              column_id,
              position
            `)
            .in('column_id', columnIds)
            .order('position')

          if (error) throw error

          // Group cards by column
          const cardsByColumn = new Map<string, typeof cards>()
          columns.forEach(col => cardsByColumn.set(col.id, []))
          cards?.forEach(card => {
            const columnCards = cardsByColumn.get(card.column_id)
            if (columnCards) {
              columnCards.push(card)
            }
          })

          // Format the output in a compact way
          const formatList = () => {
            return columns.map(column => {
              const columnCards = cardsByColumn.get(column.id) || []
              const cardList = columnCards.length 
                ? columnCards.map(card => `  - ${card.title}`).join('\n')
                : '  - (empty)'
              
              return `${column.name.toUpperCase()}:\n${cardList}`
            }).join('\n\n')
          }

          return {
            success: true,
            message: columns.length 
              ? formatList()
              : 'No columns found in this board'
          }
        }

        case 'delete': {
          // delete/dl {Task name}
          const cardTitle = parts.slice(1).join(' ')

          // Find the card by title
          const { data: card } = await supabase
            .from('cards')
            .select('*')  // Get all fields to know which state to update
            .eq('title', cardTitle)
            .single()

          if (!card) {
            return {
              success: false,
              message: `Card "${cardTitle}" not found`
            }
          }

          const { error } = await supabase
            .from('cards')
            .delete()
            .eq('id', card.id)

          if (error) throw error

          // Update the appropriate state
          if (card.column_id === backlogColumnId && setBacklogCards) {
            setBacklogCards(prev => prev.filter(c => c.id !== card.id))
          } else if (setBoardCards) {
            setBoardCards(prev => prev.filter(c => c.id !== card.id))
          }

          return {
            success: true,
            message: `Deleted card "${cardTitle}"`
          }
        }

        case 'help':
          return {
            success: true,
            message: `Available commands:
create (cr) {Task name} [in {Column name}] [--desc "description"] [--color #hexcode]
move (mv) {Task name} to {Column name}
delete (dl) {Task name}
list (l)
help (h)

Note: If no column is specified in create command, card will be created in Backlog.`
          }

        default:
          return {
            success: false,
            message: 'Unknown command. Type "help" or "h" for available commands.'
          }
      }
    } catch (error) {
      console.error('Terminal command error:', error)
      return {
        success: false,
        message: 'An error occurred while executing the command'
      }
    }

    return {
      success: false,
      message: 'Invalid command format. Type "help" or "h" for available commands.'
    }
  }

  // Add handler for card creation
  const handleCreateCard = async (columnId: string, cardData: {
    title: string
    description: string
    color: string | null
    due_date: string | null
  }) => {
    if (!boardId) return

    try {
      const newPosition = allCards.filter(card => card.column_id === columnId).length

      const { data: newCard, error } = await supabase
        .from('cards')
        .insert({
          column_id: columnId,
          title: cardData.title,
          description: cardData.description,
          color: cardData.color,
          due_date: cardData.due_date,
          position: newPosition
        })
        .select('*')
        .single()

      if (error) throw error

      if (newCard) {
        // Update the appropriate state based on which column the card was created in
        if (columnId === backlogColumnId && setBacklogCards) {
          setBacklogCards(prev => [...prev, newCard])
        } else if (setBoardCards) {
          setBoardCards(prev => [...prev, newCard])
        }
        // Also update allCards state for terminal functionality
        setAllCards(prev => [...prev, newCard])
      }
    } catch (error) {
      console.error('Error creating card:', error)
    }
  }

  // Add handler for column creation
  const handleCreateColumn = async (name: string) => {
    if (!boardId) return

    try {
      const { data: newColumn, error } = await supabase
        .from('columns')
        .insert({
          name,
          board_id: boardId,
          position: boardColumns.length
        })
        .select('*')
        .single()

      if (error) throw error

      if (newColumn) {
        setBoardColumns(prev => [...prev, newColumn])
      }
    } catch (error) {
      console.error('Error creating column:', error)
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
              {/* Create button */}
              <motion.button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center justify-center gap-2 px-2 py-1.5 rounded-lg 
                  bg-white/50 dark:bg-gray-800/50 
                  border border-gray-200/50 dark:border-gray-700/50 
                  hover:bg-gray-50 dark:hover:bg-gray-700/50 
                  transition-colors group cursor-pointer min-w-[100px] sm:min-w-[120px]"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                title="Create New"
              >
                <Plus className="h-4 w-4 text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300" />
                <span className="text-xs text-gray-600 dark:text-gray-300">Create</span>
              </motion.button>

              {/* Copy URL button - always visible */}
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

              {/* Desktop buttons - hidden on mobile */}
              <div className="hidden sm:flex items-center gap-1 sm:gap-2">
                <motion.button
                  onClick={() => setIsTerminalOpen(true)}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg 
                    bg-white/50 dark:bg-gray-800/50 
                    border border-gray-200/50 dark:border-gray-700/50 
                    hover:bg-gray-50 dark:hover:bg-gray-700/50 
                    transition-colors group cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  title="Open Terminal"
                >
                  <TerminalIcon className="h-4 w-4 text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300" />
                </motion.button>

                {/* Board Expiration Timer */}
                {expiresAt && (
                  <BoardExpirationTimer expiresAt={expiresAt} />
                )}

                {/* Delete button */}
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
              </div>

              {/* Mobile menu button */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button
                    className="sm:hidden flex items-center gap-1 px-2 py-1.5 rounded-lg 
                      bg-white/50 dark:bg-gray-800/50 
                      border border-gray-200/50 dark:border-gray-700/50 
                      hover:bg-gray-50 dark:hover:bg-gray-700/50 
                      transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Settings className="h-4 w-4 text-gray-500" />
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuItem
                    onClick={() => {
                      setIsTerminalOpen(true)
                    }}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <TerminalIcon className="h-4 w-4" />
                    <span>Terminal</span>
                  </DropdownMenuItem>

                  {expiresAt && (
                    <DropdownMenuItem
                      className="flex items-center gap-2 cursor-default"
                      disabled
                    >
                      <Clock className="h-4 w-4" />
                      <span>Expires in: {timeLeft}</span>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem
                    onClick={() => {
                      setIsDeleteModalOpen(true)
                    }}
                    className="flex items-center gap-2 cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Board</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>

      {/* Add CreateModal */}
      <CreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        columns={boardColumns}
        onCreateCard={handleCreateCard}
        onCreateColumn={handleCreateColumn}
      />

      {/* Add Terminal Interface */}
      <TerminalInterface
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
        onCommand={handleTerminalCommand}
        availableCards={allCards}
        availableColumns={boardColumns}
      />

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