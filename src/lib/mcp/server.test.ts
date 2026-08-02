import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import type { SupabaseClient } from './rpc'
import { createMcpServer } from './server'

const BOARD_ID = '3f7c1e2a-9b4d-4c8e-a1f6-2d5b8e7c0a91'
const CARD_ID = '8a2f4c6d-1e3b-4f5a-9c7d-0b6e2a4f8c1d'

const BOARD_READ = {
  status: 'ok',
  board: {
    id: BOARD_ID,
    created_at: '2026-08-01T00:00:00.000Z',
    name: 'Roadmap',
    expires_at: '2026-09-30T00:00:00.000Z',
    requires_password: false,
    password_hash: '$2a$10$leaked',
    view_token: 'secret-view-token',
  },
  columns: [
    { id: 'col-1', board_id: BOARD_ID, name: 'Backlog', position: -1, created_at: '2026-08-01T00:00:00.000Z' },
    { id: 'col-2', board_id: BOARD_ID, name: 'Done', position: 0, created_at: '2026-08-01T00:00:00.000Z' },
  ],
  cards: [
    {
      id: CARD_ID,
      column_id: 'col-1',
      title: 'Write the spec',
      description: null,
      color: null,
      due_date: null,
      position: 0,
      created_at: '2026-08-01T00:00:00.000Z',
      password_hash: '$2a$10$leaked',
    },
  ],
  card_history: [],
}

type RpcStub = (fn: string, args: Record<string, unknown>) => { data: unknown; error: unknown }

const defaultRpc: RpcStub = (fn) => {
  if (fn === 'board_read') return { data: BOARD_READ, error: null }
  if (fn === 'board_create') return { data: BOARD_ID, error: null }
  return { data: 'ok', error: null }
}

const connect = async (rpc: RpcStub = defaultRpc) => {
  const calls: { fn: string; args: Record<string, unknown> }[] = []
  const supabase = {
    rpc: async (fn: string, args: Record<string, unknown>) => {
      calls.push({ fn, args })
      return rpc(fn, args)
    },
  } as unknown as SupabaseClient

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  const client = new Client({ name: 'test', version: '0.0.0' })
  await Promise.all([
    client.connect(clientTransport),
    createMcpServer(supabase).connect(serverTransport),
  ])

  return { client, calls }
}

const textOf = (result: unknown) =>
  ((result as { content?: { type: string; text: string }[] }).content ?? [])
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('\n')

let consoleError: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  consoleError.mockRestore()
})

describe('tool catalogue', () => {
  it('ships the discrete tools and nothing that enumerates boards', async () => {
    const { client } = await connect()
    const { tools } = await client.listTools()

    expect(tools.map((tool) => tool.name).sort()).toEqual([
      'create_board',
      'create_card',
      'delete_card',
      'get_board',
      'list_cards',
      'list_columns',
      'move_card',
      'update_card',
    ])
  })

  it('gives every tool a title and read-only and destructive annotations', async () => {
    const { client } = await connect()
    const { tools } = await client.listTools()

    for (const tool of tools) {
      expect(tool.annotations?.title, tool.name).toBeTruthy()
      expect(typeof tool.annotations?.readOnlyHint, tool.name).toBe('boolean')
      expect(typeof tool.annotations?.destructiveHint, tool.name).toBe('boolean')
    }

    const byName = new Map(tools.map((tool) => [tool.name, tool]))
    expect(byName.get('list_cards')?.annotations?.readOnlyHint).toBe(true)
    expect(byName.get('get_board')?.annotations?.readOnlyHint).toBe(true)
    expect(byName.get('list_columns')?.annotations?.readOnlyHint).toBe(true)
    expect(byName.get('create_card')?.annotations?.readOnlyHint).toBe(false)
    expect(byName.get('delete_card')?.annotations?.destructiveHint).toBe(true)
    expect(byName.get('create_card')?.annotations?.destructiveHint).toBe(false)
  })

  it('makes every board-scoped tool demand a caller-supplied board id', async () => {
    const { client } = await connect()
    const { tools } = await client.listTools()

    for (const tool of tools) {
      if (tool.name === 'create_board') continue
      expect(tool.inputSchema.required, tool.name).toContain('board_id')
    }
  })
})

describe('tool results', () => {
  it('never returns password_hash or a view token from a board read', async () => {
    const { client } = await connect()

    const board = textOf(await client.callTool({ name: 'get_board', arguments: { board_id: BOARD_ID } }))
    const cards = textOf(await client.callTool({ name: 'list_cards', arguments: { board_id: BOARD_ID } }))

    for (const payload of [board, cards]) {
      expect(payload).not.toContain('password_hash')
      expect(payload).not.toContain('leaked')
      expect(payload).not.toContain('view_token')
      expect(payload).not.toContain('secret-view-token')
    }
    expect(board).toContain('Roadmap')
    expect(cards).toContain('Write the spec')
  })

  it('passes the caller password through to the rpc and never echoes it back', async () => {
    const { client, calls } = await connect()

    const result = textOf(
      await client.callTool({
        name: 'get_board',
        arguments: { board_id: BOARD_ID, password: 'hunter2' },
      })
    )

    expect(calls[0].args.password_attempt).toBe('hunter2')
    expect(result).not.toContain('hunter2')
  })
})

describe('tool errors', () => {
  const expectFailure = async (
    call: Promise<unknown>,
    matcher: (message: string) => void
  ) => {
    const result = (await call) as { isError?: boolean }
    expect(result.isError).toBe(true)
    matcher(textOf(result))
  }

  it('rejects a board id that is not a uuid or a board url', async () => {
    const { client, calls } = await connect()

    await expectFailure(
      client.callTool({ name: 'get_board', arguments: { board_id: 'the roadmap board' } }),
      (message) => expect(message).toContain('board_id must be a board UUID')
    )
    expect(calls).toHaveLength(0)
  })

  it('rejects an out of range list limit before any rpc runs', async () => {
    const { client, calls } = await connect()

    await expectFailure(
      client.callTool({ name: 'list_cards', arguments: { board_id: BOARD_ID, limit: 5000 } }),
      (message) => expect(message).toContain('Input validation error')
    )
    expect(calls).toHaveLength(0)
  })

  it('asks for the password rather than saying whether the board exists', async () => {
    const { client } = await connect((fn) =>
      fn === 'board_read' ? { data: { status: 'wrong_password' }, error: null } : { data: 'ok', error: null }
    )

    await expectFailure(
      client.callTool({ name: 'list_cards', arguments: { board_id: BOARD_ID } }),
      (message) => expect(message).toContain('password protected')
    )
  })

  it('hides supabase internals behind a generic failure', async () => {
    const { client } = await connect(() => ({
      data: null,
      error: {
        message: 'permission denied for table boards',
        details: 'select password_hash from public.boards',
        hint: 'grant select to anon',
        code: '42501',
      },
    }))

    await expectFailure(
      client.callTool({ name: 'get_board', arguments: { board_id: BOARD_ID } }),
      (message) => {
        expect(message).toBe('The board service is unavailable. Try again in a moment.')
        expect(message).not.toContain('boards')
        expect(message).not.toContain('42501')
      }
    )
    expect(consoleError).toHaveBeenCalled()
  })

  it('names the columns that exist instead of writing to a column that does not', async () => {
    const { client, calls } = await connect()

    await expectFailure(
      client.callTool({
        name: 'create_card',
        arguments: { board_id: BOARD_ID, title: 'Ship it', column: 'Nowhere' },
      }),
      (message) => expect(message).toContain('Backlog, Done')
    )
    expect(calls.map((call) => call.fn)).toEqual(['board_read'])
  })
})
