'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Pencil, Plus } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Button, IconButton, Modal, ModalFooter, Textarea } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'

const BRIEF_MAX_LENGTH = 4000

const collapsedKey = (boardId: string) => `kanbanthing.brief.collapsed.${boardId}`

const storedPassword = (boardId: string) =>
  localStorage.getItem(`board_password_${boardId}`) ?? ''

const SAVE_ERRORS: Record<string, string> = {
  wrong_password: 'The stored board password is no longer correct.',
  not_found: 'This board no longer exists.',
}

export default function BoardBrief({ boardId }: { boardId: string }) {
  const supabase = useMemo(() => createClient(), [])
  const [brief, setBrief] = useState<string | null | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [isPreview, setIsPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [draft, setDraft] = useState('')
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    let cancelled = false

    setBrief(undefined)
    setIsLoading(true)
    setIsCollapsed(localStorage.getItem(collapsedKey(boardId)) === '1')

    const load = async () => {
      const { data, error } = await supabase.rpc('board_brief', {
        board_id_param: boardId,
        password_attempt: storedPassword(boardId),
      })
      if (cancelled) return
      setIsLoading(false)
      if (error || data?.status !== 'ok') return
      setBrief(data.brief ?? null)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [boardId, supabase])

  const toggleCollapsed = () => {
    const next = !isCollapsed
    setIsCollapsed(next)
    if (next) localStorage.setItem(collapsedKey(boardId), '1')
    else localStorage.removeItem(collapsedKey(boardId))
  }

  const openEditor = () => {
    setDraft(brief ?? '')
    setIsPreview(false)
    setSaveError('')
    setIsEditorOpen(true)
  }

  const save = async () => {
    setIsSaving(true)
    setSaveError('')

    const { data, error } = await supabase.rpc('board_set_brief', {
      board_id_param: boardId,
      password_attempt: storedPassword(boardId),
      brief_param: draft,
    })
    setIsSaving(false)

    if (error || data !== 'ok') {
      setSaveError(SAVE_ERRORS[data] ?? 'Could not save the board brief.')
      return
    }

    setBrief(draft.slice(0, BRIEF_MAX_LENGTH).trim() || null)
    setIsEditorOpen(false)
  }

  if (isLoading) return <div className="h-9 px-3 pb-2" />
  if (brief === undefined) return null

  return (
    <div className="px-3 pb-2">
      {brief === null ? (
        <Button variant="ghost" size="sm" className="-ml-2.5 text-2xs" onClick={openEditor}>
          <Plus />
          Add a board brief
        </Button>
      ) : (
        <section
          aria-label="About this board"
          className="group rounded-panel border border-subtle bg-surface"
        >
          <div className="flex items-center gap-1 px-2 py-1.5">
            <IconButton
              label={isCollapsed ? 'Expand board brief' : 'Collapse board brief'}
              size="sm"
              aria-expanded={!isCollapsed}
              icon={isCollapsed ? <ChevronRight /> : <ChevronDown />}
              onClick={toggleCollapsed}
            />
            <h2 className="min-w-0 flex-1 truncate text-xs font-medium uppercase tracking-wide text-muted">
              About this board
            </h2>
            <IconButton
              label="Edit board brief"
              size="sm"
              icon={<Pencil />}
              className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
              onClick={openEditor}
            />
          </div>
          {!isCollapsed && (
            <div className="prose max-h-48 max-w-none overflow-y-auto break-words px-2 pb-2 text-sm scrollbar-thin">
              <ReactMarkdown components={{ h1: 'h3' }}>{brief}</ReactMarkdown>
            </div>
          )}
        </section>
      )}

      <Modal
        open={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title="Board brief"
        description="Pinned to the top of this board for anyone who opens the link."
        size="lg"
      >
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="board-brief-text" className="block text-xs font-medium text-muted">
            Brief
          </label>
          <Button
            variant="link"
            size="sm"
            className="h-auto px-0"
            onClick={() => setIsPreview(!isPreview)}
          >
            {isPreview ? 'Edit' : 'Preview'}
          </Button>
        </div>
        {isPreview ? (
          <div className="prose min-h-24 max-w-none rounded-control border border-subtle bg-surface px-2.5 py-2 text-sm">
            <ReactMarkdown>{draft}</ReactMarkdown>
          </div>
        ) : (
          <Textarea
            id="board-brief-text"
            rows={8}
            maxLength={BRIEF_MAX_LENGTH}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="what this board is for, what the columns mean, who to ask"
          />
        )}
        <p className="mt-1 min-h-4 text-xs text-danger" role="alert">
          {saveError}
        </p>

        <ModalFooter>
          <Button variant="ghost" onClick={() => setIsEditorOpen(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} disabled={isSaving}>
            {isSaving ? 'Saving' : 'Save brief'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
