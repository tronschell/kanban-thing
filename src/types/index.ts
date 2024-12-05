export interface Card {
  id: string
  title: string
  description: string | null
  color: string | null
  due_date: string | null
  position: number
  column_id: string
  created_at: string
}

export interface Column {
  id: string
  board_id: string
  name: string
  position: number
  created_at: string
}

export interface Board {
  id: string
  name: string
  created_at: string
}

export interface CardHistory {
  id: string
  card_id: string
  from_column: string
  to_column: string
  timestamp: string
} 