// [IMPL-NSYNC_ENGINE] [ARCH-NSYNC_INTEGRATION] [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS]: SyncEngine orchestrates multi-source multi-destination sync with observer callbacks, compare skip, verify, store monitoring, and deferred move deletion
// Sync module exports

export { SyncEngine } from "./engine";
export { computeFileHash, verifyHash, computeBufferHash } from "./hash";
export { verifyDestination, verifyMultipleDestinations } from "./verify";
export { compareFiles } from "./compare";
export { copyFile, moveFile, deleteFile, renameFile, fileExists, getFileStat } from "./operations";
export { buildMovePlan, classifyVolumeAffinity } from "./move-plan";
export type { MovePlan, MoveLeg, GetDevFn, VolumeClass } from "./move-plan";
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
