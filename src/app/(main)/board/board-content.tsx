'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { Plus, X } from 'lucide-react'
import {
  Backlog,
  CalendarView,
  KanbanBoard,
  Navbar,
  PulseView,
  TimelineView,
  ViewSwitcher,
} from '@/components'
import BoardBrief from '@/components/board-brief'
import CardDetail from '@/components/card-detail'
import CardEditor from '@/components/card-editor'
import ColumnEditor from '@/components/column-editor'
import { CardPreview } from '@/components/sortable-card'
import { HorizontalScrollArea } from '@/components/horizontal-scroll-area'
import { PasswordProtection } from '@/components/password-protection'
import ReadOnlyBoard from '@/components/read-only-board'
import { Button, IconButton, Input, Modal, ModalFooter, Skeleton } from '@/components/ui'
import {
  boardScreenReaderInstructions,
  createBoardAnnouncements,
  deletedCardAnnouncement,
  focusTargetForDeletedCard,
  restoreFocusAfterDeletion,
  type DeletionFocusTarget,
} from '@/components/board/accessibility'
import {
  boardKeyboardCoordinates,
  boardCollisionDetection,
  cardsIn,
  columnOf,
  dropIndex,
  moveCard,
  numbered,
  touchedColumns,
} from '@/components/board/dnd'
import { createClient } from '@/lib/supabase/client'
import { BACKLOG_NAME, splitBacklog } from '@/lib/backlog'
import { boardRoute } from '@/lib/board-route'
import { rememberBoard } from '@/lib/board-library'
import { DEFAULT_LIFESPAN_DAYS } from '@/lib/board-lifespan'
import {
  cardRow,
  columnRow,
  createBoard,
  readBoard,
  saveCards,
  saveColumns,
  writeMessage,
  type WriteResult,
} from '@/lib/board-writes'
import { useAnalytics } from '@/hooks/use-analytics'
import { useBoardAuth } from '@/hooks/use-board-auth'
import type { Card, Column } from '@/types'

type SupabaseClient = ReturnType<typeof createClient>

interface CardFormData {
  title: string
  description: string
  color: string | null
  due_date: string | null
}

const fetchBoard = async (supabase: SupabaseClient, boardId: string) => {
  const payload = await readBoard(supabase, boardId)
  if (payload.status !== 'ok') return payload.status

  const { backlog, columns } = splitBacklog(payload.columns)
  return { board: payload.board, backlog, columns, cards: payload.cards }
}

function BoardSkeleton() {
  return (
    <div className="flex flex-1 gap-3 px-3 pb-3">
      {[0, 1, 2].map((column) => (
        <div key={column} className="w-column shrink-0 rounded-panel border border-subtle bg-surface p-2">
          <Skeleton className="mb-2 h-5 w-24" />
          <div className="flex flex-col gap-2">
            {[0, 1, 2, 3].map((card) => (
              <Skeleton key={card} className="h-12 w-full rounded-card" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div
      role="alert"
      className="flex items-center gap-2 rounded-panel border border-danger bg-danger-soft px-3 py-2 text-sm text-danger"
    >
      <span className="min-w-0 flex-1">{message}</span>
      <IconButton label="Dismiss error" size="sm" icon={<X />} onClick={onDismiss} />
    </div>
  )
}

export default function BoardContent() {
  const route = boardRoute(useSearchParams())

  if (route.kind === 'read-only') {
    return <ReadOnlyBoard viewToken={route.viewToken} />
  }

  return <EditableBoard />
}

function EditableBoard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const boardId = searchParams.get('id')
  const supabase = useMemo(() => createClient(), [])
  const { trackEvent } = useAnalytics()
  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    checkFailed,
    requiresPassword,
    unlock,
    lock,
    setPasswordRequired,
  } = useBoardAuth(boardId)

  const [currentView, setCurrentView] = useState<'kanban' | 'calendar' | 'timeline' | 'pulse'>(
    'kanban'
  )
  const [columns, setColumns] = useState<Column[]>([])
  const [cards, setCards] = useState<Card[]>([])
  const [backlogColumn, setBacklogColumn] = useState<Column | null>(null)
  const [boardName, setBoardName] = useState('')
  const [expiresAt, setExpiresAt] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [boardNotFound, setBoardNotFound] = useState(false)
  const [newBoardName, setNewBoardName] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [activeCardId, setActiveCardId] = useState<string | null>(null)
  const [detailCardId, setDetailCardId] = useState<string | null>(null)
  const [cardEditor, setCardEditor] = useState<{ columnId: string; card?: Card } | null>(null)
  const [deletingCard, setDeletingCard] = useState<Card | null>(null)
  const [columnEditor, setColumnEditor] = useState<{ column?: Column } | null>(null)
  const [deletingColumn, setDeletingColumn] = useState<Column | null>(null)
  const [liveMessage, setLiveMessage] = useState('')
  const [dndContextKey, setDndContextKey] = useState(0)

  const dragOrigin = useRef<{ cards: Card[]; columnId: string } | null>(null)
  const writeQueue = useRef<Promise<void>>(Promise.resolve())
  const pendingFocusAfterDelete = useRef<DeletionFocusTarget | null>(null)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: boardKeyboardCoordinates })
  )

  const allColumns = useMemo(
    () => (backlogColumn ? [backlogColumn, ...columns] : columns),
    [backlogColumn, columns]
  )

  const columnIds = useMemo(() => allColumns.map((column) => column.id), [allColumns])

  const moveTargets = useMemo(
    () => allColumns.map((column) => ({ id: column.id, name: column.name })),
    [allColumns]
  )

  const dndAnnouncements = useMemo(
    () => createBoardAnnouncements({ cards, columns: allColumns }),
    [allColumns, cards]
  )

  const nameOfColumn = (columnId: string) =>
    allColumns.find((column) => column.id === columnId)?.name ?? 'Unknown'

  const handleWriteResult = (result: WriteResult, message: string) => {
    if (result === 'not_found') return setBoardNotFound(true)
    setErrorMessage(writeMessage(result, message))
    if (result === 'wrong_password') lock()
  }

  useEffect(() => {
    if (!boardId || !isAuthenticated) return
    let cancelled = false

    setIsLoading(true)
    setBoardNotFound(false)

    const loadBoard = async () => {
      const board = await fetchBoard(supabase, boardId).catch((error) => {
        console.error('Board load failed:', error)
        return null
      })
      if (cancelled) return

      if (board === null) {
        setErrorMessage('Could not load this board.')
        setIsLoading(false)
        return
      }

      if (typeof board === 'string') {
        if (board === 'not_found') setBoardNotFound(true)
        else lock()
        setIsLoading(false)
        return
      }

      setBoardName(board.board.name)
      setExpiresAt(board.board.expires_at)
      setBacklogColumn(board.backlog)
      setColumns(board.columns)
      setCards(board.cards)
      setIsLoading(false)

      rememberBoard({
        id: boardId,
        name: board.board.name,
        expiresAt: board.board.expires_at,
        columns: board.backlog ? [board.backlog, ...board.columns] : board.columns,
        cards: board.cards,
      })

      if (board.backlog) return

      const repaired: Column = {
        id: crypto.randomUUID(),
        board_id: boardId,
        name: BACKLOG_NAME,
        position: -1,
        created_at: new Date().toISOString(),
      }
      const result = await saveColumns(supabase, boardId, [columnRow(repaired)])
      if (!cancelled && result === 'ok') setBacklogColumn(repaired)
    }

    loadBoard()
    return () => {
      cancelled = true
    }
  }, [boardId, supabase, isAuthenticated, lock])

  useEffect(() => {
    const target = pendingFocusAfterDelete.current
    if (!target) return
    if (restoreFocusAfterDeletion(target)) {
      pendingFocusAfterDelete.current = null
    }
  }, [cards])

  const enqueueWrite = (work: () => Promise<void>) => {
    const next = writeQueue.current.then(work).catch((error) => {
      console.error('Board write failed:', error)
      setErrorMessage('Could not save that change.')
    })
    writeQueue.current = next
    return next
  }

  const persistCards = (next: Card[], previous: Card[]) =>
    enqueueWrite(async () => {
      if (!boardId) return
      const rows = touchedColumns(next, previous).flatMap((columnId) =>
        cardsIn(next, columnId).map(cardRow)
      )
      if (rows.length === 0) return

      const result = await saveCards(supabase, boardId, rows)
      if (result !== 'ok') {
        setCards(previous)
        handleWriteResult(result, 'Could not save that change.')
      }
    })

  const handleDragStart = ({ active }: DragStartEvent) => {
    if (active.data.current?.type !== 'card') return

    const card = cards.find((item) => item.id === active.id)
    if (!card) return

    setActiveCardId(card.id)
    dragOrigin.current = { cards, columnId: card.column_id }
  }

  const handleDragOver = ({ active, over, activatorEvent }: DragOverEvent) => {
    if (!over || active.data.current?.type !== 'card') return

    setCards((current) => {
      const from = columnOf(current, String(active.id), columnIds)
      const to = columnOf(current, String(over.id), columnIds)
      // Same-column gaps are opened by the sortable strategy; re-splicing here would loop forever.
      if (!from || !to || from === to) return current
      return moveCard(
        current,
        String(active.id),
        to,
        dropIndex(current, to, active, over, activatorEvent)
      )
    })
  }

  const handleDragCancel = () => {
    setActiveCardId(null)
    if (dragOrigin.current) setCards(dragOrigin.current.cards)
    dragOrigin.current = null
  }

  const handleDragEnd = async ({ active, over, activatorEvent }: DragEndEvent) => {
    const origin = dragOrigin.current
    dragOrigin.current = null
    setActiveCardId(null)

    if (!over) {
      if (origin) setCards(origin.cards)
      return
    }

    if (active.data.current?.type === 'column') {
      await reorderColumns(String(active.id), String(over.id))
      return
    }

    if (!origin) return

    const toColumnId = columnOf(cards, String(over.id), columnIds)
    if (!toColumnId) {
      setCards(origin.cards)
      return
    }

    const next = moveCard(
      cards,
      String(active.id),
      toColumnId,
      dropIndex(cards, toColumnId, active, over, activatorEvent)
    )
    setCards(next)
    await persistCards(next, origin.cards)
  }

  const reorderColumns = async (activeId: string, overId: string) => {
    if (!boardId) return

    const fromIndex = columns.findIndex((column) => column.id === activeId)
    const toIndex = columns.findIndex(
      (column) => column.id === columnOf(cards, overId, columnIds)
    )
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return

    const previous = columns
    const next = arrayMove(columns, fromIndex, toIndex).map((column, position) => ({
      ...column,
      position,
    }))
    setColumns(next)

    const result = await saveColumns(supabase, boardId, next.map(columnRow))
    if (result !== 'ok') {
      setColumns(previous)
      handleWriteResult(result, 'Could not save the column order.')
    }
  }

  const moveCardToColumn = async (card: Card, toColumnId: string) => {
    const previous = cards
    const next = moveCard(previous, card.id, toColumnId, cardsIn(previous, toColumnId).length)
    setCards(next)
    await persistCards(next, previous)
  }

  const updateCardFields = async (cardId: string, fields: Partial<Card>) => {
    if (!boardId) return

    const previous = cards
    const next = previous.map((card) => (card.id === cardId ? { ...card, ...fields } : card))
    const updated = next.find((card) => card.id === cardId)
    if (!updated) return
    setCards(next)

    await enqueueWrite(async () => {
      const result = await saveCards(supabase, boardId, [cardRow(updated)])
      if (result !== 'ok') {
        setCards(previous)
        handleWriteResult(result, 'Could not update that card.')
      }
    })
  }

  const saveCard = async (data: CardFormData) => {
    const editor = cardEditor
    if (!editor || !boardId) return

    const fields = {
      title: data.title,
      description: data.description || null,
      color: data.color,
      due_date: data.due_date,
    }

    if (editor.card) {
      const cardId = editor.card.id
      setCardEditor(null)
      await updateCardFields(cardId, fields)
      return
    }

    setCardEditor(null)

    const created: Card = {
      ...fields,
      id: crypto.randomUUID(),
      column_id: editor.columnId,
      position: cardsIn(cards, editor.columnId).length,
      created_at: new Date().toISOString(),
    }
    setCards((current) => [...current, created])

    const result = await saveCards(supabase, boardId, [cardRow(created)])
    if (result !== 'ok') {
      setCards((current) => current.filter((card) => card.id !== created.id))
      handleWriteResult(result, 'Could not create that card.')
      return
    }

    trackEvent('create_card', { card_id: created.id, column_id: editor.columnId })
  }

  const saveCardDescription = (card: Card, description: string) =>
    updateCardFields(card.id, { description })

  const deleteCard = async (card: Card) => {
    setDeletingCard(null)
    if (!boardId) return

    const previous = cards
    pendingFocusAfterDelete.current = focusTargetForDeletedCard(previous, card)
    setDndContextKey((key) => key + 1)
    const remaining = previous.filter((item) => item.id !== card.id)
    const renumbered = numbered(cardsIn(remaining, card.column_id))
    const next = [...remaining.filter((item) => item.column_id !== card.column_id), ...renumbered]
    setCards(next)

    await enqueueWrite(async () => {
      const result = await saveCards(supabase, boardId, renumbered.map(cardRow), [card.id])
      if (result !== 'ok') {
        setCards(previous)
        setLiveMessage(`Could not delete card ${card.title}.`)
        handleWriteResult(result, 'Could not delete that card.')
        return
      }

      setLiveMessage(deletedCardAnnouncement(card.title))
    })
  }

  const saveColumn = async (name: string) => {
    const editor = columnEditor
    if (!editor || !boardId) return
    setColumnEditor(null)

    if (editor.column) {
      const previous = columns
      const renamed = { ...editor.column, name }
      setColumns(previous.map((column) => (column.id === renamed.id ? renamed : column)))

      const result = await saveColumns(supabase, boardId, [columnRow(renamed)])
      if (result !== 'ok') {
        setColumns(previous)
        handleWriteResult(result, 'Could not rename that column.')
      }
      return
    }

    const created: Column = {
      id: crypto.randomUUID(),
      board_id: boardId,
      name,
      position: columns.length,
      created_at: new Date().toISOString(),
    }
    setColumns((current) => [...current, created])

    const result = await saveColumns(supabase, boardId, [columnRow(created)])
    if (result !== 'ok') {
      setColumns((current) => current.filter((column) => column.id !== created.id))
      handleWriteResult(result, 'Could not create that column.')
    }
  }

  const deleteColumn = async (column: Column) => {
    setDeletingColumn(null)
    if (!boardId) return

    const previousColumns = columns
    const previousCards = cards
    const nextColumns = previousColumns
      .filter((item) => item.id !== column.id)
      .map((item, position) => ({ ...item, position }))
    setColumns(nextColumns)
    setCards(previousCards.filter((card) => card.column_id !== column.id))

    const result = await saveColumns(supabase, boardId, nextColumns.map(columnRow), [column.id])
    if (result !== 'ok') {
      setColumns(previousColumns)
      setCards(previousCards)
      handleWriteResult(result, 'Could not delete that column.')
    }
  }

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const newBoardId = await createBoard(supabase, newBoardName, '', [], DEFAULT_LIFESPAN_DAYS)
      router.push(`/board?id=${newBoardId}`)
    } catch (error) {
      console.error('Error creating board:', error)
      setErrorMessage('Could not create the board.')
    }
  }

  if (isAuthLoading) {
    return (
      <div className="flex h-full flex-col overflow-hidden bg-canvas">
        <BoardSkeleton />
      </div>
    )
  }

  if (boardId && !isAuthenticated) {
    const checkFailedNotice = checkFailed
      ? 'Could not check this board. Enter its password to try again.'
      : null
    return <PasswordProtection unlock={unlock} notice={errorMessage ?? checkFailedNotice} />
  }

  if (boardNotFound) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-canvas px-4 text-center">
        <h1 className="text-xl font-semibold text-fg">Board not found</h1>
        <p className="text-sm text-muted">This board may have expired or never existed.</p>
        <Button variant="primary" onClick={() => router.push('/')}>
          Go to home page
        </Button>
      </div>
    )
  }

  if (!boardId) {
    return (
      <div className="flex h-full items-center justify-center bg-canvas px-4">
        <form
          onSubmit={handleCreateBoard}
          className="w-full max-w-sm rounded-panel border border-subtle bg-surface-raised p-5"
        >
          <h1 className="mb-4 text-md font-semibold text-fg">Create a new board</h1>
          {errorMessage && (
            <div className="mb-3">
              <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />
            </div>
          )}
          <label htmlFor="board-name" className="block text-xs font-medium text-muted mb-1.5">
            Board name
          </label>
          <Input
            id="board-name"
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            placeholder="Board name"
            required
          />
          <div className="mt-4 flex justify-end">
            <Button type="submit" variant="primary" disabled={!newBoardName.trim()}>
              <Plus />
              Create board
            </Button>
          </div>
        </form>
      </div>
    )
  }

  const activeCard = cards.find((card) => card.id === activeCardId)
  const detailCard = cards.find((card) => card.id === detailCardId)
  const openCardEditor = (card: Card) => setCardEditor({ columnId: card.column_id, card })
  const cardActions = {
    moveTargets,
    onOpenCard: (card: Card) => setDetailCardId(card.id),
    onEditCard: openCardEditor,
    onDeleteCard: setDeletingCard,
    onMoveCard: moveCardToColumn,
    onAddCard: (columnId: string) => setCardEditor({ columnId }),
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-canvas">
      <p data-board-status role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {liveMessage}
      </p>
      <Navbar
        boardId={boardId}
        boardName={boardName}
        expiresAt={expiresAt}
        onRenamed={setBoardName}
        onPasswordChanged={setPasswordRequired}
        onLock={lock}
        canLock={requiresPassword === true}
        cards={cards}
        setBoardCards={setCards}
        setBacklogCards={setCards}
        backlogColumnId={backlogColumn?.id ?? null}
        columns={allColumns}
        setColumns={setColumns}
        onError={setErrorMessage}
      />

      <div className="px-3 py-2">
        <ViewSwitcher currentView={currentView} onViewChange={setCurrentView} boardId={boardId} />
      </div>

      <BoardBrief boardId={boardId} />

      {errorMessage && (
        <div className="px-3 pb-2">
          <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />
        </div>
      )}

      {isLoading && <BoardSkeleton />}

      {!isLoading && currentView === 'kanban' && (
        <DndContext
          key={dndContextKey}
          sensors={sensors}
          accessibility={{
            announcements: dndAnnouncements,
            screenReaderInstructions: boardScreenReaderInstructions,
          }}
          collisionDetection={boardCollisionDetection}
          measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <HorizontalScrollArea
            aria-label="Board columns"
            viewportClassName="flex h-full min-h-0 gap-3 px-3 pb-3"
          >
            {backlogColumn && (
              <Backlog
                columnId={backlogColumn.id}
                cards={cardsIn(cards, backlogColumn.id)}
                {...cardActions}
              />
            )}
            <KanbanBoard
              columns={columns}
              cards={cards}
              onAddColumn={() => setColumnEditor({})}
              onRenameColumn={(column) => setColumnEditor({ column })}
              onDeleteColumn={setDeletingColumn}
              {...cardActions}
            />
          </HorizontalScrollArea>

          <DragOverlay>{activeCard && <CardPreview card={activeCard} />}</DragOverlay>
        </DndContext>
      )}

      {!isLoading && currentView === 'calendar' && (
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 scrollbar-thin">
          <CalendarView
            cards={cards}
            columns={allColumns}
            onOpenCard={(card) => setCardEditor({ columnId: card.column_id, card })}
            onSetDueDate={(card, due_date) => updateCardFields(card.id, { due_date })}
          />
        </div>
      )}

      {!isLoading && currentView === 'timeline' && (
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 scrollbar-thin">
          <TimelineView boardId={boardId} />
        </div>
      )}

      {!isLoading && currentView === 'pulse' && (
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 scrollbar-thin">
          <PulseView boardId={boardId} />
        </div>
      )}

      {detailCard && (
        <CardDetail
          card={detailCard}
          columnName={nameOfColumn(detailCard.column_id)}
          onClose={() => setDetailCardId(null)}
          onEdit={(card) => {
            setDetailCardId(null)
            openCardEditor(card)
          }}
          onDelete={(card) => {
            setDetailCardId(null)
            setDeletingCard(card)
          }}
          onSaveDescription={saveCardDescription}
        />
      )}

      {cardEditor && (
        <CardEditor
          isOpen
          onClose={() => setCardEditor(null)}
          onSave={saveCard}
          isEditing={!!cardEditor.card}
          columnName={nameOfColumn(cardEditor.columnId)}
          initialData={
            cardEditor.card && {
              title: cardEditor.card.title,
              description: cardEditor.card.description ?? '',
              color: cardEditor.card.color,
              due_date: cardEditor.card.due_date,
            }
          }
        />
      )}

      <ColumnEditor
        isOpen={columnEditor !== null}
        initialName={columnEditor?.column?.name}
        onClose={() => setColumnEditor(null)}
        onSave={saveColumn}
      />

      <Modal
        open={deletingCard !== null}
        onClose={() => setDeletingCard(null)}
        title="Delete card"
        size="sm"
      >
        <p className="text-sm text-muted">
          {`"${deletingCard?.title}" will be removed from this board permanently.`}
        </p>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setDeletingCard(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => deletingCard && deleteCard(deletingCard)}>
            Delete card
          </Button>
        </ModalFooter>
      </Modal>

      <Modal
        open={deletingColumn !== null}
        onClose={() => setDeletingColumn(null)}
        title="Delete column"
        size="sm"
      >
        <p className="text-sm text-muted">
          {`"${deletingColumn?.name}" and every card inside it will be removed permanently.`}
        </p>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setDeletingColumn(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => deletingColumn && deleteColumn(deletingColumn)}>
            Delete column
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
