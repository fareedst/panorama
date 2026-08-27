# IMPL-NSYNC_HASH essence pseudocode

// [IMPL-NSYNC_HASH] [ARCH-HASH_VERIFICATION] [REQ-HASH_COMPUTATION]: Hash computation with BLAKE3, SHA-256, XXH3 support — buffer read for small files, streaming for large files

## Summary contract

// [IMPL-NSYNC_HASH] [ARCH-HASH_VERIFICATION] [REQ-HASH_COMPUTATION]: how: computeFileHash returns hex digest; verifyHash compares digests case-insensitively

```
IMPL-NSYNC_HASH_Summary():
  INPUT: filePath, HashAlgorithm (default blake3)
  OUTPUT: hex-encoded hash string; verifyHash returns boolean match
  DATA: fs.stat, fs.readFile, fs.createReadStream; @noble/hashes blake3 and sha256
  PRE: filePath resolvable
  POST: hex digest or verify boolean
  EFFECTS: IO
  CONTROL: files < 1 MB read whole buffer; ≥ 1 MB stream chunks
  TERMINATION: total
```

## ComputeFileHash

// [IMPL-NSYNC_HASH] [ARCH-HASH_VERIFICATION] [REQ-HASH_COMPUTATION]: how: reject non-files; choose buffer vs stream path by 1 MB threshold

```
IMPL-NSYNC_HASH_ComputeFileHash(filePath, algorithm):
  INPUT: filePath, algorithm default blake3
  OUTPUT: hex hash string
  DATA: stats.size, isSmallFile := size < 1024 * 1024
  PRE: filePath exists and is a regular file
  POST: hex-encoded digest returned
  EFFECTS: IO
  FAILURE_MODES: non-file → THROW; compute error → LOG and rethrow
  TERMINATION: total
  stats := AWAIT fs.stat(filePath)
  IF NOT stats.isFile() THEN THROW cannot hash non-file
  IF stats.size < 1 MB THEN
    data := AWAIT fs.readFile(filePath)
    RETURN computeBufferHash(data, algorithm)
  ELSE
    RETURN AWAIT computeStreamHash(filePath, algorithm)
  ON error: LOG error AND rethrow
```

## ComputeBufferHash

// [IMPL-NSYNC_HASH] [ARCH-HASH_VERIFICATION] [REQ-HASH_COMPUTATION]: how: sync hash over in-memory buffer; xxh3 falls back to blake3

```
IMPL-NSYNC_HASH_ComputeBufferHash(data, algorithm):
  INPUT: Buffer data, algorithm
  OUTPUT: hex hash string
  PRE: data is Buffer
  POST: hex digest for supported algorithm
  EFFECTS: pure
  FAILURE_MODES: unsupported algorithm → THROW; xxh3 buffer → warn and blake3 fallback
  TERMINATION: total
  SWITCH algorithm
    CASE blake3: RETURN toHex(blake3(data))
    CASE sha256: RETURN toHex(sha256(data))
    CASE xxh3: warn unsupported for buffer AND RETURN toHex(blake3(data))
    DEFAULT: THROW unsupported algorithm
```

## ComputeStreamHash

// [IMPL-NSYNC_HASH] [ARCH-HASH_VERIFICATION] [REQ-HASH_COMPUTATION] [IMPL-NSYNC_TYPE_SAFETY]: how: createReadStream, incremental hasher update per chunk; string chunks converted to Buffer

```
IMPL-NSYNC_HASH_ComputeStreamHash(filePath, algorithm):
  INPUT: filePath, algorithm
  OUTPUT: hex hash string
  DATA: blake3.create or sha256.create hasher; xxh3 streaming falls back to blake3
  PRE: filePath readable as stream
  POST: hex digest from streamed chunks
  EFFECTS: IO
  FAILURE_MODES: stream error → reject promise
  TERMINATION: total
  CREATE read stream for filePath
  SELECT hasher by algorithm (xxh3 → blake3 fallback)
  ON data chunk:
    buffer := IF chunk is string THEN Buffer.from(chunk) ELSE chunk
    hasher.update(buffer)
  ON end: RETURN toHex(hasher.digest())
  ON stream error: reject promise
```

## VerifyHash

// [IMPL-NSYNC_HASH] [ARCH-HASH_VERIFICATION] [REQ-HASH_COMPUTATION]: how: case-insensitive string equality on hex digests

```
IMPL-NSYNC_HASH_VerifyHash(actual, expected):
  INPUT: actual hex, expected hex
  OUTPUT: boolean match
  PRE: both hex strings provided
  POST: case-insensitive equality result
  EFFECTS: pure
  TERMINATION: total
  RETURN actual.toLowerCase() === expected.toLowerCase()
```

## CodeLocations

// [IMPL-NSYNC_HASH] [ARCH-HASH_VERIFICATION] [REQ-HASH_COMPUTATION]: map implementing and verifying source files for this IMPL

// FILE: src/lib/sync/hash.ts — computeFileHash, computeBufferHash, computeStreamHash, verifyHash
// TEST: (integration) src/lib/sync/engine.test.ts — hash used when compareMethod hash or verify enabled

## ErrorHandling

// [IMPL-NSYNC_HASH] [ARCH-HASH_VERIFICATION] [REQ-HASH_COMPUTATION]: how: computeFileHash throws; callers (compare, verify, engine) catch and treat as failure

```
IMPL-NSYNC_HASH_on_error(context, error):
  INPUT: hash computation error, filePath context
  OUTPUT: error propagated to caller
  PRE: error during computeFileHash or stream read
  POST: error logged and rethrown
  EFFECTS: none beyond logging
  TERMINATION: total
  LOG error with filePath
  THROW error to caller
```
