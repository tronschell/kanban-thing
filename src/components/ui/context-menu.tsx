'use client'

import { useEffect, useRef } from 'react'

interface ContextMenuProps {
  x: number
  y: number
  columns: Array<{ id: string; name: string }>
  onSelect: (columnId: string) => void
  onClose: () => void
}

export function ContextMenu({ x, y, columns, onSelect, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <div
      ref={menuRef}
      style={{ top: y, left: x }}
      className="fixed z-50 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1"
    >
      <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
        Move to column
      </div>
      {columns.map((column) => (
        <button
          key={column.id}
          onClick={() => onSelect(column.id)}
          className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50"
        >
          {column.name}
        </button>
      ))}
    </div>
  )
} 