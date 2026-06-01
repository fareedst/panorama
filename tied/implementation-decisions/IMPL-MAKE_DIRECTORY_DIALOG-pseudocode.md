# IMPL-MAKE_DIRECTORY_DIALOG essence pseudocode

<!-- [IMPL-MAKE_DIRECTORY_DIALOG] [ARCH-MOUSE_SUPPORT] [REQ-DIRECTORY_NAVIGATION] [REQ-MOUSE_INTERACTION]: Top-level — Make directory dialog and context menu wiring -->

```
COMPONENT MakeDirectoryDialog(isOpen, initiatingPaneIndex, paneCount, paneLabels, makeDirectoryLabels, onApply, onClose):
  // [IMPL-MAKE_DIRECTORY_DIALOG] [ARCH-MOUSE_SUPPORT] [REQ-DIRECTORY_NAVIGATION]: how — secondary workspace dialog; pane target radio group + directory name field + Create Apply
  IF NOT isOpen: RETURN null

  STATE paneTarget = "thisPane"
  STATE directoryName = ""

  RENDER fieldset pane target with thisPane and allPanes options data-testid make-in-this-pane / make-in-all-panes
  RENDER text input directory name with autofocus
  RENDER Apply disabled WHEN trim(directoryName) empty OR NOT validateRenameBasename(trim(directoryName))

  ON overlay click OR Escape: onClose()
  ON Apply:
    onApply({ paneTarget, directoryName: trim(directoryName) })
    onClose()

COMPONENT ContextMenu(..., onMakeDirectory, makeDirectoryMenuLabel):
  // [IMPL-MAKE_DIRECTORY_DIALOG] [IMPL-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION] [REQ-DIRECTORY_NAVIGATION]: how — Make directory… menu item when onMakeDirectory provided; after Execute, before Delete
  IF onMakeDirectory:
    RENDER menuitem makeDirectoryMenuLabel default "Make directory…" data-testid=make-directory-menu-item
    ON click: onMakeDirectory(); onClose()

COMPONENT FilePane(..., onMakeDirectory, makeDirectoryMenuLabel):
  // [IMPL-MAKE_DIRECTORY_DIALOG] [IMPL-FILE_PANE] [REQ-MOUSE_INTERACTION]: how — pass onMakeDirectory to ContextMenu on row right-click (no marks snapshot)
  onMakeDirectory := () => onMakeDirectory()

WORKSPACE handleApplyMakeDirectory(dialogState, selection):
  // [IMPL-MAKE_DIRECTORY_DIALOG] [IMPL-MAKE_DIRECTORY] [IMPL-WORKSPACE_VIEW] [REQ-DIRECTORY_NAVIGATION]: how — build entries, POST bulk-mkdir, refresh affected panes
  entries = buildMakeDirectoryEntries(selection.paneTarget, selection.directoryName, dialogState.paneIndex, panes)
  IF entries empty: alert and RETURN
  POST /api/files { operation: "bulk-mkdir", entries: [{ path }] }
  FOR EACH paneIndex in entries: refresh pane listing via handleNavigate
```
