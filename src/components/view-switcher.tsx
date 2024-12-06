'use client'

import { LayoutGrid, Calendar, Clock } from 'lucide-react'

interface ViewSwitcherProps {
  currentView: 'kanban' | 'calendar' | 'timeline'
  onViewChange: (view: 'kanban' | 'calendar' | 'timeline') => void
  boardId: string
}

export default function ViewSwitcher({ currentView, onViewChange }: ViewSwitcherProps) {
  const views = [
    {
      id: 'kanban',
      label: 'Board',
      icon: LayoutGrid,
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: Calendar,
    },
    {
      id: 'timeline',
      label: 'Timeline',
      icon: Clock,
    },
  ] as const

  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800/50 p-1 rounded-lg w-fit relative">
      {views.map((view) => {
        const Icon = view.icon
        const isActive = currentView === view.id
        
        return (
          <button
            key={view.id}
            onClick={() => onViewChange(view.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
              w-full
              ${isActive 
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-900/50'
              }
            `}
          >
            <Icon className="w-4 h-4" />
            {view.label}
          </button>
        )
      })}
    </div>
  )
} 