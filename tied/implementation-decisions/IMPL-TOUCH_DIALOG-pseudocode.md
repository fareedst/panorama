# IMPL-TOUCH_DIALOG essence pseudocode

<!-- [IMPL-TOUCH_DIALOG] [ARCH-TOUCH_MTIME] [ARCH-MOUSE_SUPPORT] [REQ-TOUCH_MTIME] [REQ-MOUSE_INTERACTION]: Top-level — Touch dialog and context menu wiring -->

```
COMPONENT TouchFileDialog(isOpen, initiatingPaneIndex, paneCount, file, marksAtOpen, paneFilesList, labels, onApply, onClose):
  // [IMPL-TOUCH_DIALOG] [ARCH-MOUSE_SUPPORT] [REQ-TOUCH_MTIME]: how — secondary workspace dialog; two choice groups + Apply; e2e_only false — covered by composition tests
  IF NOT isOpen: RETURN null

  STATE paneTarget = "thisPane"
  STATE mtimeMode = "now"
  STATE specifiedInput, timeZoneMode = "local"

  // [IMPL-TOUCH_DIALOG] [REQ-TOUCH_MTIME]: how — pane target radio group reuses setBaseInThisPane / setBaseInAllPanes copy labels
  RENDER fieldset pane target with thisPane and allPanes options

  // [IMPL-TOUCH_DIALOG] [IMPL-TOUCH_MTIME] [REQ-TOUCH_MTIME]: how — mtime mode radios; disable earliest/latest when NOT isEarliestLatestModeAvailable(paneFilesList, basenames)
  RENDER fieldset mtime mode: now, specified, earliest, latest

  // [IMPL-TOUCH_DIALOG] [REQ-TOUCH_MTIME]: how — specified mode shows datetime-local + UTC/local toggle; Apply disabled until parseSpecifiedMtime valid
  IF mtimeMode == "specified":
    RENDER datetime-local input and local/utc radio toggle

  ON Apply:
    specifiedDate = parseSpecifiedMtime(specifiedInput, timeZoneMode) when specified else null
    onApply({ paneTarget, mtimeMode, specifiedDate })
    onClose()

FUNCTION parseSpecifiedMtime(input, zone):
  // [IMPL-TOUCH_DIALOG] [REQ-TOUCH_MTIME]: how — parse datetime-local as local wall time or UTC wall time
  IF NOT match YYYY-MM-DDTHH:mm: RETURN null
  IF zone == "utc": RETURN Date.UTC(...)
  RETURN new Date(local components)

COMPONENT ContextMenu(..., onTouch, touchMenuLabel):
  // [IMPL-TOUCH_DIALOG] [IMPL-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION] [REQ-TOUCH_MTIME]: how — Touch… menu item when onTouch provided
  IF onTouch:
    RENDER menuitem touchMenuLabel default "Touch…"
    ON click: onTouch(); onClose()

COMPONENT FilePane(..., onTouch, touchMenuLabel):
  // [IMPL-TOUCH_DIALOG] [IMPL-FILE_PANE] [REQ-TOUCH_MTIME] [REQ-MOUSE_INTERACTION]: how — pass onTouch(contextMenu.file, marksAtOpen) to ContextMenu on row right-click
  onTouch := () => onTouch(contextMenu.file, new Set(marks))

WORKSPACE handleApplyTouch(dialogState, selection):
  // [IMPL-TOUCH_DIALOG] [IMPL-TOUCH_MTIME] [IMPL-WORKSPACE_VIEW] [REQ-TOUCH_MTIME]: how — build entries, POST bulk-touch, refresh panes whose listings contain touched paths
  entries = buildTouchEntries(selection, dialogState.paneIndex, paneFilesList, dialogState.marksAtOpen, dialogState.file)
  IF entries empty: alert and RETURN
  POST /api/files { operation: "bulk-touch", entries: [{ path, mtime: ISO }], displaySpecId }
  FOR EACH paneIndex WHERE panes[paneIndex].files contains any entry.path:
    handleNavigate(paneIndex, panes[paneIndex].path)
```
