import { describe, it, expect } from 'vitest'
import { boardRoute } from './board-route'

const route = (query: string) => boardRoute(new URLSearchParams(query))

describe('boardRoute', () => {
  it('routes a token-only share link to the read-only board', () => {
    expect(route('view=token-1')).toEqual({ kind: 'read-only', viewToken: 'token-1' })
  })

  it('keeps already-issued id+view links on the read-only board', () => {
    expect(route('id=board-1&view=token-1')).toEqual({ kind: 'read-only', viewToken: 'token-1' })
  })

  it('stays read-only when a view link is opened, whatever else the query carries', () => {
    expect(route('view=token-1&id=board-1&foo=bar')).toEqual({
      kind: 'read-only',
      viewToken: 'token-1',
    })
  })

  it('routes a bare board id to the editable board', () => {
    expect(route('id=board-1')).toEqual({ kind: 'editable' })
  })

  it('routes an empty query to the editable board', () => {
    expect(route('')).toEqual({ kind: 'editable' })
  })

  it('treats an empty view token as no token', () => {
    expect(route('id=board-1&view=')).toEqual({ kind: 'editable' })
  })
})
