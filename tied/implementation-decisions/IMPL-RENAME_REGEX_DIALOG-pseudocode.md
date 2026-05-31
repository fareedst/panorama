# IMPL-RENAME_REGEX_DIALOG essence pseudocode

<!-- [IMPL-RENAME_REGEX_DIALOG] [ARCH-BATCH_OPERATIONS] [ARCH-MOUSE_SUPPORT] [REQ-BULK_FILE_OPS] [REQ-MOUSE_INTERACTION]: Top-level — Rename Regex dialog, context menu, FilePane wiring, workspace apply -->

```
COMPONENT RenameRegexDialog(isOpen, initiatingPaneIndex, paneCount, file, marksAtOpen, paneFilesList, labels, onApply, onClose):
  // [IMPL-RENAME_REGEX_DIALOG] [ARCH-MOUSE_SUPPORT] [REQ-BULK_FILE_OPS] [REQ-MOUSE_INTERACTION]: how — secondary workspace dialog; pane target + match/replacement fields + Apply
  IF NOT isOpen: RETURN null

  STATE paneTarget = "thisPane"
  STATE matchPattern = ""
  STATE replacement = ""

  // [IMPL-RENAME_REGEX_DIALOG] [REQ-BULK_FILE_OPS]: how — pane target radio group reuses setBaseInThisPane / setBaseInAllPanes copy labels (same subset as Touch/Execute)
  RENDER fieldset pane target with thisPane and allPanes options

  // [IMPL-RENAME_REGEX_DIALOG] [IMPL-RENAME_REGEX] [REQ-BULK_FILE_OPS]: how — match pattern and replacement text inputs; Apply disabled when pattern empty or validateRegex fails
  RENDER text input matchPattern label matchPatternLabel
  RENDER text input replacement label replacementLabel

  ON Apply:
    onApply({ paneTarget, matchPattern: trimmed pattern, replacement })
    onClose()

COMPONENT ContextMenu(..., onRenameRegex, renameRegexMenuLabel):
  // [IMPL-RENAME_REGEX_DIALOG] [IMPL-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION] [REQ-BULK_FILE_OPS]: how — Rename Regex… menu item when onRenameRegex provided; visible with marks (unlike single Rename)
  IF onRenameRegex:
    RENDER menuitem renameRegexMenuLabel default "Rename Regex…"
    ON click: onRenameRegex(); onClose()

COMPONENT FilePane(..., onRenameRegex, renameRegexMenuLabel):
  // [IMPL-RENAME_REGEX_DIALOG] [IMPL-FILE_PANE] [REQ-MOUSE_INTERACTION] [REQ-BULK_FILE_OPS]: how — pass onRenameRegex(contextMenu.file, marksAtOpen) snapshot
  onRenameRegex := () => onRenameRegex(contextMenu.file, new Set(marks))

WORKSPACE handleApplyRenameRegex(dialogState, selection):
  // [IMPL-RENAME_REGEX_DIALOG] [IMPL-RENAME_REGEX] [IMPL-WORKSPACE_VIEW] [REQ-BULK_FILE_OPS]: how — build entries, POST bulk-rename, refresh panes listing renamed paths
  entries = buildRenameRegexEntries(selection, dialogState.paneIndex, paneFilesList, dialogState.marksAtOpen, dialogState.file)
  IF entries empty: alert "No files to rename with the selected pattern." and RETURN
  POST /api/files { operation: "bulk-rename", entries: [{ src, dest }], displaySpecId }
  FOR EACH paneIndex WHERE panes[paneIndex].files contains any entry.src OR entry.dest:
    handleNavigate(paneIndex, panes[paneIndex].path)
```
