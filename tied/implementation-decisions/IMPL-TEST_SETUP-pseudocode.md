# IMPL-TEST_SETUP essence pseudocode

// [IMPL-TEST_SETUP] [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM]: Top-level Test Setup Implementation: Create test setup file with utilities and mocks

## Summary contract

// [IMPL-TEST_SETUP] [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM]: bound module inputs, outputs, and shared data for all runtime blocks below

CONTRACT Summary
  INPUT: caller context, pane state, configuration
  OUTPUT: behavior required by IMPL-TEST_SETUP
  DATA: state and configuration per implementation_approach

## ConfigureTestingLibrary

// [IMPL-TEST_SETUP] [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM]: Configure testing-library

CONTRACT ConfigureTestingLibrary
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-TEST_SETUP_ConfigureTestingLibrary(context)
  // Configure testing-library
  CALL Configure testing-library
  ON invalid input OR missing data THEN RETURN without mutation

## CreateTestSetupTs

// [IMPL-TEST_SETUP] [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM]: Create test/setup.ts

CONTRACT CreateTestSetupTs
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-TEST_SETUP_CreateTestSetupTs(context)
  // Create test/setup.ts
  CALL Create test/setup.ts
  ON invalid input OR missing data THEN RETURN without mutation

## MockNextNavigation

// [IMPL-TEST_SETUP] [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM]: Mock next/navigation

CONTRACT MockNextNavigation
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-TEST_SETUP_MockNextNavigation(context)
  // Mock next/navigation
  CALL Mock next/navigation
  ON invalid input OR missing data THEN RETURN without mutation

## MockWindowMatchMedia

// [IMPL-TEST_SETUP] [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM]: Mock window.matchMedia

CONTRACT MockWindowMatchMedia
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-TEST_SETUP_MockWindowMatchMedia(context)
  // Mock window.matchMedia
  CALL Mock window.matchMedia
  ON invalid input OR missing data THEN RETURN without mutation

## FunctionalLocalStorage

// [IMPL-TEST_SETUP] [IMPL-FILE_SEARCH] [REQ-BUILD_SYSTEM]: Replace non-functional Node 22 global localStorage with in-memory Storage for Vitest/jsdom.

PROCEDURE IMPL-TEST_SETUP_FunctionalLocalStorage()
  IF globalThis.localStorage exists AND getItem is not function
  THEN assign createInMemoryLocalStorage to globalThis.localStorage
  // how: Enables SearchHistory and BookmarkManager component tests without quota errors.

## CodeLocations

// [IMPL-TEST_SETUP] [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM]: Implementing files map — `src/test/setup.ts` (testing-library, localStorage shim, next/font mock, matchMedia).

## ErrorHandling

// [IMPL-TEST_SETUP] [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM]: surface recoverable failures without breaking pane invariants

PROCEDURE IMPL-TEST_SETUP_on_error(context, error)
  LOG diagnostic with IMPL, ARCH, REQ token refs
  IF recoverable THEN retry or degrade gracefully
  ELSE propagate error to caller
