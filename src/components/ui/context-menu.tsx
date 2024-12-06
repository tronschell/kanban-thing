'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

interface ContextMenuProps {
  x: number
  y: number
  columns: Array<{ id: string; name: string }>
  onSelect: (columnId: string) => void
  onClose: () => void
}

export default function ContextMenu({ x, y, columns, onSelect, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  // Adjust position to prevent menu from going off screen
  const menuPosition = {
    left: Math.min(x, window.innerWidth - 192), // 192px is menu width
    top: Math.min(y, window.innerHeight - (columns.length * 40 + 40)) // Approximate height
  }

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.1 }}
      className="fixed z-50 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 overflow-hidden"
      style={menuPosition}
    >
      <div className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
        Move to column
      </div>
      <div className="max-h-[320px] overflow-y-auto">
        {columns.length === 0 ? (
          <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 italic">
            No columns available
          </div>
        ) : (
          columns.map((column) => (
            <motion.button
              key={column.id}
              onClick={() => onSelect(column.id)}
              className="w-full px-3 py-2 text-sm text-left flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 group"
              whileHover={{ x: 4 }}
              transition={{ duration: 0.1 }}
            >
              <span className="flex-1">{column.name}</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.button>
          ))
        )}
      </div>
    </motion.div>
  )
} 