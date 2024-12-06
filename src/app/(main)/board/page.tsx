'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Suspense } from 'react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { GradientBackground } from '@/components/ui/gradient-background'
import BoardContent from './board-content'

export default function BoardPage() {
  const router = useRouter()

  useEffect(() => {
    const userId = localStorage.getItem('kanban_user_id')
    if (!userId) {
      router.push('/onboarding')
    }
  }, [router])

  return (
    <div className="min-h-screen flex flex-col bg-gray-950 touch-pan-y">
      <GradientBackground />
      <div className="flex-1 overflow-y-auto overscroll-behavior-y-contain">
        <Suspense>
          <BoardContent />
        </Suspense>
      </div>
    </div>
  )
}
