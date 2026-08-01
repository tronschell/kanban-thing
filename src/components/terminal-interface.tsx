'use client'

import { useState, useRef, useEffect } from 'react'
import { Input, Sheet } from '@/components/ui'
import { cn } from '@/lib/utils'

interface CommandResponse {
  success: boolean
  message: string
}

interface Line {
  text: string
  kind: 'input' | 'output' | 'error'
}

interface TerminalInterfaceProps {
  isOpen: boolean
  onClose: () => void
  onCommand: (command: string) => Promise<CommandResponse>
  availableCards: { title: string }[]
  availableColumns: { name: string }[]
}

const COMPLETABLE = ['mv', 'move', 'dl', 'delete']

export function TerminalInterface({
  isOpen,
  onClose,
  onCommand,
  availableCards,
  availableColumns,
}: TerminalInterfaceProps) {
  const [input, setInput] = useState('')
  const [lines, setLines] = useState<Line[]>([])
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [completionIndex, setCompletionIndex] = useState(0)
  const [suggestion, setSuggestion] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    // The dialog focus trap claims focus on mount, so take it back on the next frame.
    const frame = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [isOpen])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [lines])

  const completionsFor = (value: string) => {
    const words = value.split(/\s+/)
    const command = words[0].toLowerCase()
    if (!COMPLETABLE.includes(command)) return { prefix: '', matches: [], typed: '' }

    const toIndex = words.findIndex((word) => word.toLowerCase() === 'to')
    const completingColumn = toIndex > 0 && words.length > toIndex + 1

    const start = completingColumn ? toIndex + 1 : 1
    const typed = words.slice(start).join(' ')
    if (!typed) return { prefix: '', matches: [], typed: '' }

    const candidates = completingColumn
      ? availableColumns.map((column) => column.name)
      : availableCards.map((card) => card.title)

    const matches = candidates.filter(
      (candidate) =>
        candidate.toLowerCase().startsWith(typed.toLowerCase()) &&
        candidate.toLowerCase() !== typed.toLowerCase()
    )

    return { prefix: words.slice(0, start).join(' '), matches, typed }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInput(value)
    setCompletionIndex(0)

    const { matches, typed } = completionsFor(value)
    setSuggestion(matches.length ? matches[0].slice(typed.length) : '')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const { prefix, matches } = completionsFor(input)
      if (!matches.length) return

      const next = completionIndex % matches.length
      setCompletionIndex(next + 1)
      setInput(`${prefix} ${matches[next]}`)
      setSuggestion('')
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (historyIndex >= commandHistory.length - 1) return
      const next = historyIndex + 1
      setHistoryIndex(next)
      setInput(commandHistory[commandHistory.length - 1 - next])
      setSuggestion('')
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex < 0) return
      const next = historyIndex - 1
      setHistoryIndex(next)
      setInput(next < 0 ? '' : commandHistory[commandHistory.length - 1 - next])
      setSuggestion('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const command = input.trim()
    if (!command) return

    setLines((prev) => [...prev, { text: `❯ ${command}`, kind: 'input' }])
    setCommandHistory((prev) => [...prev, command])
    setHistoryIndex(-1)
    setInput('')
    setSuggestion('')

    const response = await onCommand(command)
    setLines((prev) => [
      ...prev,
      { text: response.message, kind: response.success ? 'output' : 'error' },
    ])
  }

  return (
    <Sheet open={isOpen} onClose={onClose} title="Terminal" side="bottom">
      <div className="p-4 font-mono">
        <div
          ref={logRef}
          role="log"
          aria-live="polite"
          className="max-h-64 space-y-1.5 overflow-y-auto scrollbar-thin text-xs"
        >
          {lines.map((line, index) => (
            <p
              key={index}
              className={cn(
                'whitespace-pre-wrap',
                line.kind === 'input' && 'text-fg',
                line.kind === 'output' && 'text-muted',
                line.kind === 'error' && 'text-danger'
              )}
            >
              {line.text}
            </p>
          ))}
          {lines.length === 0 && (
            <p className="text-xs text-subtle">Type help to list the available commands.</p>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-3 flex items-center gap-2 border-t border-subtle pt-3"
        >
          <span aria-hidden className="text-xs text-accent">
            ❯
          </span>
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              aria-label="Terminal command"
              placeholder="Type a command or help"
              autoComplete="off"
              spellCheck={false}
              className="h-6 border-transparent bg-transparent px-0 font-mono text-xs"
            />
            {suggestion && (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 flex items-center font-mono text-xs"
              >
                <span className="invisible whitespace-pre">{input}</span>
                <span className="whitespace-pre text-subtle">{suggestion}</span>
              </span>
            )}
          </div>
        </form>
      </div>
    </Sheet>
  )
}
