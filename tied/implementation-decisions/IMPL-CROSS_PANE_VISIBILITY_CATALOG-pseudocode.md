# IMPL-CROSS_PANE_VISIBILITY_CATALOG essence pseudocode

// [IMPL-CROSS_PANE_VISIBILITY_CATALOG] [ARCH-CROSS_PANE_VISIBILITY] [REQ-CROSS_PANE_VISIBILITY]: how: named preset catalog in localStorage panorama.crossPaneVisibility.v1

## SPEC_CATALOG_CRUD

// [IMPL-CROSS_PANE_VISIBILITY_CATALOG] [REQ-CROSS_PANE_VISIBILITY]: how: create/update/duplicate/delete presets with unique names and version bump on update

```
PROCEDURE SPEC_CATALOG_CRUD(store, operation, input)
  VALIDATE unique name (case-insensitive)
  PERSIST panorama.crossPaneVisibility.v1
  EMIT updated | deleted event to subscribers
```

## RESOLVE_PANE_VISIBILITY

// [IMPL-CROSS_PANE_VISIBILITY_CATALOG] [IMPL-CROSS_PANE_VISIBILITY_UI] [REQ-CROSS_PANE_VISIBILITY]: how: toolbar and engine use pane.crossPaneVisibilityDraft as working copy

```
PROCEDURE RESOLVE_PANE_VISIBILITY(pane)
  RETURN pane.crossPaneVisibilityDraft
```

## SET_ACTIVE_PRESET

// [IMPL-CROSS_PANE_VISIBILITY_UI] [IMPL-CROSS_PANE_VISIBILITY_CATALOG] [REQ-CROSS_PANE_VISIBILITY]: how: pane header selector loads catalog state into draft

```
PROCEDURE SET_ACTIVE_PRESET(paneIndex, presetId, store)
  pane.activeCrossPaneVisibilityId := presetId
  pane.crossPaneVisibilityDraft := copy(store.get(presetId).state)
  pane.crossPaneVisibilityDraftSourceVersion := store.get(presetId).version
```

## SAVE_DRAFT_TO_CATALOG

// [IMPL-CROSS_PANE_VISIBILITY_UI] [IMPL-CROSS_PANE_VISIBILITY_CATALOG] [REQ-CROSS_PANE_VISIBILITY]: how: manager Save copies focused pane draft into preset

```
PROCEDURE SAVE_DRAFT_TO_CATALOG(focusedDraft, name, store)
  store.create OR store.update WITH state = focusedDraft
```

## CATALOG_DELETE_CASCADE

// [IMPL-CROSS_PANE_VISIBILITY_CATALOG] [IMPL-CROSS_PANE_VISIBILITY_UI] [REQ-CROSS_PANE_VISIBILITY]: how: on preset delete, reset panes referencing presetId to No compare filter via loadPresetIntoPane(null)

```
PROCEDURE CATALOG_DELETE_CASCADE(presetId, store)
  store.delete(presetId)
  FOR each pane WHERE activeCrossPaneVisibilityId = presetId
    loadPresetIntoPane(pane, null, store)
  NOTIFY user compare filter preset was deleted
```

## INLINE_SNAPSHOT_WHEN_DIRTY

// [IMPL-CROSS_PANE_VISIBILITY_CATALOG] [IMPL-WORKSPACE_MESH_BRIDGE] [REQ-CROSS_PANE_VISIBILITY] [REQ-WORKSPACE_MESH_BRIDGE]: how: when draft diverges from preset, snapshot v5 persists inline crossPaneVisibility on pane; else crossPaneVisibilityId only

```
PROCEDURE INLINE_SNAPSHOT_WHEN_DIRTY(paneFields, store)
  IF isCrossPaneVisibilityDraftDirty(paneFields, store) THEN
    RETURN { crossPaneVisibilityId, crossPaneVisibility: paneFields.crossPaneVisibilityDraft }
  RETURN { crossPaneVisibilityId: paneFields.activeCrossPaneVisibilityId }
```

## MERGE_LISTING_WITH_CROSS_PANE_FIELDS

// [IMPL-CROSS_PANE_VISIBILITY_CATALOG] [ARCH-CROSS_PANE_VISIBILITY] [REQ-CROSS_PANE_VISIBILITY] [REQ-DIRECTORY_NAVIGATION]: how: after BUILD_PANE_FROM_RAW_LISTING, attach visibility fields without overwriting listing path/files/cursor/marks

```
PROCEDURE MERGE_LISTING_WITH_CROSS_PANE_FIELDS(listingPane, crossPaneFields)
  RETURN { ...listingPane,
           activeCrossPaneVisibilityId: crossPaneFields.activeCrossPaneVisibilityId,
           crossPaneVisibilityDraft: crossPaneFields.crossPaneVisibilityDraft,
           crossPaneVisibilityDraftSourceVersion: crossPaneFields.crossPaneVisibilityDraftSourceVersion }
  // INVARIANT: never spread full prior pane into listingPane
```
