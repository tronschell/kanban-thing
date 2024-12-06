import { Droppable } from 'react-beautiful-dnd';
import { SortableCard } from './sortable-card';
import { Plus } from 'lucide-react';

interface Column {
  id: string
  name: string
  board_id: string
  position: number
  created_at: string
}

interface Card {
  id: string
  column_id: string
  title: string
  description: string | null
  color: string | null
  position: number
  created_at: string
}

interface SortableColumnProps {
  column: Column
  cards: Card[]
  onAddCard: () => void
  onDeleteCard: (cardId: string) => void
}

export function SortableColumn({ column, cards, onAddCard, onDeleteCard }: SortableColumnProps) {
  return (
    <div className="w-80 flex-shrink-0 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 touch-none">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">{column.name}</h3>
        <button onClick={onAddCard}>
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <Droppable 
        droppableId={column.id} 
        type="card"
        direction="vertical"
      >
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              min-h-[8rem] rounded-lg p-2 touch-none
              ${snapshot.isDraggingOver ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}
              transition-colors duration-200
            `}
          >
            {cards.map((card, index) => (
              <SortableCard
                key={card.id}
                card={card}
                index={index}
                onDelete={onDeleteCard}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
} 