// [IMPL-TEST_SETUP] [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM]: Global Vitest setup — jest-dom matchers, functional localStorage, ResizeObserver polyfill, scrollIntoView and Next.js mocks
// Test setup configuration for Vitest. Loaded before any tests run.
// Configures @testing-library/jest-dom custom matchers and mocks
// next/font/google which requires Next.js build context.

// [IMPL-TEST_SETUP] [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM]: import @testing-library/jest-dom to register DOM matchers on expect before any test file runs
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

// [IMPL-TEST_SETUP] [IMPL-LAYOUT_CALCULATOR] [REQ-MULTI_PANE_LAYOUT] [REQ-BUILD_SYSTEM]: install ResizeObserver when undefined; observe reads HTMLElement clientWidth/clientHeight into callback contentRect
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserverPolyfill {
    private callback: ResizeObserverCallback;

    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }

    observe(element: Element) {
      const width = element instanceof HTMLElement ? element.clientWidth : 0;
      const height = element instanceof HTMLElement ? element.clientHeight : 0;
      this.callback(
        [{ contentRect: { width, height } } as ResizeObserverEntry],
        this as unknown as ResizeObserver,
      );
    }

    unobserve() {}

    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

// [IMPL-TEST_SETUP] [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM]: stub Element.prototype.scrollIntoView for FilePane scroll tests in jsdom
// scrollIntoView is not available in jsdom test environment
Element.prototype.scrollIntoView = vi.fn();

// [IMPL-TEST_SETUP] [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM] [REQ-FONT_SYSTEM]: vi.mock next/font/google returning className variable style objects matching Geist and Geist_Mono shape
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

// [IMPL-TEST_SETUP] [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM] [IMPL-WORKSPACE_MESH_BRIDGE]: mock next/navigation useRouter push/replace and usePathname /files for WorkspaceView mesh redirect tests
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
