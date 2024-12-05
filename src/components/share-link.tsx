'use client'

import { useState } from 'react'
import { Copy, Check, X } from 'lucide-react'

interface ShareLinkProps {
  boardId: string
}

export default function ShareLink({ boardId }: ShareLinkProps) {
  const [copied, setCopied] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const url = `${window.location.origin}/board?id=${boardId}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      {isExpanded ? (
        <div className="flex items-center gap-2 p-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-700/50">
          <div className="relative group max-w-[200px] overflow-hidden">
            <input
              type="text"
              value={url}
              readOnly
              className="w-full text-sm bg-white/50 dark:bg-gray-900/50 px-2 py-1 rounded border border-gray-200/50 dark:border-gray-700/50 pr-8 truncate"
              onClick={(e) => e.currentTarget.select()}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-1">
              <button
                onClick={handleCopy}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : (
                  <Copy className="w-3 h-3 text-gray-500" />
                )}
              </button>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-colors"
        >
          <Copy className="w-4 h-4" />
          <span>Share board</span>
        </button>
      )}
    </div>
  )
} 