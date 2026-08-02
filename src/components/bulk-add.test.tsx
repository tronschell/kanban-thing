import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import BulkAdd from '@/components/bulk-add'

const columns = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'In Progress' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Backlog' },
]

const typeCards = () =>
  fireEvent.change(screen.getByLabelText('Cards'), { target: { value: 'first\nsecond' } })

afterEach(cleanup)

describe('BulkAdd', () => {
  it('saves to the default column when columns arrive after mount', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const { rerender } = render(
      <BulkAdd isOpen columns={[]} onSave={onSave} onClose={() => {}} />
    )

    rerender(<BulkAdd isOpen columns={columns} onSave={onSave} onClose={() => {}} />)
    typeCards()
    fireEvent.click(screen.getByRole('button', { name: 'Add 2 cards' }))

    expect(onSave).toHaveBeenCalledWith(columns[1].id, ['first', 'second'])
  })

  it('keeps a column the user picked', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<BulkAdd isOpen columns={columns} onSave={onSave} onClose={() => {}} />)

    fireEvent.change(screen.getByLabelText('Column'), { target: { value: columns[0].id } })
    typeCards()
    fireEvent.click(screen.getByRole('button', { name: 'Add 2 cards' }))

    expect(onSave).toHaveBeenCalledWith(columns[0].id, ['first', 'second'])
  })

  it('blocks submit while no column can be resolved', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<BulkAdd isOpen columns={[]} onSave={onSave} onClose={() => {}} />)

    typeCards()
    const submit = screen.getByRole('button', { name: 'Add 2 cards' })

    expect(submit).toHaveProperty('disabled', true)
    fireEvent.click(submit)
    expect(onSave).not.toHaveBeenCalled()
  })
})
