# IMPL-GLOBAL_ERROR_BOUNDARY essence pseudocode

// [IMPL-GLOBAL_ERROR_BOUNDARY] [ARCH-NEXTJS_FRAMEWORK] [REQ-ERROR_HANDLING]: Root-level Next.js global-error boundary — client component replaces root layout with full HTML document, recovery UI, and optional error digest

## Summary contract

// [IMPL-GLOBAL_ERROR_BOUNDARY] [ARCH-NEXTJS_FRAMEWORK] [REQ-ERROR_HANDLING]: how: catch unhandled errors at root layout; render standalone document when boundary activates (production); dev uses Next overlay

```
IMPL-GLOBAL_ERROR_BOUNDARY_Summary():
  INPUT: error (Error with optional digest), reset () => void from Next.js
  OUTPUT: full HTML page with message, recovery actions, collapsible details
  DATA: GlobalErrorProps; inline CSS in head (no dependency on globals.css)
  CONTROL: "use client" required for reset() and onClick
  PRE: framework invokes GlobalError after unhandled root layout error
  POST: standalone html document rendered with recovery affordances
  EFFECTS: pure
  TERMINATION: total
```

## ClientBoundaryEntry

// [IMPL-GLOBAL_ERROR_BOUNDARY] [ARCH-NEXTJS_FRAMEWORK] [REQ-ERROR_HANDLING]: how: default export GlobalError marked use client per Next.js App Router convention

```
IMPL-GLOBAL_ERROR_BOUNDARY_ClientBoundaryEntry(props):
  INPUT: GlobalErrorProps from framework
  OUTPUT: React tree rooted at html element
  DATA: error.message, error.digest optional
  PRE: module marked "use client"
  POST: default export GlobalError accepts error and reset props
  EFFECTS: pure
  TERMINATION: total
  DECLARE module as client component
  EXPORT default function GlobalError accepting error and reset
```

## FullHtmlDocumentShell

// [IMPL-GLOBAL_ERROR_BOUNDARY] [ARCH-NEXTJS_FRAMEWORK] [REQ-ERROR_HANDLING]: how: render html lang en, head meta charset and viewport, title, self-contained style block

```
IMPL-GLOBAL_ERROR_BOUNDARY_FullHtmlDocumentShell():
  INPUT: children for body
  OUTPUT: complete document replacing root layout
  DATA: inline style rules for layout, typography, button, details panel
  PRE: GlobalError render path active
  POST: html/head/body shell with charset, viewport, title, and inline styles
  EFFECTS: pure
  TERMINATION: total
  RENDER html WITH lang en
  RENDER head WITH charset utf-8, viewport meta, title "Something went wrong"
  EMBED minimal black/white centered layout styles in style element
  RENDER body wrapping error UI container
```

## RecoveryUserInterface

// [IMPL-GLOBAL_ERROR_BOUNDARY] [ARCH-NEXTJS_FRAMEWORK] [REQ-ERROR_HANDLING]: how: friendly heading, explanation, home link, Try again button calling reset()

```
IMPL-GLOBAL_ERROR_BOUNDARY_RecoveryUserInterface(reset):
  INPUT: reset callback
  OUTPUT: visible recovery affordances
  DATA: anchor href / for home page (plain a, not Next Link — layout replaced)
  PRE: reset callback provided by framework
  POST: heading, home link, and Try again button visible and wired
  EFFECTS: Control
  TERMINATION: total
  RENDER h1 "Something went wrong"
  RENDER paragraph with link to home page
  RENDER button onClick invokes reset WITH label "Try again"
```

## ErrorDetailsPanel

// [IMPL-GLOBAL_ERROR_BOUNDARY] [ARCH-NEXTJS_FRAMEWORK] [REQ-ERROR_HANDLING]: how: collapsible details shows message and digest for server log correlation

```
IMPL-GLOBAL_ERROR_BOUNDARY_ErrorDetailsPanel(error):
  INPUT: error
  OUTPUT: optional expanded technical details
  DATA: error.message fallback "An unknown error occurred"; digest appended when present
  PRE: error object available from framework
  POST: collapsible details shows message and optional digest
  EFFECTS: pure
  TERMINATION: total
  RENDER details summary "Error details"
  RENDER pre WITH error.message OR unknown fallback
  IF error.digest present THEN append digest line to pre content
```

## CodeLocations

// [IMPL-GLOBAL_ERROR_BOUNDARY] [ARCH-NEXTJS_FRAMEWORK] [REQ-ERROR_HANDLING]: map implementing source files (no dedicated unit tests — boundary requires production error path)

// FILE: src/app/global-error.tsx — GlobalError component

## ErrorHandling

// [IMPL-GLOBAL_ERROR_BOUNDARY] [ARCH-NEXTJS_FRAMEWORK] [REQ-ERROR_HANDLING]: how: boundary only renders after framework catches error; reset re-renders segment without mutating pane state

```
IMPL-GLOBAL_ERROR_BOUNDARY_on_error(context, error):
  INPUT: framework error and reset callback
  OUTPUT: recovery UI without throw from boundary render path
  PRE: error already caught by Next.js global-error boundary
  POST: user may retry via reset or navigate home; no throw from render
  EFFECTS: Control
  TERMINATION: total
  FRAMEWORK supplies error and reset to GlobalError
  USER may retry via reset OR navigate home via anchor
  NO throw from boundary render path
```
