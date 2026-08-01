'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { LibraryBig, Plus, Terminal as TerminalIcon } from 'lucide-react'
import { Button, IconButton } from '@/components/ui'
import { BoardExpirationTimer } from '@/components/board-expiration-timer'
import { CreateModal } from '@/components/create-modal'
import ShareLink from '@/components/share-link'
import { TerminalInterface } from '@/components/terminal-interface'
import { BoardMenu } from '@/components/navbar/board-menu'
import {
  DeleteBoardModal,
  RenameBoardModal,
  SetPasswordModal,
} from '@/components/navbar/board-modals'
import { ThemePicker } from '@/components/theme-picker'
import { exportBoardAsCsv, exportBoardAsJson } from '@/components/navbar/board-export'
import { runBoardCommand } from '@/components/navbar/board-commands'
import { useBoardExpiration } from '@/hooks/use-board-expiration'
import { createClient } from '@/lib/supabase/client'
import { ensureBoardPassword } from '@/lib/board-writes'
import { Card, Column } from '@/types'

interface NavbarProps {
  boardId?: string
  setBoardCards?: React.Dispatch<React.SetStateAction<Card[]>>
  setBacklogCards?: React.Dispatch<React.SetStateAction<Card[]>>
  backlogColumnId?: string | null
  columns: Column[]
  setColumns: React.Dispatch<React.SetStateAction<Column[]>>
  onError: (message: string) => void
}

type Modal = 'create' | 'terminal' | 'rename' | 'password' | 'delete' | 'appearance' | null

export default function Navbar({
  boardId,
  setBoardCards,
  setBacklogCards,
  backlogColumnId,
  columns,
  setColumns,
  onError,
}: NavbarProps) {
  const [openModal, setOpenModal] = useState<Modal>(null)
  const [boardName, setBoardName] = useState('')
  const [cardTitles, setCardTitles] = useState<{ title: string }[]>([])
  const expiresAt = useBoardExpiration(boardId)
  const supabase = useMemo(createClient, [])

  useEffect(() => {
    if (!boardId) return
    let cancelled = false

    supabase
      .from('boards')
      .select('name')
      .eq('id', boardId)
      .single()
      .then(({ data }) => !cancelled && data && setBoardName(data.name))

    return () => {
      cancelled = true
    }
  }, [boardId, supabase])

  useEffect(() => {
    if (!boardId || openModal !== 'terminal') return
    let cancelled = false

    supabase
      .from('cards')
      .select('title, columns!inner(board_id)')
      .eq('columns.board_id', boardId)
      .order('title')
      .then(
        ({ data }) => !cancelled && data && setCardTitles(data.map(({ title }) => ({ title })))
      )

    return () => {
      cancelled = true
    }
  }, [boardId, openModal, supabase])

  const handleCreateCard = async (
    columnId: string,
    cardData: { title: string; description: string; color: string | null; due_date: string | null }
  ) => {
    if (!boardId) return
    await ensureBoardPassword(supabase, boardId)

    const { count } = await supabase
      .from('cards')
      .select('id', { count: 'exact', head: true })
      .eq('column_id', columnId)

    const { data: newCard, error } = await supabase
      .from('cards')
      .insert({ column_id: columnId, ...cardData, position: count ?? 0 })
      .select('*')
      .single()

    if (error || !newCard) {
      console.error('Error creating card:', error)
      onError('Could not create that card.')
      return
    }

    const setCards = columnId === backlogColumnId ? setBacklogCards : setBoardCards
    setCards?.((prev) => [...prev, newCard])
  }

  const handleCreateColumn = async (name: string) => {
    if (!boardId) return
    await ensureBoardPassword(supabase, boardId)

    const position = columns.filter((column) => column.position >= 0).length
    const { data: newColumn, error } = await supabase
      .from('columns')
      .insert({ name, board_id: boardId, position })
      .select('*')
      .single()

    if (error || !newColumn) {
      console.error('Error creating column:', error)
      onError('Could not create that column.')
      return
    }

    setColumns((prev) => [...prev, newColumn])
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

        {boardId && (
          <>
            <span aria-hidden className="text-subtle">
              /
            </span>
            <h1 className="min-w-0 flex-1 truncate text-sm font-semibold text-fg">{boardName}</h1>

            <div className="flex shrink-0 items-center gap-1">
              {expiresAt && (
                <span className="hidden md:inline-flex">
                  <BoardExpirationTimer expiresAt={expiresAt} />
                </span>
              )}
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
                onSetPassword={() => setOpenModal('password')}
                onExportJson={() => exportBoardAsJson(boardId)}
                onExportCsv={() => exportBoardAsCsv(boardId)}
                onDelete={() => setOpenModal('delete')}
              />
            </div>
          </>
        )}
      </header>

      <ThemePicker open={openModal === 'appearance'} onClose={closeModal} />

      {boardId && (
        <>
          <CreateModal
            isOpen={openModal === 'create'}
            onClose={closeModal}
            columns={columns}
            onCreateCard={handleCreateCard}
            onCreateColumn={handleCreateColumn}
          />

          <TerminalInterface
            isOpen={openModal === 'terminal'}
            onClose={closeModal}
            onCommand={(command) =>
              runBoardCommand(command, {
                columns,
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
            onRenamed={setBoardName}
          />

          <SetPasswordModal
            open={openModal === 'password'}
            onClose={closeModal}
            boardId={boardId}
          />

          <DeleteBoardModal open={openModal === 'delete'} onClose={closeModal} boardId={boardId} />
        </>
      )}
    </>
  )
}
