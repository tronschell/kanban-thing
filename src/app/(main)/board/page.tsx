'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Suspense } from 'react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { GradientBackground } from '@/components/ui/gradient-background'
import BoardContent from './board-content'

export default function BoardPage() {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    // Check authorization status immediately
    const checkAuth = () => {
      const userId = localStorage.getItem('kanban_user_id')
      if (!userId) {
        router.replace('/onboarding')
      } else {
        setIsAuthorized(true)
      }
    }

    checkAuth()
  }, [router])

  // Show loading state while checking authorization
  if (isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <LoadingSpinner />
      </div>
    )
  }

  // Only render the board content if authorized
  return (
    <div className="min-h-screen flex flex-col bg-gray-950 touch-pan-y">
      <GradientBackground />
      <div className="flex-1 overflow-y-auto overscroll-behavior-y-contain">
        <Suspense fallback={<LoadingSpinner />}>
          <BoardContent />
        </Suspense>
      </div>
    </div>
  )
}
