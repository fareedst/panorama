# Testing Guide

**Version**: 0.1.0  
**Last Updated**: 2026-02-06

This document provides comprehensive information about testing in this Next.js application, including test structure, coverage requirements, and best practices following STDD methodology.

## Table of Contents

- [Test Framework](#test-framework)
- [Running Tests](#running-tests)
- [Test Coverage](#test-coverage)
- [Coverage Metrics Explained](#coverage-metrics-explained)
- [Coverage Standards](#coverage-standards)
- [Test Structure](#test-structure)
- [Writing Tests with STDD](#writing-tests-with-stdd)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Test Framework

This project uses:

- **[Vitest](https://vitest.dev)** - Fast test runner with native ESM support
- **[React Testing Library](https://testing-library.com/react)** - Component testing utilities
- **[@testing-library/jest-dom](https://github.com/testing-library/jest-dom)** - Custom DOM matchers
- **[jsdom](https://github.com/jsdom/jsdom)** - DOM implementation for Node.js

### Why Vitest?

- ⚡ **Fast**: Uses Vite for near-instant HMR
- 🔧 **Modern**: Native ESM, TypeScript, JSX support out of the box
- 🎯 **Compatible**: Jest-compatible API for easy migration
- 📊 **Coverage**: Built-in coverage with v8 or Istanbul
- 🔄 **Watch Mode**: Smart re-run only affected tests

## Running Tests

### Basic Commands

```bash
# Run all tests once (CI mode)
npm test

# Run tests in watch mode (development)
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Watch Mode Commands

When in watch mode, you can use these keyboard shortcuts:

- `a` - Run all tests
- `f` - Run only failed tests
- `t` - Filter by test name pattern
- `p` - Filter by file name pattern
- `q` - Quit watch mode
- `h` - Show help

### Advanced Options

```bash
# Run specific test file
npx vitest run src/app/page.test.tsx

# Run tests matching pattern
npx vitest run --testNamePattern="dark mode"

# Run with UI
npx vitest --ui

# Update snapshots
npx vitest run -u
```

## Test Coverage

### Current Coverage (v0.1.0)

```
Test Files:  5 passed (5)
Tests:       66 passed (66)
Coverage:    100% (application code)
```

### Latest Coverage Report

Run `npm run test:coverage` to generate a full coverage report.

**Summary**:
- **Application Code** (`src/app/`): **100%** coverage ✅
- **All Statements**: 100%
- **All Branches**: 100%
- **All Functions**: 100%
- **All Lines**: 100%

**Excluded from Coverage**:
- Configuration files (`*.config.ts`, `*.mjs`)
- Test files (`*.test.tsx`, `*.spec.tsx`)
- Test utilities (`src/test/`)
- Build output (`.next/`, `out/`, `dist/`)
- Dependencies (`node_modules/`)
- Type definitions (`*.d.ts`)

## Coverage Metrics Explained

Coverage reports show four key metrics:

### 1. Statement Coverage (% Stmts)

**What it measures**: Percentage of executable statements that were run during tests.

```typescript
// Example: 2 statements
const x = 1;           // Statement 1
const y = x + 1;       // Statement 2
```

**100% coverage** = Both statements executed in at least one test.

### 2. Branch Coverage (% Branch)

**What it measures**: Percentage of decision branches (if/else, switch, ternary) that were tested.

```typescript
// Example: 2 branches
if (condition) {       // Branch 1: true path
  doSomething();
} else {               // Branch 2: false path
  doSomethingElse();
}
```

**100% coverage** = Both true and false paths tested.

**Common scenarios**:
- If/else statements
- Switch cases
- Ternary operators (`condition ? a : b`)
- Logical operators (`&&`, `||`)

### 3. Function Coverage (% Funcs)

**What it measures**: Percentage of functions that were called during tests.

```typescript
// Example: 2 functions
function add(a, b) {       // Function 1
  return a + b;
}

function multiply(a, b) {  // Function 2
  return a * b;
}
```

**100% coverage** = Both functions called in at least one test.

### 4. Line Coverage (% Lines)

**What it measures**: Percentage of executable lines of code that were run.

**Difference from statements**: One line can contain multiple statements.

```typescript
// 1 line, 2 statements
const x = 1, y = 2;
```

**100% coverage** = The line was executed (both statements ran).

## Coverage Standards

### Project Requirements

This project maintains the following coverage standards:

| Metric | Minimum | Target | Current |
|--------|---------|--------|---------|
| **Statements** | 80% | 90% | **100%** ✅ |
| **Branches** | 80% | 90% | **100%** ✅ |
| **Functions** | 80% | 90% | **100%** ✅ |
| **Lines** | 80% | 90% | **100%** ✅ |

### Why 80% Minimum?

- **Catches most bugs**: Studies show 80% coverage catches ~90% of bugs
- **Practical balance**: 100% coverage can be impractical for edge cases
- **Focus on critical paths**: Ensures core functionality is tested
- **Industry standard**: Common target in professional projects

### When Coverage Drops Below 80%

If coverage falls below the minimum:

1. **Build fails in CI/CD** (if configured)
2. **Review required** before merging PRs
3. **Add tests** to cover uncovered code
4. **Document exceptions** if coverage can't be achieved (with rationale)

## Test Structure

### Current Test Organization

```
src/
├── app/
│   ├── layout.tsx              # Application code
│   ├── layout.test.tsx         # [REQ-ROOT_LAYOUT] tests
│   ├── page.tsx                # Application code
│   └── page.test.tsx           # [REQ-HOME_PAGE] tests
└── test/
    ├── setup.ts                # Test configuration
    ├── utils.tsx               # Test utilities (excluded from coverage)
    ├── dark-mode.test.tsx      # [REQ-DARK_MODE] tests
    ├── responsive.test.tsx     # [REQ-RESPONSIVE_DESIGN] tests
    └── integration/
        └── app.test.tsx        # [REQ-APP_STRUCTURE] integration tests
```

### Test Categories

#### 1. Component Tests (Co-located)

Tests placed next to components they test:
- `src/app/layout.test.tsx`
- `src/app/page.test.tsx`

**Test**: Component rendering, props, interactions

#### 2. Feature Tests (src/test/)

Tests for cross-cutting features:
- `dark-mode.test.tsx` - Theme switching
- `responsive.test.tsx` - Responsive behavior

**Test**: Feature functionality across components

#### 3. Integration Tests (src/test/integration/)

Tests for full application behavior:
- `app.test.tsx` - Complete app rendering

**Test**: Multiple components working together

## Writing Tests with STDD

### STDD Test Pattern

Every test follows STDD methodology with semantic token references:

```typescript
// [REQ-FEATURE_NAME] Test file description
// Tests for [feature] verifying [behavior]

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('Feature Name [REQ-FEATURE_NAME]', () => {
  it('validates behavior [IMPL-IMPLEMENTATION_NAME]', () => {
    // [REQ-FEATURE_NAME] Test description
    render(<Component />);
    
    expect(screen.getByText('content')).toBeInTheDocument();
  });
});
```

### Test Naming Convention

**Pattern**: `[Feature/Component] [REQ-TOKEN] > [specific behavior] [IMPL-TOKEN]`

**Examples**:
```typescript
describe('Home Page [REQ-HOME_PAGE]', () => {
  it('renders without errors [IMPL-HOME_PAGE]', () => {
    // Test implementation
  });
  
  it('displays welcome heading [REQ-HOME_PAGE]', () => {
    // Test implementation
  });
});
```

### Semantic Token Usage in Tests

**File-level comment**:
```typescript
// [REQ-DARK_MODE] [REQ-GLOBAL_STYLES]
// Tests for dark mode functionality verifying CSS variables,
// Tailwind classes, and automatic theme detection
```

**Describe blocks**:
```typescript
describe('Dark Mode CSS Variables [REQ-DARK_MODE]', () => {
  // Tests for this feature
});
```

**Test cases**:
```typescript
it('defines light mode color variables [IMPL-DARK_MODE]', () => {
  // [REQ-DARK_MODE] Validates light mode CSS variable definition
  // Test implementation
});
```

### AAA Pattern (Arrange, Act, Assert)

Structure tests using the AAA pattern:

```typescript
it('validates button click behavior', () => {
  // Arrange - Set up test conditions
  const handleClick = vi.fn();
  render(<Button onClick={handleClick}>Click me</Button>);
  
  // Act - Perform the action
  const button = screen.getByRole('button');
  button.click();
  
  // Assert - Verify the outcome
  expect(handleClick).toHaveBeenCalledOnce();
});
```

## Best Practices

### 1. Test Behavior, Not Implementation

❌ **Bad**: Testing internal state
```typescript
it('sets state to true', () => {
  const component = render(<Component />);
  // Don't test internal state
});
```

✅ **Good**: Testing user-visible behavior
```typescript
it('shows success message after submit', () => {
  render(<Component />);
  fireEvent.click(screen.getByRole('button'));
  expect(screen.getByText('Success!')).toBeInTheDocument();
});
```

### 2. Use Testing Library Queries

**Query Priority** (from most to least preferred):

1. **Accessible to all**:
   - `getByRole` (buttons, headings, links)
   - `getByLabelText` (form fields)
   - `getByPlaceholderText` (inputs)
   - `getByText` (non-interactive content)

2. **Semantic queries**:
   - `getByAltText` (images)
   - `getByTitle` (tooltips)

3. **Test IDs** (last resort):
   - `getByTestId` (when nothing else works)

### 3. Write Descriptive Test Names

❌ **Bad**: Vague description
```typescript
it('works correctly', () => {
  // What works? What is "correctly"?
});
```

✅ **Good**: Clear, specific description
```typescript
it('displays validation error when email is invalid [REQ-VALIDATION]', () => {
  // Clear what is tested and what behavior is expected
});
```

### 4. Keep Tests Independent

Each test should:
- Run in isolation
- Not depend on other tests
- Clean up after itself
- Not share state

### 5. Avoid Testing Implementation Details

❌ **Bad**: Testing CSS classes
```typescript
expect(button).toHaveClass('btn-primary');  // Implementation detail
```

✅ **Good**: Testing visual result
```typescript
expect(button).toHaveStyle({ backgroundColor: 'blue' });  // Visual outcome
```

### 6. Use Semantic Tokens

Always reference semantic tokens:
- In test file headers
- In describe blocks
- In test case comments
- Link to requirements

## Troubleshooting

### Tests Hanging in Watch Mode

**Problem**: `npm test` doesn't exit

**Solution**: Tests are in watch mode. Press `q` to quit or use `npm test` (now configured to run once).

### Module Not Found Errors

**Problem**: Import errors for `@/` paths

**Solution**: Check `vitest.config.ts` has correct path aliases:
```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

### next/font Errors

**Problem**: `Geist is not a function`

**Solution**: Mock is configured in `src/test/setup.ts`. Ensure setup file is loaded.

### Coverage Not Generated

**Problem**: No coverage report after `npm run test:coverage`

**Solution**: Check that `coverage` directory exists. View HTML report:
```bash
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
start coverage/index.html  # Windows
```

### Slow Test Execution

**Problem**: Tests take too long

**Solutions**:
1. Use `test:watch` to run only changed tests
2. Use `--no-threads` if parallel execution causes issues
3. Check for unnecessary `waitFor` or delays
4. Mock heavy dependencies

### JSDOM Limitations

**Problem**: CSS/Layout features don't work

**Known limitations**:
- CSS variables (can't be tested in jsdom)
- Media queries (use snapshot/documentation tests)
- Computed styles (limited support)
- Layout calculations (position, width, height)

**Solution**: Document expected behavior in tests, verify in actual browser.

## Coverage Report Formats

### Text (Console)

Basic coverage table shown in terminal after `npm run test:coverage`.

### HTML Report

Interactive report with file-by-file breakdown:

```bash
npm run test:coverage
open coverage/index.html
```

**Features**:
- File-by-file coverage
- Line-by-line highlighting
- Uncovered lines shown in red
- Branch coverage visualization

### LCOV Format

Machine-readable format for CI/CD integration:
- File: `coverage/lcov.info`
- Used by: GitHub Actions, GitLab CI, Codecov, Coveralls

### JSON Format

Programmatic access to coverage data:
- File: `coverage/coverage-final.json`
- Used by: Custom scripts, reporting tools

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

## Resources

- **Vitest Documentation**: https://vitest.dev
- **React Testing Library**: https://testing-library.com/react
- **Testing Best Practices**: https://kentcdodds.com/blog/common-mistakes-with-react-testing-library
- **STDD Methodology**: See `ai-principles.md` and `AGENTS.md`

---

**Maintained as part of STDD methodology. All tests reference semantic tokens for traceability.**

*Last Updated: 2026-02-06*
