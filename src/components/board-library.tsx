'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { saveAs } from 'file-saver'
import { AlertTriangle, Download, HardDrive, Upload, X } from 'lucide-react'
import { Badge, Button, IconButton, Input, Modal, ModalFooter, Skeleton } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { boardPassword } from '@/lib/board-writes'
import {
  forgetBoards,
  parseEntries,
  readLibrary,
  restoreBoards,
  writeLibrary,
  type ForgottenBoard,
  type Library,
  type LibraryEntry,
  type PreviewColumn,
} from '@/lib/board-library'

type BoardSummary = {
  status: 'ok' | 'wrong_password' | 'not_found' | 'unreachable'
  name?: string
  expires_at?: string
}

/** One `board_summary` per board: it reads no cards, so listing a library stays cheap. */
const fetchBoardSummaries = async (ids: string[]) => {
  const supabase = createClient()

  const summaries = await Promise.all(
    ids.map(async (id): Promise<[string, BoardSummary]> => {
      const { data, error } = await supabase.rpc('board_summary', {
        board_id_param: id,
        password_attempt: boardPassword(id),
      })
      return [id, error ? { status: 'unreachable' } : (data as BoardSummary)]
    })
  )

  return new Map(summaries)
}

export const timeLeft = (expiresAt: string) => {
  const remaining = new Date(expiresAt).getTime() - Date.now()
  if (remaining <= 0) return { label: 'Expired', urgent: true }

  const days = Math.floor(remaining / 86400000)
  if (days > 0) return { label: `${days}d left`, urgent: days <= 7 }

  const hours = Math.floor(remaining / 3600000)
  if (hours > 0) return { label: `${hours}h left`, urgent: true }
  return { label: `${Math.max(1, Math.floor(remaining / 60000))}m left`, urgent: true }
}

const relative = (iso: string) => formatDistanceToNow(new Date(iso), { addSuffix: true })

const plural = (count: number, singular: string) =>
  `${count} ${singular}${count === 1 ? '' : 's'}`

function BoardThumbnail({ preview }: { preview: PreviewColumn[] }) {
  if (preview.length === 0) {
    return (
      <div className="flex h-28 items-center justify-center rounded-card border border-dashed border-strong bg-canvas">
        <span className="text-2xs text-subtle">No preview yet</span>
      </div>
    )
  }

  return (
    <div className="flex h-28 gap-1 overflow-hidden rounded-card border border-subtle bg-canvas p-1.5">
      {preview.map((column, columnIndex) => (
        <div
          key={columnIndex}
          aria-label={`Column ${columnIndex + 1}, ${column.cardCount} cards`}
          className="flex min-w-0 flex-1 flex-col gap-1 overflow-hidden rounded-tag bg-surface p-1"
        >
          <p className="truncate text-2xs uppercase tracking-wide text-subtle">
            Column {columnIndex + 1}
          </p>
          {Array.from({ length: column.cardCount }, (_, cardIndex) => (
            <span
              key={cardIndex}
              className="h-2 shrink-0 rounded-tag border border-subtle bg-surface-raised"
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function BoardCard({
  entry,
  isGone,
  onForget,
}: {
  entry: LibraryEntry
  isGone: boolean
  onForget: () => void
}) {
  const { label, urgent } = timeLeft(entry.expiresAt)
  const href = `/board?id=${entry.id}`

  return (
    <li className="rounded-panel border border-subtle bg-surface-raised p-3 transition-colors duration-fast ease-out hover:border-strong">
      {isGone ? (
        <div aria-hidden>
          <BoardThumbnail preview={entry.preview} />
        </div>
      ) : (
        <Link href={href} aria-hidden tabIndex={-1} className="block rounded-card">
          <BoardThumbnail preview={entry.preview} />
        </Link>
      )}

      <div className="mt-3 flex items-start gap-2">
        <div className="min-w-0 flex-1">
          {isGone ? (
            <p className="truncate text-sm font-medium text-muted">{entry.name}</p>
          ) : (
            <Link
              href={href}
              className="focus-ring block truncate rounded text-sm font-medium text-fg"
            >
              {entry.name}
            </Link>
          )}
          <p className="mt-0.5 text-2xs text-subtle">Opened {relative(entry.openedAt)}</p>
        </div>

        {isGone ? (
          <Badge variant="danger" className="shrink-0">
            <AlertTriangle aria-hidden className="size-3" />
            Gone
          </Badge>
        ) : (
          <Badge variant={urgent ? 'danger' : 'neutral'} className="shrink-0">
            {urgent && <AlertTriangle aria-hidden className="size-3" />}
            <span className="font-mono tabular-nums">{label}</span>
          </Badge>
        )}

        <IconButton
          label={`Forget ${entry.name}`}
          variant="danger"
          size="sm"
          icon={<X />}
          onClick={onForget}
        />
      </div>
    </li>
  )
}

export function BoardLibrary() {
  const [library, setLibrary] = useState<Library | null>(null)
  const [goneIds, setGoneIds] = useState<string[]>([])
  const [checkFailed, setCheckFailed] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [pendingForgetIds, setPendingForgetIds] = useState<string[] | null>(null)
  const [undoForget, setUndoForget] = useState<{
    forgotten: ForgottenBoard[]
    goneIds: string[]
  } | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (undoTimer.current) clearTimeout(undoTimer.current)
    },
    []
  )

  const refresh = useCallback(async (current: Library) => {
    setLibrary(current)
    if (current.entries.length === 0) return

    const live = await fetchBoardSummaries(current.entries.map((entry) => entry.id))
    const statusOf = (id: string) => live.get(id)?.status

    const next = {
      ...current,
      entries: current.entries.map((entry) => {
        const summary = live.get(entry.id)
        return summary?.status === 'ok'
          ? { ...entry, name: summary.name!, expiresAt: summary.expires_at! }
          : entry
      }),
    }

    writeLibrary(next)
    setLibrary(next)
    setGoneIds(
      current.entries.filter((entry) => statusOf(entry.id) === 'not_found').map((entry) => entry.id)
    )
    setCheckFailed(current.entries.some((entry) => statusOf(entry.id) === 'unreachable'))
  }, [])

  useEffect(() => {
    refresh(readLibrary())
  }, [refresh])

  const requestForget = (ids: string[]) => {
    if (ids.length > 0) setPendingForgetIds(ids)
  }

  const forget = () => {
    if (!pendingForgetIds) return

    const forgottenGoneIds = goneIds.filter((id) => pendingForgetIds.includes(id))
    const result = forgetBoards(pendingForgetIds)
    setLibrary(result.library)
    setGoneIds((current) => current.filter((id) => !pendingForgetIds.includes(id)))
    setPendingForgetIds(null)
    setNotice(null)

    if (undoTimer.current) clearTimeout(undoTimer.current)
    setUndoForget({ forgotten: result.forgotten, goneIds: forgottenGoneIds })
    undoTimer.current = setTimeout(() => {
      setUndoForget(null)
      undoTimer.current = null
    }, 10000)
  }

  const undo = () => {
    if (!undoForget) return

    if (undoTimer.current) clearTimeout(undoTimer.current)
    setLibrary(restoreBoards(undoForget.forgotten))
    setGoneIds((current) => [...new Set([...current, ...undoForget.goneIds])])
    setUndoForget(null)
    undoTimer.current = null
    setNotice('The board was restored to this browser.')
  }

  const exportList = () => {
    if (!library) return

    const exportedAt = new Date().toISOString()
    const file = { kind: 'kanbanthing-library', version: 1, exportedAt, entries: library.entries }
    const next = { ...library, exportedAt }

    writeLibrary(next)
    setLibrary(next)
    saveAs(
      new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' }),
      `kanbanthing-boards-${exportedAt.replace(/[:.]/g, '-')}.json`
    )
  }

  const importList = async (file: File) => {
    let parsed: unknown
    try {
      parsed = JSON.parse(await file.text())
    } catch {
      setNotice('That file is not valid JSON.')
      return
    }

    const contents = parsed as { kind?: unknown; entries?: unknown }
    if (contents?.kind !== 'kanbanthing-library') {
      setNotice('That is not a KanbanThing library export.')
      return
    }

    const imported = parseEntries(contents.entries)
    if (imported.length === 0) {
      setNotice('That file has no boards in it.')
      return
    }

    const current = library ?? readLibrary()
    const merged = new Map(current.entries.map((entry) => [entry.id, entry]))
    let added = 0

    for (const entry of imported) {
      const existing = merged.get(entry.id)
      if (!existing) added += 1
      if (!existing || existing.openedAt < entry.openedAt) merged.set(entry.id, entry)
    }

    setNotice(
      `Added ${plural(added, 'board')}. ${plural(imported.length - added, 'board')} already here.`
    )
    await refresh({ ...current, entries: [...merged.values()] })
  }

  const entries = [...(library?.entries ?? [])].sort((a, b) => b.openedAt.localeCompare(a.openedAt))

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-fg md:text-3xl">Your boards</h1>
      <p className="mt-3 max-w-[62ch] text-md text-muted">
        Every board you create or open in this browser is listed here automatically, with how long
        each one has left before it is deleted.
      </p>

      <section className="mt-8 rounded-panel border border-subtle bg-surface p-4">
        <div className="flex gap-3">
          <HardDrive aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-medium text-fg">Saved in this browser only</h2>
            <p className="mt-1.5 max-w-[62ch] text-sm text-muted">
              This is not an account. Clearing your browser cache or site data wipes this list, and
              a board with no link is unreachable forever. The boards keep running on the server,
              you just lose the only record of where they are.
            </p>
            {library && library.entries.length > 0 && (
              <p className="mt-2 text-xs text-subtle">
                {library.exportedAt
                  ? `${plural(library.entries.length, 'board')} saved. Last exported ${relative(library.exportedAt)}.`
                  : `${plural(library.entries.length, 'board')} saved, never exported.`}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={exportList} disabled={entries.length === 0}>
                <Download />
                Export list
              </Button>
              <Button size="sm" onClick={() => fileInput.current?.click()}>
                <Upload />
                Import list
              </Button>
            </div>
            <p className="mt-3 max-w-[62ch] text-xs text-subtle">
              Board passwords stay in this tab&apos;s session storage in plain text. They are not
              encrypted, are cleared when the tab closes or you lock the board, and are never
              written to the export file. Keep a separate copy if you need recovery.
            </p>
            <p className="mt-2 max-w-[62ch] text-xs text-subtle">
              Board thumbnails contain only anonymous column and card counts; column labels and
              card colors are not saved in the library.
            </p>
          </div>
        </div>

        <Input
          ref={fileInput}
          type="file"
          accept="application/json"
          className="hidden"
          aria-hidden
          tabIndex={-1}
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (file) importList(file)
          }}
        />
      </section>

      {notice && (
        <p role="status" className="mt-4 text-sm text-muted">
          {notice}
        </p>
      )}

      {undoForget && (
        <div
          role="status"
          className="mt-4 flex flex-wrap items-center gap-3 rounded-panel border border-subtle bg-surface px-4 py-3"
        >
          <p className="min-w-0 flex-1 text-sm text-muted">
            {undoForget.forgotten.length === 1
              ? 'Board removed from this browser.'
              : `${undoForget.forgotten.length} boards removed from this browser.`}{' '}
            Undo is available briefly.
          </p>
          <Button size="sm" onClick={undo}>
            Undo
          </Button>
        </div>
      )}

      {goneIds.length > 0 && (
        <div
          role="status"
          className="mt-4 flex flex-wrap items-center gap-3 rounded-panel border border-subtle bg-danger-soft px-4 py-3"
        >
          <AlertTriangle aria-hidden className="size-4 shrink-0 text-danger" />
          <p className="min-w-0 flex-1 text-sm text-danger">
            {goneIds.length === 1
              ? 'One board is gone. It expired or was deleted, and its link no longer works.'
              : `${goneIds.length} boards are gone. They expired or were deleted, and their links no longer work.`}
          </p>
          <Button size="sm" onClick={() => requestForget(goneIds)}>
            Remove {goneIds.length === 1 ? 'it' : 'them'}
          </Button>
        </div>
      )}

      {checkFailed && (
        <p className="mt-4 text-xs text-subtle">
          Could not check which boards are still alive. The times below are from your last visit.
        </p>
      )}

      {library === null && (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((placeholder) => (
            <li key={placeholder} className="rounded-panel border border-subtle bg-surface-raised p-3">
              <Skeleton className="h-28 w-full rounded-card" />
              <Skeleton className="mt-3 h-4 w-32" />
            </li>
          ))}
        </ul>
      )}

      {library !== null && entries.length === 0 && (
        <div className="mt-8 rounded-panel border border-dashed border-strong px-6 py-12 text-center">
          <h2 className="text-sm font-medium text-fg">No boards saved yet</h2>
          <p className="mx-auto mt-2 max-w-[54ch] text-sm text-muted">
            Create or open a board and it appears here, so you never have to keep the link yourself.
            The list lives in this browser only, and clearing site data erases it.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button asChild size="sm">
              <Link href="/onboarding">Create a board</Link>
            </Button>
            <Button size="sm" onClick={() => fileInput.current?.click()}>
              <Upload />
              Import a list
            </Button>
          </div>
        </div>
      )}

      {entries.length > 0 && (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <BoardCard
              key={entry.id}
              entry={entry}
              isGone={goneIds.includes(entry.id)}
              onForget={() => requestForget([entry.id])}
            />
          ))}
        </ul>
      )}

      <Modal
        open={pendingForgetIds !== null}
        onClose={() => setPendingForgetIds(null)}
        title={
          pendingForgetIds?.length === 1 ? 'Forget this board?' : 'Forget these boards?'
        }
        size="sm"
      >
        <p className="text-sm text-muted">
          This removes the board{pendingForgetIds?.length === 1 ? '' : 's'} from this browser and
          clears the saved password in this tab. It does not delete anything on the server. You can
          undo for a few seconds; after that, recovery requires the board link and password.
        </p>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setPendingForgetIds(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={forget}>
            Forget {pendingForgetIds?.length === 1 ? 'board' : 'boards'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
