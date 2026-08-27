# IMPL-FILES_DATA essence pseudocode

// [IMPL-FILES_DATA] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-DIRECTORY_NAVIGATION] [REQ-FILE_OPERATIONS]: Server-only filesystem layer wrapping Node fs/promises — list/stat paths, single and bulk mutations, server-side sort, comparison index; re-exports client-safe formatSize from IMPL-FILES_UTILS

## Summary contract

// [IMPL-FILES_DATA] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-DIRECTORY_NAVIGATION] [REQ-FILE_OPERATIONS]: how: all fs access centralized here; listDirectory tolerates per-entry stat failures; mutations throw after logging; bulk ops use Promise.allSettled

```
IMPL-FILES_DATA_Summary():
  INPUT: absolute paths, SortType, pane file lists
  OUTPUT: FileStat[], void, OperationResult, sorted FileStat[], ComparisonIndex
  DATA: fs/promises, path, os.homedir, preserveCopyAttributes (IMPL-COPY_ATTRS), formatSize re-export
  PRE: server runtime with filesystem access
  POST: filesystem results per operation contract
  EFFECTS: IO
  CONTROL: logger on debug/trace/info/warn/error
  TERMINATION: total
```

## ListDirectory

// [IMPL-FILES_DATA] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-DIRECTORY_NAVIGATION] [REQ-FILE_OPERATIONS]: how: normalize path, readdir withFileTypes, stat each entry into FileStat, skip unstatable entries, return array (empty on top-level failure)

```
IMPL-FILES_DATA_ListDirectory(dirPath):
  INPUT: dirPath absolute string
  OUTPUT: FileStat[] { name, path, isDirectory, size, mtime, extension }
  DATA: path.normalize, fs.readdir, fs.stat per entry
  PRE: dirPath absolute string
  POST: FileStat array OR empty on top-level readdir failure
  EFFECTS: IO
  FAILURE_MODES: per-entry stat failure → skip entry; readdir failure → return []
  TERMINATION: total
  normalizedPath := NORMALIZE dirPath
  entries := AWAIT fs.readdir(normalizedPath, withFileTypes)
  FOR EACH entry
    TRY
      stats := AWAIT fs.stat(entryPath)
      APPEND FileStat with extension "" for directories else path.extname
    ON stat error LOG warn SKIP entry
  RETURN fileStats
  ON readdir error LOG error RETURN []
```

## PathNavigationHelpers

// [IMPL-FILES_DATA] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-DIRECTORY_NAVIGATION]: how: getParentDirectory stops at root; joinPath normalizes joined segments; getUserHomeDirectory returns os.homedir()

```
IMPL-FILES_DATA_getParentDirectory(dirPath):
  INPUT: path string
  OUTPUT: parent path (stops at root)
  PRE: dirPath defined
  POST: parent directory path returned
  EFFECTS: pure
  TERMINATION: total
  parent := path.dirname(dirPath)
  IF parent equals dirPath THEN RETURN dirPath
  RETURN parent

IMPL-FILES_DATA_joinPath(parts...):
  INPUT: path segment strings
  OUTPUT: joined normalized path
  PRE: one or more path segments
  POST: normalized joined path
  EFFECTS: pure
  TERMINATION: total
  RETURN path.normalize(path.join(parts))

IMPL-FILES_DATA_getUserHomeDirectory():
  INPUT: none
  OUTPUT: home directory string
  PRE: server runtime
  POST: os.homedir() returned
  EFFECTS: pure
  TERMINATION: total
  RETURN os.homedir()
```

## GetFileInfo

// [IMPL-FILES_DATA] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-FILE_LISTING]: how: stat single path; return FileStat or null on failure

```
IMPL-FILES_DATA_GetFileInfo(filePath):
  INPUT: filePath
  OUTPUT: FileStat OR null
  PRE: filePath absolute string
  POST: FileStat OR null on stat failure
  EFFECTS: IO
  FAILURE_MODES: stat error → null after log
  TERMINATION: total
  TRY stats := AWAIT fs.stat(filePath) BUILD FileStat RETURN
  ON error LOG error RETURN null
```

## SingleFileOperations

// [IMPL-FILES_DATA] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-FILE_OPERATIONS]: how: copyFile mkdirs dest parent, fs.cp recursive for directories else fs.copyFile, then preserveCopyAttributes; moveFile/renameFile use fs.rename; deleteFile branches file vs recursive directory

```
IMPL-FILES_DATA_copyFile(src, dest):
  INPUT: src, dest absolute paths
  OUTPUT: void OR thrown error after log
  PRE: src exists; dest parent creatable
  POST: file or directory copied with attributes preserved
  EFFECTS: IO
  FAILURE_MODES: fs errors → throw after log
  TERMINATION: total
  // [IMPL-FILES_DATA] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-FILE_OPERATIONS]: how: destination parent creation — mkdir dest parent so cross-pane and nested dest paths succeed
  AWAIT fs.mkdir(dirname(dest) recursive true)
  stats := AWAIT fs.stat(src)
  // [IMPL-FILES_DATA] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-FILE_OPERATIONS]: how: branch copy mechanism — fs.cp recursive for directories; fs.copyFile for files only
  IF stats.isDirectory THEN AWAIT fs.cp(src, dest, recursive true)
  ELSE AWAIT fs.copyFile(src, dest)
  // [IMPL-COPY_ATTRS] [REQ-COPY_OPERATIONS] [REQ-FILE_OPERATIONS]: how: after copy completes apply best-effort utimes/chmod from source stat
  AWAIT preserveCopyAttributes(src, dest)

IMPL-FILES_DATA_moveFile(src, dest):
  INPUT: src, dest paths
  OUTPUT: void OR thrown error
  PRE: src exists
  POST: file renamed/moved at dest
  EFFECTS: IO
  TERMINATION: total
  AWAIT fs.rename(src, dest)

IMPL-FILES_DATA_deleteFile(filePath):
  INPUT: filePath
  OUTPUT: void OR thrown error
  PRE: path exists
  POST: file or directory removed
  EFFECTS: IO
  TERMINATION: total
  stats := AWAIT fs.stat(filePath)
  IF directory THEN AWAIT fs.rm recursive ELSE AWAIT fs.unlink

IMPL-FILES_DATA_renameFile(oldPath, newPath):
  INPUT: oldPath, newPath
  OUTPUT: void via moveFile
  PRE: oldPath exists
  POST: file at newPath
  EFFECTS: IO
  TERMINATION: total
  DELEGATE moveFile(oldPath, newPath)
```

## BulkOperations

// [IMPL-FILES_DATA] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-FILE_OPERATIONS]: how: bulkCopy/Move map each source to destDir/basename via single-file ops; bulkDelete maps deleteFile; Promise.allSettled aggregates successCount, errorCount, errors[]

```
IMPL-FILES_DATA_bulkCopy(sources, destDir, onProgress):
  INPUT: sources[], destDir, optional onProgress callback
  OUTPUT: OperationResult { successCount, errorCount, errors }
  PRE: sources non-empty; destDir writable
  POST: per-source results aggregated without aborting siblings
  EFFECTS: IO
  TERMINATION: total
  results := AWAIT Promise.allSettled(FOR EACH src copy to join(destDir, basename(src)))
  COUNT fulfilled vs rejected into OperationResult

IMPL-FILES_DATA_bulkMove(sources, destDir, onProgress):
  INPUT: sources[], destDir, optional onProgress
  OUTPUT: OperationResult
  PRE: same as bulkCopy
  POST: OperationResult from moveFile per source
  EFFECTS: IO
  TERMINATION: total
  SAME pattern with moveFile

IMPL-FILES_DATA_bulkDelete(sources, onProgress):
  INPUT: sources[]
  OUTPUT: OperationResult
  PRE: sources non-empty
  POST: OperationResult from deleteFile per source
  EFFECTS: IO
  TERMINATION: total
  SAME pattern with deleteFile
```

## SortFilesServer

// [IMPL-FILES_DATA] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-FILE_LISTING]: how: in-place sort by SortType enum (Name, NameRev, Size, SizeRev, Mtime, MtimeRev, Ext, ExtRev) with optional directory priority

```
IMPL-FILES_DATA_sortFiles(files, sortType, priorityDir):
  INPUT: files[], sortType, priorityDir default true
  OUTPUT: same array reference sorted in place
  PRE: files array and sortType defined
  POST: array sorted per SortType with optional directory priority
  EFFECTS: State
  TERMINATION: total
  IF priorityDir THEN directories before files
  SWITCH sortType APPLY localeCompare or numeric compare on size/mtime/extension
```

## CodeLocations

// [IMPL-FILES_DATA] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-DIRECTORY_NAVIGATION] [REQ-FILE_OPERATIONS]: map implementing and verifying source files for this IMPL

// FILE: src/lib/files.data.ts — server filesystem functions
// FILE: src/lib/files.types.ts — FileStat, SortType, OperationResult interfaces
// FILE: src/lib/files.data.test.ts — listDirectory, path helpers, operations, sortFiles, buildComparisonIndex, formatSize re-export tests
// FILE: src/lib/copy-file.data.test.ts — copyFile integration tests on real filesystem (recursive directory copy, attribute preservation)

## ErrorHandling

// [IMPL-FILES_DATA] [ARCH-FILESYSTEM_ABSTRACTION] [REQ-DIRECTORY_NAVIGATION] [REQ-FILE_OPERATIONS]: how: listDirectory returns [] on failure; getFileInfo returns null; mutations rethrow after error log; bulk ops collect per-file errors without aborting siblings

```
IMPL-FILES_DATA_on_error(context, error):
  INPUT: error from filesystem operation
  OUTPUT: degraded result OR propagated error
  PRE: error in list/stat/mutation path
  POST: []/null for reads OR rethrow for mutations
  EFFECTS: IO
  TERMINATION: total
  LOG with IMPL-FILES_DATA tokens
  IF list or stat read THEN degrade to empty/null
  ELSE propagate to API caller
```
