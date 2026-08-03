import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import CardEditor from '@/components/card-editor'

afterEach(cleanup)

const renderEditor = (onSave = vi.fn()) => {
  render(<CardEditor isOpen onClose={() => {}} onSave={onSave} />)
  return onSave
}

describe('CardEditor', () => {
  it('reports an empty title inline and focuses the title field', () => {
    const onSave = renderEditor()
    const title = screen.getByLabelText('Title')

    fireEvent.click(screen.getByRole('button', { name: 'Save card' }))

    expect(screen.getByText('Title is required')).toBeTruthy()
    expect(title.getAttribute('aria-invalid')).toBe('true')
    expect(document.activeElement).toBe(title)
    expect(onSave).not.toHaveBeenCalled()
  })

  it('reports an invalid custom colour inline and focuses its field', () => {
    const onSave = renderEditor()
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'A card' } })
    const color = screen.getByPlaceholderText('Custom colour, e.g. #30a46c. Leave empty for none')
    fireEvent.change(color, { target: { value: 'not-a-colour' } })

    fireEvent.click(screen.getByRole('button', { name: 'Save card' }))

    expect(screen.getByText('Colour must be a 3- or 6-digit hex value')).toBeTruthy()
    expect(color.getAttribute('aria-invalid')).toBe('true')
    expect(color.getAttribute('aria-describedby')).toBe('card-color-error')
    expect(document.activeElement).toBe(color)
    expect(onSave).not.toHaveBeenCalled()
  })
})
