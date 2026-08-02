import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { Card, Column } from '@/types'
import { DEFAULT_LIFESPAN_DAYS } from '@/lib/board-lifespan'
import { dayToDueDate } from '@/lib/date-utils'
import {
  createBoard,
  readBoard,
  saveCards,
  type SupabaseClient,
  type WriteResult,
} from '@/lib/mcp/rpc'
import {
  boardIdInput,
  cardDescriptionInput,
  cardIdInput,
  cardTitleInput,
  colorInput,
  columnRefInput,
  dueDateInput,
  findColumn,
  limitInput,
  nextPosition,
  parseBoardId,
  passwordInput,
  publicBoard,
  publicCard,
  publicColumn,
} from '@/lib/mcp/board'

const DEFAULT_COLUMNS = ['To Do', 'In Progress', 'Done']

const boardArgs = { board_id: boardIdInput, password: passwordInput.optional() }

const result = (payload: Record<string, unknown>) => ({
  content: [{ type: 'text' as const, text: JSON.stringify(payload, null, 2) }],
  structuredContent: payload,
})

const accessError = (status: 'wrong_password' | 'not_found') =>
  new Error(
    status === 'not_found'
      ? 'No board with that id. It may have expired and been deleted.'
      : 'This board is password protected. Supply the current board password as `password`.'
  )

const loadBoard = async (
  supabase: SupabaseClient,
  { board_id, password }: { board_id: string; password?: string }
) => {
  const boardId = parseBoardId(board_id)
  if (!boardId) throw new Error('board_id must be a board UUID or a KanbanThing board URL.')

  const read = await readBoard(supabase, boardId, password ?? '')
  if (read.status !== 'ok') throw accessError(read.status)

  return { boardId, board: read.board, columns: read.columns, cards: read.cards }
}

const columnOrThrow = (columns: Column[], ref: string) => {
  const column = findColumn(columns, ref)
  if (column) return column
  throw new Error(
    `No column "${ref}" on this board. Columns: ${columns.map((entry) => entry.name).join(', ')}`
  )
}

const cardOrThrow = (cards: Card[], cardId: string) => {
  const card = cards.find((entry) => entry.id === cardId)
  if (card) return card
  throw new Error('No card with that id on this board. Call list_cards for the current ids.')
}

const writtenOrThrow = (write: WriteResult) => {
  if (write !== 'ok') throw accessError(write)
}

export function createMcpServer(supabase: SupabaseClient) {
  const server = new McpServer(
    { name: 'kanbanthing', version: '0.1.0' },
    {
      instructions:
        'Drive a KanbanThing board. Every tool needs a board_id the user supplied - either a board UUID or a board URL. There is no way to list or search boards, so ask the user for the link rather than guessing. Boards with a password need it passed as `password` on every call.',
    }
  )

  server.registerTool(
    'create_board',
    {
      title: 'Create a Kanban board',
      description:
        'Create a new KanbanThing board and return its id and shareable URL. No sign-up. The board has no password, so anyone holding the URL can read and edit it; boards created here are deleted when they expire.',
      inputSchema: {
        name: z.string().trim().min(1).max(100).describe('Board name shown to everyone.'),
        columns: z
          .array(columnRefInput)
          .max(10)
          .optional()
          .describe(`Columns left to right after Backlog. Defaults to ${DEFAULT_COLUMNS.join(', ')}.`),
        lifespan_days: z
          .number()
          .int()
          .min(1)
          .max(60)
          .optional()
          .describe(`Days until the board is deleted. Defaults to ${DEFAULT_LIFESPAN_DAYS}.`),
      },
      annotations: {
        title: 'Create a Kanban board',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ name, columns, lifespan_days }) => {
      const boardId = await createBoard(
        supabase,
        name,
        columns ?? DEFAULT_COLUMNS,
        lifespan_days ?? DEFAULT_LIFESPAN_DAYS
      )
      const board = await readBoard(supabase, boardId, '')
      if (board.status !== 'ok') throw new Error('The board was created but could not be read back.')

      return result({
        board: publicBoard(board.board),
        columns: board.columns.map(publicColumn),
      })
    }
  )

  server.registerTool(
    'get_board',
    {
      title: 'Get a board',
      description:
        'Read a board by id: its name, expiry, columns and how many cards each column holds.',
      inputSchema: boardArgs,
      annotations: {
        title: 'Get a board',
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      const board = await loadBoard(supabase, args)
      return result({
        board: publicBoard(board.board),
        columns: board.columns.map((column) => ({
          ...publicColumn(column),
          card_count: board.cards.filter((card) => card.column_id === column.id).length,
        })),
      })
    }
  )

  server.registerTool(
    'list_columns',
    {
      title: 'List columns',
      description: 'List the columns on a board, left to right, with their ids.',
      inputSchema: boardArgs,
      annotations: {
        title: 'List columns',
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      const board = await loadBoard(supabase, args)
      return result({ columns: board.columns.map(publicColumn) })
    }
  )

  server.registerTool(
    'list_cards',
    {
      title: 'List cards',
      description: 'List the cards on a board, optionally only those in one column.',
      inputSchema: {
        ...boardArgs,
        column: columnRefInput.optional().describe('Column name or id. Omit for every column.'),
        limit: limitInput.optional().describe('Maximum cards to return. Defaults to 100.'),
      },
      annotations: {
        title: 'List cards',
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ column, limit, ...args }) => {
      const board = await loadBoard(supabase, args)
      const wanted = column ? columnOrThrow(board.columns, column) : null
      const cards = board.cards.filter((card) => !wanted || card.column_id === wanted.id)

      return result({
        total: cards.length,
        cards: cards.slice(0, limit ?? 100).map(publicCard),
      })
    }
  )

  server.registerTool(
    'create_card',
    {
      title: 'Create a card',
      description: 'Add a card to a column on a board. Lands in Backlog when no column is given.',
      inputSchema: {
        ...boardArgs,
        title: cardTitleInput.describe('Card title.'),
        column: columnRefInput.optional().describe('Column name or id. Defaults to Backlog.'),
        description: cardDescriptionInput.optional(),
        due_date: dueDateInput.optional().describe('Due day as YYYY-MM-DD.'),
        color: colorInput.optional().describe('Card colour as #rrggbb.'),
      },
      annotations: {
        title: 'Create a card',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ title, column, description, due_date, color, ...args }) => {
      const board = await loadBoard(supabase, args)
      const target = columnOrThrow(board.columns, column ?? 'Backlog')

      const card = {
        id: crypto.randomUUID(),
        column_id: target.id,
        title,
        description: description ?? null,
        color: color ?? null,
        due_date: due_date ? dayToDueDate(due_date) : null,
        position: nextPosition(board.cards, target.id),
      }

      writtenOrThrow(await saveCards(supabase, board.boardId, args.password ?? '', [card]))

      return result({ card, column: target.name })
    }
  )

  server.registerTool(
    'move_card',
    {
      title: 'Move a card',
      description: 'Move a card to another column on the same board, at the end of that column.',
      inputSchema: {
        ...boardArgs,
        card_id: cardIdInput.describe('Card id from list_cards.'),
        column: columnRefInput.describe('Destination column name or id.'),
      },
      annotations: {
        title: 'Move a card',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ card_id, column, ...args }) => {
      const board = await loadBoard(supabase, args)
      const card = cardOrThrow(board.cards, card_id)
      const target = columnOrThrow(board.columns, column)

      if (card.column_id === target.id) {
        return result({ card: publicCard(card), column: target.name, moved: false })
      }

      const moved = {
        ...publicCard(card),
        column_id: target.id,
        position: nextPosition(board.cards, target.id),
      }
      writtenOrThrow(await saveCards(supabase, board.boardId, args.password ?? '', [moved]))

      return result({ card: moved, column: target.name, moved: true })
    }
  )

  server.registerTool(
    'update_card',
    {
      title: 'Update a card',
      description:
        'Change a card title, description, due date or colour. Pass null to clear a field. Use move_card to change column.',
      inputSchema: {
        ...boardArgs,
        card_id: cardIdInput.describe('Card id from list_cards.'),
        title: cardTitleInput.optional(),
        description: cardDescriptionInput.nullable().optional(),
        due_date: dueDateInput.nullable().optional().describe('Due day as YYYY-MM-DD, or null.'),
        color: colorInput.nullable().optional().describe('Card colour as #rrggbb, or null.'),
      },
      annotations: {
        title: 'Update a card',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ card_id, title, description, due_date, color, ...args }) => {
      const edits = { title, description, due_date, color }
      if (Object.values(edits).every((value) => value === undefined)) {
        throw new Error('Pass at least one of title, description, due_date or color.')
      }

      const board = await loadBoard(supabase, args)
      const card = cardOrThrow(board.cards, card_id)

      const updated = {
        ...publicCard(card),
        title: title ?? card.title,
        description: description === undefined ? card.description : description,
        color: color === undefined ? card.color : color,
        due_date: due_date === undefined ? card.due_date : due_date && dayToDueDate(due_date),
      }
      writtenOrThrow(await saveCards(supabase, board.boardId, args.password ?? '', [updated]))

      return result({ card: updated })
    }
  )

  server.registerTool(
    'delete_card',
    {
      title: 'Delete a card',
      description: 'Permanently delete a card from a board. This cannot be undone.',
      inputSchema: { ...boardArgs, card_id: cardIdInput.describe('Card id from list_cards.') },
      annotations: {
        title: 'Delete a card',
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ card_id, ...args }) => {
      const board = await loadBoard(supabase, args)
      const card = cardOrThrow(board.cards, card_id)

      writtenOrThrow(await saveCards(supabase, board.boardId, args.password ?? '', [], [card.id]))

      return result({ deleted: { id: card.id, title: card.title } })
    }
  )

  return server
}
