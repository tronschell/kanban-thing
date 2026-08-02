'use client'

import { useEffect, useRef, useState } from 'react'
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  parse,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react'

import { Button, IconButton, fieldClass } from '@/components/ui'
import { cn } from '@/lib/utils'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const dayKey = (date: Date) => format(date, 'yyyy-MM-dd')
const fromDayKey = (key: string) => parse(key, 'yyyy-MM-dd', new Date())

const weeksOfMonth = (month: Date) => {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month)),
    end: endOfWeek(endOfMonth(month)),
  })
  return Array.from({ length: days.length / 7 }, (_, week) => days.slice(week * 7, week * 7 + 7))
}

const quickOptions = () => {
  const today = new Date()
  return [
    { label: 'Today', day: dayKey(today) },
    { label: 'Tomorrow', day: dayKey(addDays(today, 1)) },
    { label: 'Next week', day: dayKey(addDays(today, 7)) },
  ]
}

const stepFrom = (key: string, from: Date) => {
  switch (key) {
    case 'ArrowLeft':
      return addDays(from, -1)
    case 'ArrowRight':
      return addDays(from, 1)
    case 'ArrowUp':
      return addDays(from, -7)
    case 'ArrowDown':
      return addDays(from, 7)
    case 'Home':
      return startOfWeek(from)
    case 'End':
      return endOfWeek(from)
    case 'PageUp':
      return addMonths(from, -1)
    case 'PageDown':
      return addMonths(from, 1)
    default:
      return null
  }
}

interface DueDatePickerProps {
  id: string
  /** `yyyy-MM-dd`, or an empty string for no due date. */
  value: string
  onChange: (day: string) => void
}

export default function DueDatePicker({ id, value, onChange }: DueDatePickerProps) {
  const [open, setOpen] = useState(false)
  const [focusedDay, setFocusedDay] = useState(() => value || dayKey(new Date()))
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const pullFocusIntoGrid = useRef(false)

  const month = startOfMonth(fromDayKey(focusedDay))
  const readableValue = value ? format(fromDayKey(value), 'EEE, MMM d, yyyy') : 'No due date'

  useEffect(() => {
    if (!open || !pullFocusIntoGrid.current) return
    pullFocusIntoGrid.current = false
    panelRef.current?.querySelector<HTMLButtonElement>('[data-focused]')?.focus()
  }, [open, focusedDay])

  useEffect(() => {
    if (!open) return

    const closeOnOutside = (event: PointerEvent) => {
      const target = event.target as Node
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return
      setOpen(false)
    }

    // Radix's dialog listens for Escape on document capture; window capture runs first,
    // so preventing it here keeps the card editor open while the picker closes.
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      setOpen(false)
      triggerRef.current?.focus()
    }

    document.addEventListener('pointerdown', closeOnOutside)
    window.addEventListener('keydown', closeOnEscape, true)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside)
      window.removeEventListener('keydown', closeOnEscape, true)
    }
  }, [open])

  const openPanel = () => {
    pullFocusIntoGrid.current = true
    setFocusedDay(value || dayKey(new Date()))
    setOpen(true)
  }

  const select = (day: string) => {
    onChange(day)
    setOpen(false)
    triggerRef.current?.focus()
  }

  const handleGridKeyDown = (event: React.KeyboardEvent) => {
    const next = stepFrom(event.key, fromDayKey(focusedDay))
    if (!next) return
    event.preventDefault()
    pullFocusIntoGrid.current = true
    setFocusedDay(dayKey(next))
  }

  const trapTab = (event: React.KeyboardEvent) => {
    if (event.key !== 'Tab' || !panelRef.current) return
    const stops = Array.from(panelRef.current.querySelectorAll<HTMLButtonElement>('button')).filter(
      (button) => button.tabIndex >= 0
    )
    const index = stops.indexOf(document.activeElement as HTMLButtonElement)
    event.preventDefault()
    event.stopPropagation()
    stops[(index + (event.shiftKey ? -1 : 1) + stops.length) % stops.length]?.focus()
  }

  return (
    <div>
      <div className="flex items-center gap-1.5">
        <button
          id={id}
          ref={triggerRef}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={value ? `Due date: ${readableValue}` : 'Due date: not set'}
          onClick={() => (open ? setOpen(false) : openPanel())}
          className={cn(fieldClass, 'flex h-8 min-w-0 flex-1 items-center gap-2 px-2.5 text-sm')}
        >
          <CalendarDays className="size-3.5 shrink-0 text-subtle" />
          <span className={cn('truncate', !value && 'text-subtle')}>{readableValue}</span>
        </button>
        {value && (
          <IconButton label="Clear due date" size="sm" icon={<X />} onClick={() => onChange('')} />
        )}
      </div>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Choose a due date"
          onKeyDown={trapTab}
          className="mt-1.5 rounded-panel border border-subtle bg-surface p-2 duration-base ease-out animate-in fade-in-0 zoom-in-95"
        >
          <div className="flex gap-1">
            {quickOptions().map((option) => (
              <Button
                key={option.label}
                size="sm"
                className="min-w-0 flex-1"
                onClick={() => select(option.day)}
              >
                {option.label}
              </Button>
            ))}
          </div>

          <div className="mt-2 flex items-center gap-1">
            <IconButton
              label="Previous month"
              size="sm"
              icon={<ChevronLeft />}
              onClick={() => setFocusedDay(dayKey(addMonths(fromDayKey(focusedDay), -1)))}
            />
            <span
              aria-live="polite"
              className="min-w-0 flex-1 truncate text-center text-xs font-medium text-fg"
            >
              {format(month, 'MMMM yyyy')}
            </span>
            <IconButton
              label="Next month"
              size="sm"
              icon={<ChevronRight />}
              onClick={() => setFocusedDay(dayKey(addMonths(fromDayKey(focusedDay), 1)))}
            />
          </div>

          <table role="grid" className="mt-1 w-full table-fixed border-collapse">
            <thead>
              <tr>
                {WEEKDAYS.map((weekday) => (
                  <th
                    key={weekday}
                    scope="col"
                    className="pb-1 text-2xs font-medium uppercase tracking-wide text-subtle"
                  >
                    {weekday}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody onKeyDown={handleGridKeyDown}>
              {weeksOfMonth(month).map((week) => (
                <tr key={dayKey(week[0])}>
                  {week.map((day) => {
                    const key = dayKey(day)
                    const selected = key === value
                    const focused = key === focusedDay
                    const today = isToday(day)
                    return (
                      <td
                        key={key}
                        aria-selected={selected}
                        aria-current={today ? 'date' : undefined}
                        className="p-0"
                      >
                        <button
                          type="button"
                          data-focused={focused ? '' : undefined}
                          tabIndex={focused ? 0 : -1}
                          aria-label={format(day, 'EEEE, MMMM d, yyyy')}
                          onClick={() => select(key)}
                          className={cn(
                            'focus-ring relative flex h-8 w-full items-center justify-center rounded-control font-mono text-xs tabular-nums transition-colors duration-fast ease-out',
                            selected
                              ? 'bg-accent font-medium text-accent-fg'
                              : cn(
                                  'hover:bg-surface-hover',
                                  isSameMonth(day, month) ? 'text-fg' : 'text-subtle'
                                )
                          )}
                        >
                          {format(day, 'd')}
                          {today && (
                            <span
                              aria-hidden
                              className={cn(
                                'absolute bottom-1 size-1 rounded-full',
                                selected ? 'bg-accent-fg' : 'bg-accent'
                              )}
                            />
                          )}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
