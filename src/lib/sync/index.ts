// [IMPL-NSYNC_ENGINE] [ARCH-NSYNC_INTEGRATION] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: Top-level Sync Engine Core Implementation: SyncEngine class orchestrates sync loop iterating over sources, syncing each to all destinations in parallel, tracking results, and handling move deletion
// Sync module exports

export { SyncEngine } from "./engine";
export { computeFileHash, verifyHash, computeBufferHash } from "./hash";
export { verifyDestination, verifyMultipleDestinations } from "./verify";
export { compareFiles } from "./compare";
export { copyFile, moveFile, deleteFile, fileExists, getFileStat } from "./operations";
export { StoreMonitor } from "./store";

// Re-export types
export type {
  SyncOptions,
  SyncResult,
  SyncPlan,
  ItemInfo,
  ItemResult,
  DestResult,
  SyncStats,
  SyncObserver,
  CompareMethod,
  HashAlgorithm,
} from "../sync.types";

export { ErrorClass, NoopObserver } from "../sync.types";
