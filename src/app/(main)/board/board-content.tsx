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
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { Plus, X } from 'lucide-react'
import { Backlog, CalendarView, KanbanBoard, Navbar, TimelineView, ViewSwitcher } from '@/components'
import BoardBrief from '@/components/board-brief'
import CardEditor from '@/components/card-editor'
import ColumnEditor from '@/components/column-editor'
import { CardPreview } from '@/components/sortable-card'
import { PasswordProtection } from '@/components/password-protection'
import { Button, IconButton, Input, Modal, ModalFooter, Skeleton } from '@/components/ui'
import {
  boardCollisionDetection,
  cardsIn,
  columnOf,
  dropIndex,
  moveCard,
  numbered,
  touchedColumns,
} from '@/components/board/dnd'
import { createClient } from '@/lib/supabase/client'
import { rememberBoard } from '@/lib/board-library'
import { ensureBoardPassword, recordCardHistory } from '@/lib/board-writes'
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

const BACKLOG_NAME = 'Backlog'

const lowestIdBacklog = (columns: Column[]) =>
  columns
    .filter((column) => column.name === BACKLOG_NAME)
    .sort((a, b) => a.id.localeCompare(b.id))[0] ?? null

const fetchBoard = async (supabase: SupabaseClient, boardId: string) => {
  const { data: meta } = await supabase
    .from('boards')
    .select('id, name, expires_at')
    .eq('id', boardId)
    .single()
  if (!meta) return null

  const readColumns = async () => {
    const { data } = await supabase.from('columns').select('*').eq('board_id', boardId).order('position')
    return (data ?? []) as Column[]
  }

  let loaded = await readColumns()
  if (!lowestIdBacklog(loaded)) {
    await supabase.from('columns').insert({ board_id: boardId, name: BACKLOG_NAME, position: -1 })
    loaded = await readColumns()
  }

  const backlog = lowestIdBacklog(loaded)
  const { data: cardRows } = await supabase
    .from('cards')
    .select('*')
    .in('column_id', loaded.map((column) => column.id))
    .order('position')

  return {
    meta: meta as { id: string; name: string; expires_at: string },
    backlog,
    columns: loaded.filter((column) => column.name !== BACKLOG_NAME),
    cards: (cardRows ?? []) as Card[],
  }
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
  const router = useRouter()
  const searchParams = useSearchParams()
  const boardId = searchParams.get('id')
  const supabase = useMemo(() => createClient(), [])
  const { trackEvent } = useAnalytics()
  const { isAuthenticated, isLoading: isAuthLoading } = useBoardAuth(boardId)

  const [currentView, setCurrentView] = useState<'kanban' | 'calendar' | 'timeline'>('kanban')
  const [columns, setColumns] = useState<Column[]>([])
  const [cards, setCards] = useState<Card[]>([])
  const [backlogColumn, setBacklogColumn] = useState<Column | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [boardNotFound, setBoardNotFound] = useState(false)
  const [newBoardName, setNewBoardName] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [activeCardId, setActiveCardId] = useState<string | null>(null)
  const [cardEditor, setCardEditor] = useState<{ columnId: string; card?: Card } | null>(null)
  const [deletingCard, setDeletingCard] = useState<Card | null>(null)
  const [columnEditor, setColumnEditor] = useState<{ column?: Column } | null>(null)
  const [deletingColumn, setDeletingColumn] = useState<Column | null>(null)

  const dragOrigin = useRef<{ cards: Card[]; columnId: string } | null>(null)
  const writeQueue = useRef<Promise<void>>(Promise.resolve())

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
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

  const nameOfColumn = (columnId: string) =>
    allColumns.find((column) => column.id === columnId)?.name ?? 'Unknown'

  useEffect(() => {
    if (!boardId) return
    let cancelled = false

    setIsLoading(true)
    setBoardNotFound(false)

    const loadBoard = async () => {
      await ensureBoardPassword(supabase, boardId)
      const board = await fetchBoard(supabase, boardId)
      if (cancelled) return

      if (!board) {
        setBoardNotFound(true)
        setIsLoading(false)
        return
      }

      setBacklogColumn(board.backlog)
      setColumns(board.columns)
      setCards(board.cards)
      setIsLoading(false)

      rememberBoard({
        id: boardId,
        name: board.meta.name,
        expiresAt: board.meta.expires_at,
        columns: board.backlog ? [board.backlog, ...board.columns] : board.columns,
        cards: board.cards,
      })
    }

    loadBoard()
    return () => {
      cancelled = true
    }
  }, [boardId, supabase])

  const reloadCards = async () => {
    if (!boardId) return
    const board = await fetchBoard(supabase, boardId)
    if (board) setCards(board.cards)
  }

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
      const rows = touchedColumns(next, previous).flatMap((columnId) =>
        cardsIn(next, columnId).map((card) => ({
          id: card.id,
          column_id: card.column_id,
          title: card.title,
          position: card.position,
        }))
      )
      if (rows.length === 0) return

      const { error } = await supabase.from('cards').upsert(rows, { onConflict: 'id' })
      if (error) {
        setErrorMessage('Could not save that change. The board has been reloaded.')
        await reloadCards()
      }
    })

  const commitCardMove = async (
    next: Card[],
    previous: Card[],
    cardId: string,
    fromColumnId: string,
    toColumnId: string
  ) => {
    await persistCards(next, previous)
    if (fromColumnId !== toColumnId) {
      await recordCardHistory(supabase, cardId, nameOfColumn(fromColumnId), nameOfColumn(toColumnId))
    }
  }

  const handleDragStart = ({ active }: DragStartEvent) => {
    if (active.data.current?.type !== 'card') return

    const card = cards.find((item) => item.id === active.id)
    if (!card) return

    setActiveCardId(card.id)
    dragOrigin.current = { cards, columnId: card.column_id }
  }

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over || active.data.current?.type !== 'card') return

    setCards((current) => {
      const from = columnOf(current, String(active.id), columnIds)
      const to = columnOf(current, String(over.id), columnIds)
      // Same-column gaps are opened by the sortable strategy; re-splicing here would loop forever.
      if (!from || !to || from === to) return current
      return moveCard(current, String(active.id), to, dropIndex(current, to, active, over))
    })
  }

  const handleDragCancel = () => {
    setActiveCardId(null)
    if (dragOrigin.current) setCards(dragOrigin.current.cards)
    dragOrigin.current = null
  }

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
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
      dropIndex(cards, toColumnId, active, over)
    )
    setCards(next)
    await commitCardMove(next, origin.cards, String(active.id), origin.columnId, toColumnId)
  }

  const saveColumnOrder = (next: Column[]) =>
    supabase.from('columns').upsert(
      next.map(({ id, board_id, name, position }) => ({ id, board_id, name, position })),
      { onConflict: 'id' }
    )

  const reorderColumns = async (activeId: string, overId: string) => {
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

    const { error } = await saveColumnOrder(next)
    if (error) {
      setErrorMessage('Could not save the column order.')
      setColumns(previous)
    }
  }

  const moveCardToColumn = async (card: Card, toColumnId: string) => {
    const previous = cards
    const next = moveCard(previous, card.id, toColumnId, cardsIn(previous, toColumnId).length)
    setCards(next)
    await commitCardMove(next, previous, card.id, card.column_id, toColumnId)
  }

  const saveCard = async (data: CardFormData) => {
    const editor = cardEditor
    if (!editor) return

    setCardEditor(null)
    if (boardId) await ensureBoardPassword(supabase, boardId)

    const fields = {
      title: data.title,
      description: data.description || null,
      color: data.color,
      due_date: data.due_date,
    }

    if (editor.card) {
      const previous = cards
      setCards(previous.map((card) => (card.id === editor.card!.id ? { ...card, ...fields } : card)))

      const { error } = await supabase.from('cards').update(fields).eq('id', editor.card.id)
      if (error) {
        setErrorMessage('Could not update that card.')
        setCards(previous)
      }
      return
    }

    const { data: created, error } = await supabase
      .from('cards')
      .insert({
        ...fields,
        column_id: editor.columnId,
        position: cardsIn(cards, editor.columnId).length,
      })
      .select()
      .single()

    if (error || !created) {
      setErrorMessage('Could not create that card.')
      return
    }

    setCards((current) => [...current, created])
    trackEvent('create_card', { card_id: created.id, column_id: editor.columnId })
  }

  const deleteCard = async (card: Card) => {
    setDeletingCard(null)
    const previous = cards
    const remaining = previous.filter((item) => item.id !== card.id)
    const next = [
      ...remaining.filter((item) => item.column_id !== card.column_id),
      ...numbered(cardsIn(remaining, card.column_id)),
    ]
    setCards(next)

    const { error } = await supabase.from('cards').delete().eq('id', card.id)
    if (error) {
      setErrorMessage('Could not delete that card.')
      setCards(previous)
      return
    }

    await persistCards(next, previous)
  }

  const saveColumn = async (name: string) => {
    const editor = columnEditor
    if (!editor || !boardId) return
    setColumnEditor(null)

    if (editor.column) {
      const previous = columns
      setColumns(previous.map((column) => (column.id === editor.column!.id ? { ...column, name } : column)))

      const { error } = await supabase.from('columns').update({ name }).eq('id', editor.column.id)
      if (error) {
        setErrorMessage('Could not rename that column.')
        setColumns(previous)
      }
      return
    }

    const { data: created, error } = await supabase
      .from('columns')
      .insert({ board_id: boardId, name, position: columns.length })
      .select()
      .single()

    if (error || !created) {
      setErrorMessage('Could not create that column.')
      return
    }

    setColumns((current) => [...current, created])
  }

  const deleteColumn = async (column: Column) => {
    setDeletingColumn(null)
    const previousColumns = columns
    const previousCards = cards
    const nextColumns = previousColumns
      .filter((item) => item.id !== column.id)
      .map((item, position) => ({ ...item, position }))
    setColumns(nextColumns)
    setCards(previousCards.filter((card) => card.column_id !== column.id))

    const response = await fetch(`/api/columns/${column.id}`, { method: 'DELETE' })
    if (!response.ok) {
      setErrorMessage('Could not delete that column.')
      setColumns(previousColumns)
      setCards(previousCards)
      return
    }

    const { error } = await saveColumnOrder(nextColumns)
    if (error) setErrorMessage('Could not renumber the remaining columns.')
  }

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault()

    const { data: board, error } = await supabase
      .from('boards')
      .insert({ name: newBoardName })
      .select()
      .single()

    if (error || !board) {
      setErrorMessage('Could not create the board.')
      return
    }

    await supabase.from('columns').insert({ board_id: board.id, name: BACKLOG_NAME, position: -1 })
    router.push(`/board?id=${board.id}`)
  }

  if (isAuthLoading) {
    return (
      <div className="flex h-full flex-col overflow-hidden bg-canvas">
        <BoardSkeleton />
      </div>
    )
  }

  if (boardId && !isAuthenticated) {
    return <PasswordProtection boardId={boardId} onSuccess={() => window.location.reload()} />
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
  const cardActions = {
    moveTargets,
    onEditCard: (card: Card) => setCardEditor({ columnId: card.column_id, card }),
    onDeleteCard: setDeletingCard,
    onMoveCard: moveCardToColumn,
    onAddCard: (columnId: string) => setCardEditor({ columnId }),
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-canvas">
      <Navbar
        boardId={boardId}
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
          sensors={sensors}
          collisionDetection={boardCollisionDetection}
          measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto px-3 pb-3 scrollbar-thin">
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
          </div>

          <DragOverlay>{activeCard && <CardPreview card={activeCard} />}</DragOverlay>
        </DndContext>
      )}

      {!isLoading && currentView === 'calendar' && (
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 scrollbar-thin">
          <CalendarView boardId={boardId} />
        </div>
      )}

      {!isLoading && currentView === 'timeline' && (
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 scrollbar-thin">
          <TimelineView boardId={boardId} />
        </div>
      )}

      {cardEditor && (
        <CardEditor
          isOpen
          onClose={() => setCardEditor(null)}
          onSave={saveCard}
          isEditing={!!cardEditor.card}
          boardId={boardId}
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
