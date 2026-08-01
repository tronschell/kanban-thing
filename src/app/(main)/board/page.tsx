'use client'

import { Suspense } from 'react'
import { Spinner } from '@/components/ui'
import BoardContent from './board-content'

export default function BoardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center bg-canvas">
          <Spinner size="lg" />
        </div>
      }
    >
      <BoardContent />
    </Suspense>
  )
}
