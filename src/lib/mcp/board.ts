import { z } from 'zod'
import type { Card, Column } from '@/types'
import { baseUrl } from '@/lib/metadata'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const parseBoardId = (value: string): string | null => {
  const trimmed = value.trim()
  if (UUID.test(trimmed)) return trimmed.toLowerCase()

  const fromUrl = trimmed.match(/[?&]id=([^&#\s]+)/)?.[1]
  return fromUrl && UUID.test(fromUrl) ? fromUrl.toLowerCase() : null
}

export const boardUrl = (boardId: string) => `${baseUrl}/board?id=${boardId}`

export type PublicCard = ReturnType<typeof publicCard>
export type PublicColumn = ReturnType<typeof publicColumn>

export const publicCard = (card: Card) => ({
  id: card.id,
  column_id: card.column_id,
  title: card.title,
  description: card.description ?? null,
  color: card.color ?? null,
  due_date: card.due_date ?? null,
  position: card.position,
  created_at: card.created_at,
})

export const publicColumn = (column: Column) => ({
  id: column.id,
  name: column.name,
  position: column.position,
})

type BoardRow = {
  id: string
  name: string
  created_at: string
  expires_at: string
  requires_password: boolean
}

export const publicBoard = (board: BoardRow) => ({
  id: board.id,
  name: board.name,
  created_at: board.created_at,
  expires_at: board.expires_at,
  requires_password: board.requires_password,
  url: boardUrl(board.id),
})

export const findColumn = (columns: Column[], ref: string) => {
  const wanted = ref.trim().toLowerCase()
  return (
    columns.find((column) => column.id.toLowerCase() === wanted) ??
    columns.find((column) => column.name.toLowerCase() === wanted) ??
    null
  )
}

export const nextPosition = (cards: Card[], columnId: string) =>
  cards
    .filter((card) => card.column_id === columnId)
    .reduce((next, card) => Math.max(next, card.position + 1), 0)

const isRealDay = (day: string) => {
  const [year, month, date] = day.split('-').map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, date))
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === date
  )
}

export const boardIdInput = z
  .string()
  .min(1)
  .max(300)
  .describe('The board UUID, or the board URL the user shared. Never invent one.')

export const passwordInput = z
  .string()
  .max(100)
  .describe('The board password, if the board is protected.')

export const columnRefInput = z.string().trim().min(1).max(100)

export const cardIdInput = z.string().regex(UUID, 'card_id must be a UUID')

export const cardTitleInput = z.string().trim().min(1).max(200)

export const cardDescriptionInput = z.string().max(4000)

export const dueDateInput = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'due_date must be YYYY-MM-DD')
  .refine(isRealDay, 'due_date is not a real calendar day')

export const colorInput = z.string().regex(/^#[0-9a-f]{6}$/i, 'color must be a #rrggbb hex colour')

export const limitInput = z.number().int().min(1).max(200)
