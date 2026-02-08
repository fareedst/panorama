// [IMPL-TEST_SETUP] [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM]
// Test setup configuration for Vitest. Loaded before any tests run.
// Configures @testing-library/jest-dom custom matchers and mocks
// next/font/google which requires Next.js build context.

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// [IMPL-TEST_SETUP] Mock scrollIntoView for FilePane scroll tests
// scrollIntoView is not available in jsdom test environment
Element.prototype.scrollIntoView = vi.fn();

// [IMPL-TEST_SETUP] Mock next/font/google to work in test environment
// next/font requires Next.js webpack context which isn't available in Vitest.
// This mock returns simple objects with the same structure as real font objects.
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
