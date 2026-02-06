// [IMPL-TEST_SETUP] [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM]
// Test utilities for React component testing. Provides custom render function
// that can be extended with providers (theme, router, etc.) as needed.
// Re-exports Testing Library for convenient single-import usage.

import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

// [IMPL-TEST_SETUP] Custom render function extensible with future providers
// Currently wraps standard render but can be enhanced with ThemeProvider,
// Router context, Redux store, or other global providers as needed.
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { ...options });
}

// [IMPL-TEST_SETUP] Re-export all Testing Library utilities
// Enables single import: import { render, screen } from '@/test/utils'
export * from '@testing-library/react';
export { renderWithProviders as render };
