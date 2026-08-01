import type { Dispatch, SetStateAction } from 'react'
import { createClient } from '@/lib/supabase/client'
import { recordCardHistory } from '@/lib/board-writes'
import { randomLabelColor } from '@/lib/colors'
import { Card, Column } from '@/types'

export interface CommandResponse {
  success: boolean
  message: string
}

export interface BoardCommandContext {
  columns: Column[]
  backlogColumnId?: string | null
  setBoardCards?: Dispatch<SetStateAction<Card[]>>
  setBacklogCards?: Dispatch<SetStateAction<Card[]>>
}

const ALIASES: Record<string, string> = {
  cr: 'create',
  dl: 'delete',
  mv: 'move',
  l: 'list',
  h: 'help',
}

const HELP = `create (cr) {title} [in {column}] [--desc "text"] [--color #hex]
move (mv) {title} to {column}
delete (dl) {title}
list (l)
help (h)

Without "in {column}" a new card lands in Backlog.`

const failure = (message: string): CommandResponse => ({ success: false, message })
const ok = (message: string): CommandResponse => ({ success: true, message })

const findColumn = (columns: Column[], name: string) =>
  columns.find((column) => column.name.toLowerCase() === name.trim().toLowerCase())

const unknownColumn = (columns: Column[], name: string) =>
  failure(
    `Column "${name}" not found. Available: ${columns.map((column) => `"${column.name}"`).join(', ')}`
  )

const listFor = (ctx: BoardCommandContext, columnId: string) =>
  columnId === ctx.backlogColumnId ? ctx.setBacklogCards : ctx.setBoardCards

const addCard = (ctx: BoardCommandContext, card: Card) =>
  listFor(ctx, card.column_id)?.((prev) => [...prev, card])

const removeCard = (ctx: BoardCommandContext, card: Card) =>
  listFor(ctx, card.column_id)?.((prev) => prev.filter((c) => c.id !== card.id))

export async function runBoardCommand(
  input: string,
  ctx: BoardCommandContext
): Promise<CommandResponse> {
  const supabase = createClient()
  const columnIds = ctx.columns.map((column) => column.id)

  const nextPositionIn = async (columnId: string) => {
    const { count } = await supabase
      .from('cards')
      .select('id', { count: 'exact', head: true })
      .eq('column_id', columnId)
    return count ?? 0
  }

  const findCardByTitle = async (title: string) => {
    const { data } = await supabase.from('cards').select('*').in('column_id', columnIds)
    return (
      (data as Card[] | null)?.find((card) => card.title.toLowerCase() === title.toLowerCase()) ??
      null
    )
  }

  const words = input.trim().split(/\s+/)
  const action = ALIASES[words[0].toLowerCase()] ?? words[0].toLowerCase()

  try {
    if (action === 'help') return ok(HELP)

    if (action === 'create') {
      const flagsAt = input.indexOf('--')
      const head = (flagsAt === -1 ? input : input.slice(0, flagsAt)).trim().split(/\s+/).slice(1)
      const inAt = head.findIndex((word) => word.toLowerCase() === 'in')

      const title = (inAt === -1 ? head : head.slice(0, inAt)).join(' ')
      if (!title) return failure('Usage: create {title} [in {column}]')

      const columnName = inAt === -1 ? 'Backlog' : head.slice(inAt + 1).join(' ')
      const column = findColumn(ctx.columns, columnName)
      if (!column) return unknownColumn(ctx.columns, columnName)

      const description = input.match(/--desc\s+"([^"]+)"/i)?.[1] ?? null
      const color = input.match(/--color\s+(#[0-9a-f]{6}|#[0-9a-f]{3})/i)?.[1] ?? randomLabelColor()

      const { data: card, error } = await supabase
        .from('cards')
        .insert({
          column_id: column.id,
          title,
          description,
          color,
          position: await nextPositionIn(column.id),
        })
        .select('*')
        .single()

      if (error) throw error
      if (card) addCard(ctx, card as Card)

      return ok(`Created "${title}" in ${column.name}`)
    }

    if (action === 'move') {
      const toAt = words.findIndex((word) => word.toLowerCase() === 'to')
      if (toAt < 2 || toAt === words.length - 1) {
        return failure('Usage: move {title} to {column}')
      }

      const columnName = words.slice(toAt + 1).join(' ')
      const column = findColumn(ctx.columns, columnName)
      if (!column) return unknownColumn(ctx.columns, columnName)

      const title = words.slice(1, toAt).join(' ')
      const card = await findCardByTitle(title)
      if (!card) return failure(`Card "${title}" not found`)

      if (card.column_id === column.id) return ok(`"${card.title}" is already in ${column.name}`)

      const position = await nextPositionIn(column.id)
      const { error } = await supabase
        .from('cards')
        .update({ column_id: column.id, position })
        .eq('id', card.id)

      if (error) throw error

      const fromColumn = ctx.columns.find((item) => item.id === card.column_id)
      await recordCardHistory(supabase, card.id, fromColumn?.name ?? 'Unknown', column.name)

      removeCard(ctx, card)
      addCard(ctx, { ...card, column_id: column.id, position })

      return ok(`Moved "${card.title}" to ${column.name}`)
    }

    if (action === 'delete') {
      const title = words.slice(1).join(' ')
      if (!title) return failure('Usage: delete {title}')

      const card = await findCardByTitle(title)
      if (!card) return failure(`Card "${title}" not found`)

      const { error } = await supabase.from('cards').delete().eq('id', card.id)
      if (error) throw error

      removeCard(ctx, card)

      return ok(`Deleted "${card.title}"`)
    }

    if (action === 'list') {
      const { data, error } = await supabase
        .from('cards')
        .select('title, column_id')
        .in('column_id', columnIds)
        .order('position')

      if (error) throw error

      const cards = (data ?? []) as { title: string; column_id: string }[]

      return ok(
        ctx.columns
          .map((column) => {
            const titles = cards
              .filter((card) => card.column_id === column.id)
              .map((card) => `  - ${card.title}`)
            return `${column.name.toUpperCase()}:\n${titles.join('\n') || '  - (empty)'}`
          })
          .join('\n\n')
      )
    }

    return failure('Unknown command. Type help for the list.')
  } catch (error) {
    console.error('Terminal command error:', error)
    return failure('The command failed. Check the console for details.')
  }
}
