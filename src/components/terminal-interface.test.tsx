import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { TerminalInterface } from '@/components/terminal-interface'

afterEach(cleanup)

describe('TerminalInterface', () => {
  it('dispatches a command when Enter is pressed in the command field', async () => {
    const onCommand = vi.fn().mockResolvedValue({ success: true, message: 'Available commands' })

    render(
      <TerminalInterface
        isOpen
        onClose={() => {}}
        onCommand={onCommand}
        availableCards={[]}
        availableColumns={[]}
      />
    )

    const input = screen.getByRole('textbox', { name: 'Terminal command' })
    fireEvent.change(input, { target: { value: 'help' } })
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })

    await waitFor(() => expect(onCommand).toHaveBeenCalledWith('help'))
    expect(screen.getByRole('log').textContent).toContain('Available commands')
  })
})
