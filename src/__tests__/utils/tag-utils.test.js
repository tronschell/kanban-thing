/**
 * Unit tests for tag utility functions
 * These tests focus on pure functions that handle tag operations
 */

describe('Tag Utility Functions', () => {
  describe('Tag Validation', () => {
    const validateTagName = (name) => {
      if (!name || typeof name !== 'string') return false
      return name.trim().length > 0 && name.trim().length <= 50
    }

    it('should validate valid tag names', () => {
      expect(validateTagName('Bug')).toBe(true)
      expect(validateTagName('Feature Request')).toBe(true)
      expect(validateTagName('High Priority')).toBe(true)
      expect(validateTagName('a')).toBe(true) // Single character
    })

    it('should reject invalid tag names', () => {
      expect(validateTagName('')).toBe(false)
      expect(validateTagName('   ')).toBe(false) // Only whitespace
      expect(validateTagName(null)).toBe(false)
      expect(validateTagName(undefined)).toBe(false)
      expect(validateTagName(123)).toBe(false) // Not a string
    })

    it('should reject tag names that are too long', () => {
      const longName = 'a'.repeat(51) // 51 characters
      expect(validateTagName(longName)).toBe(false)
    })

    it('should accept tag names at the boundary', () => {
      const maxLengthName = 'a'.repeat(50) // Exactly 50 characters
      expect(validateTagName(maxLengthName)).toBe(true)
    })
  })

  describe('Tag Color Validation', () => {
    const validateTagColor = (color) => {
      if (!color) return true // null/undefined colors are allowed (default)
      const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
      return hexColorRegex.test(color)
    }

    it('should validate valid hex colors', () => {
      expect(validateTagColor('#ff0000')).toBe(true) // 6-digit hex
      expect(validateTagColor('#f00')).toBe(true) // 3-digit hex
      expect(validateTagColor('#FF0000')).toBe(true) // Uppercase
      expect(validateTagColor('#abc123')).toBe(true) // Mixed case
    })

    it('should accept null/undefined colors', () => {
      expect(validateTagColor(null)).toBe(true)
      expect(validateTagColor(undefined)).toBe(true)
      expect(validateTagColor('')).toBe(true)
    })

    it('should reject invalid color formats', () => {
      expect(validateTagColor('red')).toBe(false) // Named color
      expect(validateTagColor('rgb(255,0,0)')).toBe(false) // RGB format
      expect(validateTagColor('#gg0000')).toBe(false) // Invalid hex characters
      expect(validateTagColor('#ff00')).toBe(false) // Wrong length
      expect(validateTagColor('ff0000')).toBe(false) // Missing #
    })
  })

  describe('Tag Filtering and Sorting', () => {
    const mockTags = [
      { id: '1', name: 'Bug', color: '#ef4444', created_at: '2023-01-01T00:00:00Z' },
      { id: '2', name: 'Feature', color: '#22c55e', created_at: '2023-01-02T00:00:00Z' },
      { id: '3', name: 'Enhancement', color: '#3b82f6', created_at: '2023-01-03T00:00:00Z' },
      { id: '4', name: 'Documentation', color: '#8b5cf6', created_at: '2023-01-04T00:00:00Z' }
    ]

    const filterAvailableTags = (allTags, selectedTagIds) => {
      return allTags.filter(tag => !selectedTagIds.includes(tag.id))
    }

    const sortTagsByName = (tags) => {
      return [...tags].sort((a, b) => a.name.localeCompare(b.name))
    }

    const sortTagsByCreatedDate = (tags) => {
      return [...tags].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    }

    it('should filter out selected tags from available tags', () => {
      const selectedIds = ['1', '3']
      const available = filterAvailableTags(mockTags, selectedIds)
      
      expect(available).toHaveLength(2)
      expect(available.map(t => t.id)).toEqual(['2', '4'])
      expect(available.map(t => t.name)).toEqual(['Feature', 'Documentation'])
    })

    it('should return all tags when none are selected', () => {
      const available = filterAvailableTags(mockTags, [])
      expect(available).toHaveLength(4)
      expect(available).toEqual(mockTags)
    })

    it('should return empty array when all tags are selected', () => {
      const allIds = mockTags.map(t => t.id)
      const available = filterAvailableTags(mockTags, allIds)
      expect(available).toHaveLength(0)
    })

    it('should sort tags alphabetically by name', () => {
      const sorted = sortTagsByName(mockTags)
      const expectedOrder = ['Bug', 'Documentation', 'Enhancement', 'Feature']
      expect(sorted.map(t => t.name)).toEqual(expectedOrder)
    })

    it('should sort tags by creation date', () => {
      const sorted = sortTagsByCreatedDate(mockTags)
      const expectedOrder = ['1', '2', '3', '4'] // Already in chronological order
      expect(sorted.map(t => t.id)).toEqual(expectedOrder)
    })

    it('should not mutate original array when sorting', () => {
      const originalOrder = mockTags.map(t => t.name)
      sortTagsByName(mockTags)
      expect(mockTags.map(t => t.name)).toEqual(originalOrder)
    })
  })

  describe('Tag Data Transformation', () => {
    const transformCardTags = (cardData) => {
      if (!cardData.card_tags) return []
      
      return cardData.card_tags
        .map(ct => ct.tags)
        .filter(Boolean) // Remove null/undefined tags
    }

    const extractTagIds = (tags) => {
      return tags.map(tag => tag.id)
    }

    const findTagsByIds = (allTags, tagIds) => {
      return allTags.filter(tag => tagIds.includes(tag.id))
    }

    it('should transform card data with tags correctly', () => {
      const cardData = {
        id: 'card-1',
        title: 'Test Card',
        card_tags: [
          { tag_id: 'tag-1', tags: { id: 'tag-1', name: 'Bug', color: '#ef4444' } },
          { tag_id: 'tag-2', tags: { id: 'tag-2', name: 'Feature', color: '#22c55e' } }
        ]
      }

      const tags = transformCardTags(cardData)
      expect(tags).toHaveLength(2)
      expect(tags[0].name).toBe('Bug')
      expect(tags[1].name).toBe('Feature')
    })

    it('should handle card data without tags', () => {
      const cardData = { id: 'card-1', title: 'Test Card' }
      const tags = transformCardTags(cardData)
      expect(tags).toEqual([])
    })

    it('should handle card data with empty card_tags array', () => {
      const cardData = { id: 'card-1', title: 'Test Card', card_tags: [] }
      const tags = transformCardTags(cardData)
      expect(tags).toEqual([])
    })

    it('should filter out null tags', () => {
      const cardData = {
        id: 'card-1',
        title: 'Test Card',
        card_tags: [
          { tag_id: 'tag-1', tags: { id: 'tag-1', name: 'Bug', color: '#ef4444' } },
          { tag_id: 'tag-2', tags: null }, // Null tag
          { tag_id: 'tag-3', tags: { id: 'tag-3', name: 'Feature', color: '#22c55e' } }
        ]
      }

      const tags = transformCardTags(cardData)
      expect(tags).toHaveLength(2)
      expect(tags.map(t => t.name)).toEqual(['Bug', 'Feature'])
    })

    it('should extract tag IDs correctly', () => {
      const tags = [
        { id: 'tag-1', name: 'Bug' },
        { id: 'tag-2', name: 'Feature' }
      ]

      const ids = extractTagIds(tags)
      expect(ids).toEqual(['tag-1', 'tag-2'])
    })

    it('should find tags by IDs', () => {
      const allTags = [
        { id: 'tag-1', name: 'Bug', color: '#ef4444' },
        { id: 'tag-2', name: 'Feature', color: '#22c55e' },
        { id: 'tag-3', name: 'Enhancement', color: '#3b82f6' }
      ]

      const foundTags = findTagsByIds(allTags, ['tag-1', 'tag-3'])
      expect(foundTags).toHaveLength(2)
      expect(foundTags.map(t => t.name)).toEqual(['Bug', 'Enhancement'])
    })
  })

  describe('Tag Color Utilities', () => {
    const getContrastColor = (backgroundColor) => {
      if (!backgroundColor) return 'black'
      
      // Simple contrast calculation based on background color
      const hex = backgroundColor.replace('#', '')
      const r = parseInt(hex.substr(0, 2), 16)
      const g = parseInt(hex.substr(2, 2), 16)
      const b = parseInt(hex.substr(4, 2), 16)
      
      // Calculate luminance
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
      
      return luminance > 0.5 ? 'black' : 'white'
    }

    const getDefaultTagColor = () => '#3b82f6' // Default blue

    it('should return white text for dark backgrounds', () => {
      expect(getContrastColor('#000000')).toBe('white') // Black
      expect(getContrastColor('#ef4444')).toBe('white') // Red
      expect(getContrastColor('#3b82f6')).toBe('white') // Blue
    })

    it('should return black text for light backgrounds', () => {
      expect(getContrastColor('#ffffff')).toBe('black') // White
      expect(getContrastColor('#ffff00')).toBe('black') // Yellow
      expect(getContrastColor('#e5e7eb')).toBe('black') // Light gray
    })

    it('should return black for null/undefined background', () => {
      expect(getContrastColor(null)).toBe('black')
      expect(getContrastColor(undefined)).toBe('black')
      expect(getContrastColor('')).toBe('black')
    })

    it('should provide default tag color', () => {
      expect(getDefaultTagColor()).toBe('#3b82f6')
    })
  })

  describe('Tag Search and Filtering', () => {
    const mockTags = [
      { id: '1', name: 'Bug Fix', color: '#ef4444' },
      { id: '2', name: 'New Feature', color: '#22c55e' },
      { id: '3', name: 'Enhancement', color: '#3b82f6' },
      { id: '4', name: 'Documentation', color: '#8b5cf6' },
      { id: '5', name: 'Bug Report', color: '#ef4444' }
    ]

    const searchTags = (tags, searchTerm) => {
      if (!searchTerm) return tags
      
      const term = searchTerm.toLowerCase()
      return tags.filter(tag => 
        tag.name.toLowerCase().includes(term)
      )
    }

    it('should search tags by name', () => {
      const results = searchTags(mockTags, 'bug')
      expect(results).toHaveLength(2)
      expect(results.map(t => t.name)).toEqual(['Bug Fix', 'Bug Report'])
    })

    it('should be case insensitive', () => {
      const results = searchTags(mockTags, 'BUG')
      expect(results).toHaveLength(2)
    })

    it('should return all tags for empty search', () => {
      expect(searchTags(mockTags, '')).toEqual(mockTags)
      expect(searchTags(mockTags, null)).toEqual(mockTags)
      expect(searchTags(mockTags, undefined)).toEqual(mockTags)
    })

    it('should return empty array for no matches', () => {
      const results = searchTags(mockTags, 'nonexistent')
      expect(results).toEqual([])
    })

    it('should handle partial matches', () => {
      const results = searchTags(mockTags, 'feat')
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('New Feature')
    })
  })
})