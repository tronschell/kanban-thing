'use client'

import { useEffect, useState } from 'react'

interface BoardExpirationTimerProps {
  expiresAt: string
}

export function BoardExpirationTimer({ expiresAt }: BoardExpirationTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>('')

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const expirationDate = new Date(expiresAt).getTime()
      const difference = expirationDate - now

      if (difference <= 0) {
        return 'Expired'
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

      return `${days}d ${hours}h`
    }

    setTimeLeft(calculateTimeLeft())
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000 * 60) // Update every minute

    return () => clearInterval(timer)
  }, [expiresAt])

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white/50 dark:bg-gray-800/50 
                    border border-gray-200/50 dark:border-gray-700/50 text-xs">
      <span className="text-gray-500 dark:text-gray-400 hidden sm:inline">
        Expires:
      </span>
      <span className={`
        font-medium
        ${timeLeft === 'Expired' 
          ? 'text-red-500 dark:text-red-400' 
          : 'text-gray-700 dark:text-gray-200'
        }
      `}>
        {timeLeft}
      </span>
    </div>
  )
}