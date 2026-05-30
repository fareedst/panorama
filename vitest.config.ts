// [IMPL-TEST_CONFIG] [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM]: Vitest configuration — jsdom environment, global APIs, setup file, coverage thresholds, path aliases
// Configures jsdom environment, React support, coverage reporting,
// and test utilities for the Next.js application.

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // [IMPL-TEST_CONFIG] [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM]: configure jsdom test environment and Vitest globals for describe/it/expect without per-file imports
    environment: 'jsdom',
    globals: true,
    // [IMPL-TEST_CONFIG] [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM] [IMPL-LOGGER_CONFIG]: load src/test/setup.ts before tests; set CONSOLE_ERRORS false to suppress logger console mirroring unless test resets modules
    setupFiles: ['./src/test/setup.ts'],
    // [IMPL-TEST_CONFIG] [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM] [IMPL-LOGGER_CONFIG] Suppress ERROR/FATAL console mirroring during tests;
    // logger.test.ts uses vi.resetModules() when asserting console behavior.
    env: {
      CONSOLE_ERRORS: 'false',
    },
    // [IMPL-TEST_CONFIG] [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM]: disable CSS injection in jsdom; exclude node_modules dist e2e Playwright paths from Vitest discovery
    // (@layer, @property, etc.) triggers "Could not parse CSS stylesheet" in jsdom.
    // Unit tests assert DOM/behavior, not computed styles; E2E covers real CSS.
    css: false,
    // [IMPL-TEST_CONFIG] Exclude E2E tests (Playwright) from Vitest
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**',  // Playwright E2E tests
      '**/.{idea,git,cache,output,temp}/**',
    ],
    // [IMPL-TEST_CONFIG] [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM]: v8 coverage on src/app and src/lib with 80% lines/functions/branches/statements thresholds
    coverage: {
      // [IMPL-TEST_CONFIG] [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM]: how: provider v8, reporters, include/exclude globs, all-files collection
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
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
  // [IMPL-TEST_CONFIG] [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM]: resolve @ alias to ./src matching tsconfig for consistent imports in tests
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
