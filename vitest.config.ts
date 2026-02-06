// [IMPL-TEST_CONFIG] [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM]
// Vitest configuration for comprehensive React component testing.
// Configures jsdom environment, React support, coverage reporting,
// and test utilities for the Next.js application.

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // [IMPL-TEST_CONFIG] Use jsdom for DOM simulation in Node.js environment
    environment: 'jsdom',
    // [IMPL-TEST_CONFIG] Enable global test APIs (describe, it, expect)
    globals: true,
    // [IMPL-TEST_CONFIG] Setup file for matchers and mocks
    setupFiles: ['./src/test/setup.ts'],
    // [IMPL-TEST_CONFIG] Process CSS imports for Tailwind classes
    css: true,
    // [IMPL-TEST_CONFIG] [REQ-BUILD_SYSTEM] Coverage configuration
    coverage: {
      // [IMPL-TEST_CONFIG] Use v8 for fast coverage (no instrumentation)
      provider: 'v8',
      // [IMPL-TEST_CONFIG] Multiple report formats for different use cases
      reporter: ['text', 'json', 'html', 'lcov'],
      // [IMPL-TEST_CONFIG] Exclude config files, tests, and utilities from coverage
      exclude: [
        // Configuration files
        '*.config.*',
        '*.mjs',
        '*.cjs',
        // Test files and utilities
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/test/**',
        '**/__tests__/**',
        // Build output
        '.next/**',
        'out/**',
        'dist/**',
        // Dependencies
        'node_modules/**',
        // Types
        '**/*.d.ts',
        // Setup files
        'src/test/setup.ts',
        'src/test/utils.tsx',
      ],
      // [IMPL-TEST_CONFIG] Include application code and library modules in coverage
      include: [
        'src/app/**/*.{ts,tsx}',
        'src/lib/**/*.{ts,tsx}',
      ],
      // [IMPL-TEST_CONFIG] Collect coverage from all files (even untested)
      all: true,
      // [IMPL-TEST_CONFIG] [REQ-BUILD_SYSTEM] 80% minimum coverage thresholds
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
  },
  // [IMPL-TEST_CONFIG] Path aliases matching tsconfig.json for consistent imports
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
