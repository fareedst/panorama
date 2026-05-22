// [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] [REQ-MESH_PLATFORM] [REQ-MULTI_PANE_LAYOUT]: Workspace ↔ mesh snapshot bridge

import type { ComparisonMode } from "./files.types";
import { normalizeLayoutType, type LayoutType } from "./files.layout";
import type { SortCriterion, SortDirection } from "./files.utils";
import type { Mesh } from "./mesh/domain";

export const WORKSPACE_SNAPSHOT_TAG = "workspace-snapshot";
export const WORKSPACE_SNAPSHOT_VERSION = 1 as const;

export type WorkspaceSnapshotPane = {
  path: string;
  sortBy: SortCriterion;
  sortDirection: SortDirection;
  sortDirsFirst: boolean;
  cursor: number;
};

export type WorkspaceSnapshot = {
  version: typeof WORKSPACE_SNAPSHOT_VERSION;
  layout: LayoutType;
  focusIndex: number;
  linkedMode: boolean;
  comparisonMode: ComparisonMode;
  panes: WorkspaceSnapshotPane[];
};

export type WorkspaceCaptureInput = {
  layout: LayoutType;
  focusIndex: number;
  linkedMode: boolean;
  comparisonMode: ComparisonMode;
  panes: WorkspaceSnapshotPane[];
};

export type MeshCreateFromWorkspaceInput = {
  name: string;
  note?: string;
  snapshot: WorkspaceSnapshot;
};

export type MeshUpdateFromWorkspaceInput = {
  name?: string;
  note?: string;
  snapshot: WorkspaceSnapshot;
  existingDescription?: string;
};

export type WorkspaceSnapshotChange = {
  field: string;
  saved: string;
  current: string;
};

export type DepotSyncOp =
  | { op: "update"; depotId: string; root: string; name: string }
  | { op: "add"; name: string; root: string }
  | { op: "remove"; depotId: string };

export type DepotForSync = { id: string; name: string; root: string };

// [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] CAPTURE_SNAPSHOT
/** Build v1 snapshot from live workspace pane state. */
export function captureWorkspaceSnapshot(input: WorkspaceCaptureInput): WorkspaceSnapshot {
  return {
    version: WORKSPACE_SNAPSHOT_VERSION,
    layout: normalizeLayoutType(input.layout) ?? "Tile",
    focusIndex: input.focusIndex,
    linkedMode: input.linkedMode,
    comparisonMode: input.comparisonMode,
    panes: input.panes.map((p) => ({ ...p })),
  };
}

// [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] EXTRACT_NOTE_PREFIX
/** Human-readable note before JSON in mesh description, if any. */
export function extractNotePrefixFromDescription(description: string | undefined): string {
  if (!description?.trim()) {
    return "";
  }
  const trimmed = description.trim();
  const jsonStart = trimmed.indexOf("{");
  if (jsonStart <= 0) {
    return jsonStart < 0 ? trimmed : "";
  }
  return trimmed.slice(0, jsonStart).trim();
}

// [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] BUILD_MESH_UPDATE_DESCRIPTION
/** Rebuild description with workspaceSnapshot JSON; optional note prefix. */
export function buildMeshUpdateDescription(
  snapshot: WorkspaceSnapshot,
  note?: string,
  existingDescription?: string,
): string {
  const descriptionPayload = { workspaceSnapshot: snapshot };
  const noteText = note?.trim() ?? extractNotePrefixFromDescription(existingDescription);
  return noteText
    ? `${noteText}\n${JSON.stringify(descriptionPayload)}`
    : JSON.stringify(descriptionPayload);
}

// [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] BUILD_MESH_PATCH_PAYLOAD
/** PATCH /api/mesh/:id body fields for workspace update. */
export function buildMeshPatchPayload(input: MeshUpdateFromWorkspaceInput): {
  name?: string;
  description: string;
  tags: string[];
} {
  const description = buildMeshUpdateDescription(
    input.snapshot,
    input.note,
    input.existingDescription,
  );
  return {
    ...(input.name?.trim() ? { name: input.name.trim() } : {}),
    description,
    tags: [WORKSPACE_SNAPSHOT_TAG],
  };
}

// [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] PLAN_DEPOT_SYNC
/** Ordered depot ops to align mesh depots with snapshot pane paths. */
export function planDepotSync(
  existingDepots: DepotForSync[],
  snapshotPanes: WorkspaceSnapshotPane[],
): DepotSyncOp[] {
  const ops: DepotSyncOp[] = [];
  const pairCount = Math.min(existingDepots.length, snapshotPanes.length);
  for (let i = 0; i < pairCount; i++) {
    const depot = existingDepots[i];
    const pane = snapshotPanes[i];
    const name = `Pane ${i + 1}`;
    if (depot.root !== pane.path || depot.name !== name) {
      ops.push({ op: "update", depotId: depot.id, root: pane.path, name });
    }
  }
  for (let i = existingDepots.length - 1; i >= snapshotPanes.length; i--) {
    ops.push({ op: "remove", depotId: existingDepots[i].id });
  }
  for (let i = existingDepots.length; i < snapshotPanes.length; i++) {
    ops.push({ op: "add", name: `Pane ${i + 1}`, root: snapshotPanes[i].path });
  }
  return ops;
}

// [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] DIFF_SAVED_VS_CURRENT
/** Field-level diff between saved and current workspace snapshots. */
export function diffWorkspaceSnapshots(
  saved: WorkspaceSnapshot,
  current: WorkspaceSnapshot,
): WorkspaceSnapshotChange[] {
  const changes: WorkspaceSnapshotChange[] = [];
  const push = (field: string, savedVal: unknown, currentVal: unknown) => {
    const s = String(savedVal);
    const c = String(currentVal);
    if (s !== c) {
      changes.push({ field, saved: s, current: c });
    }
  };

  push("layout", saved.layout, current.layout);
  push("focusIndex", saved.focusIndex + 1, current.focusIndex + 1);
  push("linkedMode", saved.linkedMode ? "on" : "off", current.linkedMode ? "on" : "off");
  push("comparisonMode", saved.comparisonMode, current.comparisonMode);
  push("paneCount", saved.panes.length, current.panes.length);

  const maxPanes = Math.max(saved.panes.length, current.panes.length);
  for (let i = 0; i < maxPanes; i++) {
    const sp = saved.panes[i];
    const cp = current.panes[i];
    const n = i + 1;
    if (!sp && cp) {
      changes.push({ field: `Pane ${n}`, saved: "(missing)", current: cp.path });
      continue;
    }
    if (sp && !cp) {
      changes.push({ field: `Pane ${n}`, saved: sp.path, current: "(missing)" });
      continue;
    }
    if (!sp || !cp) {
      continue;
    }
    push(`Pane ${n} path`, sp.path, cp.path);
    push(`Pane ${n} sortBy`, sp.sortBy, cp.sortBy);
    push(`Pane ${n} sortDirection`, sp.sortDirection, cp.sortDirection);
    push(`Pane ${n} sortDirsFirst`, sp.sortDirsFirst, cp.sortDirsFirst);
    push(`Pane ${n} cursor`, sp.cursor, cp.cursor);
  }
  return changes;
}

// [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] BUILD_MESH_PAYLOAD
/** POST /api/mesh body: depots from panes, UI in description JSON, tag workspace-snapshot. */
export function buildMeshCreatePayload(input: MeshCreateFromWorkspaceInput): Record<string, unknown> {
  const { snapshot, name, note } = input;
  const description = buildMeshUpdateDescription(snapshot, note);

  return {
    name: name.trim(),
    tags: [WORKSPACE_SNAPSHOT_TAG],
    description,
    depots: snapshot.panes.map((pane, i) => ({
      name: `Pane ${i + 1}`,
      kind: "local",
      root: pane.path,
      accessMode: "read_write",
    })),
    links: [],
  };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/** Accept `{ workspaceSnapshot }` wrapper or a root-level v1 snapshot object. */
function extractSnapshotRecord(parsed: unknown): Record<string, unknown> | null {
  if (!isRecord(parsed)) {
    return null;
  }
  if (isRecord(parsed.workspaceSnapshot)) {
    return parsed.workspaceSnapshot;
  }
  if (Number(parsed.version) === WORKSPACE_SNAPSHOT_VERSION && Array.isArray(parsed.panes)) {
    return parsed;
  }
  return null;
}

// PARSE_SNAPSHOT_FROM_MESH — parse description JSON (note prefix allowed)
function parseDescriptionJson(description: string | undefined): WorkspaceSnapshot | null {
  if (!description?.trim()) {
    return null;
  }
  const trimmed = description.trim();
  const jsonStart = trimmed.indexOf("{");
  const jsonText = jsonStart >= 0 ? trimmed.slice(jsonStart) : trimmed;
  try {
    const parsed = JSON.parse(jsonText) as unknown;
    const snapshotRecord = extractSnapshotRecord(parsed);
    if (!snapshotRecord) {
      return null;
    }
    return validateWorkspaceSnapshot(snapshotRecord);
  } catch {
    return null;
  }
}

function validateWorkspaceSnapshot(raw: unknown): WorkspaceSnapshot | null {
  if (!isRecord(raw)) {
    return null;
  }
  if (Number(raw.version) !== WORKSPACE_SNAPSHOT_VERSION) {
    return null;
  }
  if (!Array.isArray(raw.panes) || raw.panes.length === 0) {
    return null;
  }
  const panes: WorkspaceSnapshotPane[] = [];
  for (const p of raw.panes) {
    if (!isRecord(p) || typeof p.path !== "string" || !p.path.trim()) {
      return null;
    }
    panes.push({
      path: p.path,
      sortBy: (p.sortBy as SortCriterion) ?? "name",
      sortDirection: (p.sortDirection as SortDirection) ?? "asc",
      sortDirsFirst: typeof p.sortDirsFirst === "boolean" ? p.sortDirsFirst : true,
      cursor: typeof p.cursor === "number" && p.cursor >= 0 ? p.cursor : 0,
    });
  }
  // [IMPL-WORKSPACE_MESH_BRIDGE] [REQ-MULTI_PANE_LAYOUT] NORMALIZE_LAYOUT within PARSE_SNAPSHOT_FROM_MESH
  const layout = normalizeLayoutType(raw.layout) ?? "Tile";
  const comparison = raw.comparisonMode as ComparisonMode;
  const validComparison: ComparisonMode[] = ["off", "name", "size", "time"];
  return {
    version: WORKSPACE_SNAPSHOT_VERSION,
    layout,
    focusIndex:
      typeof raw.focusIndex === "number" && raw.focusIndex >= 0
        ? Math.min(raw.focusIndex, panes.length - 1)
        : 0,
    linkedMode: Boolean(raw.linkedMode),
    comparisonMode: validComparison.includes(comparison) ? comparison : "off",
    panes,
  };
}

/** Paths from depots when snapshot JSON is missing or invalid. */
export function depotPathsFromMesh(mesh: Pick<Mesh, "depots">): string[] {
  return mesh.depots.map((d) => d.root).filter((r) => r.trim().length > 0);
}

// [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] PARSE_SNAPSHOT_FROM_MESH
export function parseWorkspaceSnapshotFromMesh(
  mesh: Pick<Mesh, "description" | "tags" | "depots">,
): WorkspaceSnapshot | null {
  const fromDescription = parseDescriptionJson(mesh.description);
  if (fromDescription) {
    return fromDescription;
  }
  if (!mesh.tags.includes(WORKSPACE_SNAPSHOT_TAG)) {
    const paths = depotPathsFromMesh(mesh);
    if (paths.length === 0) {
      return null;
    }
    return depotOnlySnapshot(paths);
  }
  const paths = depotPathsFromMesh(mesh);
  if (paths.length === 0) {
    return null;
  }
  return depotOnlySnapshot(paths);
}

function depotOnlySnapshot(paths: string[]): WorkspaceSnapshot {
  return {
    version: WORKSPACE_SNAPSHOT_VERSION,
    layout: "Tile",
    focusIndex: 0,
    linkedMode: false,
    comparisonMode: "off",
    panes: paths.map((path) => ({
      path,
      sortBy: "name",
      sortDirection: "asc",
      sortDirsFirst: true,
      cursor: 0,
    })),
  };
}

export type WorkspaceSnapshotSummary = {
  layout: LayoutType;
  focusIndex: number;
  linkedMode: boolean;
  comparisonMode: ComparisonMode;
  panePaths: string[];
};

// [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] WORKSPACE_SNAPSHOT_SUMMARY
export function workspaceSnapshotSummary(
  snapshot: WorkspaceSnapshot,
): WorkspaceSnapshotSummary {
  return {
    layout: snapshot.layout,
    focusIndex: snapshot.focusIndex,
    linkedMode: snapshot.linkedMode,
    comparisonMode: snapshot.comparisonMode,
    panePaths: snapshot.panes.map((p) => p.path),
  };
}

// [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE] APPLY_MAX_PANES_LIMIT
/** Truncate panes when exceeding maxPanes (0 = no limit). */
export function applyMaxPanesLimit(
  snapshot: WorkspaceSnapshot,
  maxPanes: number,
): { snapshot: WorkspaceSnapshot; truncated: boolean } {
  if (maxPanes <= 0 || snapshot.panes.length <= maxPanes) {
    return { snapshot, truncated: false };
  }
  const panes = snapshot.panes.slice(0, maxPanes);
  return {
    snapshot: {
      ...snapshot,
      panes,
      focusIndex: Math.min(snapshot.focusIndex, panes.length - 1),
    },
    truncated: true,
  };
}
