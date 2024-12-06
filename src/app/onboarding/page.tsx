'use client'

import { Suspense } from 'react'
import { UserOnboarding } from '@/components'
import { LoadingSpinner } from '@/components/ui'

export default function OnboardingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      <Suspense fallback={<LoadingSpinner />}>
        <UserOnboarding />
      </Suspense>
    </div>
  )
} 