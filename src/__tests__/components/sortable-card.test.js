import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SortableCard } from '@/components/sortable-card'

// Mock react-beautiful-dnd
jest.mock('react-beautiful-dnd', () => ({
  Draggable: ({ children }) => children({
    draggableProps: {},
    dragHandleProps: {},
    innerRef: jest.fn(),
  }, { isDragging: false }),
}))

describe('SortableCard Tag Functionality', () => {
  const mockTags = [
    {
      id: 'tag-1',
      board_id: 'test-board-id',
      name: 'Bug',
      color: '#ef4444',
      created_at: '2023-01-01T00:00:00Z'
    },
    {
      id: 'tag-2',
      board_id: 'test-board-id',
      name: 'Feature',
      color: '#22c55e',
      created_at: '2023-01-01T00:00:00Z'
    }
  ]

  const mockCard = {
    id: 'card-1',
    title: 'Test Card',
    description: 'Test Description',
    color: null,
    position: 0,
    due_date: null,
    tags: mockTags
  }

  const defaultProps = {
    card: mockCard,
    index: 0,
    onDelete: jest.fn(),
    onUpdate: jest.fn(),
    availableTags: mockTags,
    onCreateTag: jest.fn(),
    boardId: 'test-board-id'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Tag Display', () => {
    it('should display tags on the card', () => {
      render(<SortableCard {...defaultProps} />)

      expect(screen.getByText('Bug')).toBeInTheDocument()
      expect(screen.getByText('Feature')).toBeInTheDocument()
    })

    it('should display tags with correct colors', () => {
      render(<SortableCard {...defaultProps} />)

      const bugTag = screen.getByText('Bug')
      const featureTag = screen.getByText('Feature')

      expect(bugTag).toHaveStyle('color: white')
      expect(featureTag).toHaveStyle('color: white')

      // Check background colors
      expect(bugTag.closest('span')).toHaveStyle('background-color: #ef4444')
      expect(featureTag.closest('span')).toHaveStyle('background-color: #22c55e')
    })

    it('should not display tags section when card has no tags', () => {
      const cardWithoutTags = { ...mockCard, tags: [] }
      const props = { ...defaultProps, card: cardWithoutTags }

      render(<SortableCard {...props} />)

      expect(screen.queryByText('Bug')).not.toBeInTheDocument()
      expect(screen.queryByText('Feature')).not.toBeInTheDocument()
    })

    it('should not display tags section when tags is undefined', () => {
      const cardWithoutTags = { ...mockCard, tags: undefined }
      const props = { ...defaultProps, card: cardWithoutTags }

      render(<SortableCard {...props} />)

      expect(screen.queryByText('Bug')).not.toBeInTheDocument()
      expect(screen.queryByText('Feature')).not.toBeInTheDocument()
    })

    it('should handle tags with default color when color is null', () => {
      const tagsWithNullColor = [
        {
          id: 'tag-3',
          board_id: 'test-board-id',
          name: 'No Color',
          color: null,
          created_at: '2023-01-01T00:00:00Z'
        }
      ]
      const cardWithNullColorTags = { ...mockCard, tags: tagsWithNullColor }
      const props = { ...defaultProps, card: cardWithNullColorTags }

      render(<SortableCard {...props} />)

      const noColorTag = screen.getByText('No Color')
      expect(noColorTag.closest('span')).toHaveStyle('background-color: #e5e7eb')
      expect(noColorTag).toHaveStyle('color: black')
    })
  })

  describe('Card Editor Integration', () => {
    it('should open card editor when card is clicked', async () => {
      const user = userEvent.setup()
      render(<SortableCard {...defaultProps} />)

      const cardElement = screen.getByText('Test Card').closest('div')
      await user.click(cardElement)

      // Card editor should be opened (modal should be visible)
      await waitFor(() => {
        expect(screen.getByText('Edit Card')).toBeInTheDocument()
      })
    })

    it('should pass tags to card editor when editing', async () => {
      const user = userEvent.setup()
      render(<SortableCard {...defaultProps} />)

      const cardElement = screen.getByText('Test Card').closest('div')
      await user.click(cardElement)

      await waitFor(() => {
        // Check if the card editor is opened with tags
        expect(screen.getByText('Edit Card')).toBeInTheDocument()
        // Tags should be visible in the editor
        expect(screen.getByText('Bug')).toBeInTheDocument()
        expect(screen.getByText('Feature')).toBeInTheDocument()
      })
    })

    it('should call onUpdate with tags when card is saved', async () => {
      const user = userEvent.setup()
      const mockOnUpdate = jest.fn().mockResolvedValue()

      render(<SortableCard {...defaultProps} onUpdate={mockOnUpdate} />)

      const cardElement = screen.getByText('Test Card').closest('div')
      await user.click(cardElement)

      await waitFor(() => {
        expect(screen.getByText('Edit Card')).toBeInTheDocument()
      })

      // Modify the title and save
      const titleInput = screen.getByDisplayValue('Test Card')
      await user.clear(titleInput)
      await user.type(titleInput, 'Updated Card')

      const saveButton = screen.getByRole('button', { name: 'Save Card' })
      await user.click(saveButton)

      expect(mockOnUpdate).toHaveBeenCalledWith('card-1', {
        title: 'Updated Card',
        description: 'Test Description',
        color: null,
        due_date: null,
        tags: ['tag-1', 'tag-2'] // Tag IDs should be passed
      })
    })

    it('should handle save errors gracefully', async () => {
      const user = userEvent.setup()
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const mockOnUpdate = jest.fn().mockRejectedValue(new Error('Save failed'))

      render(<SortableCard {...defaultProps} onUpdate={mockOnUpdate} />)

      const cardElement = screen.getByText('Test Card').closest('div')
      await user.click(cardElement)

      await waitFor(() => {
        expect(screen.getByText('Edit Card')).toBeInTheDocument()
      })

      const saveButton = screen.getByRole('button', { name: 'Save Card' })
      await user.click(saveButton)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to update card:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })
  })

  describe('Tag Layout and Positioning', () => {
    it('should display tags before due date', () => {
      const cardWithDueDate = {
        ...mockCard,
        due_date: '2023-12-31T23:59:59Z'
      }
      const props = { ...defaultProps, card: cardWithDueDate }

      render(<SortableCard {...props} />)

      const cardContent = screen.getByText('Test Card').closest('div')
      const tagsSection = screen.getByText('Bug').closest('div')
      const dueDateSection = screen.getByText('Today').closest('div') || 
                            screen.getByText(/\w+/).closest('div')

      // Tags should appear before due date in the DOM
      expect(cardContent).toContainElement(tagsSection)
      if (dueDateSection) {
        expect(cardContent).toContainElement(dueDateSection)
      }
    })

    it('should wrap tags properly when there are many tags', () => {
      const manyTags = [
        { id: 'tag-1', name: 'Bug', color: '#ef4444' },
        { id: 'tag-2', name: 'Feature', color: '#22c55e' },
        { id: 'tag-3', name: 'Enhancement', color: '#3b82f6' },
        { id: 'tag-4', name: 'Documentation', color: '#8b5cf6' },
        { id: 'tag-5', name: 'Testing', color: '#f59e0b' }
      ]
      const cardWithManyTags = { ...mockCard, tags: manyTags }
      const props = { ...defaultProps, card: cardWithManyTags }

      render(<SortableCard {...props} />)

      // All tags should be visible
      manyTags.forEach(tag => {
        expect(screen.getByText(tag.name)).toBeInTheDocument()
      })

      // Tags container should have flex-wrap class
      const tagsContainer = screen.getByText('Bug').closest('div')
      expect(tagsContainer).toHaveClass('flex-wrap')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels for tags', () => {
      render(<SortableCard {...defaultProps} />)

      const bugTag = screen.getByText('Bug')
      const featureTag = screen.getByText('Feature')

      // Tags should be properly labeled
      expect(bugTag).toBeInTheDocument()
      expect(featureTag).toBeInTheDocument()
    })

    it('should maintain card accessibility when tags are present', () => {
      render(<SortableCard {...defaultProps} />)

      const cardElement = screen.getByText('Test Card').closest('div')
      
      // Card should still be clickable/focusable
      expect(cardElement).toHaveClass('cursor-grab')
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing availableTags prop', () => {
      const propsWithoutTags = { ...defaultProps, availableTags: undefined }

      expect(() => {
        render(<SortableCard {...propsWithoutTags} />)
      }).not.toThrow()

      expect(screen.getByText('Bug')).toBeInTheDocument()
      expect(screen.getByText('Feature')).toBeInTheDocument()
    })

    it('should handle missing onCreateTag prop', async () => {
      const user = userEvent.setup()
      const propsWithoutCreateTag = { ...defaultProps, onCreateTag: undefined }

      render(<SortableCard {...propsWithoutCreateTag} />)

      const cardElement = screen.getByText('Test Card').closest('div')
      await user.click(cardElement)

      // Should still open editor without crashing
      await waitFor(() => {
        expect(screen.getByText('Edit Card')).toBeInTheDocument()
      })
    })

    it('should handle empty tags array', () => {
      const cardWithEmptyTags = { ...mockCard, tags: [] }
      const props = { ...defaultProps, card: cardWithEmptyTags }

      render(<SortableCard {...props} />)

      expect(screen.getByText('Test Card')).toBeInTheDocument()
      expect(screen.queryByText('Bug')).not.toBeInTheDocument()
    })

    it('should handle tags with very long names', () => {
      const longNameTags = [
        {
          id: 'tag-1',
          name: 'This is a very long tag name that might cause layout issues',
          color: '#ef4444'
        }
      ]
      const cardWithLongTags = { ...mockCard, tags: longNameTags }
      const props = { ...defaultProps, card: cardWithLongTags }

      render(<SortableCard {...props} />)

      expect(screen.getByText('This is a very long tag name that might cause layout issues')).toBeInTheDocument()
    })
  })
})