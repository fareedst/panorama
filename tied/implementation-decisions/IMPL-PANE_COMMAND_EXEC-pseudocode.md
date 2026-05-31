# IMPL-PANE_COMMAND_EXEC essence pseudocode

<!-- [IMPL-PANE_COMMAND_EXEC] [ARCH-PANE_COMMAND_EXEC] [ARCH-FILE_OPERATIONS_API] [REQ-PANE_COMMAND_EXEC]: Top-level — target resolution, placeholder expansion, server spawn -->

## resolveExecuteTargets

// [IMPL-PANE_COMMAND_EXEC] [ARCH-PANE_COMMAND_EXEC] [REQ-PANE_COMMAND_EXEC]: how — thisPane runs once with initiating pane cwd; allPanes runs once per pane with each pane cwd and per-pane file/mark context

CONTRACT resolveExecuteTargets
  INPUT: paneTarget, initiatingPaneIndex, panes[], marksAtOpen, contextFile
  OUTPUT: ExecuteTarget[] { paneIndex, cwd, filePath, markedPaths[] }

PROCEDURE resolveExecuteTargets(context)
  basenames = resolveTouchBasenames(marksAtOpen, contextFile)
  // [IMPL-PANE_COMMAND_EXEC] [ARCH-PANE_COMMAND_EXEC] [REQ-PANE_COMMAND_EXEC]: how — thisPane single target with initiating pane cwd and file/mark scope
  IF paneTarget == "thisPane":
    paneIndex = initiatingPaneIndex
    cwd = panes[paneIndex].path
    markedPaths = resolve paths for basenames in initiating pane listing
    filePath = contextFile.path when in scope else ""
    RETURN [{ paneIndex, cwd, filePath, markedPaths }]
  // [IMPL-PANE_COMMAND_EXEC] [ARCH-PANE_COMMAND_EXEC] [REQ-PANE_COMMAND_EXEC]: how — allPanes emits one target per pane with per-pane filePath and markedPaths
  ELSE:
    FOR EACH paneIndex IN panes:
      cwd = panes[paneIndex].path
      markedPaths = resolve marked basenames in panes[paneIndex].files
      filePath = cross-pane resolved path for contextFile.name in this pane or ""
      PUSH { paneIndex, cwd, filePath, markedPaths }

## expandCommandPlaceholders

// [IMPL-PANE_COMMAND_EXEC] [REQ-PANE_COMMAND_EXEC]: how — replace $FILE with filePath and $MARKED with markedPaths joined by newline

PROCEDURE expandCommandPlaceholders(command, filePath, markedPaths)
  RETURN command.replace("$FILE", filePath).replace("$MARKED", markedPaths.join("\n"))

## buildExecuteEntries

// [IMPL-PANE_COMMAND_EXEC] [IMPL-EXECUTE_DIALOG] [REQ-PANE_COMMAND_EXEC]: how — flatten targets with expanded command for API payload

PROCEDURE buildExecuteEntries(selection, initiatingPaneIndex, panes, marks, contextFile)
  targets = resolveExecuteTargets(...)
  RETURN targets.map(t => ({ paneIndex: t.paneIndex, cwd: t.cwd, command: expandCommandPlaceholders(selection.command, t.filePath, t.markedPaths) }))

## executeCommandInDirectory

// [IMPL-PANE_COMMAND_EXEC] [ARCH-PANE_COMMAND_EXEC] [REQ-PANE_COMMAND_EXEC]: how — spawn shell with cwd; set PANORAMA_PANE_PATH, PANORAMA_FILE_PATH, PANORAMA_MARKED_PATHS env; capture exit code

PROCEDURE executeCommandInDirectory(cwd, command, env)
  VALIDATE cwd absolute, no .., exists
  VALIDATE command non-empty
  // [IMPL-PANE_COMMAND_EXEC] [ARCH-PANE_COMMAND_EXEC] [REQ-PANE_COMMAND_EXEC]: how — spawn shell with cwd; merge PANORAMA_PANE_PATH, PANORAMA_FILE_PATH, PANORAMA_MARKED_PATHS into process env
  spawn shell with cwd and merged env
  RETURN { exitCode, stdout, stderr }

## API execute-command

// [IMPL-PANE_COMMAND_EXEC] [IMPL-FILES_API] [ARCH-FILE_OPERATIONS_API] [REQ-PANE_COMMAND_EXEC]: how — validate entries; run sequentially; return successCount and errorCount

PROCEDURE POST_execute_command(body)
  REQUIRE entries array non-empty
  FOR EACH entry: validate paneIndex, cwd, command; reject .. in cwd
  // [IMPL-PANE_COMMAND_EXEC] [IMPL-FILES_API] [ARCH-FILE_OPERATIONS_API] [REQ-PANE_COMMAND_EXEC]: how — run entries sequentially; tally successCount and errorCount from exit codes
  FOR EACH entry sequentially:
    result = executeCommandInDirectory(entry.cwd, entry.command, env from entry context)
    count success when exitCode == 0 else error
  RETURN { results, successCount, errorCount }
