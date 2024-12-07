'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { GradientBackground } from '@/components/ui/gradient-background'
import BoardContent from './board-content'

// Separate component to handle the search params and auth check
function BoardPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      console.log('Checking auth...')
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const boardId = searchParams.get('id')
      const userId = localStorage.getItem('kanban_user_id')
      console.log('UserId:', userId)
      
      if (!userId && !boardId) {
        console.log('Redirecting to onboarding...')
        router.replace('/onboarding')
      } else {
        console.log('User authorized')
        setIsAuthorized(true)
      }
    }

    checkAuth()
  }, [router, searchParams])

  // Show loading state while checking authorization
  if (isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto overscroll-behavior-y-contain">
      <Suspense fallback={<LoadingSpinner />}>
        <BoardContent />
      </Suspense>
    </div>
  )
}

// Main page component with Suspense boundary
export default function BoardPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-950 touch-pan-y">
      <GradientBackground />
      <Suspense fallback={<LoadingSpinner />}>
        <BoardPageContent />
      </Suspense>
    </div>
  )
}
