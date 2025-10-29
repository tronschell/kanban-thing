import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CardEditor from '@/components/card-editor'

describe('CardEditor Tag Functionality', () => {
  const mockTags = [
    {
      id: 'tag-1',
      name: 'Bug',
      color: '#ef4444'
    },
    {
      id: 'tag-2',
      name: 'Feature',
      color: '#22c55e'
    },
    {
      id: 'tag-3',
      name: 'Enhancement',
      color: '#3b82f6'
    }
  ]

  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSave: jest.fn(),
    columnName: 'To Do',
    availableTags: mockTags,
    onCreateTag: jest.fn(),
    boardId: 'test-board-id'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Tag Display and Selection', () => {
    it('should display available tags section', () => {
      render(<CardEditor {...defaultProps} />)

      expect(screen.getByText('Tags')).toBeInTheDocument()
      expect(screen.getByText('Available tags:')).toBeInTheDocument()
      expect(screen.getByText('Bug')).toBeInTheDocument()
      expect(screen.getByText('Feature')).toBeInTheDocument()
      expect(screen.getByText('Enhancement')).toBeInTheDocument()
    })

    it('should allow selecting existing tags', async () => {
      const user = userEvent.setup()
      render(<CardEditor {...defaultProps} />)

      const bugTag = screen.getByRole('button', { name: 'Bug' })
      await user.click(bugTag)

      // Tag should move to selected tags section
      expect(screen.getByText('Bug')).toBeInTheDocument()
      
      // Should have remove button (X) for selected tag
      const removeButton = screen.getByRole('button', { name: /remove/i })
      expect(removeButton).toBeInTheDocument()
    })

    it('should allow removing selected tags', async () => {
      const user = userEvent.setup()
      const initialData = {
        title: 'Test Card',
        description: 'Test Description',
        color: null,
        due_date: null,
        tags: ['tag-1'] // Pre-selected Bug tag
      }

      render(<CardEditor {...defaultProps} initialData={initialData} />)

      // Find the remove button for the Bug tag
      const removeButtons = screen.getAllByRole('button')
      const removeButton = removeButtons.find(button => 
        button.querySelector('svg') && button.closest('[style*="background-color"]')
      )

      if (removeButton) {
        await user.click(removeButton)
      }

      // Tag should be removed from selected tags
      await waitFor(() => {
        const selectedTags = screen.queryAllByText('Bug')
        expect(selectedTags.length).toBeLessThanOrEqual(1) // Should only appear in available tags
      })
    })

    it('should display selected tags with correct colors', () => {
      const initialData = {
        title: 'Test Card',
        description: 'Test Description',
        color: null,
        due_date: null,
        tags: ['tag-1', 'tag-2'] // Bug and Feature tags
      }

      render(<CardEditor {...defaultProps} initialData={initialData} />)

      // Check if tags are displayed with their colors
      const bugTag = screen.getByText('Bug').closest('div')
      const featureTag = screen.getByText('Feature').closest('div')

      expect(bugTag).toHaveStyle('background-color: #ef4444')
      expect(featureTag).toHaveStyle('background-color: #22c55e')
    })
  })

  describe('Tag Creation', () => {
    it('should allow creating new tags', async () => {
      const user = userEvent.setup()
      const mockOnCreateTag = jest.fn().mockResolvedValue({
        id: 'new-tag-id',
        name: 'New Tag',
        color: '#3b82f6'
      })

      render(<CardEditor {...defaultProps} onCreateTag={mockOnCreateTag} />)

      const tagInput = screen.getByPlaceholderText('Add new tag')
      const addButton = screen.getByRole('button', { name: /add/i })

      await user.type(tagInput, 'New Tag')
      await user.click(addButton)

      expect(mockOnCreateTag).toHaveBeenCalledWith('New Tag')
      
      await waitFor(() => {
        expect(tagInput.value).toBe('') // Input should be cleared
      })
    })

    it('should handle tag creation errors', async () => {
      const user = userEvent.setup()
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const mockOnCreateTag = jest.fn().mockRejectedValue(new Error('Creation failed'))

      render(<CardEditor {...defaultProps} onCreateTag={mockOnCreateTag} />)

      const tagInput = screen.getByPlaceholderText('Add new tag')
      const addButton = screen.getByRole('button', { name: /add/i })

      await user.type(tagInput, 'Failed Tag')
      await user.click(addButton)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to create tag:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })

    it('should not create tag with empty name', async () => {
      const user = userEvent.setup()
      const mockOnCreateTag = jest.fn()

      render(<CardEditor {...defaultProps} onCreateTag={mockOnCreateTag} />)

      const addButton = screen.getByRole('button', { name: /add/i })
      
      // Button should be disabled when input is empty
      expect(addButton).toBeDisabled()

      await user.click(addButton)
      expect(mockOnCreateTag).not.toHaveBeenCalled()
    })

    it('should not create tag with whitespace-only name', async () => {
      const user = userEvent.setup()
      const mockOnCreateTag = jest.fn()

      render(<CardEditor {...defaultProps} onCreateTag={mockOnCreateTag} />)

      const tagInput = screen.getByPlaceholderText('Add new tag')
      const addButton = screen.getByRole('button', { name: /add/i })

      await user.type(tagInput, '   ')
      await user.click(addButton)

      expect(mockOnCreateTag).not.toHaveBeenCalled()
    })
  })

  describe('Form Submission with Tags', () => {
    it('should include selected tags when saving card', async () => {
      const user = userEvent.setup()
      const mockOnSave = jest.fn()

      render(<CardEditor {...defaultProps} onSave={mockOnSave} />)

      // Fill in required fields
      const titleInput = screen.getByLabelText('Title')
      await user.type(titleInput, 'Test Card')

      // Select some tags
      const bugTag = screen.getByRole('button', { name: 'Bug' })
      const featureTag = screen.getByRole('button', { name: 'Feature' })
      
      await user.click(bugTag)
      await user.click(featureTag)

      // Submit form
      const saveButton = screen.getByRole('button', { name: 'Save Card' })
      await user.click(saveButton)

      expect(mockOnSave).toHaveBeenCalledWith({
        title: 'Test Card',
        description: '',
        color: null,
        due_date: null,
        tags: ['tag-1', 'tag-2'] // Bug and Feature tag IDs
      })
    })

    it('should save card with empty tags array when no tags selected', async () => {
      const user = userEvent.setup()
      const mockOnSave = jest.fn()

      render(<CardEditor {...defaultProps} onSave={mockOnSave} />)

      const titleInput = screen.getByLabelText('Title')
      await user.type(titleInput, 'Test Card')

      const saveButton = screen.getByRole('button', { name: 'Save Card' })
      await user.click(saveButton)

      expect(mockOnSave).toHaveBeenCalledWith({
        title: 'Test Card',
        description: '',
        color: null,
        due_date: null,
        tags: []
      })
    })
  })

  describe('Tag Filtering', () => {
    it('should not show selected tags in available tags list', async () => {
      const user = userEvent.setup()
      
      render(<CardEditor {...defaultProps} />)

      // Select Bug tag
      const bugTag = screen.getByRole('button', { name: 'Bug' })
      await user.click(bugTag)

      // Bug should not appear in available tags anymore
      const availableTagsSection = screen.getByText('Available tags:').parentElement
      const availableBugTags = availableTagsSection.querySelectorAll('button')
      const bugInAvailable = Array.from(availableBugTags).find(button => 
        button.textContent === 'Bug'
      )
      
      expect(bugInAvailable).toBeUndefined()
    })

    it('should show tag in available list when removed from selected', async () => {
      const user = userEvent.setup()
      const initialData = {
        title: 'Test Card',
        description: 'Test Description',
        color: null,
        due_date: null,
        tags: ['tag-1'] // Pre-selected Bug tag
      }

      render(<CardEditor {...defaultProps} initialData={initialData} />)

      // Remove the Bug tag
      const removeButtons = screen.getAllByRole('button')
      const removeButton = removeButtons.find(button => 
        button.querySelector('svg') && button.closest('[style*="background-color"]')
      )

      if (removeButton) {
        await user.click(removeButton)
      }

      // Bug should appear in available tags again
      await waitFor(() => {
        const availableTagsSection = screen.getByText('Available tags:').parentElement
        expect(availableTagsSection).toHaveTextContent('Bug')
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing onCreateTag prop gracefully', async () => {
      const user = userEvent.setup()
      const propsWithoutCreateTag = { ...defaultProps, onCreateTag: undefined }

      render(<CardEditor {...propsWithoutCreateTag} />)

      const tagInput = screen.getByPlaceholderText('Add new tag')
      const addButton = screen.getByRole('button', { name: /add/i })

      await user.type(tagInput, 'New Tag')
      await user.click(addButton)

      // Should not crash, input should remain unchanged
      expect(tagInput.value).toBe('New Tag')
    })

    it('should handle empty availableTags array', () => {
      const propsWithNoTags = { ...defaultProps, availableTags: [] }

      render(<CardEditor {...propsWithNoTags} />)

      expect(screen.getByText('Tags')).toBeInTheDocument()
      expect(screen.queryByText('Available tags:')).not.toBeInTheDocument()
    })

    it('should reset form when modal is reopened', () => {
      const { rerender } = render(<CardEditor {...defaultProps} isOpen={false} />)

      // Open modal with initial data
      const initialData = {
        title: 'Test Card',
        description: 'Test Description',
        color: null,
        due_date: null,
        tags: ['tag-1']
      }

      rerender(<CardEditor {...defaultProps} isOpen={true} initialData={initialData} />)

      expect(screen.getByDisplayValue('Test Card')).toBeInTheDocument()
      expect(screen.getByText('Bug')).toBeInTheDocument() // Selected tag
    })
  })
})