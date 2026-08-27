# IMPL-NSYNC_VERIFY essence pseudocode

// [IMPL-NSYNC_VERIFY] [ARCH-HASH_VERIFICATION] [REQ-VERIFY_DEST]: Recompute destination hash after copy and compare to precomputed source hash

## Summary contract

// [IMPL-NSYNC_VERIFY] [ARCH-HASH_VERIFICATION] [REQ-VERIFY_DEST]: how: SyncEngine calls verifyDestination when verifyDestination option true and sourceHash available

```
IMPL-NSYNC_VERIFY_Summary():
  INPUT: sourceHash (hex), destPath, HashAlgorithm
  OUTPUT: boolean — true when destination digest matches source
  DATA: computeFileHash, verifyHash from IMPL-NSYNC_HASH
  PRE: destination file exists when verification runs
  POST: match result returned; mismatches and errors yield false without throw
  EFFECTS: IO (re-read destination file)
  CONTROL: failures return false without throwing
  TERMINATION: total
```

## VerifyDestination

// [IMPL-NSYNC_VERIFY] [ARCH-HASH_VERIFICATION] [REQ-VERIFY_DEST]: how: re-hash destination file and compare to source hash via verifyHash

```
IMPL-NSYNC_VERIFY_VerifyDestination(sourceHash, destPath, algorithm):
  INPUT: sourceHash, destPath, algorithm
  OUTPUT: boolean match
  PRE: destPath readable; algorithm supported by IMPL-NSYNC_HASH
  POST: true when dest digest equals sourceHash; false on mismatch or hash failure
  EFFECTS: IO, log
  TERMINATION: total
  destHash := AWAIT computeFileHash(destPath, algorithm)
  matches := verifyHash(destHash, sourceHash)
  IF matches THEN LOG debug verified
  ELSE LOG warn with sourceHash and destHash
  RETURN matches
  ON error: LOG error AND RETURN false
```

## VerifyMultipleDestinations

// [IMPL-NSYNC_VERIFY] [ARCH-HASH_VERIFICATION] [REQ-VERIFY_DEST]: how: parallel verifyDestination for each dest path

```
IMPL-NSYNC_VERIFY_VerifyMultipleDestinations(sourceHash, destPaths, algorithm):
  INPUT: sourceHash, destPaths[], algorithm
  OUTPUT: boolean[] per destination
  PRE: destPaths non-empty array
  POST: one boolean per destination path
  EFFECTS: IO, log
  TERMINATION: total
  results := AWAIT Promise.all(destPaths.map verifyDestination)
  LOG info success count
  RETURN results
```

## CodeLocations

// [IMPL-NSYNC_VERIFY] [ARCH-HASH_VERIFICATION] [REQ-VERIFY_DEST]: map implementing and verifying source files for this IMPL

// FILE: src/lib/sync/verify.ts — verifyDestination, verifyMultipleDestinations
// TEST: src/lib/sync/engine.test.ts — verifyDestination integration and verify/hash compare path

## ErrorHandling

// [IMPL-NSYNC_VERIFY] [ARCH-HASH_VERIFICATION] [REQ-VERIFY_DEST]: how: hash failure or mismatch returns false; SyncEngine sets destResult.error and records VerifyFailed with store monitor

```
IMPL-NSYNC_VERIFY_on_error(context, error):
  INPUT: destPath, error from computeFileHash
  OUTPUT: false
  PRE: verification invoked
  POST: caller receives false; error logged
  EFFECTS: log
  TERMINATION: total
  LOG error with destPath
  RETURN false
```
