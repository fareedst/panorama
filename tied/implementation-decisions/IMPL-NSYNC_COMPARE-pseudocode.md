# IMPL-NSYNC_COMPARE essence pseudocode

// [IMPL-NSYNC_COMPARE] [REQ-COMPARE_METHODS]: File comparison module — dispatch compare method to skip unchanged files during sync

## Summary contract

// [IMPL-NSYNC_COMPARE] [REQ-COMPARE_METHODS]: how: compareFiles returns true when source and destination are equivalent so SyncEngine can skip copy

```
IMPL-NSYNC_COMPARE_Summary():
  INPUT: sourcePath, destPath, CompareMethod, optional HashAlgorithm
  OUTPUT: boolean — true if files equivalent (skip copy), false otherwise
  DATA: fs.stat for both paths; computeFileHash and verifyHash when method is hash
  PRE: valid paths resolvable by fs
  POST: equivalence decision returned per compare method
  EFFECTS: IO (stat; optional hash reads)
  CONTROL: logger debug/trace/warn/error on each branch
  TERMINATION: total
```

## CompareFiles

// [IMPL-NSYNC_COMPARE] [REQ-COMPARE_METHODS]: how: stat both paths in parallel, dispatch on method; any error or missing dest returns false (not equivalent)

```
IMPL-NSYNC_COMPARE_CompareFiles(sourcePath, destPath, method, hashAlgorithm):
  INPUT: sourcePath, destPath, method, hashAlgorithm?
  OUTPUT: boolean equivalent flag
  DATA: sourceStat, destStat from Promise.all fs.stat
  PRE: sourcePath and destPath provided
  POST: true when files equivalent per method; false on error, missing dest, or not equivalent
  EFFECTS: IO
  FAILURE_MODES: stat error → false; unknown method → warn and fallback size-mtime; hash without algorithm → warn and fallback size-mtime
  TERMINATION: total
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
```

## CompareSize

// [IMPL-NSYNC_COMPARE] [REQ-COMPARE_METHODS]: how: exact equality on stat.size

```
IMPL-NSYNC_COMPARE_CompareSize(sourceStat, destStat):
  INPUT: sourceStat, destStat
  OUTPUT: boolean — true when sizes match
  PRE: both stat objects available
  POST: size equality result
  EFFECTS: pure
  TERMINATION: total
  RETURN sourceStat.size === destStat.size
```

## CompareMtime

// [IMPL-NSYNC_COMPARE] [REQ-COMPARE_METHODS]: how: mtime match within 1000 ms tolerance for filesystem resolution variance

```
IMPL-NSYNC_COMPARE_CompareMtime(sourceStat, destStat):
  INPUT: sourceStat, destStat
  OUTPUT: boolean — true when |src mtime − dest mtime| ≤ 1000 ms
  PRE: both stat objects with mtime
  POST: mtime equivalence within tolerance
  EFFECTS: pure
  TERMINATION: total
  diff := ABS(sourceStat.mtime.getTime() − destStat.mtime.getTime())
  RETURN diff ≤ 1000
```

## CompareHash

// [IMPL-NSYNC_COMPARE] [REQ-COMPARE_METHODS] [REQ-HASH_COMPUTATION]: how: compute source and dest hashes in parallel, compare via verifyHash

```
IMPL-NSYNC_COMPARE_CompareHash(sourcePath, destPath, algorithm):
  INPUT: sourcePath, destPath, algorithm
  OUTPUT: boolean — true when digests match
  DATA: computeFileHash, verifyHash from IMPL-NSYNC_HASH
  PRE: both paths readable; algorithm supported
  POST: hash match result OR false on error
  EFFECTS: IO
  FAILURE_MODES: hash compute error → LOG error AND RETURN false
  TERMINATION: total
  AWAIT computeFileHash(sourcePath, algorithm) AND computeFileHash(destPath, algorithm) in parallel
  RETURN verifyHash(sourceHash, destHash)
  ON error: LOG error AND RETURN false
```

## CodeLocations

// [IMPL-NSYNC_COMPARE] [REQ-COMPARE_METHODS]: map implementing and verifying source files for this IMPL

// FILE: src/lib/sync/compare.ts — compareFiles, compareSize, compareMtime, compareHash
// TEST: src/lib/sync/engine.test.ts — "should skip unchanged files [REQ-COMPARE_METHODS]"

## ErrorHandling

// [IMPL-NSYNC_COMPARE] [REQ-COMPARE_METHODS]: how: comparison failures are non-fatal — return false so sync proceeds with copy

```
IMPL-NSYNC_COMPARE_on_error(context, error):
  INPUT: comparison error context, error
  OUTPUT: false (not equivalent)
  PRE: error during compareFiles or sub-compare
  POST: false returned; sync proceeds with copy
  EFFECTS: none beyond logging
  TERMINATION: total
  LOG debug with sourcePath, destPath
  RETURN false
```
