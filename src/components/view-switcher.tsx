'use client'

import { LayoutGrid, Calendar, Clock } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

const VIEWS = [
  { id: 'kanban', label: 'Board', icon: LayoutGrid },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'timeline', label: 'Timeline', icon: Clock },
] as const

type View = (typeof VIEWS)[number]['id']

interface ViewSwitcherProps {
  currentView: View
  onViewChange: (view: View) => void
  boardId: string
}

export default function ViewSwitcher({ currentView, onViewChange }: ViewSwitcherProps) {
  return (
    <div
      role="tablist"
      aria-label="Board view"
      className="inline-flex items-center gap-0.5 rounded-control border border-subtle bg-surface p-0.5"
    >
      {VIEWS.map(({ id, label, icon: Icon }) => (
        <Button
          key={id}
          role="tab"
          aria-selected={currentView === id}
          variant="ghost"
          size="sm"
          onClick={() => onViewChange(id)}
          className={cn(
            currentView === id && 'bg-accent-soft text-accent hover:bg-accent-soft hover:text-accent'
          )}
        >
          <Icon />
          {label}
        </Button>
      ))}
    </div>
  )
}
