'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { LibraryBig, Plus, Terminal as TerminalIcon, TriangleAlert } from 'lucide-react'
import { Button, IconButton } from '@/components/ui'
import { BoardExpirationTimer } from '@/components/board-expiration-timer'
import { CreateModal } from '@/components/create-modal'
import ShareLink from '@/components/share-link'
import { TerminalInterface } from '@/components/terminal-interface'
import { BoardMenu } from '@/components/navbar/board-menu'
import { BoardLifespanModal } from '@/components/navbar/board-lifespan-modal'
import {
  DeleteBoardModal,
  DuplicateBoardModal,
  RenameBoardModal,
  SetPasswordModal,
} from '@/components/navbar/board-modals'
import { ThemePicker } from '@/components/theme-picker'
import { exportBoardAsCsv, exportBoardAsJson } from '@/components/navbar/board-export'
import { runBoardCommand } from '@/components/navbar/board-commands'
import { useHoursLeft } from '@/hooks/use-board-expiration'
import { EXPIRY_WARNING_HOURS, expiryWarningText } from '@/lib/board-lifespan'
import { numbered } from '@/components/board/dnd'
import { createClient } from '@/lib/supabase/client'
import { cardRow, columnRow, saveCards, saveColumns, writeMessage } from '@/lib/board-writes'
import { Card, Column } from '@/types'

interface NavbarProps {
  boardId?: string
  /** Renders the board name and expiry only: no Create, terminal, share or board menu. */
  readOnly?: boolean
  /** The anon role cannot select from `boards`: both come from the caller's `board_read`. */
  boardName?: string
  expiresAt?: string
  onRenamed?: (name: string) => void
  cards?: Card[]
  setBoardCards?: React.Dispatch<React.SetStateAction<Card[]>>
  setBacklogCards?: React.Dispatch<React.SetStateAction<Card[]>>
  backlogColumnId?: string | null
  columns?: Column[]
  setColumns?: React.Dispatch<React.SetStateAction<Column[]>>
  onError?: (message: string) => void
}

type Modal =
  | 'create'
  | 'terminal'
  | 'rename'
  | 'duplicate'
  | 'password'
  | 'lifespan'
  | 'delete'
  | 'appearance'
  | null

export default function Navbar({
  boardId,
  readOnly,
  boardName = '',
  expiresAt,
  onRenamed = () => {},
  cards = [],
  setBoardCards,
  setBacklogCards,
  backlogColumnId,
  columns = [],
  setColumns,
  onError,
}: NavbarProps) {
  const [openModal, setOpenModal] = useState<Modal>(null)
  const supabase = useMemo(createClient, [])
  const hoursLeft = useHoursLeft(expiresAt ?? null)
  const showsBoard = Boolean(boardId) || Boolean(readOnly)

  const cardTitles = useMemo(
    () =>
      [...cards].sort((a, b) => a.title.localeCompare(b.title)).map(({ title }) => ({ title })),
    [cards]
  )

  const cardsInColumn = (columnId: string) => cards.filter((card) => card.column_id === columnId)

  const applyToColumn = (columnId: string) =>
    columnId === backlogColumnId ? setBacklogCards : setBoardCards

  const handleCreateCard = async (
    columnId: string,
    cardData: { title: string; description: string; color: string | null; due_date: string | null }
  ) => {
    if (!boardId) return

    const created: Card = {
      ...cardData,
      id: crypto.randomUUID(),
      column_id: columnId,
      position: cardsInColumn(columnId).length,
      created_at: new Date().toISOString(),
    }

    const result = await saveCards(supabase, boardId, [cardRow(created)])
    if (result !== 'ok') {
      onError?.(writeMessage(result, 'Could not create that card.'))
      return
    }

    applyToColumn(columnId)?.((prev) => [...prev, created])
  }

  const handleCreateCards = async (columnId: string, titles: string[]) => {
    if (!boardId) return

    const fresh = titles.map(
      (title): Card => ({
        id: crypto.randomUUID(),
        column_id: columnId,
        title,
        description: null,
        color: null,
        due_date: null,
        position: 0,
        created_at: new Date().toISOString(),
      })
    )
    const merged = numbered([...cardsInColumn(columnId), ...fresh])

    const result = await saveCards(supabase, boardId, merged.map(cardRow))
    if (result !== 'ok') {
      const message = writeMessage(result, 'Could not add those cards.')
      onError?.(message)
      throw new Error(message)
    }

    applyToColumn(columnId)?.((prev) => [
      ...prev.filter((card) => card.column_id !== columnId),
      ...merged,
    ])
  }

  const handleCreateColumn = async (name: string) => {
    if (!boardId) return

    const created: Column = {
      id: crypto.randomUUID(),
      board_id: boardId,
      name,
      position: columns.filter((column) => column.position >= 0).length,
      created_at: new Date().toISOString(),
    }

    const result = await saveColumns(supabase, boardId, [columnRow(created)])
    if (result !== 'ok') {
      onError?.(writeMessage(result, 'Could not create that column.'))
      return
    }

    setColumns?.((prev) => [...prev, created])
  }

  const exportBoard = (download: (boardId: string) => Promise<void>) => {
    if (!boardId) return
    download(boardId).catch((error) => {
      console.error('Board export failed:', error)
      onError?.('Could not export this board.')
    })
  }

  const closeModal = () => setOpenModal(null)

  return (
    <>
      <header className="sticky top-0 z-40 flex h-12 items-center gap-2 border-b bg-surface px-3">
        <Link
          href="/"
          className="focus-ring shrink-0 rounded-control text-sm font-medium text-muted transition-colors duration-fast ease-out hover:text-fg"
        >
          KanbanThing
        </Link>

        {showsBoard && (
          <>
            <span aria-hidden className="text-subtle">
              /
            </span>
            <h1 className="min-w-0 flex-1 truncate text-sm font-semibold text-fg">{boardName}</h1>

            <div className="flex shrink-0 items-center gap-1">
              {hoursLeft !== null && (
                <span
                  className={
                    hoursLeft <= EXPIRY_WARNING_HOURS ? 'inline-flex' : 'hidden md:inline-flex'
                  }
                >
                  <BoardExpirationTimer hoursLeft={hoursLeft} />
                </span>
              )}
              {boardId && !readOnly && (
                <>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/boards">
                      <LibraryBig />
                      Boards
                    </Link>
                  </Button>
                  <ShareLink boardId={boardId} />
                  <IconButton
                    label="Open terminal"
                    size="sm"
                    icon={<TerminalIcon />}
                    onClick={() => setOpenModal('terminal')}
                  />
                  <Button variant="primary" size="sm" onClick={() => setOpenModal('create')}>
                    <Plus />
                    Create
                  </Button>
                  <BoardMenu
                    onAppearance={() => setOpenModal('appearance')}
                    onRename={() => setOpenModal('rename')}
                    onDuplicate={() => setOpenModal('duplicate')}
                    onSetPassword={() => setOpenModal('password')}
                    onLifespan={() => setOpenModal('lifespan')}
                    onExportJson={() => exportBoard(exportBoardAsJson)}
                    onExportCsv={() => exportBoard(exportBoardAsCsv)}
                    onDelete={() => setOpenModal('delete')}
                  />
                </>
              )}
            </div>
          </>
        )}
      </header>

      {showsBoard && hoursLeft !== null && hoursLeft < 24 && (
        <div
          role="status"
          className="flex flex-wrap items-center gap-2 border-b border-danger bg-danger-soft px-3 py-2"
        >
          <TriangleAlert aria-hidden className="size-4 shrink-0 text-danger" />
          <p className="min-w-0 flex-1 text-sm text-danger">
            {expiryWarningText(hoursLeft)} It cannot be renewed, so export it now or duplicate it
            into a fresh board.
          </p>
          <Button size="sm" onClick={() => exportBoard(exportBoardAsJson)}>
            Export JSON
          </Button>
        </div>
      )}

      <ThemePicker open={openModal === 'appearance'} onClose={closeModal} />

      {boardId && !readOnly && (
        <>
          <CreateModal
            isOpen={openModal === 'create'}
            onClose={closeModal}
            columns={columns}
            onCreateCard={handleCreateCard}
            onCreateColumn={handleCreateColumn}
            onCreateCards={handleCreateCards}
          />

          <TerminalInterface
            isOpen={openModal === 'terminal'}
            onClose={closeModal}
            onCommand={(command) =>
              runBoardCommand(command, {
                boardId,
                columns,
                cards,
                backlogColumnId,
                setBoardCards,
                setBacklogCards,
              })
            }
            availableCards={cardTitles}
            availableColumns={columns}
          />

          <RenameBoardModal
            open={openModal === 'rename'}
            onClose={closeModal}
            boardId={boardId}
            boardName={boardName}
            onRenamed={onRenamed}
          />

          <DuplicateBoardModal
            open={openModal === 'duplicate'}
            onClose={closeModal}
            boardId={boardId}
            boardName={boardName}
          />

          <SetPasswordModal
            open={openModal === 'password'}
            onClose={closeModal}
            boardId={boardId}
          />

          <BoardLifespanModal
            open={openModal === 'lifespan'}
            onClose={closeModal}
            expiresAt={expiresAt ?? null}
          />

          <DeleteBoardModal open={openModal === 'delete'} onClose={closeModal} boardId={boardId} />
        </>
      )}
    </>
  )
}
