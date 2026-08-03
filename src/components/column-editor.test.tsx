import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import ColumnEditor from '@/components/column-editor'

afterEach(cleanup)

describe('ColumnEditor', () => {
  it('reports a blank rename inline and keeps focus on the field', () => {
    const onSave = vi.fn()
    const onClose = vi.fn()

    render(
      <ColumnEditor
        isOpen
        initialName="Doing"
        onClose={onClose}
        onSave={onSave}
      />
    )

    const input = screen.getByLabelText('Name')
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Rename' }))

    expect(screen.getByText('Column name is required')).toBeTruthy()
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(input.getAttribute('aria-describedby')).toBe('column-name-error')
    expect(document.activeElement).toBe(input)
    expect(onSave).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })
})
