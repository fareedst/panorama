# IMPL-EXECUTE_DIALOG essence pseudocode

<!-- [IMPL-EXECUTE_DIALOG] [ARCH-PANE_COMMAND_EXEC] [ARCH-MOUSE_SUPPORT] [REQ-PANE_COMMAND_EXEC] [REQ-MOUSE_INTERACTION]: Top-level — Execute dialog and context menu wiring -->

```
COMPONENT ExecuteFileDialog(isOpen, initiatingPaneIndex, paneCount, file, marksAtOpen, paneLabels, executeLabels, onApply, onClose):
  // [IMPL-EXECUTE_DIALOG] [ARCH-MOUSE_SUPPORT] [REQ-PANE_COMMAND_EXEC]: how — secondary workspace dialog; pane target radio group + command field + Execute Apply
  IF NOT isOpen: RETURN null

  STATE paneTarget = "thisPane"
  STATE command = ""

  // [IMPL-EXECUTE_DIALOG] [REQ-PANE_COMMAND_EXEC]: how — pane target radio group reuses setBaseInThisPane / setBaseInAllPanes copy labels
  RENDER fieldset pane target with thisPane and allPanes options data-testid execute-in-this-pane / execute-in-all-panes

  // [IMPL-EXECUTE_DIALOG] [REQ-PANE_COMMAND_EXEC]: how — command text input; Apply disabled when trimmed command empty
  RENDER text input command with autofocus
  RENDER Apply button disabled WHEN trim(command) empty

  ON overlay click OR Escape: onClose()
  ON Apply:
    onApply({ paneTarget, command: trim(command) })
    onClose()

COMPONENT ContextMenu(..., onExecute, executeMenuLabel):
  // [IMPL-EXECUTE_DIALOG] [IMPL-MOUSE_SUPPORT] [REQ-MOUSE_INTERACTION] [REQ-PANE_COMMAND_EXEC]: how — Execute… menu item when onExecute provided; after Touch, before Delete
  IF onExecute:
    RENDER menuitem executeMenuLabel default "Execute…" data-testid=execute-file-menu-item
    ON click: onExecute(); onClose()

COMPONENT FilePane(..., onExecute, executeMenuLabel):
  // [IMPL-EXECUTE_DIALOG] [IMPL-FILE_PANE] [ARCH-MOUSE_SUPPORT] [REQ-PANE_COMMAND_EXEC] [REQ-MOUSE_INTERACTION]: how — pass onExecute(contextMenu.file, marksAtOpen) to ContextMenu on row right-click
  onExecute := () => onExecute(contextMenu.file, new Set(marks))

WORKSPACE handleApplyExecute(dialogState, selection):
  // [IMPL-EXECUTE_DIALOG] [IMPL-PANE_COMMAND_EXEC] [IMPL-WORKSPACE_VIEW] [REQ-PANE_COMMAND_EXEC]: how — build entries, POST execute-command, refresh affected panes
  entries = buildExecuteEntries(selection, dialogState.paneIndex, panes, dialogState.marksAtOpen, dialogState.file)
  IF entries empty: alert and RETURN
  POST /api/files { operation: "execute-command", entries: [{ paneIndex, cwd, command }] }
  FOR EACH paneIndex in entries: refresh pane listing via handleNavigate
```
