'use client'

import { useEffect, useState } from 'react'
import { Check, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui'

export default function ShareLink({ boardId }: { boardId: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  const copyBoardUrl = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/board?id=${boardId}`)
      setCopied(true)
    } catch (error) {
      console.error('Failed to copy board link:', error)
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={copyBoardUrl} aria-live="polite">
      {copied ? <Check /> : <LinkIcon />}
      {copied ? 'Copied' : 'Share'}
    </Button>
  )
}
