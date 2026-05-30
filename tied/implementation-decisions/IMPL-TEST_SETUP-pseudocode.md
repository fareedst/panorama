# IMPL-TEST_SETUP essence pseudocode

// [IMPL-TEST_SETUP] [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM]: Global Vitest setup — jest-dom matchers, functional localStorage, ResizeObserver polyfill, scrollIntoView and Next.js mocks

## ConfigureTestingLibrary

// [IMPL-TEST_SETUP] [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM]: import @testing-library/jest-dom to register DOM matchers on expect before any test file runs

CONTRACT ConfigureTestingLibrary
  INPUT: Vitest pre-test bootstrap
  OUTPUT: expect(...).toBeInTheDocument and related matchers available
  DATA: side-effect import only

PROCEDURE IMPL-TEST_SETUP_ConfigureTestingLibrary()
  IMPORT '@testing-library/jest-dom'

## FunctionalLocalStorage

// [IMPL-TEST_SETUP] [IMPL-FILE_SEARCH] [REQ-BUILD_SYSTEM]: replace non-functional Node 22 global localStorage with in-memory Storage for Vitest/jsdom

CONTRACT FunctionalLocalStorage
  INPUT: globalThis.localStorage and optional window.localStorage
  OUTPUT: working getItem/setItem/removeItem/clear/key/length for SearchHistory and BookmarkManager tests
  DATA: createInMemoryLocalStorage record store

PROCEDURE IMPL-TEST_SETUP_FunctionalLocalStorage()
  IF globalThis.localStorage exists AND getItem is not function
    THEN assign createInMemoryLocalStorage() to globalThis.localStorage AND window.localStorage when window defined
  ELSE IF already functional THEN RETURN without change

## ResizeObserverPolyfill

// [IMPL-TEST_SETUP] [IMPL-LAYOUT_CALCULATOR] [REQ-MULTI_PANE_LAYOUT] [REQ-BUILD_SYSTEM]: install ResizeObserver when undefined; observe reads HTMLElement clientWidth/clientHeight into callback contentRect

CONTRACT ResizeObserverPolyfill
  INPUT: jsdom without native ResizeObserver
  OUTPUT: global ResizeObserver class with observe/disconnect/unobserve
  DATA: used by useElementSize and WorkspaceView.toolbar-compact layout tests

PROCEDURE IMPL-TEST_SETUP_ResizeObserverPolyfill()
  IF globalThis.ResizeObserver is undefined
    THEN define class with constructor(callback)
    ON observe(element) INVOKE callback with contentRect width/height from client dimensions
    ON unobserve/disconnect NO-OP

## ScrollIntoViewMock

// [IMPL-TEST_SETUP] [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM]: stub Element.prototype.scrollIntoView for FilePane scroll tests in jsdom

CONTRACT ScrollIntoViewMock
  INPUT: Vitest vi.fn
  OUTPUT: scrollIntoView callable without jsdom implementation error
  DATA: Element.prototype.scrollIntoView

PROCEDURE IMPL-TEST_SETUP_ScrollIntoViewMock()
  ASSIGN Element.prototype.scrollIntoView := vi.fn()

## MockNextFontGoogle

// [IMPL-TEST_SETUP] [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM] [REQ-FONT_SYSTEM]: vi.mock next/font/google returning className variable style objects matching Geist and Geist_Mono shape

CONTRACT MockNextFontGoogle
  INPUT: Vitest module mock registry
  OUTPUT: RootLayout font imports resolve in unit tests without Next webpack context
  DATA: Geist → mock-geist-sans + --font-geist-sans; Geist_Mono → mock-geist-mono + --font-geist-mono

PROCEDURE IMPL-TEST_SETUP_MockNextFontGoogle()
  REGISTER vi.mock('next/font/google') returning factory objects for Geist and Geist_Mono

## MockNextNavigation

// [IMPL-TEST_SETUP] [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM] [IMPL-WORKSPACE_MESH_BRIDGE]: mock next/navigation useRouter push/replace and usePathname /files for WorkspaceView mesh redirect tests

CONTRACT MockNextNavigation
  INPUT: Vitest module mock registry
  OUTPUT: client components using useRouter do not throw in jsdom
  DATA: usePathname '/files', useSearchParams empty URLSearchParams, router methods vi.fn

PROCEDURE IMPL-TEST_SETUP_MockNextNavigation()
  REGISTER vi.mock('next/navigation') with useRouter stub object and fixed pathname

## CodeLocations

// [IMPL-TEST_SETUP] [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM]: map implementing source for this IMPL

// FILE: src/test/setup.ts — all global mocks and polyfills above
// FILE: src/test/utils.tsx — re-exports Testing Library helpers (see also IMPL-TEST_SETUP consumers)
