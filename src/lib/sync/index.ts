// [IMPL-NSYNC_ENGINE] [ARCH-NSYNC_INTEGRATION]
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
