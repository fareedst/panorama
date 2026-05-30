# IMPL-GLOBAL_ERROR_BOUNDARY essence pseudocode

// [IMPL-GLOBAL_ERROR_BOUNDARY] [ARCH-NEXTJS_FRAMEWORK] [REQ-ERROR_HANDLING]: Root-level Next.js global-error boundary — client component replaces root layout with full HTML document, recovery UI, and optional error digest

## Summary contract

// [IMPL-GLOBAL_ERROR_BOUNDARY] [ARCH-NEXTJS_FRAMEWORK] [REQ-ERROR_HANDLING]: how: catch unhandled errors at root layout; render standalone document when boundary activates (production); dev uses Next overlay

CONTRACT Summary
  INPUT: error (Error with optional digest), reset () => void from Next.js
  OUTPUT: full HTML page with message, recovery actions, collapsible details
  DATA: GlobalErrorProps; inline CSS in head (no dependency on globals.css)
  CONTROL: "use client" required for reset() and onClick

## ClientBoundaryEntry

// [IMPL-GLOBAL_ERROR_BOUNDARY] [ARCH-NEXTJS_FRAMEWORK] [REQ-ERROR_HANDLING]: how: default export GlobalError marked use client per Next.js App Router convention

CONTRACT ClientBoundaryEntry
  INPUT: GlobalErrorProps from framework
  OUTPUT: React tree rooted at html element
  DATA: error.message, error.digest optional

PROCEDURE IMPL-GLOBAL_ERROR_BOUNDARY_ClientBoundaryEntry(props)
  DECLARE module as client component
  EXPORT default function GlobalError accepting error and reset

## FullHtmlDocumentShell

// [IMPL-GLOBAL_ERROR_BOUNDARY] [ARCH-NEXTJS_FRAMEWORK] [REQ-ERROR_HANDLING]: how: render html lang en, head meta charset and viewport, title, self-contained style block

CONTRACT FullHtmlDocumentShell
  INPUT: children for body
  OUTPUT: complete document replacing root layout
  DATA: inline style rules for layout, typography, button, details panel

PROCEDURE IMPL-GLOBAL_ERROR_BOUNDARY_FullHtmlDocumentShell()
  RENDER html WITH lang en
  RENDER head WITH charset utf-8, viewport meta, title "Something went wrong"
  EMBED minimal black/white centered layout styles in style element
  RENDER body wrapping error UI container

## RecoveryUserInterface

// [IMPL-GLOBAL_ERROR_BOUNDARY] [ARCH-NEXTJS_FRAMEWORK] [REQ-ERROR_HANDLING]: how: friendly heading, explanation, home link, Try again button calling reset()

CONTRACT RecoveryUserInterface
  INPUT: reset callback
  OUTPUT: visible recovery affordances
  DATA: anchor href / for home page (plain a, not Next Link — layout replaced)

PROCEDURE IMPL-GLOBAL_ERROR_BOUNDARY_RecoveryUserInterface(reset)
  RENDER h1 "Something went wrong"
  RENDER paragraph with link to home page
  RENDER button onClick invokes reset WITH label "Try again"

## ErrorDetailsPanel

// [IMPL-GLOBAL_ERROR_BOUNDARY] [ARCH-NEXTJS_FRAMEWORK] [REQ-ERROR_HANDLING]: how: collapsible details shows message and digest for server log correlation

CONTRACT ErrorDetailsPanel
  INPUT: error
  OUTPUT: optional expanded technical details
  DATA: error.message fallback "An unknown error occurred"; digest appended when present

PROCEDURE IMPL-GLOBAL_ERROR_BOUNDARY_ErrorDetailsPanel(error)
  RENDER details summary "Error details"
  RENDER pre WITH error.message OR unknown fallback
  IF error.digest present THEN append digest line to pre content

## CodeLocations

// [IMPL-GLOBAL_ERROR_BOUNDARY] [ARCH-NEXTJS_FRAMEWORK] [REQ-ERROR_HANDLING]: map implementing source files (no dedicated unit tests — boundary requires production error path)

// FILE: src/app/global-error.tsx — GlobalError component

## ErrorHandling

// [IMPL-GLOBAL_ERROR_BOUNDARY] [ARCH-NEXTJS_FRAMEWORK] [REQ-ERROR_HANDLING]: how: boundary only renders after framework catches error; reset re-renders segment without mutating pane state

PROCEDURE IMPL-GLOBAL_ERROR_BOUNDARY_on_error(context, error)
  FRAMEWORK supplies error and reset to GlobalError
  USER may retry via reset OR navigate home via anchor
  NO throw from boundary render path
