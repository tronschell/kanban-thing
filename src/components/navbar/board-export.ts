import { saveAs } from 'file-saver'
import { createClient } from '@/lib/supabase/client'
import { columnRow, readBoard } from '@/lib/board-writes'

const fileStamp = () => new Date().toISOString().replace(/[:.]/g, '-')

const csvCell = (value: string | number | null) => `"${String(value ?? '').replace(/"/g, '""')}"`

async function fetchBoardData(boardId: string) {
  const payload = await readBoard(createClient(), boardId)
  if (payload.status !== 'ok') throw new Error(payload.status)

  return { columns: payload.columns.map(columnRow), cards: payload.cards }
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
