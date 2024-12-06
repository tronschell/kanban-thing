'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { KanbanBoard, CalendarView, ViewSwitcher, Backlog, TimelineView, UserOnboarding, Navbar } from '@/components'
import { createClient } from '@/lib/supabase/client'
import { Plus } from 'lucide-react'
import { DragDropContext } from 'react-beautiful-dnd'
import type { Card } from '@/types'

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
  const [currentView, setCurrentView] = useState<'kanban' | 'calendar' | 'timeline'>('kanban')
  const [backlogCards, setBacklogCards] = useState<Card[]>([])
  const [boardCards, setBoardCards] = useState<Card[]>([])
  const [columns, setColumns] = useState<Array<{ id: string; name: string }>>([])
  const [backlogColumnId, setBacklogColumnId] = useState<string | null>(null);
  const supabase = createClient()

  useEffect(() => {
    const initializeBacklog = async () => {
      const { data: column, error: fetchError } = await supabase
        .from('columns')
        .select('id')
        .eq('board_id', boardId)
        .eq('name', 'Backlog')
        .single();

      if (fetchError && fetchError.code === 'PGRST116') {
        const { data: newColumn, error: createError } = await supabase
          .from('columns')
          .insert({
            board_id: boardId,
            name: 'Backlog',
            position: -1
          })
          .select('id')
          .single();

        if (createError) {
          console.error('Error creating backlog column:', createError);
          return;
        }

        if (newColumn) {
          setBacklogColumnId(newColumn.id);
        }
      } else if (column) {
        setBacklogColumnId(column.id);
      }
    };

    if (boardId) {
      initializeBacklog();
    }
  }, [boardId]);

  const handleDragEnd = async (result: any) => {
    const { source, destination, draggableId } = result;
    if (!destination || !backlogColumnId) return;

    // Find the card being moved
    const movedCard = backlogCards.find(card => card.id === draggableId) || 
                     boardCards.find(card => card.id === draggableId);
    if (!movedCard) return;

    try {
      if (source.droppableId === 'backlog') {
        if (destination.droppableId === 'backlog') {
          // Reordering within backlog
          const newBacklogCards = Array.from(backlogCards);
          const [removed] = newBacklogCards.splice(source.index, 1);
          newBacklogCards.splice(destination.index, 0, removed);

          // Update positions in state
          setBacklogCards(newBacklogCards);

          // Update positions in database
          await Promise.all(
            newBacklogCards.map((card, index) =>
              supabase
                .from('cards')
                .update({ position: index * 1000 })
                .eq('id', card.id)
            )
          );
        } else {
          // Moving from backlog to board
          const { error } = await supabase
            .from('cards')
            .update({
              column_id: destination.droppableId,
              position: destination.index * 1000
            })
            .eq('id', draggableId);

          if (error) throw error;

          // Record history
          await recordCardHistory(
            supabase,
            draggableId,
            backlogColumnId,
            destination.droppableId
          );

          // Update local state
          setBacklogCards(current => 
            current.filter(card => card.id !== draggableId)
          );

          // Get destination column cards for proper positioning
          const destinationCards = boardCards.filter(
            card => card.column_id === destination.droppableId
          );
          const updatedDestinationCards = [...destinationCards];
          updatedDestinationCards.splice(destination.index, 0, {
            ...movedCard,
            column_id: destination.droppableId,
            position: destination.index * 1000
          });

          setBoardCards(current => {
            const otherCards = current.filter(
              card => card.column_id !== destination.droppableId
            );
            return [...otherCards, ...updatedDestinationCards];
          });
        }
      } else if (destination.droppableId === 'backlog') {
        // Moving from board to backlog
        const { error } = await supabase
          .from('cards')
          .update({
            column_id: backlogColumnId,
            position: destination.index * 1000
          })
          .eq('id', draggableId);

        if (error) throw error;

        // Record history
        await recordCardHistory(
          supabase,
          draggableId,
          source.droppableId,
          backlogColumnId
        );

        // Update local state
        setBoardCards(current => 
          current.filter(card => card.id !== draggableId)
        );

        const newBacklogCards = Array.from(backlogCards);
        newBacklogCards.splice(destination.index, 0, {
          ...movedCard,
          column_id: backlogColumnId,
          position: destination.index * 1000
        });

        setBacklogCards(newBacklogCards);

        // Update all backlog positions
        await Promise.all(
          newBacklogCards.map((card, index) =>
            supabase
              .from('cards')
              .update({ position: index * 1000 })
              .eq('id', card.id)
          )
        );
      } else {
        // Moving between board columns
        try {
          // First update the database with the moved card's new location
          await supabase
            .from('cards')
            .update({
              column_id: destination.droppableId,
              position: destination.index * 1000
            })
            .eq('id', draggableId);

          // Record history
          await recordCardHistory(
            supabase,
            draggableId,
            source.droppableId,
            destination.droppableId
          );

          // Then update local state
          setBoardCards(current => {
            // Remove the card from its current position
            const cardsWithoutMoved = current.filter(card => card.id !== draggableId);
            
            // Create the updated card
            const updatedCard = {
              ...movedCard,
              column_id: destination.droppableId,
              position: destination.index * 1000
            };

            // Get all cards in the destination column (excluding the moved card)
            const destinationColumnCards = cardsWithoutMoved.filter(
              card => card.column_id === destination.droppableId
            );

            // Insert the moved card at the correct position
            destinationColumnCards.splice(destination.index, 0, updatedCard);

            // Update positions for all cards in the destination column
            const updatedDestinationCards = destinationColumnCards.map((card, index) => ({
              ...card,
              position: index * 1000
            }));

            // Get all cards not in the destination column
            const otherCards = cardsWithoutMoved.filter(
              card => card.column_id !== destination.droppableId
            );

            // Combine all cards
            const newCards = [...otherCards, ...updatedDestinationCards];

            // Update database with new positions
            Promise.all(
              updatedDestinationCards.map(card =>
                supabase
                  .from('cards')
                  .update({ position: card.position })
                  .eq('id', card.id)
              )
            ).catch(error => {
              console.error('Error updating card positions:', error);
            });

            return newCards;
          });

        } catch (error) {
          console.error('Error moving card between columns:', error);
        }
      }
    } catch (error) {
      console.error('Error moving card:', error);
    }
  };

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

  return (
    <div className="flex flex-col min-h-full container mx-auto px-4 sm:px-6 pb-4 sm:pb-8 min-w-[320px]">
      <Navbar boardId={boardId} />
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
                      <div className="overflow-x-auto overflow-y-visible pb-4 -mx-4 px-4 sm:mx-0 sm:px-0
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