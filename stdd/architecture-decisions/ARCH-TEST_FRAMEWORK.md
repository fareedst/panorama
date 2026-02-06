# Architecture Decision: Vitest Testing Framework

**Token**: [ARCH-TEST_FRAMEWORK]  
**Status**: ✅ Implemented  
**Last Updated**: 2026-02-06

## Context and Problem Statement

The application requires a comprehensive testing framework that supports modern JavaScript/TypeScript, React component testing, fast execution, and excellent developer experience. The framework must integrate with Next.js, provide code coverage, and support both CI/CD and local development workflows.

## Decision Drivers

- **Modern Support**: Native ESM, TypeScript, JSX support without configuration
- **Performance**: Fast test execution and re-runs
- **React Testing**: Component testing with React Testing Library
- **Coverage**: Built-in code coverage with multiple reporters
- **Developer Experience**: Watch mode, HMR, clear error messages
- **CI/CD Integration**: Non-watch mode for automated testing
- **Next.js Compatibility**: Work with Next.js App Router and Server Components
- **Migration Path**: Jest-compatible API for easy adoption

## Considered Options

1. **Vitest** - Fast, modern test runner with Vite
2. **Jest** - Traditional, widely-used test framework
3. **Playwright** - E2E testing focus
4. **Cypress** - E2E and component testing

## Decision Outcome

**Chosen option**: "Vitest with React Testing Library"

### Rationale

Vitest provides:
- **Native ESM Support**: Works with Next.js 16 module system without configuration
- **Fast Execution**: Uses Vite for near-instant test startup (<1 second)
- **Smart Watch Mode**: Re-runs only affected tests on file changes
- **Jest Compatible**: Same API as Jest (describe, it, expect, etc.)
- **Built-in Coverage**: v8 or Istanbul coverage without extra packages
- **TypeScript Native**: First-class TypeScript support
- **React Testing**: Seamless integration with React Testing Library
- **Modern**: Active development, growing community

### Performance Comparison

**Vitest vs Jest**:
- **Startup Time**: Vitest ~1s vs Jest ~5-10s
- **Re-run Speed**: Vitest ~100ms vs Jest ~1-3s
- **Watch Mode**: Vitest HMR-like vs Jest full re-run
- **ESM Support**: Vitest native vs Jest experimental

### React Testing Library Integration

**Why React Testing Library**:
- Industry standard for React component testing
- Focuses on testing user behavior, not implementation
- Accessible queries (getByRole, getByLabelText)
- Encourages best practices
- Works seamlessly with Vitest

## Requirements Fulfilled

- **[REQ-BUILD_SYSTEM]** - Testing scripts for development and CI/CD
- **[REQ-TYPESCRIPT]** - Native TypeScript support in tests
- **[REQ-ACCESSIBILITY]** - Testing Library encourages accessible queries

## Implementation Notes

### Dependencies

**Core Testing**:
- `vitest@^2.1.8` - Test runner
- `@vitejs/plugin-react@^4.3.4` - React support in tests

**React Testing**:
- `@testing-library/react@^16.1.0` - Component testing utilities
- `@testing-library/jest-dom@^6.6.3` - Custom DOM matchers
- `@testing-library/user-event@^14.5.2` - User interaction simulation

**Environment**:
- `jsdom@^25.0.1` - DOM implementation for Node.js

### Configuration

**vitest.config.ts**:
```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        '*.config.*',
        '**/*.test.{ts,tsx}',
        '**/test/**',
      ],
      all: true,
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
  },
});
```

### Test Scripts

**package.json**:
```json
{
  "scripts": {
    "test": "vitest run",              // CI mode (runs once)
    "test:watch": "vitest",             // Watch mode (development)
    "test:coverage": "vitest run --coverage"  // Coverage report
  }
}
```

### Test Structure

```
src/
├── app/
│   ├── layout.tsx
│   ├── layout.test.tsx        # Co-located component tests
│   ├── page.tsx
│   └── page.test.tsx          # Co-located component tests
└── test/
    ├── setup.ts               # Test configuration
    ├── utils.tsx              # Test utilities
    ├── dark-mode.test.tsx     # Feature tests
    ├── responsive.test.tsx    # Feature tests
    └── integration/
        └── app.test.tsx       # Integration tests
```

## Test Coverage Standards

### Coverage Thresholds

- **Statements**: 80% minimum, 90% target, 100% achieved ✅
- **Branches**: 80% minimum, 90% target, 100% achieved ✅
- **Functions**: 80% minimum, 90% target, 100% achieved ✅
- **Lines**: 80% minimum, 90% target, 100% achieved ✅

### Coverage Exclusions

Automatically excluded from coverage:
- Configuration files (`*.config.*`, `*.mjs`)
- Test files (`*.test.tsx`, `*.spec.tsx`)
- Test utilities (`src/test/`)
- Build output (`.next/`, `dist/`)
- Type definitions (`*.d.ts`)

### Coverage Reporters

Multiple formats for different use cases:
- **text**: Console output for quick checks
- **html**: Interactive file-by-file report
- **json**: Programmatic access
- **lcov**: CI/CD integration (Codecov, Coveralls)

## Positive Consequences

- **Fast Development**: Watch mode provides instant feedback
- **High Quality**: 100% code coverage ensures thorough testing
- **CI/CD Ready**: Runs quickly in automated pipelines
- **Developer Friendly**: Jest-compatible API, clear errors
- **Maintainable**: Tests reference STDD semantic tokens
- **Accessible**: Testing Library promotes accessible components
- **Modern**: Native ESM, TypeScript, React 19 support

## Negative Consequences

- **Learning Curve**: Different from Jest in some advanced scenarios
- **Ecosystem**: Smaller plugin ecosystem than Jest
- **Documentation**: Less Stack Overflow content than Jest
- **Mocking**: Some mocking patterns differ from Jest

## Testing Best Practices Applied

### 1. STDD Token References

All tests reference semantic tokens:
```typescript
// [REQ-DARK_MODE] Tests for dark mode functionality
describe('Dark Mode [REQ-DARK_MODE]', () => {
  it('validates CSS variables [IMPL-DARK_MODE]', () => {
    // Test implementation
  });
});
```

### 2. Accessible Queries

Use Testing Library's accessible queries:
```typescript
// ✅ Good: Accessible query
screen.getByRole('button', { name: 'Submit' });

// ❌ Bad: Test ID (last resort)
screen.getByTestId('submit-button');
```

### 3. Test Behavior, Not Implementation

```typescript
// ✅ Good: Tests user-visible behavior
expect(screen.getByText('Success!')).toBeInTheDocument();

// ❌ Bad: Tests internal state
expect(component.state.isSuccess).toBe(true);
```

### 4. AAA Pattern

```typescript
it('validates behavior', () => {
  // Arrange - Setup
  render(<Component />);
  
  // Act - Perform action
  fireEvent.click(screen.getByRole('button'));
  
  // Assert - Verify outcome
  expect(screen.getByText('Clicked')).toBeInTheDocument();
});
```

## Related Decisions

- **[ARCH-NEXTJS_FRAMEWORK]** - Vitest works seamlessly with Next.js 16
- **[ARCH-TYPESCRIPT_LANG]** - Native TypeScript support
- **[ARCH-SERVER_COMPONENTS]** - Can test server components with appropriate mocks

## Future Enhancements

Potential additions:
- **E2E Testing**: Add Playwright for end-to-end tests
- **Visual Regression**: Add visual diff testing
- **Performance Testing**: Add performance benchmarks
- **Mutation Testing**: Add Stryker for mutation coverage
- **Snapshot Testing**: Use Vitest snapshots for complex UI

## References

- [Vitest Documentation](https://vitest.dev)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [TESTING.md](../TESTING.md) - Complete testing guide

## Implementation Tokens

- **[IMPL-TEST_CONFIG]** - Vitest configuration file
- **[IMPL-BUILD_SCRIPTS]** - Test scripts in package.json
- **[IMPL-TEST_SETUP]** - Test setup and utilities

## Validation

**Token Audit** `[PROC-TOKEN_AUDIT]`:
- File: `vitest.config.ts`
- File: `src/test/setup.ts`
- Tests: 66 tests across 5 files, all passing ✅
- Coverage: 100% for application code ✅

**Last Updated**: 2026-02-06
