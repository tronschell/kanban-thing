'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns'
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { Modal } from '@/components/ui'

interface CardEvent {
  id: string
  title: string
  color: string | null
  column_name: string
  created_at: string
  column_changes: {
    timestamp: string
    from: string
    to: string
  }[]
}

interface DayEventsModalProps {
  isOpen: boolean
  onClose: () => void
  date: Date
  events: CardEvent[]
}

function DayEventsModal({ isOpen, onClose, date, events }: DayEventsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={format(date, 'PPPP')}>
      <div className="space-y-4 max-h-[calc(100vh-12rem)] overflow-y-auto">
        {events.map(event => (
          <div 
            key={event.id} 
            className="space-y-2 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
          >
            <div className="flex items-center gap-2">
              {event.color && (
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: event.color }} 
                />
              )}
              <h4 className="font-medium truncate">{event.title}</h4>
            </div>
            <div className="space-y-2">
              {event.column_changes.filter(change => 
                isSameDay(parseISO(change.timestamp), date)
              ).map((change, idx) => (
                <div 
                  key={idx} 
                  className="ml-5 text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2"
                >
                  <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="break-words">
                    Moved from <span className="font-medium">{change.from}</span>{' '}
                    to <span className="font-medium">{change.to}</span>{' '}
                    at {format(parseISO(change.timestamp), 'p')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {events.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            No card updates on this day.
          </p>
        )}
      </div>
    </Modal>
  )
}

export default function CalendarView({ boardId }: { boardId: string }) {
  const [events, setEvents] = useState<CardEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchCardEvents = async () => {
      setLoading(true)
      
      const { data: cards } = await supabase
        .from('cards')
        .select(`
          id,
          title,
          color,
          created_at,
          column_id,
          columns!inner (
            id,
            name,
            board_id
          ),
          card_history (
            timestamp,
            from_column,
            to_column
          )
        `)
        .eq('columns.board_id', boardId)
        .order('created_at', { ascending: false })

      if (cards) {
        const formattedEvents = cards
          .filter(card => card.columns?.board_id === boardId)
          .map(card => ({
            id: card.id,
            title: card.title,
            color: card.color,
            column_name: card.columns?.name || '',
            created_at: card.created_at,
            column_changes: (card.card_history || []).map((history: any) => ({
              timestamp: history.timestamp,
              from: history.from_column,
              to: history.to_column
            }))
          }))
        setEvents(formattedEvents)
      }
      
      setLoading(false)
    }

    fetchCardEvents()
  }, [boardId])

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  })

  const getEventsForDay = (date: Date) => {
    return events.filter(event => 
      event.column_changes.some(change => 
        isSameDay(parseISO(change.timestamp), date)
      )
    )
  }

  if (loading) {
    return <div className="p-8 text-center">Loading calendar view...</div>
  }

  return (
    <div className="max-w-[1000px] mx-auto">
      <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="bg-gray-50 dark:bg-gray-800 p-2 text-center text-sm font-medium">
              {day}
            </div>
          ))}
          {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-gray-50 dark:bg-gray-800 p-2" />
          ))}
          {days.map(day => {
            const dayEvents = getEventsForDay(day)
            const hasEvents = dayEvents.length > 0

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`
                  bg-gray-50 dark:bg-gray-800 p-2 min-h-[80px] text-left
                  hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors
                  ${isSameDay(day, new Date()) ? 'font-bold' : ''}
                `}
              >
                <span className="block mb-1">{format(day, 'd')}</span>
                {hasEvents && (
                  <div className="flex flex-wrap gap-1">
                    {dayEvents.map(event => (
                      event.color && (
                        <div
                          key={event.id}
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: event.color }}
                          title={event.title}
                        />
                      )
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {selectedDate && (
        <DayEventsModal
          isOpen={true}
          onClose={() => setSelectedDate(null)}
          date={selectedDate}
          events={getEventsForDay(selectedDate)}
        />
      )}
    </div>
  )
} 