'use client'

import { LayoutGrid, Calendar, GitBranch } from 'lucide-react'

interface ViewSwitcherProps {
  currentView: 'kanban' | 'calendar' | 'timeline'
  onViewChange: (view: 'kanban' | 'calendar' | 'timeline') => void
  boardId: string
}

export default function ViewSwitcher({ currentView, onViewChange, boardId }: ViewSwitcherProps) {
  return (
    <div className="flex items-center gap-2 mb-8">
      <button
        onClick={() => onViewChange('kanban')}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
          ${currentView === 'kanban' 
            ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }
        `}
      >
        <LayoutGrid className="w-4 h-4" />
        Board
      </button>

      <button
        onClick={() => onViewChange('calendar')}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
          ${currentView === 'calendar' 
            ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }
        `}
      >
        <Calendar className="w-4 h-4" />
        Calendar
      </button>

      <button
        onClick={() => onViewChange('timeline')}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
          ${currentView === 'timeline' 
            ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }
        `}
      >
        <GitBranch className="w-4 h-4" />
        Timeline
      </button>
    </div>
  )
} 