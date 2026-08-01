import { saveAs } from 'file-saver'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/types'

const fileStamp = () => new Date().toISOString().replace(/[:.]/g, '-')

const csvCell = (value: string | number | null) => `"${String(value ?? '').replace(/"/g, '""')}"`

async function fetchBoardData(boardId: string) {
  const supabase = createClient()

  const { data: columns } = await supabase
    .from('columns')
    .select('id, name, position')
    .eq('board_id', boardId)
    .order('position')

  const { data: cards } = await supabase
    .from('cards')
    .select('*')
    .in('column_id', columns?.map((column) => column.id) ?? [])

  return {
    columns: (columns ?? []) as { id: string; name: string; position: number }[],
    cards: (cards ?? []) as Card[],
  }
}

export async function exportBoardAsJson(boardId: string) {
  const data = await fetchBoardData(boardId)
  const blob = new Blob(
    [JSON.stringify({ board_id: boardId, exported_at: new Date().toISOString(), ...data }, null, 2)],
    { type: 'application/json' }
  )
  saveAs(blob, `kanban-${boardId}-${fileStamp()}.json`)
}

export async function exportBoardAsCsv(boardId: string) {
  const { columns, cards } = await fetchBoardData(boardId)
  const columnNames = new Map(columns.map((column) => [column.id, column.name]))

  const rows = cards.map((card) =>
    [
      columnNames.get(card.column_id) ?? '',
      card.title,
      card.description,
      card.color,
      card.due_date,
      card.position,
    ]
      .map(csvCell)
      .join(',')
  )

  const blob = new Blob([['Column,Title,Description,Colour,Due date,Position', ...rows].join('\n')], {
    type: 'text/csv;charset=utf-8',
  })
  saveAs(blob, `kanban-${boardId}-${fileStamp()}.csv`)
}
