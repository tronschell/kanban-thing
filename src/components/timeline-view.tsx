'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ArrowRight, Circle, GitCommit } from 'lucide-react'

interface CardHistory {
  id: string
  card_id: string
  from_column: string
  to_column: string
  timestamp: string
}

interface Card {
  id: string
  title: string
  description: string | null
  color: string | null
  created_at: string
  card_history: CardHistory[]
}

function TimelineEvent({ 
  timestamp, 
  title, 
  description, 
  type,
  color,
  isLast
}: { 
  timestamp: string
  title: string
  description: string
  type: 'creation' | 'movement'
  color?: string | null
  isLast?: boolean
}) {
  return (
    <div className="flex-shrink-0 relative w-72 mx-4 first:ml-0">
      {/* Timeline line */}
      <div className="absolute top-8 left-0 right-0 flex items-center">
        <div className="w-full h-px bg-gray-200 dark:bg-gray-700" />
        {!isLast && <div className="w-8 h-px bg-gray-200 dark:bg-gray-700" />}
      </div>

      {/* Event node */}
      <div className="relative">
        <div className={`
          absolute left-1/2 -translate-x-1/2 top-6
          w-8 h-8 rounded-full flex items-center justify-center
          ${type === 'creation' 
            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
          }
          z-10
        `}>
          {type === 'creation' ? <GitCommit className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
        </div>

        {/* Content */}
        <div className="pt-20">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
              <time>{format(new Date(timestamp), 'MMM d, yyyy HH:mm')}</time>
              {color && (
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: color }} 
                />
              )}
            </div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
              {title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TimelineView({ boardId }: { boardId: string }) {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchCardHistory = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('cards')
        .select(`
          id,
          title,
          description,
          color,
          created_at,
          card_history (
            id,
            from_column,
            to_column,
            timestamp
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching card history:', error)
        return
      }

      if (data) {
        setCards(data)
      }
      setLoading(false)
    }

    fetchCardHistory()
  }, [boardId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">
          Loading timeline...
        </div>
      </div>
    )
  }

  return (
    <div className="px-8 py-4 space-y-24">
      {cards.map(card => (
        <div key={card.id} className="relative">
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {card.title}
            </h2>
            {card.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {card.description}
              </p>
            )}
          </div>

          <div className="relative">
            <div className="flex overflow-x-auto pb-8 custom-scrollbar">
              {/* Creation event */}
              <TimelineEvent
                timestamp={card.created_at}
                title="Card Created"
                description="Card was added to the board"
                type="creation"
                color={card.color}
                isLast={!card.card_history?.length}
              />

              {/* Column change events */}
              {card.card_history?.map((history, index) => (
                <TimelineEvent
                  key={history.id}
                  timestamp={history.timestamp}
                  title="Column Changed"
                  description={`Moved from ${history.from_column} to ${history.to_column}`}
                  type="movement"
                  color={card.color}
                  isLast={index === card.card_history.length - 1}
                />
              ))}
            </div>
          </div>
        </div>
      ))}

      {cards.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No card history available
        </div>
      )}
    </div>
  )
} 