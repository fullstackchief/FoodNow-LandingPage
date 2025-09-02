# FoodNow Testing Guide

## 🧪 Comprehensive Testing Setup

This project uses modern testing tools to ensure reliability, performance, and user experience quality.

## Testing Stack

### Unit & Integration Testing
- **Vitest** - Fast unit test runner
- **React Testing Library** - Component testing utilities
- **MSW** - API mocking for integration tests
- **jsdom** - DOM simulation for tests

### End-to-End Testing
- **Playwright** - Cross-browser E2E testing
- **Multi-device testing** - Desktop, tablet, mobile
- **Visual regression testing** - Screenshot comparisons

## Available Test Commands

```bash
# Unit Tests
npm test                    # Run tests in watch mode
npm run test:run           # Run all tests once
npm run test:ui            # Open Vitest UI
npm run test:coverage      # Generate coverage report

# Component & Integration Tests
npm run test:components    # Run component tests only
npm run test:integration   # Run integration tests only

# End-to-End Tests
npm run test:e2e           # Run E2E tests (headless)
npm run test:e2e:headed    # Run E2E tests (headed)
npm run test:e2e:ui        # Run E2E tests with UI
npm run test:debug         # Debug E2E tests
npm run test:mobile        # Run mobile E2E tests
npm run test:visual        # Run visual regression tests

# Combined Testing
npm run test:all           # Run unit + E2E tests
```

## Test Structure

```
tests/
├── e2e/                          # Playwright E2E tests
│   ├── homepage.spec.ts          # Homepage functionality
│   ├── restaurant-ordering.spec.ts # Order flow
│   ├── checkout-payment.spec.ts   # Payment integration
│   └── content-rendering.spec.ts  # Content & accessibility
├── integration/                   # Integration tests
│   ├── restaurant-flow.test.tsx   # Restaurant discovery
│   └── cart-functionality.test.tsx # Cart operations
└── src/test/
    ├── components/                # Component unit tests
    │   ├── Header.test.tsx
    │   ├── SearchBar.test.tsx
    │   └── RestaurantCard.test.tsx
    ├── utils.tsx                  # Test utilities
    ├── setup.ts                   # Test configuration
    └── mocks/                     # API mocks
        ├── server.ts
        └── handlers.ts
```

## Test Categories

### 1. Component Tests
Test individual React components in isolation:
- Rendering behavior
- User interactions
- Props handling
- State management

### 2. Integration Tests  
Test component integration and data flow:
- API integration
- Context providers
- State management
- User workflows

### 3. E2E Tests
Test complete user journeys:
- Homepage navigation
- Restaurant browsing
- Order placement
- Payment processing
- Mobile responsiveness

### 4. Visual & Content Tests
Ensure proper rendering and accessibility:
- Responsive design
- Image loading
- Text content
- Accessibility standards

## Mock Data & APIs

Tests use Mock Service Worker (MSW) to intercept API calls:

```typescript
// Example API mock
http.get('*/restaurants*', () => {
  return HttpResponse.json([
    {
      id: '1',
      name: 'Test Restaurant',
      cuisine_types: ['Nigerian'],
      rating: 4.5
    }
  ])
})
```

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Main branch pushes
- Release preparation

GitHub Actions workflow includes:
- TypeScript checking
- Linting validation
- Unit test execution
- E2E test suite
- Coverage reporting

## Best Practices

### Writing Tests
1. **Arrange-Act-Assert pattern**
2. **Test user behavior, not implementation**
3. **Use semantic queries** (getByRole, getByLabelText)
4. **Mock external dependencies**
5. **Test error states and edge cases**

### Test Naming
```typescript
describe('Component Name', () => {
  it('should perform expected behavior when condition', () => {
    // Test implementation
  })
})
```

### Accessibility Testing
- Use semantic HTML elements
- Test keyboard navigation
- Verify ARIA attributes
- Check color contrast
- Test screen reader compatibility

## Coverage Goals

- **Unit Tests**: >90% coverage
- **Integration Tests**: Critical user paths
- **E2E Tests**: Happy path + error scenarios
- **Accessibility**: WCAG 2.1 AA compliance

## Debugging Tests

### Unit Tests
```bash
npm run test:ui    # Visual test runner
npm test -- --reporter=verbose
```

### E2E Tests
```bash
npm run test:debug  # Step-through debugging
npx playwright show-report  # View test report
```

## Performance Testing

E2E tests include performance checks:
- Page load times
- Image loading
- API response times
- Bundle size monitoring

## Getting Started

1. **Run all tests**: `npm run test:all`
2. **Start with components**: `npm run test:components`
3. **Test a user flow**: `npm run test:e2e:headed`
4. **Check coverage**: `npm run test:coverage`

For more details on specific test implementations, check the test files in their respective directories.