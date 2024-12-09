import { Droppable } from 'react-beautiful-dnd';
import { SortableCard } from './sortable-card';
import { Plus, Settings } from 'lucide-react';

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
  due_date: string | null
}

interface SortableColumnProps {
  column: Column
  cards: Card[]
  onAddCard: () => void
  onDeleteCard: (cardId: string) => void
  onEdit: () => void
}

export function SortableColumn({ column, cards, onAddCard, onDeleteCard, onEdit }: SortableColumnProps) {
  return (
    <div className="w-80 flex-shrink-0 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 touch-none border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">{column.name}</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={onAddCard}
            className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={onEdit}
            className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
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
              min-h-[8rem] rounded-lg p-2 touch-none space-y-2
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