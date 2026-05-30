# IMPL-HOME_PAGE essence pseudocode

// [IMPL-HOME_PAGE] [ARCH-SERVER_COMPONENTS] [REQ-HOME_PAGE]: Root home route — server component at src/app/page.tsx redirects visitors to the file manager (/files); sole-purpose app entry

## Summary contract

// [IMPL-HOME_PAGE] [ARCH-SERVER_COMPONENTS] [REQ-HOME_PAGE]: how: / no longer renders welcome/marketing content; immediate navigation to primary application surface

CONTRACT Summary
  INPUT: HTTP GET /
  OUTPUT: redirect response to /files
  DATA: next/navigation redirect helper
  CONTROL: server component (no client state)

## RootRedirectToFileManager

// [IMPL-HOME_PAGE] [ARCH-SERVER_COMPONENTS] [REQ-HOME_PAGE]: how: Home() calls redirect("/files") so App Router never paints legacy home UI

CONTRACT RootRedirectToFileManager
  INPUT: none
  OUTPUT: Next.js redirect to /files (not renderable tree in unit tests)
  DATA: redirect from next/navigation

PROCEDURE IMPL-HOME_PAGE_RootRedirectToFileManager()
  IMPORT redirect from next/navigation
  EXPORT default async or sync function Home
  INVOKE redirect WITH path "/files"
  ASSERT no config load, logo, or links in page.tsx (see IMPL-CONFIG_LOADER for site branding elsewhere)

## CodeLocations

// [IMPL-HOME_PAGE] [ARCH-SERVER_COMPONENTS] [REQ-HOME_PAGE]: map implementing and verifying source files

// FILE: src/app/page.tsx — Home redirect
// FILE: src/test/integration/app.test.tsx — documents root redirect behavior [IMPL-HOME_PAGE]

## ErrorHandling

// [IMPL-HOME_PAGE] [ARCH-SERVER_COMPONENTS] [REQ-HOME_PAGE]: how: invalid redirect target would fail at build; runtime errors propagate to framework error boundaries

PROCEDURE IMPL-HOME_PAGE_on_error(context, error)
  IF redirect throws THEN propagate to Next error handling
  ELSE no pane or workspace state involved

## E2eOnlyBoundary

// [IMPL-HOME_PAGE] [ARCH-SERVER_COMPONENTS] [REQ-HOME_PAGE]: how: redirect() side effect requires Playwright E2E; Vitest integration test documents contract only

// e2e_only_reason: next/navigation redirect() throws NEXT_REDIRECT in unit tests; browser navigation verified in e2e/root-redirect.spec.ts
// FILE: e2e/root-redirect.spec.ts — page.goto('/') asserts URL ends with /files
