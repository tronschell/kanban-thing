'use client'

import { useState, useRef, useEffect } from 'react'
import { Terminal as TerminalIcon, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CommandResponse {
  success: boolean
  message: string
}

interface TerminalInterfaceProps {
  isOpen: boolean
  onClose: () => void
  onCommand: (command: string) => Promise<CommandResponse>
  availableCards: { title: string }[]
  availableColumns: { name: string }[]
}

export function TerminalInterface({ isOpen, onClose, onCommand, availableCards, availableColumns }: TerminalInterfaceProps) {
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const historyRef = useRef<HTMLDivElement>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [suggestionIndex, setSuggestionIndex] = useState(0)
  const [suggestion, setSuggestion] = useState<string>('')

  // Focus input when terminal opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  // Scroll to bottom when history changes
  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight
    }
  }, [history])

  const getCommandParts = (input: string) => {
    const parts = input.toLowerCase().split(' ')
    const command = parts[0]
    return { command, parts }
  }

  const getGhostSuggestion = (input: string): string => {
    const { command, parts } = getCommandParts(input)
    
    if (!['mv', 'move', 'dl', 'delete'].includes(command)) {
      return ''
    }

    // Check if we're completing a column name (after 'to')
    const isColumnCompletion = (command === 'mv' || command === 'move') && 
      parts.includes('to') && 
      parts.length > parts.indexOf('to') + 1

    if (isColumnCompletion) {
      const toIndex = parts.indexOf('to')
      const currentWord = parts.slice(toIndex + 1).join(' ').toLowerCase()
      
      const match = availableColumns
        .map(col => col.name)
        .find(name => 
          name.toLowerCase().startsWith(currentWord) &&
          name.toLowerCase() !== currentWord
        )

      if (match) {
        return match.slice(currentWord.length)
      }
    } else if (parts.length > 1) {
      const currentWord = parts.slice(1).join(' ').toLowerCase()
      
      const match = availableCards
        .map(card => card.title)
        .find(title => 
          title.toLowerCase().startsWith(currentWord) &&
          title.toLowerCase() !== currentWord
        )

      if (match) {
        return match.slice(currentWord.length)
      }
    }

    return ''
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInput = e.target.value
    setInput(newInput)
    setSuggestion(getGhostSuggestion(newInput))
  }

  const handleTabCompletion = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault() // Prevent tab from moving focus
    
    const { command, parts } = getCommandParts(input)
    
    if (!['mv', 'move', 'dl', 'delete'].includes(command)) {
      return
    }

    // Check if we're completing a column name (after 'to')
    const isColumnCompletion = (command === 'mv' || command === 'move') && 
      parts.includes('to') && 
      parts.length > parts.indexOf('to') + 1

    if (isColumnCompletion) {
      const toIndex = parts.indexOf('to')
      const currentWord = parts.slice(toIndex + 1).join(' ').toLowerCase()
      
      const matches = availableColumns
        .map(col => col.name)
        .filter(name => 
          name.toLowerCase().startsWith(currentWord) &&
          name.toLowerCase() !== currentWord
        )

      if (matches.length > 0) {
        const newIndex = (suggestionIndex + 1) % matches.length
        setSuggestionIndex(newIndex)
        
        // Keep everything up to and including 'to', then add the column name
        const beforeTo = parts.slice(0, toIndex + 1).join(' ')
        const newInput = `${beforeTo} ${matches[newIndex]}`
        setInput(newInput)
        setSuggestion('')
      }
    } else if (parts.length > 1) {
      const currentWord = parts.slice(1).join(' ').toLowerCase()
      
      const matches = availableCards
        .map(card => card.title)
        .filter(title => 
          title.toLowerCase().startsWith(currentWord) &&
          title.toLowerCase() !== currentWord
        )

      if (matches.length > 0) {
        const newIndex = (suggestionIndex + 1) % matches.length
        setSuggestionIndex(newIndex)
        
        const fullSuggestion = matches[newIndex]
        const newInput = `${parts[0]} ${fullSuggestion}`
        setInput(newInput)
        setSuggestion('')
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab') {
      handleTabCompletion(e)
      return
    }
    // Existing arrow key handling
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1
        setHistoryIndex(newIndex)
        setInput(commandHistory[commandHistory.length - 1 - newIndex])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setInput(commandHistory[commandHistory.length - 1 - newIndex])
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setInput('')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    // Add command to history
    setHistory(prev => [...prev, `> ${input}`])
    
    // Add to command history
    setCommandHistory(prev => [...prev, input])
    setHistoryIndex(-1)
    
    // Process command and show response
    const response = await onCommand(input)
    setHistory(prev => [...prev, response.message])
    
    // Clear input
    setInput('')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-3xl p-4"
        >
          <div className="rounded-lg bg-gray-950/95 backdrop-blur supports-[backdrop-filter]:bg-gray-950/60 
                         border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm text-gray-400">Terminal</div>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-gray-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div 
              ref={historyRef}
              className="space-y-2 mb-2 max-h-32 overflow-y-auto apple-scrollbar"
            >
              {history.map((line, i) => (
                <div key={i} className="text-xs text-gray-300 whitespace-pre-wrap">{line}</div>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="flex items-center gap-2">
                <span className="text-xs text-green-500">❯</span>
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-transparent border-none outline-none text-gray-100 text-xs"
                    placeholder='Type a command or "help"...'
                    spellCheck={false}
                  />
                  {suggestion && (
                    <div className="absolute inset-0 flex items-center pointer-events-none">
                      <div className="relative flex items-center min-w-0">
                        <span className="invisible text-xs">{input}</span>
                        <span className="absolute left-full text-gray-600/50 text-xs whitespace-pre">{suggestion}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 