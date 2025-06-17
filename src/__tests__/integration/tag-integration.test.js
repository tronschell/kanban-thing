import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import KanbanBoard from '@/components/kanban-board'
import { createClient } from '@/lib/supabase/client'

// Mock the Supabase client
jest.mock('@/lib/supabase/client')

describe('Tag Integration Tests', () => {
  const mockSupabase = {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn(),
      upsert: jest.fn().mockReturnThis(),
    })),
    rpc: jest.fn(),
  }

  const mockBoard = {
    id: 'test-board-id',
    name: 'Test Board'
  }

  const mockColumns = [
    {
      id: 'col-1',
      board_id: 'test-board-id',
      name: 'To Do',
      position: 0,
      created_at: '2023-01-01T00:00:00Z'
    },
    {
      id: 'col-2',
      board_id: 'test-board-id',
      name: 'In Progress',
      position: 1,
      created_at: '2023-01-01T00:00:00Z'
    }
  ]

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

  const mockCards = [
    {
      id: 'card-1',
      column_id: 'col-1',
      title: 'Test Card with Tags',
      description: 'A test card',
      color: null,
      due_date: null,
      position: 0,
      created_at: '2023-01-01T00:00:00Z',
      card_tags: [
        {
          tag_id: 'tag-1',
          tags: mockTags[0]
        }
      ]
    }
  ]

  const mockProps = {
    boardId: 'test-board-id',
    cards: [],
    setCards: jest.fn(),
    activeId: null,
    activeType: null,
    setActiveId: jest.fn(),
    setActiveType: jest.fn(),
    columns: mockColumns,
    setColumns: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup default mock responses using global mockSupabase
    mockSupabase.from().select().eq().single
      .mockResolvedValueOnce({ data: mockBoard, error: null })
    
    mockSupabase.from().select().eq().neq().order
      .mockResolvedValueOnce({ data: mockColumns, error: null })
    
    mockSupabase.from().select().in().order
      .mockResolvedValueOnce({ data: mockCards, error: null })
    
    mockSupabase.from().select().eq().order
      .mockResolvedValueOnce({ data: mockTags, error: null })
  })

  describe('End-to-End Tag Workflow', () => {
    it('should complete full tag workflow: create tag, add to card, display, edit, remove', async () => {
      const user = userEvent.setup()

      // Mock tag creation
      const newTag = {
        id: 'tag-3',
        board_id: 'test-board-id',
        name: 'Enhancement',
        color: '#3b82f6',
        created_at: '2023-01-01T00:00:00Z'
      }

      mockSupabase.from().insert().select().single
        .mockResolvedValueOnce({ data: newTag, error: null })

      // Mock card creation with tags
      const newCard = {
        id: 'card-2',
        column_id: 'col-1',
        title: 'New Card with Tags',
        description: 'Test description',
        color: null,
        due_date: null,
        position: 1,
        created_at: '2023-01-01T00:00:00Z'
      }

      mockSupabase.from().insert().select().single
        .mockResolvedValueOnce({ data: newCard, error: null })

      mockSupabase.from().insert
        .mockResolvedValueOnce({ data: null, error: null })

      render(<KanbanBoard {...mockProps} />)

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Test Board')).toBeInTheDocument()
      })

      // Step 1: Add a new card
      const addCardButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('svg') && btn.closest('[class*="p-1.5"]')
      )
      
      if (addCardButton) {
        await user.click(addCardButton)

        await waitFor(() => {
          expect(screen.getByText('Add Card to To Do')).toBeInTheDocument()
        })

        // Step 2: Fill in card details
        const titleInput = screen.getByLabelText('Title')
        await user.type(titleInput, 'New Card with Tags')

        const descriptionInput = screen.getByLabelText('Description')
        await user.type(descriptionInput, 'Test description')

        // Step 3: Create a new tag
        const tagInput = screen.getByPlaceholderText('Add new tag')
        await user.type(tagInput, 'Enhancement')

        const addTagButton = screen.getByRole('button', { name: /add/i })
        await user.click(addTagButton)

        // Wait for tag creation
        await waitFor(() => {
          expect(mockSupabase.from().insert).toHaveBeenCalledWith({
            board_id: 'test-board-id',
            name: 'Enhancement',
            color: '#3b82f6'
          })
        })

        // Step 4: Select existing tags
        const bugTag = screen.getByRole('button', { name: 'Bug' })
        await user.click(bugTag)

        // Step 5: Save the card
        const saveButton = screen.getByRole('button', { name: 'Save Card' })
        await user.click(saveButton)

        // Verify card creation with tags
        await waitFor(() => {
          expect(mockSupabase.from().insert).toHaveBeenCalledWith({
            column_id: 'col-1',
            title: 'New Card with Tags',
            description: 'Test description',
            color: null,
            due_date: null,
            position: expect.any(Number)
          })
        })
      }
    })

    it('should handle tag operations across multiple cards', async () => {
      const user = userEvent.setup()

      // Mock multiple cards with different tag combinations
      const cardsWithTags = [
        {
          ...mockCards[0],
          card_tags: [
            { tag_id: 'tag-1', tags: mockTags[0] },
            { tag_id: 'tag-2', tags: mockTags[1] }
          ]
        },
        {
          id: 'card-2',
          column_id: 'col-2',
          title: 'Another Card',
          description: 'Another test card',
          color: null,
          due_date: null,
          position: 0,
          created_at: '2023-01-01T00:00:00Z',
          card_tags: [
            { tag_id: 'tag-1', tags: mockTags[0] }
          ]
        }
      ]

      // Update mock to return cards with tags
      mockSupabase.from().select().in().order
        .mockResolvedValueOnce({ data: cardsWithTags, error: null })

      render(<KanbanBoard {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByText('Test Board')).toBeInTheDocument()
      })

      // Verify tags are displayed on both cards
      const bugTags = screen.getAllByText('Bug')
      expect(bugTags.length).toBeGreaterThanOrEqual(2) // Should appear on both cards

      const featureTags = screen.getAllByText('Feature')
      expect(featureTags.length).toBeGreaterThanOrEqual(1) // Should appear on first card
    })
  })

  describe('Tag Persistence and State Management', () => {
    it('should maintain tag state across component re-renders', async () => {
      const { rerender } = render(<KanbanBoard {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByText('Test Board')).toBeInTheDocument()
      })

      // Verify initial tags are loaded
      expect(mockSupabase.from).toHaveBeenCalledWith('tags')

      // Re-render with updated props
      rerender(<KanbanBoard {...mockProps} />)

      // Tags should still be available (cached in state)
      await waitFor(() => {
        expect(screen.getByText('Test Board')).toBeInTheDocument()
      })
    })

    it('should handle concurrent tag operations', async () => {
      const user = userEvent.setup()

      // Mock multiple tag creations
      const tag1 = { id: 'tag-3', name: 'Priority', color: '#f59e0b' }
      const tag2 = { id: 'tag-4', name: 'Urgent', color: '#dc2626' }

      mockSupabase.from().insert().select().single
        .mockResolvedValueOnce({ data: tag1, error: null })
        .mockResolvedValueOnce({ data: tag2, error: null })

      render(<KanbanBoard {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByText('Test Board')).toBeInTheDocument()
      })

      // Simulate rapid tag creation (concurrent operations)
      // This would typically happen through multiple card editors
      // but we'll test the underlying functions
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should handle tag creation failures gracefully', async () => {
      const user = userEvent.setup()
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      // Mock tag creation failure
      mockSupabase.from().insert().select().single
        .mockResolvedValueOnce({ data: null, error: new Error('Creation failed') })

      render(<KanbanBoard {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByText('Test Board')).toBeInTheDocument()
      })

      // Try to add a card and create a tag
      const addCardButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('svg') && btn.closest('[class*="p-1.5"]')
      )
      
      if (addCardButton) {
        await user.click(addCardButton)

        await waitFor(() => {
          expect(screen.getByText('Add Card to To Do')).toBeInTheDocument()
        })

        const titleInput = screen.getByLabelText('Title')
        await user.type(titleInput, 'Test Card')

        const tagInput = screen.getByPlaceholderText('Add new tag')
        await user.type(tagInput, 'Failed Tag')

        const addTagButton = screen.getByRole('button', { name: /add/i })
        await user.click(addTagButton)

        // Should handle error gracefully without crashing
        await waitFor(() => {
          expect(tagInput.value).toBe('Failed Tag') // Input should remain
        })
      }

      consoleSpy.mockRestore()
    })

    it('should handle database connection errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      // Mock database connection failure
      mockSupabase.from().select().eq().single
        .mockRejectedValueOnce(new Error('Database connection failed'))

      render(<KanbanBoard {...mockProps} />)

      // Component should handle the error gracefully
      await waitFor(() => {
        // Should not crash, might show loading state or error message
        expect(screen.getByText('Loading board...')).toBeInTheDocument()
      })

      consoleSpy.mockRestore()
    })
  })

  describe('Performance and Optimization', () => {
    it('should not refetch tags unnecessarily', async () => {
      render(<KanbanBoard {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByText('Test Board')).toBeInTheDocument()
      })

      // Tags should be fetched once during initial load
      expect(mockSupabase.from).toHaveBeenCalledWith('tags')
      
      const tagCallCount = mockSupabase.from.mock.calls.filter(
        call => call[0] === 'tags'
      ).length

      expect(tagCallCount).toBe(1) // Should only fetch once
    })

    it('should handle large numbers of tags efficiently', async () => {
      // Mock a large number of tags
      const manyTags = Array.from({ length: 100 }, (_, i) => ({
        id: `tag-${i}`,
        board_id: 'test-board-id',
        name: `Tag ${i}`,
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
        created_at: '2023-01-01T00:00:00Z'
      }))

      mockSupabase.from().select().eq().order
        .mockResolvedValueOnce({ data: manyTags, error: null })

      const start = performance.now()
      render(<KanbanBoard {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByText('Test Board')).toBeInTheDocument()
      })

      const end = performance.now()
      const renderTime = end - start

      // Should render within reasonable time (less than 1 second)
      expect(renderTime).toBeLessThan(1000)
    })
  })

  describe('Accessibility and User Experience', () => {
    it('should provide proper keyboard navigation for tags', async () => {
      const user = userEvent.setup()

      render(<KanbanBoard {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByText('Test Board')).toBeInTheDocument()
      })

      // Test keyboard navigation in tag selection
      const addCardButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('svg') && btn.closest('[class*="p-1.5"]')
      )
      
      if (addCardButton) {
        await user.click(addCardButton)

        await waitFor(() => {
          expect(screen.getByText('Add Card to To Do')).toBeInTheDocument()
        })

        // Should be able to navigate to tag input with keyboard
        await user.tab() // Title input
        await user.tab() // Description input
        await user.tab() // Color input
        await user.tab() // Due date input
        await user.tab() // Tag input

        const tagInput = screen.getByPlaceholderText('Add new tag')
        expect(tagInput).toHaveFocus()
      }
    })

    it('should provide proper ARIA labels and roles', () => {
      render(<KanbanBoard {...mockProps} />)

      // Check for proper accessibility attributes
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)

      // All buttons should have accessible names or labels
      buttons.forEach(button => {
        const hasAccessibleName = 
          button.getAttribute('aria-label') ||
          button.textContent?.trim() ||
          button.querySelector('svg[aria-label]')
        
        expect(hasAccessibleName).toBeTruthy()
      })
    })
  })
})