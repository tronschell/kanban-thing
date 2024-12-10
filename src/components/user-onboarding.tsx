'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GradientBackground } from '@/components/ui/gradient-background'
import { useAnalytics } from '@/hooks/use-analytics'
import { motion } from 'framer-motion'

export default function UserOnboarding() {
  const [boardName, setBoardName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { trackEvent } = useAnalytics()

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!boardName.trim() || boardName.trim().length < 3 || isCreating) return

    setIsCreating(true)
    try {
      // Create board and wait for response
      const { data: board, error: boardError } = await supabase
        .from('boards')
        .insert({ name: boardName.trim() })
        .select('id')
        .single()

      if (boardError || !board?.id) {
        throw new Error(boardError?.message || 'Failed to create board')
      }

      // Track board creation
      trackEvent('create_board', {
        board_id: board.id,
        board_name: boardName.trim(),
      })

      // Create default columns and wait for response
      const { error: columnsError } = await supabase
        .from('columns')
        .insert([
          { board_id: board.id, name: 'To Do', position: 0 },
          { board_id: board.id, name: 'In Progress', position: 1 },
          { board_id: board.id, name: 'Done', position: 2 }
        ])

      if (columnsError) {
        throw columnsError
      }

      // Verify board exists before proceeding
      const { data: verifyBoard, error: verifyError } = await supabase
        .from('boards')
        .select('id')
        .eq('id', board.id)
        .single()

      if (verifyError || !verifyBoard) {
        throw new Error('Board verification failed')
      }

      // Set localStorage only after successful creation
      localStorage.setItem('kanban_user_id', board.id)
      
      // Trigger exit animation
      setIsExiting(true)
      
      // Wait for animation to complete before navigating
      await new Promise(resolve => setTimeout(resolve, 300))
      
      router.replace(`/board?id=${board.id}`)
    } catch (error) {
      console.error('Error creating board:', error)
      setIsCreating(false)
      setIsExiting(false)
    }
  }

  return (
    <motion.div 
      className="fixed inset-0 flex items-center justify-center px-4"
      animate={{
        opacity: isExiting ? 0 : 1,
        x: isExiting ? 100 : 0
      }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Background layer */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="absolute inset-0">
        <GradientBackground />
      </div>
      
      {/* Content layer - higher z-index */}
      <div className="relative z-10 bg-white/30 dark:bg-gray-900/30 backdrop-blur-md p-8 rounded-xl max-w-md w-full shadow-xl border border-white/20">
        <h2 className="text-2xl font-bold mb-6 text-white">
          Create Your Kanban Board
        </h2>
        <form onSubmit={handleCreateBoard} className="space-y-4">
          <div>
            <label 
              htmlFor="boardName" 
              className="block text-sm font-medium text-gray-100 mb-2"
            >
              Board Name
            </label>
            <input
              id="boardName"
              type="text"
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              className="w-full p-2 border rounded-lg bg-white/10 border-white/20 text-white placeholder-gray-400"
              placeholder="Enter board name (min. 3 characters)"
              required
              disabled={isCreating}
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={isCreating}
            className="font-md w-full bg-white text-gray-950 py-3 rounded-lg hover:bg-white/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Creating Board...' : 'Create Board'}
          </button>
        </form>
      </div>
    </motion.div>
  )
} 