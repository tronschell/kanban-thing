export type BoardRoute = { kind: 'read-only'; viewToken: string } | { kind: 'editable' }

export const boardRoute = (params: URLSearchParams): BoardRoute => {
  const viewToken = params.get('view')
  return viewToken ? { kind: 'read-only', viewToken } : { kind: 'editable' }
}
