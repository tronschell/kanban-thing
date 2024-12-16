'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GradientBackground } from '@/components/ui/gradient-background'
import { useAnalytics } from '@/hooks/use-analytics'
import { motion } from 'framer-motion'
import PasswordValidator from 'password-validator'

// Create a schema for password validation
const passwordSchema = new PasswordValidator()
  .min(6)                                    // Minimum length 6
  .max(100)                                  // Maximum length 100
  .not().spaces()                           // Should not have spaces
  .is().not().oneOf(['password', 'Password123', 'admin', '123456', 'qwerty']); // Blacklist common passwords

export default function UserOnboarding() {
  const [boardName, setBoardName] = useState('')
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { trackEvent } = useAnalytics()

  const validatePassword = (pass: string) => {
    const validationResult = passwordSchema.validate(pass, { list: true }) as string[];
    if (validationResult.length === 0) {
      setPasswordError('');
      return true;
    }

    const errorMessages: { [key: string]: string } = {
      min: 'Password must be at least 8 characters long',
      max: 'Password is too long',
      spaces: 'Password should not contain spaces',
      oneOf: 'This password is too common'
    };

    setPasswordError(errorMessages[validationResult[0]] || 'Invalid password');
    return false;
  };

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!boardName.trim() || boardName.trim().length < 3 || !password || isCreating) return
    
    if (!validatePassword(password)) {
      return;
    }

    setIsCreating(true)
    try {
      // Create the board first
      const { data: board, error: boardError } = await supabase
        .from('boards')
        .insert({
          name: boardName.trim()
        })
        .select('id')
        .single()

      if (boardError || !board?.id) {
        throw new Error(boardError?.message || 'Failed to create board')
      }

      console.log('Board created:', board)

      // Set the board password using the secure RPC function
      const { data: passwordSet, error: passwordError } = await supabase.rpc('set_board_password', {
        board_id_param: board.id,
        new_password: password
      })

      console.log('Password setting result:', { passwordSet, passwordError })

      if (passwordError) {
        console.error('Password setting error:', passwordError)
        // If setting password fails, clean up the board
        await supabase.from('boards').delete().eq('id', board.id)
        throw passwordError
      }

      // Verify the hash was set
      const { data: verifyBoard } = await supabase
        .from('boards')
        .select('password_hash')
        .eq('id', board.id)
        .single()

      console.log('Board after password set:', verifyBoard)

      // Store board password in localStorage for immediate use
      localStorage.setItem(`board_${board.id}_password`, password)
      
      // Prepare the columns data
      const columnsData = [
        { board_id: board.id, name: 'To Do', position: 0 },
        { board_id: board.id, name: 'In Progress', position: 1 },
        { board_id: board.id, name: 'Done', position: 2 }
      ]

      // Insert columns
      const { error: columnsError } = await supabase
        .from('columns')
        .insert(columnsData)

      if (columnsError) {
        // If columns creation fails, clean up the board
        await supabase.from('boards').delete().eq('id', board.id)
        throw columnsError
      }

      // Final verification - get both board AND columns
      const { data: verifyData, error: verifyError } = await supabase
        .from('boards')
        .select(`
          id,
          columns (
            id
          )
        `)
        .eq('id', board.id)
        .single()

      if (verifyError || !verifyData || !verifyData.columns?.length) {
        throw new Error('Board verification failed - board or columns missing')
      }

      // Track board creation
      trackEvent('create_board', {
        board_id: board.id,
        board_name: boardName.trim(),
      })

      // Store board password in localStorage for immediate use
      localStorage.setItem(`board_${board.id}_password`, password)
      localStorage.setItem('kanban_user_id', board.id)
      
      // Set the password in the session again before navigating
      await supabase.rpc('set_session_board_password', {
        password_param: password
      })
      
      setIsExiting(true)
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="absolute inset-0">
        <GradientBackground />
      </div>
      
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
          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-medium text-gray-100 mb-2"
            >
              Board Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                validatePassword(e.target.value);
              }}
              className="w-full p-2 border rounded-lg bg-white/10 border-white/20 text-white placeholder-gray-400"
              placeholder="Enter a strong password"
              required
              disabled={isCreating}
            />
            {passwordError && (
              <p className="mt-2 text-sm text-red-400">
                {passwordError}
              </p>
            )}
            <p className="mt-2 text-sm text-gray-300">
              Password must contain at least 6 characters
            </p>
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