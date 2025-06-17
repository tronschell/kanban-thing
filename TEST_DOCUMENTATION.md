# Tag Feature Test Documentation

## Overview

This document outlines the comprehensive test suite for the tag functionality in the kanban board application. The tests follow Test-Driven Development (TDD) principles and provide extensive coverage of all tag-related features.

## Testing Framework

- **Framework**: Jest with React Testing Library
- **Environment**: jsdom for DOM simulation
- **Coverage Target**: 80% minimum across all metrics

## Test Structure

### 1. Component Tests (`src/__tests__/components/`)

#### KanbanBoard Tests (`kanban-board.test.js`)
- **Purpose**: Tests the main board component's tag functionality
- **Coverage**:
  - Tag creation and management
  - Card operations with tags
  - Data fetching with tag relationships
  - Error handling for tag operations
  - State management for tags

**Key Test Cases**:
```javascript
describe('KanbanBoard Tag Functionality', () => {
  describe('Tag Creation', () => {
    it('should create a new tag successfully')
    it('should handle tag creation errors gracefully')
  })
  
  describe('Card with Tags Operations', () => {
    it('should add a card with tags successfully')
    it('should update card tags successfully')
  })
  
  describe('Tag Data Fetching', () => {
    it('should fetch cards with tags on component mount')
    it('should handle empty tags gracefully')
  })
})
```

#### CardEditor Tests (`card-editor.test.js`)
- **Purpose**: Tests the card editing modal's tag functionality
- **Coverage**:
  - Tag display and selection
  - Tag creation within the editor
  - Form submission with tags
  - Tag filtering and validation

**Key Test Cases**:
```javascript
describe('CardEditor Tag Functionality', () => {
  describe('Tag Display and Selection', () => {
    it('should display available tags section')
    it('should allow selecting existing tags')
    it('should allow removing selected tags')
  })
  
  describe('Tag Creation', () => {
    it('should allow creating new tags')
    it('should handle tag creation errors')
    it('should not create tag with empty name')
  })
})
```

#### SortableCard Tests (`sortable-card.test.js`)
- **Purpose**: Tests individual card components with tag display
- **Coverage**:
  - Tag rendering on cards
  - Tag color handling
  - Card editor integration with tags
  - Accessibility and layout

**Key Test Cases**:
```javascript
describe('SortableCard Tag Functionality', () => {
  describe('Tag Display', () => {
    it('should display tags on the card')
    it('should display tags with correct colors')
    it('should handle tags with default color when color is null')
  })
  
  describe('Card Editor Integration', () => {
    it('should pass tags to card editor when editing')
    it('should call onUpdate with tags when card is saved')
  })
})
```

### 2. Utility Tests (`src/__tests__/utils/`)

#### Tag Utils Tests (`tag-utils.test.js`)
- **Purpose**: Tests pure utility functions for tag operations
- **Coverage**:
  - Tag validation functions
  - Tag filtering and sorting
  - Data transformation utilities
  - Color contrast calculations

**Key Test Cases**:
```javascript
describe('Tag Utility Functions', () => {
  describe('Tag Validation', () => {
    it('should validate valid tag names')
    it('should reject invalid tag names')
  })
  
  describe('Tag Color Validation', () => {
    it('should validate valid hex colors')
    it('should reject invalid color formats')
  })
  
  describe('Tag Filtering and Sorting', () => {
    it('should filter out selected tags from available tags')
    it('should sort tags alphabetically by name')
  })
})
```

### 3. Integration Tests (`src/__tests__/integration/`)

#### Tag Integration Tests (`tag-integration.test.js`)
- **Purpose**: Tests end-to-end tag workflows
- **Coverage**:
  - Complete tag lifecycle (create → assign → display → edit → remove)
  - Cross-component tag operations
  - Performance with large datasets
  - Error recovery scenarios

**Key Test Cases**:
```javascript
describe('Tag Integration Tests', () => {
  describe('End-to-End Tag Workflow', () => {
    it('should complete full tag workflow: create tag, add to card, display, edit, remove')
    it('should handle tag operations across multiple cards')
  })
  
  describe('Performance and Optimization', () => {
    it('should not refetch tags unnecessarily')
    it('should handle large numbers of tags efficiently')
  })
})
```

## Test Coverage Areas

### Functional Coverage
- ✅ Tag creation and validation
- ✅ Tag assignment to cards
- ✅ Tag removal from cards
- ✅ Tag display with colors
- ✅ Tag persistence in database
- ✅ Tag filtering and search
- ✅ Tag state management

### Error Handling Coverage
- ✅ Database connection failures
- ✅ Invalid tag data
- ✅ Network timeouts
- ✅ Concurrent operations
- ✅ Missing dependencies
- ✅ Malformed responses

### Edge Cases Coverage
- ✅ Empty tag arrays
- ✅ Null/undefined values
- ✅ Very long tag names
- ✅ Special characters in tags
- ✅ Large numbers of tags
- ✅ Rapid user interactions

### Accessibility Coverage
- ✅ Keyboard navigation
- ✅ Screen reader compatibility
- ✅ ARIA labels and roles
- ✅ Focus management
- ✅ Color contrast validation

## Running Tests

### Install Dependencies
```bash
pnpm install
```

### Run All Tests
```bash
pnpm test
```

### Run Tests in Watch Mode
```bash
pnpm test:watch
```

### Generate Coverage Report
```bash
pnpm test:coverage
```

### Run Specific Test Suites
```bash
# Component tests only
pnpm test src/__tests__/components/

# Integration tests only
pnpm test src/__tests__/integration/

# Utility tests only
pnpm test src/__tests__/utils/
```

## Test Data and Mocks

### Mock Data Structure
```javascript
const mockTags = [
  {
    id: 'tag-1',
    board_id: 'test-board-id',
    name: 'Bug',
    color: '#ef4444',
    created_at: '2023-01-01T00:00:00Z'
  }
]

const mockCard = {
  id: 'card-1',
  title: 'Test Card',
  tags: mockTags
}
```

### Supabase Mocks
- Database operations are mocked to return predictable responses
- Error scenarios are simulated for robust error handling tests
- Async operations are properly awaited in tests

## Performance Benchmarks

### Target Performance Metrics
- **Component Render Time**: < 100ms for cards with tags
- **Tag Search**: < 50ms for 100+ tags
- **Tag Creation**: < 200ms end-to-end
- **Memory Usage**: No memory leaks in tag operations

### Load Testing Scenarios
- 100+ tags per board
- 50+ cards with multiple tags each
- Rapid tag creation/deletion
- Concurrent user operations

## Continuous Integration

### Pre-commit Hooks
- Run linting and formatting
- Execute all unit tests
- Verify test coverage thresholds

### CI Pipeline
1. Install dependencies
2. Run ESLint and Prettier
3. Execute full test suite
4. Generate coverage report
5. Fail build if coverage < 80%

## Test Maintenance

### Adding New Tests
1. Follow existing naming conventions
2. Use descriptive test names
3. Include both positive and negative test cases
4. Mock external dependencies appropriately
5. Update this documentation

### Updating Existing Tests
1. Maintain backward compatibility
2. Update related test cases
3. Verify coverage is maintained
4. Document breaking changes

## Debugging Tests

### Common Issues
- **Mock not working**: Check mock setup in `jest.setup.js`
- **Async test failures**: Ensure proper `await` usage
- **Component not rendering**: Verify all required props are provided
- **Coverage gaps**: Use `--coverage` flag to identify untested code

### Debug Commands
```bash
# Run tests with verbose output
pnpm test --verbose

# Run specific test file
pnpm test card-editor.test.js

# Debug specific test
pnpm test --testNamePattern="should create a new tag"
```

## Future Test Enhancements

### Planned Additions
- [ ] Visual regression tests for tag colors
- [ ] Performance benchmarking automation
- [ ] Cross-browser compatibility tests
- [ ] Mobile responsiveness tests
- [ ] Internationalization tests

### Test Quality Improvements
- [ ] Property-based testing for tag validation
- [ ] Mutation testing for test effectiveness
- [ ] Snapshot testing for UI consistency
- [ ] End-to-end tests with Playwright