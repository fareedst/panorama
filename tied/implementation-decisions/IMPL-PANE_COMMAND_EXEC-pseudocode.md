# IMPL-PANE_COMMAND_EXEC essence pseudocode

// [IMPL-PANE_COMMAND_EXEC] [ARCH-PANE_COMMAND_EXEC] [ARCH-FILE_OPERATIONS_API] [REQ-PANE_COMMAND_EXEC]: Top-level — target resolution, placeholder expansion, server spawn

## Summary contract

// [IMPL-PANE_COMMAND_EXEC] [ARCH-PANE_COMMAND_EXEC] [REQ-PANE_COMMAND_EXEC]: bound module inputs, outputs, and shared data for all runtime blocks below

```
IMPL-PANE_COMMAND_EXEC_Summary():
  INPUT: paneTarget (thisPane | allPanes); initiatingPaneIndex; panes[]; marksAtOpen; contextFile; command string
  OUTPUT: ExecuteTarget[]; expanded command entries; spawn results with exitCode, stdout, stderr
  DATA: placeholders $FILE and $MARKED; env PANORAMA_PANE_PATH, PANORAMA_FILE_PATH, PANORAMA_MARKED_PATHS
  PRE: panes array available; command non-empty when executing
  POST: targets resolved per paneTarget; placeholders expanded; commands executed sequentially via API
  EFFECTS: IO, State
  TERMINATION: total
```

## ResolveExecuteTargets

// [IMPL-PANE_COMMAND_EXEC] [ARCH-PANE_COMMAND_EXEC] [REQ-PANE_COMMAND_EXEC]: how — thisPane runs once with initiating pane cwd; allPanes runs once per pane with each pane cwd and per-pane file/mark context

```
IMPL-PANE_COMMAND_EXEC_ResolveExecuteTargets(context):
  INPUT: paneTarget, initiatingPaneIndex, panes[], marksAtOpen, contextFile
  OUTPUT: ExecuteTarget[] { paneIndex, cwd, filePath, markedPaths[] }
  PRE: panes array available
  POST: thisPane returns single target; allPanes returns one target per pane with per-pane scope
  EFFECTS: pure
  TERMINATION: total
  basenames = resolveTouchBasenames(marksAtOpen, contextFile)
  IF paneTarget == "thisPane" THEN
    paneIndex = initiatingPaneIndex
    cwd = panes[paneIndex].path
    markedPaths = resolve paths for basenames in initiating pane listing
    filePath = contextFile.path when in scope else ""
    RETURN [{ paneIndex, cwd, filePath, markedPaths }]
  FOR EACH paneIndex IN panes:
    cwd = panes[paneIndex].path
    markedPaths = resolve marked basenames in panes[paneIndex].files
    filePath = cross-pane resolved path for contextFile.name in this pane or ""
    PUSH { paneIndex, cwd, filePath, markedPaths }
```

## ExpandCommandPlaceholders

// [IMPL-PANE_COMMAND_EXEC] [REQ-PANE_COMMAND_EXEC]: how — replace $FILE with filePath and $MARKED with markedPaths joined by newline

```
IMPL-PANE_COMMAND_EXEC_ExpandCommandPlaceholders(context):
  INPUT: command string; filePath; markedPaths[]
  OUTPUT: expanded command string
  PRE: command non-empty
  POST: $FILE and $MARKED placeholders replaced
  EFFECTS: pure
  TERMINATION: total
  RETURN command.replace("$FILE", filePath).replace("$MARKED", markedPaths.join("\n"))
```

## BuildExecuteEntries

// [IMPL-PANE_COMMAND_EXEC] [IMPL-EXECUTE_DIALOG] [REQ-PANE_COMMAND_EXEC]: how — flatten targets with expanded command for API payload

```
IMPL-PANE_COMMAND_EXEC_BuildExecuteEntries(context):
  INPUT: selection, initiatingPaneIndex, panes, marks, contextFile
  OUTPUT: execute entries[] { paneIndex, cwd, command }
  PRE: selection.command available
  POST: one entry per resolved target with expanded command
  EFFECTS: pure
  DATA_TRANSITION: targets mapped to API payload rows
  TERMINATION: total
  targets = resolveExecuteTargets(...)
  RETURN targets.map(t => ({ paneIndex: t.paneIndex, cwd: t.cwd, command: expandCommandPlaceholders(selection.command, t.filePath, t.markedPaths) }))
```

## ExecuteCommandInDirectory

// [IMPL-PANE_COMMAND_EXEC] [ARCH-PANE_COMMAND_EXEC] [REQ-PANE_COMMAND_EXEC]: how — spawn shell with cwd; set PANORAMA_PANE_PATH, PANORAMA_FILE_PATH, PANORAMA_MARKED_PATHS env; capture exit code

```
IMPL-PANE_COMMAND_EXEC_ExecuteCommandInDirectory(context):
  INPUT: cwd, command, env
  OUTPUT: { exitCode, stdout, stderr }
  PRE: cwd absolute, no .., exists; command non-empty
  POST: shell process completed with captured streams and exit code
  EFFECTS: IO
  FAILURE_MODES: INVALID_CWD; SPAWN_FAILED
  TERMINATION: total
  VALIDATE cwd absolute, no .., exists
  VALIDATE command non-empty
  spawn shell with cwd and merged env including PANORAMA_PANE_PATH, PANORAMA_FILE_PATH, PANORAMA_MARKED_PATHS
  RETURN { exitCode, stdout, stderr }
```

## POSTExecuteCommand

// [IMPL-PANE_COMMAND_EXEC] [IMPL-FILES_API] [ARCH-FILE_OPERATIONS_API] [REQ-PANE_COMMAND_EXEC]: how — validate entries; run sequentially; return successCount and errorCount

```
IMPL-PANE_COMMAND_EXEC_POSTExecuteCommand(context):
  INPUT: POST body with entries[] { paneIndex, cwd, command }
  OUTPUT: { results[], successCount, errorCount }
  PRE: entries array non-empty
  POST: all entries validated and executed sequentially; counts tallied from exit codes
  EFFECTS: IO
  FAILURE_MODES: INVALID_ENTRIES; INVALID_CWD
  TERMINATION: total
  REQUIRE entries array non-empty
  FOR EACH entry: validate paneIndex, cwd, command; reject .. in cwd
  FOR EACH entry sequentially:
    result = executeCommandInDirectory(entry.cwd, entry.command, env from entry context)
    count success when exitCode == 0 else error
  RETURN { results, successCount, errorCount }
```
