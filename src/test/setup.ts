// [IMPL-TEST_SETUP] [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM]: Top-level Test Setup Implementation: Create test setup file with utilities and mocks
// Test setup configuration for Vitest. Loaded before any tests run.
// Configures @testing-library/jest-dom custom matchers and mocks
// next/font/google which requires Next.js build context.

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// [IMPL-TEST_SETUP] [IMPL-FILE_SEARCH] [REQ-BUILD_SYSTEM]: FunctionalLocalStorage — replace non-functional Node 22 global localStorage with in-memory Storage for Vitest/jsdom
function isFunctionalLocalStorage(storage: unknown): storage is Storage {
  return (
    storage != null &&
    typeof (storage as Storage).getItem === 'function' &&
    typeof (storage as Storage).setItem === 'function' &&
    typeof (storage as Storage).removeItem === 'function'
  );
}

function createInMemoryLocalStorage(): Storage {
  let store: Record<string, string> = {};
  return {
    get length() {
      return Object.keys(store).length;
    },
    clear() {
      store = {};
    },
    key(index: number) {
      return Object.keys(store)[index] ?? null;
    },
    getItem(key: string) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem(key: string, value: string) {
      store[key] = String(value);
    },
    removeItem(key: string) {
      delete store[key];
    },
  };
}

function installTestLocalStorage(): void {
  if (isFunctionalLocalStorage(globalThis.localStorage)) return;
  const mock = createInMemoryLocalStorage();
  Object.defineProperty(globalThis, 'localStorage', {
    value: mock,
    configurable: true,
    writable: true,
  });
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', {
      value: mock,
      configurable: true,
      writable: true,
    });
  }
}

installTestLocalStorage();

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

// [IMPL-WORKSPACE_MESH_BRIDGE] [IMPL-TEST_SETUP]: WorkspaceView uses useRouter for mesh save redirect
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/files',
  useSearchParams: () => new URLSearchParams(),
}));
