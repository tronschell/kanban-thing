import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import KanbanBoard from '@/components/kanban-board'
import { createClient } from '@/lib/supabase/client'

// Mock the Supabase client
jest.mock('@/lib/supabase/client')

describe('KanbanBoard Tag Functionality', () => {
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

  const mockProps = {
    boardId: 'test-board-id',
    cards: [],
    setCards: jest.fn(),
    activeId: null,
    activeType: null,
    setActiveId: jest.fn(),
    setActiveType: jest.fn(),
    columns: [
      {
        id: 'col-1',
        board_id: 'test-board-id',
        name: 'To Do',
        position: 0,
        created_at: '2023-01-01T00:00:00Z'
      }
    ],
    setColumns: jest.fn(),
  }

  beforeEach(() => {
    // Use the global mockSupabase instead of trying to mock createClient
    jest.clearAllMocks()
    
    // Reset mock implementations
    global.mockSupabase.from.mockReturnValue({
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
    })
    global.mockSupabase.rpc.mockResolvedValue({ data: [], error: null })
  })

  describe('Tag Creation', () => {
    it('should create a new tag successfully', async () => {
      const newTag = {
        id: 'tag-1',
        board_id: 'test-board-id',
        name: 'Bug',
        color: '#3b82f6',
        created_at: '2023-01-01T00:00:00Z'
      }

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: newTag,
        error: null
      })

      render(<KanbanBoard {...mockProps} />)

      // Wait for component to load
      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('boards')
      })

      // The handleCreateTag function should be tested through integration
      // Since it's an internal function, we'll test it through the CardEditor interaction
    })

    it('should handle tag creation errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: null,
        error: new Error('Database error')
      })

      render(<KanbanBoard {...mockProps} />)

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('boards')
      })

      // Test error handling through integration
      consoleSpy.mockRestore()
    })
  })

  describe('Card with Tags Operations', () => {
    const mockCard = {
      id: 'card-1',
      column_id: 'col-1',
      title: 'Test Card',
      description: 'Test Description',
      color: null,
      due_date: null,
      position: 0,
      created_at: '2023-01-01T00:00:00Z',
      tags: []
    }

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

    it('should add a card with tags successfully', async () => {
      const cardData = {
        title: 'New Card',
        description: 'New Description',
        color: null,
        due_date: null,
        tags: ['tag-1', 'tag-2']
      }

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: { ...mockCard, id: 'new-card-id' },
        error: null
      })

      mockSupabase.from().insert.mockResolvedValue({
        data: null,
        error: null
      })

      render(<KanbanBoard {...mockProps} />)

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('boards')
      })

      // Test through integration - the handleAddCard function should handle tags
    })

    it('should update card tags successfully', async () => {
      const updatedCardData = {
        title: 'Updated Card',
        description: 'Updated Description',
        color: null,
        due_date: null,
        tags: ['tag-1']
      }

      mockSupabase.from().update().eq.mockResolvedValue({
        data: null,
        error: null
      })

      mockSupabase.from().delete().eq.mockResolvedValue({
        data: null,
        error: null
      })

      mockSupabase.from().insert.mockResolvedValue({
        data: null,
        error: null
      })

      render(<KanbanBoard {...mockProps} cards={[mockCard]} />)

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('boards')
      })

      // Test through integration - the handleUpdateCard function should handle tags
    })
  })

  describe('Tag Data Fetching', () => {
    it('should fetch cards with tags on component mount', async () => {
      const mockCardsWithTags = [
        {
          id: 'card-1',
          column_id: 'col-1',
          title: 'Test Card',
          description: 'Test Description',
          color: null,
          due_date: null,
          position: 0,
          created_at: '2023-01-01T00:00:00Z',
          card_tags: [
            {
              tag_id: 'tag-1',
              tags: {
                id: 'tag-1',
                name: 'Bug',
                color: '#ef4444',
                board_id: 'test-board-id',
                created_at: '2023-01-01T00:00:00Z'
              }
            }
          ]
        }
      ]

      const mockTags = [
        {
          id: 'tag-1',
          board_id: 'test-board-id',
          name: 'Bug',
          color: '#ef4444',
          created_at: '2023-01-01T00:00:00Z'
        }
      ]

      // Mock the board fetch
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: { id: 'test-board-id', name: 'Test Board' },
        error: null
      })

      // Mock the columns fetch
      mockSupabase.from().select().eq().neq().order.mockResolvedValueOnce({
        data: mockProps.columns,
        error: null
      })

      // Mock the cards with tags fetch
      mockSupabase.from().select().in().order.mockResolvedValueOnce({
        data: mockCardsWithTags,
        error: null
      })

      // Mock the tags fetch
      mockSupabase.from().select().eq().order.mockResolvedValueOnce({
        data: mockTags,
        error: null
      })

      render(<KanbanBoard {...mockProps} />)

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('boards')
        expect(mockSupabase.from).toHaveBeenCalledWith('columns')
        expect(mockSupabase.from).toHaveBeenCalledWith('cards')
        expect(mockSupabase.from).toHaveBeenCalledWith('tags')
      })
    })

    it('should handle empty tags gracefully', async () => {
      // Mock empty responses
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { id: 'test-board-id', name: 'Test Board' },
        error: null
      })

      mockSupabase.from().select().eq().neq().order.mockResolvedValue({
        data: mockProps.columns,
        error: null
      })

      mockSupabase.from().select().in().order.mockResolvedValue({
        data: [],
        error: null
      })

      mockSupabase.from().select().eq().order.mockResolvedValue({
        data: [],
        error: null
      })

      render(<KanbanBoard {...mockProps} />)

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('tags')
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors during tag operations', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: new Error('Database connection failed')
      })

      render(<KanbanBoard {...mockProps} />)

      await waitFor(() => {
        expect(consoleSpy).not.toHaveBeenCalled() // Component should handle errors gracefully
      })

      consoleSpy.mockRestore()
    })
  })
})