'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, subDays } from 'date-fns'
import { ArrowRight, GitCommit, Calendar, Clock, ChevronDown, Plus } from 'lucide-react'
import * as Select from '@radix-ui/react-select'
import { Modal } from '@/components/ui'

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
  updated_at: string
  card_history: CardHistory[]
}

type TimeFilter = '7days' | '30days' | '90days' | 'all'
type SortBy = 'created' | 'updated'

function TimelineEvent({ 
  timestamp, 
  title, 
  description, 
  type,
  color,
}: { 
  timestamp: string
  title: string
  description: string
  type: 'creation' | 'movement'
  color?: string | null
}) {
  return (
    <div className="flex items-start gap-3 mb-2">
      <div className={`
        flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-1
        ${type === 'creation' 
          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
        }
      `}>
        {type === 'creation' ? <GitCommit className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <time>{format(new Date(timestamp), 'MMM d, HH:mm')}</time>
          {color && (
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
          )}
        </div>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {title}
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {description}
        </p>
      </div>
    </div>
  )
}

function FilterSelect({ 
  icon: Icon, 
  value, 
  onChange, 
  options 
}: { 
  icon: any
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <Select.Root value={value} onValueChange={onChange}>
      <Select.Trigger className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
        <Icon className="w-4 h-4 text-gray-500" />
        <Select.Value />
        <Select.Icon>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg">
          <Select.Viewport>
            {options.map(option => (
              <Select.Item
                key={option.value}
                value={option.value}
                className="px-3 py-2 text-sm outline-none cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 data-[highlighted]:bg-gray-100 dark:data-[highlighted]:bg-gray-700"
              >
                <Select.ItemText>{option.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}

function CardHistoryModal({ 
  isOpen, 
  onClose, 
  card 
}: { 
  isOpen: boolean
  onClose: () => void
  card: Card & { last_updated: Date }
}) {
  const allEvents = [
    ...card.card_history,
    {
      id: 'creation',
      timestamp: card.created_at,
      type: 'creation' as const
    }
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`History for "${card.title}"`}>
      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
        {allEvents.map(event => (
          <TimelineEvent
            key={event.id}
            timestamp={event.timestamp}
            title={event.type === 'creation' ? 'Card Created' : 'Column Changed'}
            description={event.type === 'creation' 
              ? 'Card was added to the board'
              : `Moved from ${(event as CardHistory).from_column} to ${(event as CardHistory).to_column}`
            }
            type={event.type === 'creation' ? 'creation' : 'movement'}
            color={card.color}
          />
        ))}
      </div>
    </Modal>
  )
}

function CardTimeline({ card }: { card: Card & { last_updated: Date } }) {
  const [showAllHistory, setShowAllHistory] = useState(false)

  // Combine and sort all events
  const allEvents = [
    ...card.card_history,
    {
      id: 'creation',
      timestamp: card.created_at,
      type: 'creation' as const
    }
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  // Get recent events (excluding creation if there are other events)
  const recentEvents = allEvents.slice(0, 6)
  const hasMoreEvents = allEvents.length > 6

  return (
    <div key={card.id} className="bg-gray-50/50 dark:bg-gray-800/30 rounded-lg p-3">
      <h2 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-3">
        {card.title}
      </h2>

      <div className="space-y-1">
        {recentEvents.map(event => (
          <TimelineEvent
            key={event.id}
            timestamp={event.timestamp}
            title={event.type === 'creation' ? 'Card Created' : 'Column Changed'}
            description={event.type === 'creation' 
              ? 'Card was added to the board'
              : `Moved from ${(event as CardHistory).from_column} to ${(event as CardHistory).to_column}`
            }
            type={event.type === 'creation' ? 'creation' : 'movement'}
            color={card.color}
          />
        ))}

        {hasMoreEvents && (
          <button
            onClick={() => setShowAllHistory(true)}
            className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mt-2"
          >
            <Plus className="w-3 h-3" />
            {allEvents.length - 6} more updates
          </button>
        )}
      </div>

      <CardHistoryModal
        isOpen={showAllHistory}
        onClose={() => setShowAllHistory(false)}
        card={card}
      />
    </div>
  )
}

export default function TimelineView({ boardId }: { boardId: string }) {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('30days')
  const [sortBy, setSortBy] = useState<SortBy>('updated')
  const supabase = createClient()

  useEffect(() => {
    const fetchCardHistory = async () => {
      setLoading(true)

      // Calculate date filter
      const dateFilter = timeFilter === 'all' ? null : 
        new Date(subDays(new Date(), 
          timeFilter === '7days' ? 7 : 
          timeFilter === '30days' ? 30 : 90
        )).toISOString()

      // First get all columns for this board
      const { data: columns } = await supabase
        .from('columns')
        .select('id')
        .eq('board_id', boardId)

      if (!columns) return

      // Then get cards with their history
      const { data: cardsWithHistory, error } = await supabase
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
        .in('column_id', columns.map(col => col.id))

      if (error) {
        console.error('Error fetching card history:', error)
        return
      }

      if (cardsWithHistory) {
        // Process cards to add last_updated
        const processedCards = cardsWithHistory.map(card => {
          // Get the latest timestamp from either creation or last movement
          const lastHistoryTimestamp = card.card_history?.length > 0
            ? Math.max(...card.card_history.map(h => new Date(h.timestamp).getTime()))
            : new Date(card.created_at).getTime()

          const createdTimestamp = new Date(card.created_at).getTime()
          
          return {
            ...card,
            last_updated: new Date(Math.max(lastHistoryTimestamp, createdTimestamp))
          }
        })

        // Apply date filter if needed
        let filteredCards = processedCards
        if (dateFilter) {
          const filterDate = new Date(dateFilter).getTime()
          filteredCards = processedCards.filter(card => {
            const relevantDate = sortBy === 'created' 
              ? new Date(card.created_at).getTime()
              : card.last_updated.getTime()
            return relevantDate >= filterDate
          })
        }

        // Sort cards
        const sortedCards = filteredCards.sort((a, b) => {
          const dateA = sortBy === 'created' 
            ? new Date(a.created_at).getTime()
            : a.last_updated.getTime()
          const dateB = sortBy === 'created' 
            ? new Date(b.created_at).getTime()
            : b.last_updated.getTime()
          return dateB - dateA
        })

        setCards(sortedCards)
      }
      setLoading(false)
    }

    fetchCardHistory()
  }, [boardId, timeFilter, sortBy])

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
    <div className="px-4 py-4">
      {/* Filters */}
      <div className="flex items-center gap-2 mb-6">
        <FilterSelect
          icon={Calendar}
          value={timeFilter}
          onChange={(value) => setTimeFilter(value as TimeFilter)}
          options={[
            { value: '7days', label: 'Last 7 days' },
            { value: '30days', label: 'Last 30 days' },
            { value: '90days', label: 'Last 90 days' },
            { value: 'all', label: 'All time' }
          ]}
        />

        <FilterSelect
          icon={Clock}
          value={sortBy}
          onChange={(value) => setSortBy(value as SortBy)}
          options={[
            { value: 'updated', label: 'Last updated' },
            { value: 'created', label: 'Date created' }
          ]}
        />
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {cards.map(card => (
          <CardTimeline key={card.id} card={card} />
        ))}
      </div>

      {cards.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No card history available for the selected time period
        </div>
      )}
    </div>
  )
} 