import { Suspense } from 'react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import BoardContent from './board-content'

export default function BoardPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <BoardContent />
    </Suspense>
  )
}
