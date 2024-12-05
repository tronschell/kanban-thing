'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { KanbanBoard, CalendarView, ViewSwitcher, Backlog, TimelineView, UserOnboarding, Navbar } from '@/components'
import { createClient } from '@/lib/supabase/client'
import { Plus } from 'lucide-react'
import { DndContext, DragOverlay, useSensors, useSensor, PointerSensor, closestCorners } from '@dnd-kit/core'
import type { Card } from '@/types'

export default function BoardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const boardId = searchParams.get('id')
  const [currentView, setCurrentView] = useState<'kanban' | 'calendar' | 'timeline'>('kanban')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeType, setActiveType] = useState<'column' | 'card' | null>(null)
  const [draggedCard, setDraggedCard] = useState<Card | null>(null)
  const [isCreatingBoard, setIsCreatingBoard] = useState(false)
  const [newBoardName, setNewBoardName] = useState('')
  const [backlogCards, setBacklogCards] = useState<Card[]>([])
  const [boardCards, setBoardCards] = useState<Card[]>([])
  const [columns, setColumns] = useState<Array<{ id: string; name: string }>>([])
  const supabase = createClient()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBoardName.trim()) return

    try {
      const { data: board, error: boardError } = await supabase
        .from('boards')
        .insert({
          name: newBoardName.trim()
        })
        .select()
        .single()

      if (boardError) throw boardError

      if (board) {
        await supabase
          .from('columns')
          .insert([
            { board_id: board.id, name: 'To Do', position: 0 },
            { board_id: board.id, name: 'In Progress', position: 1 },
            { board_id: board.id, name: 'Done', position: 2 }
          ])

        router.push(`/board?id=${board.id}`)
      }
    } catch (error) {
      console.error('Error creating board:', error)
    }
  }

  const handleDragStart = ({ active }: any) => {
    setActiveId(active.id)
    setActiveType(active.data.current?.type)
    setDraggedCard(active.data.current?.card || null)
  }

  const handleDragEnd = async ({ active, over }: any) => {
    if (!over) return

    const activeCard = active.data.current?.card
    if (!activeCard) return

    // Get target column ID from the over object
    const targetColumnId = over.data.current?.column?.id

    if (!targetColumnId) {
      console.error('No valid column target found')
      return
    }

    try {
      // First verify the column exists and belongs to this board
      const { data: targetColumn, error: columnError } = await supabase
        .from('columns')
        .select('*')
        .eq('id', targetColumnId)
        .eq('board_id', boardId)
        .single()

      if (columnError || !targetColumn) {
        console.error('Target column not found:', { columnError, targetColumnId })
        return
      }

      // Get highest position in target column
      const { data: columnCards, error: positionError } = await supabase
        .from('cards')
        .select('position')
        .eq('column_id', targetColumnId)
        .order('position', { ascending: false })
        .limit(1)

      if (positionError) {
        console.error('Error getting positions:', positionError)
        return
      }

      const newPosition = ((columnCards && columnCards[0]?.position) ?? -1) + 1

      // Update card in database
      const { error: updateError } = await supabase
        .from('cards')
        .update({
          column_id: targetColumnId,
          position: newPosition
        })
        .eq('id', activeCard.id)

      if (updateError) {
        console.error('Error updating card:', updateError)
        return
      }

      // Update local states
      setBacklogCards(prevCards => prevCards.filter(c => c.id !== activeCard.id))
      setBoardCards(prevCards => [...prevCards, { 
        ...activeCard, 
        column_id: targetColumnId,
        position: newPosition 
      }])

      setActiveId(null)
      setActiveType(null)
      setDraggedCard(null)
    } catch (error) {
      console.error('Error moving card:', error)
    }
  }

  if (!boardId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200/50 dark:border-gray-700/50">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Create a New Board
            </h1>
            <form onSubmit={handleCreateBoard} className="space-y-4">
              <div>
                <label 
                  htmlFor="boardName" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Board Name
                </label>
                <input
                  id="boardName"
                  type="text"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  placeholder="Enter board name"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Board
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar boardId={boardId} />
      <div className="flex-1 px-4 md:px-8 pt-4">
        <UserOnboarding />
        <ViewSwitcher 
          currentView={currentView} 
          onViewChange={setCurrentView}
          boardId={boardId}
        />
        
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {currentView === 'kanban' && (
            <div className="flex flex-col gap-8">
              <KanbanBoard 
                boardId={boardId} 
                cards={boardCards}
                setCards={setBoardCards}
                activeId={activeId}
                activeType={activeType}
                setActiveId={setActiveId}
                setActiveType={setActiveType}
              />
              <Backlog 
                boardId={boardId}
                cards={backlogCards}
                setCards={setBacklogCards}
                columns={columns}
                onMoveCard={handleDragEnd}
                activeId={activeId}
              />
            </div>
          )}

          {currentView === 'calendar' && (
            <CalendarView boardId={boardId} />
          )}

          {currentView === 'timeline' && (
            <TimelineView boardId={boardId} />
          )}

          <DragOverlay>
            {activeId && activeType === 'card' && draggedCard && (
              <div className="w-80">
                <div className="bg-white dark:bg-gray-700/50 p-4 rounded-lg shadow-lg border border-gray-100 dark:border-gray-600/50 rotate-[-2deg]">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    {draggedCard.title}
                  </h4>
                  {draggedCard.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {draggedCard.description}
                    </p>
                  )}
                  {draggedCard.color && (
                    <div
                      className="mt-2 w-full h-1 rounded-full"
                      style={{ backgroundColor: draggedCard.color }}
                    />
                  )}
                </div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}