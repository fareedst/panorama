# IMPL-NSYNC_VERIFY essence pseudocode

// [IMPL-NSYNC_VERIFY] [ARCH-HASH_VERIFICATION] [REQ-VERIFY_DEST]: Recompute destination hash after copy and compare to precomputed source hash

## Summary contract

// [IMPL-NSYNC_VERIFY] [ARCH-HASH_VERIFICATION] [REQ-VERIFY_DEST]: how: SyncEngine calls verifyDestination when verifyDestination option true and sourceHash available

CONTRACT Summary
  INPUT: sourceHash (hex), destPath, HashAlgorithm
  OUTPUT: boolean — true when destination digest matches source
  DATA: computeFileHash, verifyHash from IMPL-NSYNC_HASH
  CONTROL: failures return false without throwing

## VerifyDestination

// [IMPL-NSYNC_VERIFY] [ARCH-HASH_VERIFICATION] [REQ-VERIFY_DEST]: how: re-hash destination file and compare to source hash via verifyHash

CONTRACT VerifyDestination
  INPUT: sourceHash, destPath, algorithm
  OUTPUT: boolean match

PROCEDURE IMPL-NSYNC_VERIFY_VerifyDestination(sourceHash, destPath, algorithm)
  destHash := AWAIT computeFileHash(destPath, algorithm)
  matches := verifyHash(destHash, sourceHash)
  IF matches THEN LOG debug verified
  ELSE LOG warn with sourceHash and destHash
  RETURN matches
  ON error: LOG error AND RETURN false

## VerifyMultipleDestinations

// [IMPL-NSYNC_VERIFY] [ARCH-HASH_VERIFICATION] [REQ-VERIFY_DEST]: how: parallel verifyDestination for each dest path

CONTRACT VerifyMultipleDestinations
  INPUT: sourceHash, destPaths[], algorithm
  OUTPUT: boolean[] per destination

PROCEDURE IMPL-NSYNC_VERIFY_VerifyMultipleDestinations(sourceHash, destPaths, algorithm)
  results := AWAIT Promise.all(destPaths.map verifyDestination)
  LOG info success count
  RETURN results

## CodeLocations

// [IMPL-NSYNC_VERIFY] [ARCH-HASH_VERIFICATION] [REQ-VERIFY_DEST]: map implementing and verifying source files for this IMPL

// FILE: src/lib/sync/verify.ts — verifyDestination, verifyMultipleDestinations
// TEST: (integration) src/lib/sync/engine.test.ts — verify path when verifyDestination option enabled

## ErrorHandling

// [IMPL-NSYNC_VERIFY] [ARCH-HASH_VERIFICATION] [REQ-VERIFY_DEST]: how: hash failure or mismatch returns false; SyncEngine sets destResult.error and records VerifyFailed with store monitor

PROCEDURE IMPL-NSYNC_VERIFY_on_error(context, error)
  LOG error with destPath
  RETURN false
