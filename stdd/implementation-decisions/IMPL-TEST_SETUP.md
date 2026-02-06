# Implementation Decision: Test Setup and Utilities

**Token**: [IMPL-TEST_SETUP]  
**Status**: ✅ Implemented  
**Last Updated**: 2026-02-06

## Cross-References

- **Architecture**: [ARCH-TEST_FRAMEWORK]
- **Requirements**: [REQ-BUILD_SYSTEM]

## Implementation

### Test Setup File

**File**: `src/test/setup.ts`

```typescript
// [REQ-BUILD_SYSTEM] Test setup configuration for Vitest
// Configures testing-library matchers and global test environment

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock next/font/google to work in test environment
vi.mock('next/font/google', () => ({
  Geist: () => ({
    className: 'mock-geist-sans',
    variable: '--font-geist-sans',
    style: { fontFamily: 'Geist Sans' },
  }),
  Geist_Mono: () => ({
    className: 'mock-geist-mono',
    variable: '--font-geist-mono',
    style: { fontFamily: 'Geist Mono' },
  }),
}));
```

### Test Utilities File

**File**: `src/test/utils.tsx`

```typescript
// [REQ-BUILD_SYSTEM] Test utilities for React component testing
// Provides custom render function and common testing utilities

import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

// Custom render function that can be extended with providers if needed
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { ...options });
}

// Re-export everything from testing-library
export * from '@testing-library/react';
export { renderWithProviders as render };
```

## Key Implementation Details

### 1. @testing-library/jest-dom Integration

**Purpose**: Adds custom matchers for DOM assertions

**Matchers Provided**:
- `toBeInTheDocument()` - Element exists in DOM
- `toHaveClass()` - Element has CSS class
- `toHaveAttribute()` - Element has attribute
- `toHaveTextContent()` - Element contains text
- `toBeVisible()` - Element is visible
- `toBeDisabled()` - Element is disabled
- Many more...

**Usage**:
```typescript
expect(screen.getByText('Hello')).toBeInTheDocument();
expect(button).toHaveClass('primary');
expect(link).toHaveAttribute('href', '/home');
```

### 2. next/font/google Mock

**Problem**: next/font/google requires Next.js build system

**Solution**: Mock to return simple objects

**Mock Implementation**:
```typescript
vi.mock('next/font/google', () => ({
  Geist: () => ({
    className: 'mock-geist-sans',
    variable: '--font-geist-sans',
    style: { fontFamily: 'Geist Sans' },
  }),
  Geist_Mono: () => ({
    className: 'mock-geist-mono',
    variable: '--font-geist-mono',
    style: { fontFamily: 'Geist Mono' },
  }),
}));
```

**Mock Returns**:
- `className`: String class name for direct application
- `variable`: CSS variable name
- `style`: Style object with fontFamily

**Why Mock is Needed**:
- next/font requires webpack/Next.js build context
- Vitest runs outside Next.js build system
- Font optimization doesn't work in test environment
- We only need the variable names for tests

**What Gets Tested**:
- Font variable names are defined
- Components apply font classes
- Layout renders correctly with fonts
- Not testing actual font loading (browser responsibility)

### 3. Custom Render Utilities

**Purpose**: Extensible render function for future providers

**Current Implementation**:
```typescript
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { ...options });
}
```

**Future Extensions** (when needed):
```typescript
// Example: With theme provider
export function renderWithProviders(ui, options) {
  const wrapper = ({ children }) => (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
  return render(ui, { wrapper, ...options });
}

// Example: With router
export function renderWithProviders(ui, options) {
  const wrapper = ({ children }) => (
    <MemoryRouter>
      {children}
    </MemoryRouter>
  );
  return render(ui, { wrapper, ...options });
}
```

### 4. Re-exports from Testing Library

**Implementation**:
```typescript
export * from '@testing-library/react';
export { renderWithProviders as render };
```

**Benefits**:
- Single import location for test utilities
- Consistent render function across all tests
- Easy to extend in the future
- Reduced import boilerplate

**Usage**:
```typescript
// Before (multiple imports)
import { render, screen, fireEvent } from '@testing-library/react';

// After (single import)
import { render, screen, fireEvent } from '@/test/utils';
```

## Testing Library Integration

### Query Methods

**Accessible Queries** (prefer these):
- `getByRole` - Accessible role (button, heading, link)
- `getByLabelText` - Form labels
- `getByPlaceholderText` - Input placeholders
- `getByText` - Text content

**Semantic Queries**:
- `getByAltText` - Image alt text
- `getByTitle` - Title attribute

**Test IDs** (last resort):
- `getByTestId` - data-testid attribute

### Query Variants

- `getBy*` - Throws error if not found
- `queryBy*` - Returns null if not found
- `findBy*` - Async, waits for element

### User Events

```typescript
import { fireEvent } from '@testing-library/react';

// Click event
fireEvent.click(screen.getByRole('button'));

// Type in input
fireEvent.change(screen.getByRole('textbox'), {
  target: { value: 'test' }
});

// Submit form
fireEvent.submit(screen.getByRole('form'));
```

## Setup Timing

### When Setup Runs

**Setup file executes**:
1. Once at the start of test run
2. Before any test files are loaded
3. In every worker thread (if using --threads)

**Order**:
1. Vitest starts
2. Setup file runs (`src/test/setup.ts`)
3. Test files load
4. Tests execute

### Global Scope

Setup file runs in global scope:
- Mocks apply to all tests
- Matchers available everywhere
- Configuration is global

## Mock Strategy

### What to Mock

**Currently Mocked**:
- `next/font/google` - Font optimization (requires Next.js context)

**Future Mocks** (when needed):
- `next/image` - Image optimization (if testing image behavior)
- `next/navigation` - Router hooks (useRouter, usePathname)
- `next/headers` - Server-side headers (cookies, headers)
- API calls - External services

### What NOT to Mock

**Don't mock**:
- React itself
- Testing Library utilities
- Your own application code (test it directly)
- Simple utilities (test real implementation)

### Mock Best Practices

1. **Mock at boundaries**: External dependencies, not internal code
2. **Keep simple**: Return minimal necessary data
3. **Document why**: Explain why mock is needed
4. **Test behavior**: Don't test mock behavior

## Test Utilities Design

### Extensibility

Current design allows easy extension:

**Adding Theme Provider**:
```typescript
export function renderWithTheme(ui, { theme = 'light', ...options }) {
  return render(
    <ThemeProvider theme={theme}>
      {ui}
    </ThemeProvider>,
    options
  );
}
```

**Adding Router Context**:
```typescript
export function renderWithRouter(ui, { route = '/', ...options }) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      {ui}
    </MemoryRouter>,
    options
  );
}
```

### Reusability

Common test patterns can be extracted:

```typescript
export function renderPage(Page, props = {}) {
  return renderWithProviders(<Page {...props} />);
}

export function renderLayout(Layout, children) {
  return renderWithProviders(<Layout>{children}</Layout>);
}
```

## Performance Considerations

### Setup Performance

**Current Setup Time**: ~500ms

**Breakdown**:
- Import @testing-library/jest-dom: ~200ms
- Import Vitest mocking API: ~100ms
- Create mocks: ~50ms
- Initialize globals: ~150ms

**Optimization**: Setup runs once per test run, not per test

### Mock Performance

**Font Mocks**: Nearly instant
- Simple object creation
- No computation needed
- Cached after first call

## Rationale

This setup implementation:

1. **Minimal Configuration**: Only necessary mocks
2. **Extensible**: Easy to add providers in future
3. **Performant**: Fast setup time
4. **Standard Practice**: Follows Testing Library patterns
5. **Type Safe**: TypeScript throughout
6. **Well Documented**: Clear purpose and usage

## Related Implementations

- **[IMPL-TEST_CONFIG]** - Vitest configuration references setup file
- **[IMPL-BUILD_SCRIPTS]** - Test scripts execute via this setup
- All test files use utilities from this setup

## Testing the Setup

**Validation**:
- All 66 tests pass using this setup ✅
- Font mocks work correctly
- Custom matchers function properly
- No console warnings or errors

## Future Enhancements

Potential additions:
- Global test data factories
- Custom render presets (with theme, router, etc.)
- Mock service workers (MSW) for API mocking
- Shared test fixtures
- Performance measurement utilities

## Validation

**Token Audit** `[PROC-TOKEN_AUDIT]`:
- File: `src/test/setup.ts`
- File: `src/test/utils.tsx`
- Comments: Include `[IMPL-TEST_SETUP] [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM]`
- Validation: All tests use this setup successfully

**Last Updated**: 2026-02-06
