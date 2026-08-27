# IMPL-KEYBINDS essence pseudocode

// [IMPL-KEYBINDS] [ARCH-KEYBIND_SYSTEM] [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [REQ-REACT_SSR_STABILITY]: Config-driven keybinding registry, validation, event matching, and WorkspaceView dispatch to action handlers

## Summary contract

// [IMPL-KEYBINDS] [ARCH-KEYBIND_SYSTEM] [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [REQ-REACT_SSR_STABILITY]: how: load keybindings from files.yaml into singleton registry; match keydown to action; handlers Map in WorkspaceView executes actions

```
IMPL-KEYBINDS_Summary():
  INPUT: KeybindingConfig[] from server-loaded files config
  OUTPUT: action string from matchKeybinding OR handler execution
  DATA: KeybindingRegistry (keybindings, byAction, byCategory); module singleton registry
  PRE: keybindings config available from files page
  POST: registry initialized; keydown matched to action; handler executed when present
  EFFECTS: State
  CONTROL: initialize before first render via useMemo; global keydown on window
  TERMINATION: total
```

## LoadRegistryFromConfig

// [IMPL-KEYBINDS] [ARCH-KEYBIND_SYSTEM] [REQ-KEYBOARD_SHORTCUTS_COMPLETE]: how: initializeKeybindingRegistry parses array, validates fields, builds lookup maps

```
IMPL-KEYBINDS_LoadRegistryFromConfig(keybindingsConfig):
  INPUT: keybindingsConfig array
  OUTPUT: KeybindingRegistry stored in module singleton
  DATA: valid categories list; seenActions; seenKeys for duplicate detection
  PRE: keybindingsConfig array provided
  POST: validated registry with byAction and byCategory maps stored in singleton
  EFFECTS: State
  TERMINATION: total
  FOR EACH entry VALIDATE key, action, category required
  IF category not in allowed set THEN record error
  IF duplicate action THEN warn last wins
  IF duplicate key combo THEN warn first match wins
  BUILD byAction Map action to Keybinding
  BUILD byCategory Map category to Keybinding[]
  SET module registry singleton
  LOG info count and category size
```

## LazyEmptyRegistryFallback

// [IMPL-KEYBINDS] [ARCH-KEYBIND_SYSTEM] [REQ-KEYBOARD_SHORTCUTS_COMPLETE]: how: getKeybindingRegistry returns empty maps when uninitialized with console warn

```
IMPL-KEYBINDS_LazyEmptyRegistryFallback():
  INPUT: none
  OUTPUT: empty KeybindingRegistry
  DATA: registry null check
  PRE: registry may be uninitialized
  POST: empty maps returned with warn when registry null
  EFFECTS: pure
  TERMINATION: total
  IF registry is null
  LOG warn registry not initialized
  RETURN empty keybindings and empty maps
```

## MatchKeybindingToAction

// [IMPL-KEYBINDS] [ARCH-KEYBIND_SYSTEM] [REQ-KEYBOARD_SHORTCUTS_COMPLETE]: how: iterate registry order; first matching binding wins; return action or null

```
IMPL-KEYBINDS_MatchKeybindingToAction(event):
  INPUT: KeyboardEvent
  OUTPUT: action string OR null
  DATA: matchesKeybinding helper
  PRE: registry initialized or empty fallback available
  POST: first matching action returned OR null
  EFFECTS: pure
  TERMINATION: total
  FOR EACH kb IN registry.keybindings IN order
    IF matchesKeybinding(event, kb) THEN RETURN kb.action
  RETURN null
```

## ModifierAndKeyMatchingRules

// how: single-char keys case-insensitive; special keys case-sensitive; all declared modifiers must match exactly (including absence)

```
IMPL-KEYBINDS_ModifierAndKeyMatchingRules(event, binding):
  INPUT: KeyboardEvent, Keybinding
  OUTPUT: boolean match result
  PRE: event and binding available
  POST: true only when key and all modifier flags match binding
  EFFECTS: pure
  TERMINATION: total
  IF binding.key length 1 THEN compare lowercased event.key
  ELSE compare event.key exact to binding.key
  FOR ctrl shift alt meta IN binding.modifiers
    REQUIRE event modifier flags equal declared presence
  RETURN true only if all checks pass
```

## WorkspaceSynchronousInit

// [IMPL-KEYBINDS] [ARCH-KEYBIND_SYSTEM] [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [REQ-REACT_SSR_STABILITY]: how: WorkspaceView useMemo calls initializeKeybindingRegistry once per keybindings prop before children render

```
IMPL-KEYBINDS_WorkspaceSynchronousInit(keybindings):
  INPUT: keybindings prop from files page server component
  OUTPUT: registry ready for HelpOverlay and CommandPalette
  DATA: useMemo dependency [keybindings]
  PRE: keybindings prop from server component
  POST: registry initialized before child render via useMemo not useEffect
  EFFECTS: State
  TERMINATION: total
  useMemo ON mount or keybindings change
  CALL initializeKeybindingRegistry(keybindings)
  ASSERT NOT useEffect for init (avoids race with child render)
```

## GlobalKeydownDispatch

// [IMPL-KEYBINDS] [ARCH-KEYBIND_SYSTEM] [REQ-KEYBOARD_SHORTCUTS_COMPLETE]: how: window keydown listener skips inputs and open modals; preventDefault when handler exists

```
IMPL-KEYBINDS_GlobalKeydownDispatch(event, actionHandlers):
  INPUT: KeyboardEvent, actionHandlers Map
  OUTPUT: invoked handler side effect OR warn no handler
  DATA: showHelp, showCommandPalette, showFinderDialog, showSearchDialog flags
  PRE: window keydown event and actionHandlers map available
  POST: handler invoked with preventDefault when match found OR skipped when input/modal open
  EFFECTS: IO
  TERMINATION: total
  IF target is input or textarea THEN RETURN
  IF help OR command palette OR finder OR search dialog open THEN RETURN
  action := matchKeybinding(event)
  IF action is null THEN RETURN
  handler := actionHandlers.get(action)
  IF handler exists THEN preventDefault AND call handler
  ELSE LOG warn no handler for action
```

## HelpOverlayAndCommandPalette

// [IMPL-KEYBINDS] [ARCH-KEYBIND_SYSTEM] [REQ-KEYBOARD_SHORTCUTS_COMPLETE]: how: HelpOverlay groups by category via getKeybindingsByCategory; CommandPalette fuzzy search; formatKeyCombo for display keys

```
IMPL-KEYBINDS_HelpOverlayAndCommandPalette():
  INPUT: registry after init
  OUTPUT: categorized help list; palette selection executes handleExecuteAction
  DATA: getAllCategories, getCategoryLabel, formatKeyCombo
  PRE: registry initialized
  POST: help grouped by category; palette executes selected action
  EFFECTS: IO
  TERMINATION: total
  HelpOverlay READ categories from registry
  USE formatKeyCombo as React key for duplicate actions per action id
  CommandPalette FILTER keybindings by query AND arrow navigation
  ON select CALL handleExecuteAction(action) in WorkspaceView
```

## CodeLocations

// [IMPL-KEYBINDS] [ARCH-KEYBIND_SYSTEM] [REQ-KEYBOARD_SHORTCUTS_COMPLETE] [REQ-REACT_SSR_STABILITY]: map implementing and verifying source files

// FILE: src/lib/files.keybinds.ts — registry, matchKeybinding, formatters
// FILE: src/lib/files.keybinds.test.ts — unit tests for load, match, categories
// FILE: src/app/files/WorkspaceView.tsx — useMemo init, keydown effect, actionHandlers
// FILE: src/app/files/components/HelpOverlay.tsx — categorized help UI
// FILE: src/app/files/components/CommandPalette.tsx — fuzzy command UI
// FILE: config/files.yaml — keybindings section

## ErrorHandling

// [IMPL-KEYBINDS] [ARCH-KEYBIND_SYSTEM] [REQ-KEYBOARD_SHORTCUTS_COMPLETE]: how: validation errors logged; invalid entries still load where possible; missing handler is warn-only

```
IMPL-KEYBINDS_on_error(context, error):
  INPUT: context string, error
  OUTPUT: logged diagnostic; no throw for missing handler
  PRE: error or missing handler context
  POST: validation errors logged; empty maps on uninitialized registry
  EFFECTS: pure
  TERMINATION: total
  LOG validation errors array on load
  ON match with no handler LOG warn and do not throw
  ON uninitialized registry RETURN empty maps
```
