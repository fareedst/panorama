// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: Entity and enum types for mesh domain (types only; validators in validators.ts)

export type DomainValidationError = {
  code: string;
  path: string;
  message: string;
};

export type DepotKind = "local" | "remote" | "virtual";
export type LinkDirection = "one_way" | "bidirectional";
export type AccessMode = "read_only" | "read_write";
export type DeletePolicy = "never" | "prompt" | "allow";
export type ConflictPolicy = "prefer_authoritative" | "prefer_newer" | "manual";
export type VerificationMode = "none" | "size_mtime" | "checksum";
export type SessionState =
  | "idle"
  | "scanning"
  | "running"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled";
export type OperationKind = "copy" | "update" | "delete" | "mkdir" | "verify";
export type RiskLevel = "low" | "medium" | "high";
export type ConflictType =
  | "modify_modify"
  | "delete_modify"
  | "rename_modify"
  | "file_directory";
export type ConflictStatus = "pending" | "resolved" | "dismissed";
export type FilterMode = "include" | "exclude";

export type CredentialReference = {
  id: string;
  label: string;
};

export type Depot = {
  id: string;
  name: string;
  kind: DepotKind;
  root: string;
  credentialReferenceId?: string;
  accessMode: AccessMode;
};

export type SyncLink = {
  id: string;
  sourceDepotId: string;
  targetDepotId: string;
  direction: LinkDirection;
};

export type Policy = {
  deletePolicy: DeletePolicy;
  conflictPolicy: ConflictPolicy;
  retryMaxAttempts: number;
  verificationMode: VerificationMode;
};

export type Mesh = {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  depots: Depot[];
  links: SyncLink[];
  policy: Policy;
};

export type MeshSnapshot = {
  snapshotId: string;
  capturedAt: string;
  mesh: Mesh;
};

export type SyncSession = {
  id: string;
  meshSnapshot: MeshSnapshot;
  state: SessionState;
};

export type SyncOperation = {
  id: string;
  kind: OperationKind;
  sourcePath: string;
  targetPath?: string;
  riskLevel: RiskLevel;
};

export type ChangeSet = {
  id: string;
  operations: SyncOperation[];
};

export type Conflict = {
  id: string;
  type: ConflictType;
  participants: string[];
  status: ConflictStatus;
};

export type Filter = {
  pattern: string;
  mode: FilterMode;
};

export type SyncEvent = {
  id: string;
  timestamp: string;
  type: string;
  subject: string;
  payload: Record<string, unknown>;
};
