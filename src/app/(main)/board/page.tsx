'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { KanbanBoard, CalendarView, ViewSwitcher, Backlog, TimelineView, UserOnboarding, Navbar } from '@/components'
import { createClient } from '@/lib/supabase/client'
import { Plus } from 'lucide-react'
import { DndContext, DragOverlay, useSensors, useSensor, PointerSensor, closestCorners } from '@dnd-kit/core'

interface Card {
  id: string
  title: string
  description: string | null
  color: string | null
  due_date: string | null
  position: number
  column_id: string
  created_at: string
}

export default function BoardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const boardId = searchParams.get('id')
  const [isCreatingBoard, setIsCreatingBoard] = useState(false)
  const [newBoardName, setNewBoardName] = useState('')
  const [currentView, setCurrentView] = useState<'kanban' | 'calendar' | 'timeline'>('kanban')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeType, setActiveType] = useState<'column' | 'card' | null>(null)
  const supabase = createClient()
  const [draggedCard, setDraggedCard] = useState<Card | null>(null)
  const [backlogCards, setBacklogCards] = useState<Card[]>([])
  const [boardCards, setBoardCards] = useState<Card[]>([])
  const [columns, setColumns] = useState<Array<{ id: string; name: string }>>([])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  useEffect(() => {
    if (!boardId) return;

    const fetchColumns = async () => {
      const { data: columnsData, error } = await supabase
        .from('columns')
        .select('id, name')
        .eq('board_id', boardId)
        .neq('name', 'Backlog')  // Exclude the Backlog column
        .order('position');

      if (error) {
        console.error('Error fetching columns:', error);
        return;
      }

      if (columnsData) {
        setColumns(columnsData);
      }
    };

    fetchColumns();

    // Subscribe to column changes
    const channel = supabase
      .channel('column_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'columns',
          filter: `board_id=eq.${boardId}`
        },
        (payload) => {
          fetchColumns();  // Refetch columns on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [boardId]);

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBoardName.trim()) return

    try {
      // Create new board
      const { data: board, error: boardError } = await supabase
        .from('boards')
        .insert({
          name: newBoardName.trim()
        })
        .select()
        .single()

      if (boardError) throw boardError

      if (board) {
        // Create default columns
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
    if (!over) return;

    const activeCard = active.data.current?.card;
    if (!activeCard) return;

    // Get target column ID from the over object
    const targetColumnId = over.data.current?.column?.id;

    console.log('Drop attempt:', {
      cardId: activeCard.id,
      targetColumnId,
      overType: over.data.current?.type,
      overData: over.data.current,
      column: over.data.current?.column
    });

    if (!targetColumnId) {
      console.error('No valid column target found');
      return;
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
        console.error('Target column not found:', { columnError, targetColumnId });
        return;
      }

      // Get highest position in target column
      const { data: columnCards, error: positionError } = await supabase
        .from('cards')
        .select('position')
        .eq('column_id', targetColumnId)
        .order('position', { ascending: false })
        .limit(1)

      if (positionError) {
        console.error('Error getting positions:', positionError);
        return;
      }

      const newPosition = ((columnCards && columnCards[0]?.position) ?? -1) + 1;

      // Update card in database
      const { error: updateError } = await supabase
        .from('cards')
        .update({
          column_id: targetColumnId,
          position: newPosition
        })
        .eq('id', activeCard.id)

      if (updateError) {
        console.error('Error updating card:', updateError);
        return;
      }

      // Update local states
      setBacklogCards(prevCards => prevCards.filter(c => c.id !== activeCard.id));
      setBoardCards(prevCards => [...prevCards, { 
        ...activeCard, 
        column_id: targetColumnId,
        position: newPosition 
      }]);

      // Record history
      await supabase
        .from('card_history')
        .insert({
          card_id: activeCard.id,
          from_column: 'Backlog',
          to_column: targetColumn.name,
          timestamp: new Date().toISOString()
        });

    } catch (error) {
      console.error('Error moving card:', error);
    }

    setActiveId(null);
    setActiveType(null);
    setDraggedCard(null);
  }

  const handleMoveCard = async (cardId: string, columnId: string) => {
    try {
      // Get the source and target column names for history
      const { data: sourceColumn } = await supabase
        .from('columns')
        .select('name')
        .eq('name', 'Backlog')
        .single();

      const { data: targetColumn } = await supabase
        .from('columns')
        .select('name')
        .eq('id', columnId)
        .single();

      // Get highest position in target column
      const { data: columnCards } = await supabase
        .from('cards')
        .select('position')
        .eq('column_id', columnId)
        .order('position', { ascending: false })
        .limit(1);

      const newPosition = ((columnCards && columnCards[0]?.position) ?? -1) + 1;

      // Update card in database
      const { error: updateError } = await supabase
        .from('cards')
        .update({
          column_id: columnId,
          position: newPosition
        })
        .eq('id', cardId);

      if (updateError) throw updateError;

      // Update local states
      const movedCard = backlogCards.find(c => c.id === cardId);
      if (movedCard) {
        setBacklogCards(cards => cards.filter(c => c.id !== cardId));
        setBoardCards(cards => [...cards, { 
          ...movedCard, 
          column_id: columnId,
          position: newPosition 
        }]);

        // Record history
        await supabase
          .from('card_history')
          .insert({
            card_id: cardId,
            from_column: sourceColumn?.name || 'Backlog',
            to_column: targetColumn?.name || 'Unknown',
            timestamp: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Error moving card:', error);
    }
  };

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
                onMoveCard={handleMoveCard}
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
            {activeId && activeType === 'column' && (
              <div className="w-80 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                {/* ... column overlay remains the same ... */}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}
