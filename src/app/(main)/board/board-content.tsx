'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { KanbanBoard, CalendarView, ViewSwitcher, Backlog, TimelineView, UserOnboarding, Navbar } from '@/components'
import { createClient } from '@/lib/supabase/client'
import { Plus, RefreshCw, Lock } from 'lucide-react'
import { DragDropContext } from 'react-beautiful-dnd'
import type { Card } from '@/types'
import { useAnalytics } from '@/hooks/use-analytics';
import { PasswordProtection } from '@/components/password-protection'

const recordCardHistory = async (
  supabase: any,
  cardId: string, 
  fromColumnId: string, 
  toColumnId: string
) => {
  // Get column names for better history readability
  const { data: columns } = await supabase
    .from('columns')
    .select('id, name')
    .in('id', [fromColumnId, toColumnId]);

  const fromColumn = columns?.find(col => col.id === fromColumnId)?.name || 'Unknown';
  const toColumn = columns?.find(col => col.id === toColumnId)?.name || 'Unknown';

  // Record the movement in card_history
  await supabase
    .from('card_history')
    .insert({
      card_id: cardId,
      from_column: fromColumn,
      to_column: toColumn,
      timestamp: new Date().toISOString()
    });
};

export default function BoardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const boardId = searchParams.get('id')
  const [newBoardName, setNewBoardName] = useState('')
  const [currentView, setCurrentView] = useState<'kanban' | 'calendar' | 'timeline'>('kanban')
  const [backlogCards, setBacklogCards] = useState<Card[]>([])
  const [boardCards, setBoardCards] = useState<Card[]>([])
  const [columns, setColumns] = useState<Array<{ id: string; name: string }>>([])
  const [backlogColumnId, setBacklogColumnId] = useState<string | null>(null);
  const [boardNotFound, setBoardNotFound] = useState(false)
  const supabase = createClient()
  const { trackEvent } = useAnalytics();
  const [isPasswordProtected, setIsPasswordProtected] = useState(false)
  const [hasPasswordAccess, setHasPasswordAccess] = useState(false)

  useEffect(() => {
    const initializeBacklog = async () => {
      if (!boardId) return;

      try {
        // First check if board exists
        const { data: board, error: boardError } = await supabase
          .from('boards')
          .select('id')
          .eq('id', boardId)
          .single();

        if (boardError || !board) {
          setBoardNotFound(true);
          return;
        }

        // First try to find existing backlog column
        const { data: column, error: fetchError } = await supabase
          .from('columns')
          .select('id')
          .eq('board_id', boardId)
          .eq('name', 'Backlog')
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') { // No rows found
            // Create backlog column if it doesn't exist
            const { data: newColumn, error: createError } = await supabase
              .from('columns')
              .insert({
                board_id: boardId,
                name: 'Backlog',
                position: -1
              })
              .select('id')
              .single();

            if (createError) throw createError;
            if (newColumn) setBacklogColumnId(newColumn.id);
          }
        } else if (column) {
          setBacklogColumnId(column.id);
        }
      } catch (error) {
        console.error('Error initializing backlog:', error);
        setBoardNotFound(true);
      }
    };

    initializeBacklog();
  }, [boardId]);

  useEffect(() => {
    const fetchColumns = async () => {
      const { data: columnsData } = await supabase
        .from('columns')
        .select('*')
        .eq('board_id', boardId)
        .neq('name', 'Backlog')
        .order('position')
      
      if (columnsData) {
        setColumns(columnsData)
      }
    }

    fetchColumns()
  }, [boardId])

  useEffect(() => {
    const fetchBacklogCards = async () => {
      if (!backlogColumnId) return;

      const { data: cards, error } = await supabase
        .from('cards')
        .select('*')
        .eq('column_id', backlogColumnId)
        .order('position')

      if (error) {
        console.error('Error fetching backlog cards:', error)
        return
      }

      if (cards) {
        setBacklogCards(cards)
      }
    }

    fetchBacklogCards()
  }, [backlogColumnId])

  useEffect(() => {
    const checkPasswordProtection = async () => {
      if (!boardId) return

      try {
        // Check if board has password
        const { data: board } = await supabase
          .from('boards')
          .select('password_hash')
          .eq('id', boardId)
          .single()

        const hasPassword = !!board?.password_hash
        console.log('Board password status:', { hasPassword, boardId })

        setIsPasswordProtected(hasPassword)

        if (hasPassword) {
          // Check if user has already verified the password
          const hasAccess = localStorage.getItem(`board_access_${boardId}`) === 'true'
          setHasPasswordAccess(hasAccess)
        } else {
          setHasPasswordAccess(true)
        }
      } catch (err) {
        console.error('Error checking password protection:', err)
      }
    }

    checkPasswordProtection()
  }, [boardId])

  const handleDragEnd = async (result: any) => {
    const { source, destination, draggableId } = result;
    if (!destination || !backlogColumnId) return;

    // Find the card being moved
    const movedCard = backlogCards.find(card => card.id === draggableId) || 
                     boardCards.find(card => card.id === draggableId);
    if (!movedCard) return;

    // STEP 1: Immediately update local state (optimistic update)
    if (source.droppableId === 'backlog') {
      if (destination.droppableId === 'backlog') {
        // Reordering within backlog
        const newBacklogCards = Array.from(backlogCards);
        const [removed] = newBacklogCards.splice(source.index, 1);
        newBacklogCards.splice(destination.index, 0, removed);
        setBacklogCards(newBacklogCards);
        
        // STEP 2: Update database in background
        try {
          await Promise.all(
            newBacklogCards.map((card, index) =>
              supabase
                .from('cards')
                .update({ position: index * 1000 })
                .eq('id', card.id)
            )
          );
        } catch (error) {
          console.error('Error updating positions:', error);
          // Optionally revert the state on error
          setBacklogCards(backlogCards);
        }
      } else {
        // Moving from backlog to board
        // STEP 1: Optimistic update
        const updatedCard = {
          ...movedCard,
          column_id: destination.droppableId,
          position: destination.index * 1000
        };
        
        setBacklogCards(current => current.filter(card => card.id !== draggableId));
        setBoardCards(current => {
          const otherCards = current.filter(card => card.column_id !== destination.droppableId);
          const columnCards = current.filter(card => card.column_id === destination.droppableId);
          columnCards.splice(destination.index, 0, updatedCard);
          return [...otherCards, ...columnCards];
        });

        // STEP 2: Update database
        try {
          await supabase
            .from('cards')
            .update({
              column_id: destination.droppableId,
              position: destination.index * 1000
            })
            .eq('id', draggableId);

          await recordCardHistory(
            supabase,
            draggableId,
            backlogColumnId,
            destination.droppableId
          );
        } catch (error) {
          console.error('Error moving card:', error);
          // Revert on error
          setBacklogCards(backlogCards);
          setBoardCards(boardCards);
        }
      }
    } else if (destination.droppableId === 'backlog') {
      // Similar optimistic update pattern for board to backlog...
    } else {
      // Moving between board columns
      // STEP 1: Optimistic update
      setBoardCards(current => {
        const cardsWithoutMoved = current.filter(card => card.id !== draggableId);
        const updatedCard = {
          ...movedCard,
          column_id: destination.droppableId,
          position: destination.index * 1000
        };
        
        const destinationCards = cardsWithoutMoved.filter(
          card => card.column_id === destination.droppableId
        );
        destinationCards.splice(destination.index, 0, updatedCard);
        
        const otherCards = cardsWithoutMoved.filter(
          card => card.column_id !== destination.droppableId
        );
        
        return [...otherCards, ...destinationCards];
      });

      // STEP 2: Update database
      try {
        await supabase
          .from('cards')
          .update({
            column_id: destination.droppableId,
            position: destination.index * 1000
          })
          .eq('id', draggableId);

        await recordCardHistory(
          supabase,
          draggableId,
          source.droppableId,
          destination.droppableId
        );
      } catch (error) {
        console.error('Error moving card:', error);
        // Revert on error
        setBoardCards(boardCards);
      }
    }
  };

  // Add tracking to card creation
  const handleAddCard = async (columnId: string, cardData: {
    title: string
    description: string
    color: string | null
    due_date: string | null
  }) => {
    const newPosition = boardCards.filter(card => card.column_id === columnId).length

    const { data: card } = await supabase
      .from('cards')
      .insert({
        column_id: columnId,
        title: cardData.title,
        description: cardData.description,
        color: cardData.color,
        due_date: cardData.due_date,
        position: newPosition,
      })
      .select()
      .single()

    if (card) {
      setBoardCards([...boardCards, card])
      
      // Track card creation
      trackEvent('create_card', {
        card_id: card.id,
        column_id: columnId,
      });

      // Scroll the new card into view
      setTimeout(() => {
        const cardElement = document.getElementById(`card-${card.id}`)
        cardElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 100)
    }
  }

  const refreshBoard = async () => {
    // Fetch columns
    const { data: columnsData } = await supabase
      .from('columns')
      .select('*')
      .eq('board_id', boardId)
      .neq('name', 'Backlog')
      .order('position')
    
    if (columnsData) {
      setColumns(columnsData)
    }

    // Fetch board cards
    const { data: cardsData } = await supabase
      .from('cards')
      .select('*')
      .eq('board_id', boardId)
      .order('position')
    
    if (cardsData) {
      setBoardCards(cardsData)
    }

    // Fetch backlog cards
    if (backlogColumnId) {
      const { data: backlogData } = await supabase
        .from('cards')
        .select('*')
        .eq('column_id', backlogColumnId)
        .order('position')
      
      if (backlogData) {
        setBacklogCards(backlogData)
      }
    }
  }

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // 1. Create the board
      const { data: board, error: boardError } = await supabase
        .from('boards')
        .insert({
          name: newBoardName,
          created_by: localStorage.getItem('kanban_user_id')
        })
        .select()
        .single()

      if (boardError) throw boardError

      // 2. Create the backlog column
      const { data: backlog, error: backlogError } = await supabase
        .from('columns')
        .insert({
          board_id: board.id,
          name: 'Backlog',
          position: -1
        })
        .select()
        .single()

      if (backlogError) throw backlogError

      // 3. Initialize state
      setBacklogColumnId(backlog.id)
      setBacklogCards([])
      setBoardCards([])
      setColumns([backlog])

      // 4. Redirect to the new board
      router.push(`/board?id=${board.id}`)

      // 5. Fetch initial data including the backlog column
      const { data: columnsData } = await supabase
        .from('columns')
        .select('*')
        .eq('board_id', board.id)
        .order('position')
      
      if (columnsData) {
        setColumns(columnsData)
      }

    } catch (error) {
      console.error('Error creating board:', error)
    }
  }

  if (boardNotFound) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-950 p-4">
        <div className="max-w-md w-full bg-gray-900 rounded-lg p-8 text-center space-y-4 border border-gray-800 relative z-50">
          <h1 className="text-2xl font-bold text-gray-100">Board Not Found</h1>
          <p className="text-gray-400">
            This board may have expired or does not exist.
          </p>
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center justify-center px-4 py-2 
              bg-blue-600 text-white rounded-lg hover:bg-blue-700 
              transition-colors duration-200 w-full
              cursor-pointer relative z-50"
          >
            Go to Home Page
          </button>
        </div>
      </div>
    );
  }

  if (!boardId) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
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

  if (isPasswordProtected && !hasPasswordAccess) {
    return (
      <PasswordProtection 
        boardId={boardId!} 
        onSuccess={() => setHasPasswordAccess(true)} 
      />
    )
  }

  return (
    <div className="flex flex-col min-h-full container mx-auto px-4 sm:px-6 pb-4 sm:pb-8 min-w-[320px]">
      <Navbar 
        boardId={boardId} 
        setBoardCards={setBoardCards}
        setBacklogCards={setBacklogCards}
        backlogColumnId={backlogColumnId}
      />
      <main className="flex-1">
        <div className="h-full overflow-y-auto">
          <div className="pt-4">
            <div className="relative z-10">
              <ViewSwitcher 
                currentView={currentView} 
                onViewChange={setCurrentView}
                boardId={boardId}
              />
            </div>
            <div className="drag-container relative z-0">
              <DragDropContext onDragEnd={handleDragEnd}>
                <div className="mt-4 sm:mt-6">
                  {currentView === 'kanban' && (
                    <div className="flex flex-col gap-6 sm:gap-8">
                      <div className="overflow-x-auto overflow-y-visible pb-4 sm:mx-0 sm:px-0
                        scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700
                        scrollbar-track-transparent">
                        <div className="min-w-[768px] sm:min-w-0">
                          <KanbanBoard 
                            boardId={boardId} 
                            cards={boardCards}
                            setCards={setBoardCards}
                          />
                        </div>
                      </div>

                      <div className="sm:px-0">
                        <Backlog 
                          boardId={boardId}
                          cards={backlogCards}
                          setCards={setBacklogCards}
                          activeId={null}
                        />
                      </div>
                    </div>
                  )}

                  {currentView === 'calendar' && (
                    <div className="sm:px-0">
                      <CalendarView boardId={boardId} />
                    </div>
                  )}

                  {currentView === 'timeline' && (
                    <div className="sm:px-0">
                      <TimelineView boardId={boardId} />
                    </div>
                  )}
                </div>
              </DragDropContext>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}