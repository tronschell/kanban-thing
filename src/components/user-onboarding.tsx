'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  name: string
  created_at: string
}

export default function UserOnboarding() {
  const [userName, setUserName] = useState<string>('')
  const [isComplete, setIsComplete] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const checkExistingUser = async () => {
      const savedUserId = localStorage.getItem('kanban_user_id')
      
      if (savedUserId) {
        const { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', savedUserId)
          .single()

        if (user && !error) {
          setCurrentUser(user)
          setIsComplete(true)
        } else {
          localStorage.removeItem('kanban_user_id')
        }
      }
    }

    checkExistingUser()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const { data: user, error } = await supabase
        .from('users')
        .insert({
          name: userName.trim()
        })
        .select()
        .single()

      if (error) throw error

      if (user) {
        localStorage.setItem('kanban_user_id', user.id)
        setCurrentUser(user)
        setIsComplete(true)
        router.push('/board') // Redirect to board creation page
      }
    } catch (error) {
      console.error('Error creating user:', error)
    }
  }

  if (isComplete) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
          Welcome to Kanban
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Your Name
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              required
              minLength={2}
              placeholder="Enter your name"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get Started
          </button>
        </form>
      </div>
    </div>
  )
} 