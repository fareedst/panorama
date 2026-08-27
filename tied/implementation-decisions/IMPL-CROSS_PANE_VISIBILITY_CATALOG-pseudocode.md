# IMPL-CROSS_PANE_VISIBILITY_CATALOG essence pseudocode

// [IMPL-CROSS_PANE_VISIBILITY_CATALOG] [ARCH-CROSS_PANE_VISIBILITY] [REQ-CROSS_PANE_VISIBILITY]: how: named preset catalog in localStorage panorama.crossPaneVisibility.v1

## SPEC_CATALOG_CRUD

// [IMPL-CROSS_PANE_VISIBILITY_CATALOG] [REQ-CROSS_PANE_VISIBILITY]: how: create/update/duplicate/delete presets with unique names and version bump on update

```
IMPL-CROSS_PANE_VISIBILITY_CATALOG_SpecCatalogCrud(store, operation, input):
  INPUT: CrossPaneVisibilityStore, operation, name/state patch
  OUTPUT: preset record or PresetValidationResult; persist + emit event
  DATA: storage key panorama.crossPaneVisibility.v1; version increments on update
  PRE: store initialized; operation and input defined
  POST: preset created/updated/duplicated/deleted OR validation errors returned
  EFFECTS: State, IO
  FAILURE_MODES: validation fails → { ok: false, errors }
  TERMINATION: total
  VALIDATE name trim non-empty AND unique case-insensitive (excludePresetId on update)
  IF validation fails THEN RETURN { ok: false, errors }
  IF create THEN assign id, version 1, copy state, push preset, persist, emit updated
  IF update THEN merge patch, version := existing.version + 1, persist, emit updated
  IF duplicate THEN create with newName and copied state
  IF delete THEN filter preset, persist, emit deleted
  list() RETURNS presets sorted by name
```

## RESOLVE_PANE_VISIBILITY

// [IMPL-CROSS_PANE_VISIBILITY_CATALOG] [IMPL-CROSS_PANE_VISIBILITY_UI] [REQ-CROSS_PANE_VISIBILITY]: how: toolbar and engine use pane.crossPaneVisibilityDraft as working copy

```
IMPL-CROSS_PANE_VISIBILITY_CATALOG_ResolvePaneVisibility(pane):
  INPUT: PaneCrossPaneVisibilityFields
  OUTPUT: CrossPaneVisibilityState (draft)
  PRE: pane with crossPaneVisibilityDraft field
  POST: returns pane.crossPaneVisibilityDraft
  EFFECTS: pure
  TERMINATION: total
  RETURN pane.crossPaneVisibilityDraft
```

## SET_ACTIVE_PRESET

// [IMPL-CROSS_PANE_VISIBILITY_UI] [IMPL-CROSS_PANE_VISIBILITY_CATALOG] [REQ-CROSS_PANE_VISIBILITY]: how: pane header selector loads catalog state into draft

```
IMPL-CROSS_PANE_VISIBILITY_CATALOG_SetActivePreset(pane, presetId, store):
  INPUT: pane fields, presetId | null, store
  OUTPUT: updated activeCrossPaneVisibilityId, draft, draftSourceVersion
  PRE: pane and store available
  POST: pane draft loaded from preset OR default when presetId null
  EFFECTS: State, IO
  DATA_TRANSITION: preset state copied into pane.crossPaneVisibilityDraft
  TERMINATION: total
  CALL loadPresetIntoPane(pane, presetId, store)
  IF presetId AND preset exists
    pane.activeCrossPaneVisibilityId := presetId
    pane.crossPaneVisibilityDraft := copy(preset.state)
    pane.crossPaneVisibilityDraftSourceVersion := preset.version
  ELSE
    pane.activeCrossPaneVisibilityId := null
    pane.crossPaneVisibilityDraft := DEFAULT_CROSS_PANE_VISIBILITY
    pane.crossPaneVisibilityDraftSourceVersion := null
```

## SAVE_DRAFT_TO_CATALOG

// [IMPL-CROSS_PANE_VISIBILITY_UI] [IMPL-CROSS_PANE_VISIBILITY_CATALOG] [REQ-CROSS_PANE_VISIBILITY]: how: manager Save copies focused pane draft into preset

```
IMPL-CROSS_PANE_VISIBILITY_CATALOG_SaveDraftToCatalog(focusedDraft, name, store, presetId):
  INPUT: focusedDraft state, preset name, store, optional existing id
  OUTPUT: created or updated preset
  PRE: focusedDraft and name defined; store writable
  POST: preset created or updated with draft state
  EFFECTS: State, IO
  TERMINATION: total
  IF presetId THEN store.update(presetId, { name, state: focusedDraft })
  ELSE store.create({ name, state: focusedDraft })
```

## CATALOG_DELETE_CASCADE

// [IMPL-CROSS_PANE_VISIBILITY_CATALOG] [IMPL-CROSS_PANE_VISIBILITY_UI] [REQ-CROSS_PANE_VISIBILITY]: how: on preset delete, reset panes referencing presetId to No compare filter via loadPresetIntoPane(null)

```
IMPL-CROSS_PANE_VISIBILITY_CATALOG_CatalogDeleteCascade(presetId, store, panes):
  INPUT: deleted presetId, store, open panes
  OUTPUT: panes with matching activeCrossPaneVisibilityId reset; user notice
  PRE: presetId exists in store; panes array available
  POST: referencing panes reset to default; user notified
  EFFECTS: State, IO
  TERMINATION: total
  store.delete(presetId)
  ON deleted event
    FOR each pane WHERE activeCrossPaneVisibilityId = presetId
      MERGE pane WITH loadPresetIntoPane(pane, null, store)
    NOTIFY user compare filter preset was deleted
```

## INLINE_SNAPSHOT_WHEN_DIRTY

// [IMPL-CROSS_PANE_VISIBILITY_CATALOG] [IMPL-WORKSPACE_MESH_BRIDGE] [REQ-CROSS_PANE_VISIBILITY] [REQ-WORKSPACE_MESH_BRIDGE]: how: when draft diverges from preset, snapshot v5 persists inline crossPaneVisibility on pane; else crossPaneVisibilityId only

```
IMPL-CROSS_PANE_VISIBILITY_CATALOG_InlineSnapshotWhenDirty(paneFields, store):
  INPUT: pane fields, store
  OUTPUT: snapshot fields for workspace mesh
  PRE: pane fields and store available
  POST: inline crossPaneVisibility included when draft dirty; id-only when clean
  EFFECTS: pure
  TERMINATION: total
  IF shouldSnapshotInlineCrossPaneVisibility(paneFields, store) THEN
    RETURN { crossPaneVisibilityId: paneFields.activeCrossPaneVisibilityId,
             crossPaneVisibility: copy(paneFields.crossPaneVisibilityDraft) }
  RETURN { crossPaneVisibilityId: paneFields.activeCrossPaneVisibilityId }
```

## MERGE_LISTING_WITH_CROSS_PANE_FIELDS

// [IMPL-CROSS_PANE_VISIBILITY_CATALOG] [ARCH-CROSS_PANE_VISIBILITY] [REQ-CROSS_PANE_VISIBILITY] [REQ-DIRECTORY_NAVIGATION]: how: **Listing merge** via **Cross-pane field pick** after BUILD_PANE_FROM_RAW_LISTING — attach visibility catalog fields only; never overwrite listing path/files/cursor/marks (tied/vocab/cross-pane-visibility.md)

```
IMPL-CROSS_PANE_VISIBILITY_CATALOG_MergeListingWithCrossPaneFields(listingPane, crossPaneFields):
  INPUT: listingPane (path, files, cursor, marks, display spec fields), crossPane fields only
  OUTPUT: PaneWithCrossPaneVisibility
  PRE: listingPane with path/files/cursor/marks defined
  POST: merged pane with cross-pane visibility fields; listing fields unchanged
  EFFECTS: pure
  INVARIANT: never spread full prior pane into listingPane
  TERMINATION: total
  RETURN { ...listingPane,
           activeCrossPaneVisibilityId: crossPaneFields.activeCrossPaneVisibilityId,
           crossPaneVisibilityDraft: crossPaneFields.crossPaneVisibilityDraft,
           crossPaneVisibilityDraftSourceVersion: crossPaneFields.crossPaneVisibilityDraftSourceVersion }
```

## CodeLocations

// [IMPL-CROSS_PANE_VISIBILITY_CATALOG] [ARCH-CROSS_PANE_VISIBILITY] [REQ-CROSS_PANE_VISIBILITY]: map implementing and verifying source files

// FILE: src/lib/cross-pane-visibility-store.ts — CrossPaneVisibilityStore CRUD
// FILE: src/lib/pane-cross-pane-visibility.ts — merge, loadPreset, snapshot, resolve
// FILE: src/lib/cross-pane-visibility-store.test.ts — CRUD and duplicate name
// FILE: src/lib/pane-cross-pane-visibility.test.ts — merge and dirty draft
// FILE: src/app/files/WorkspaceView.tsx — delete cascade subscriber
