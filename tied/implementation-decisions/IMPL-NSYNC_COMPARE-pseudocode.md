# IMPL-NSYNC_COMPARE essence pseudocode

// [IMPL-NSYNC_COMPARE] [REQ-COMPARE_METHODS]: File comparison module — dispatch compare method to skip unchanged files during sync

## Summary contract

// [IMPL-NSYNC_COMPARE] [REQ-COMPARE_METHODS]: how: compareFiles returns true when source and destination are equivalent so SyncEngine can skip copy

CONTRACT Summary
  INPUT: sourcePath, destPath, CompareMethod, optional HashAlgorithm
  OUTPUT: boolean — true if files equivalent (skip copy), false otherwise
  DATA: fs.stat for both paths; computeFileHash and verifyHash when method is hash
  CONTROL: logger debug/trace/warn/error on each branch

## CompareFiles

// [IMPL-NSYNC_COMPARE] [REQ-COMPARE_METHODS]: how: stat both paths in parallel, dispatch on method; any error or missing dest returns false (not equivalent)

CONTRACT CompareFiles
  INPUT: sourcePath, destPath, method, hashAlgorithm?
  OUTPUT: boolean equivalent flag
  DATA: sourceStat, destStat from Promise.all fs.stat

PROCEDURE IMPL-NSYNC_COMPARE_CompareFiles(sourcePath, destPath, method, hashAlgorithm)
  AWAIT stat sourcePath AND stat destPath in parallel
  SWITCH method
    CASE none: RETURN false
    CASE size: RETURN compareSize(sourceStat, destStat)
    CASE mtime: RETURN compareMtime(sourceStat, destStat)
    CASE size-mtime: RETURN compareSize AND compareMtime
    CASE hash:
      IF hashAlgorithm missing THEN warn AND fallback to size-mtime
      ELSE RETURN AWAIT compareHash(sourcePath, destPath, hashAlgorithm)
    DEFAULT: warn unknown method AND fallback to size-mtime
  ON any error: LOG debug AND RETURN false

## CompareSize

// [IMPL-NSYNC_COMPARE] [REQ-COMPARE_METHODS]: how: exact equality on stat.size

CONTRACT CompareSize
  INPUT: sourceStat, destStat
  OUTPUT: boolean — true when sizes match

PROCEDURE IMPL-NSYNC_COMPARE_CompareSize(sourceStat, destStat)
  RETURN sourceStat.size === destStat.size

## CompareMtime

// [IMPL-NSYNC_COMPARE] [REQ-COMPARE_METHODS]: how: mtime match within 1000 ms tolerance for filesystem resolution variance

CONTRACT CompareMtime
  INPUT: sourceStat, destStat
  OUTPUT: boolean — true when |src mtime − dest mtime| ≤ 1000 ms

PROCEDURE IMPL-NSYNC_COMPARE_CompareMtime(sourceStat, destStat)
  diff := ABS(sourceStat.mtime.getTime() − destStat.mtime.getTime())
  RETURN diff ≤ 1000

## CompareHash

// [IMPL-NSYNC_COMPARE] [REQ-COMPARE_METHODS] [REQ-HASH_COMPUTATION]: how: compute source and dest hashes in parallel, compare via verifyHash

CONTRACT CompareHash
  INPUT: sourcePath, destPath, algorithm
  OUTPUT: boolean — true when digests match
  DATA: computeFileHash, verifyHash from IMPL-NSYNC_HASH

PROCEDURE IMPL-NSYNC_COMPARE_CompareHash(sourcePath, destPath, algorithm)
  AWAIT computeFileHash(sourcePath, algorithm) AND computeFileHash(destPath, algorithm) in parallel
  RETURN verifyHash(sourceHash, destHash)
  ON error: LOG error AND RETURN false

## CodeLocations

// [IMPL-NSYNC_COMPARE] [REQ-COMPARE_METHODS]: map implementing and verifying source files for this IMPL

// FILE: src/lib/sync/compare.ts — compareFiles, compareSize, compareMtime, compareHash
// TEST: src/lib/sync/engine.test.ts — "should skip unchanged files [REQ-COMPARE_METHODS]"

## ErrorHandling

// [IMPL-NSYNC_COMPARE] [REQ-COMPARE_METHODS]: how: comparison failures are non-fatal — return false so sync proceeds with copy

PROCEDURE IMPL-NSYNC_COMPARE_on_error(context, error)
  LOG debug with sourcePath, destPath
  RETURN false
