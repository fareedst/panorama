# IMPL-KEYBINDS essence pseudocode

// [IMPL-KEYBINDS] [ARCH-KEYBIND_SYSTEM] [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [REQ-REACT_SSR_STABILITY]: Top-level Keybinding Registry and Dispatcher: Keybinding registry with useMemo initialization and global keydown handler

## Summary contract

// [IMPL-KEYBINDS] [ARCH-KEYBIND_SYSTEM] [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [REQ-REACT_SSR_STABILITY]: bound module inputs, outputs, and shared data for all runtime blocks below

CONTRACT Summary
  INPUT: caller context, pane state, configuration
  OUTPUT: behavior required by IMPL-KEYBINDS
  DATA: state and configuration per implementation_approach

## LoadRegistry

// [IMPL-KEYBINDS] [ARCH-KEYBIND_SYSTEM] [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [REQ-REACT_SSR_STABILITY]: parse keybindings yaml into action map

CONTRACT LoadRegistry
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-KEYBINDS_LoadRegistry(context)
  // READ keybindings config array
  CALL READ keybindings config array
  FOR EACH entry VALIDATE unique key plus modifiers
  // BUILD Map action to handler registration key
  CALL BUILD Map action to handler registration key

## WorkspaceHandlerMap

// [IMPL-KEYBINDS] [ARCH-KEYBIND_SYSTEM] [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [REQ-REACT_SSR_STABILITY]: WorkspaceView registers handlers per action id

CONTRACT WorkspaceHandlerMap
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-KEYBINDS_WorkspaceHandlerMap(context)
  ON useMemo BUILD handlers Map
  FOR EACH keybinding LOOKUP handler by action string
  ON keydown DISPATCH to focused handler

## CodeLocations

// [IMPL-KEYBINDS] [ARCH-KEYBIND_SYSTEM] [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [REQ-REACT_SSR_STABILITY]: map implementing and verifying source files for this IMPL

// FILE: src/lib/files.keybinds.ts — Keybinding registry, matcher, formatters, validation (320 lines)
// FILE: src/app/files/components/HelpOverlay.tsx — Help overlay component (130 lines)
// FILE: src/app/files/components/CommandPalette.tsx — Command palette component (220 lines)
// FILE: src/app/files/WorkspaceView.tsx — useMemo initialization of registry (fixed from useEffect)
// FILE: config/files.yaml — Keybindings configuration (31 keybindings with valid categories)

## ErrorHandling

// [IMPL-KEYBINDS] [ARCH-KEYBIND_SYSTEM] [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [REQ-REACT_SSR_STABILITY]: surface recoverable failures without breaking pane invariants

PROCEDURE IMPL-KEYBINDS_on_error(context, error)
  LOG diagnostic with IMPL, ARCH, REQ token refs
  IF recoverable THEN retry or degrade gracefully
  ELSE propagate error to caller
