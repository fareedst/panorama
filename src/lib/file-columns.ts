// [IMPL-FILE_COLUMN_CONFIG] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_FILE_MANAGER] [REQ-WORKSPACE_MESH_BRIDGE]
// File pane column helpers: visibility, reorder, snapshot normalize, CSS grid template

import type { FileColumnId, FilesColumnConfig } from "./config.types";
import type { FileStat } from "./files.types";
import { WORKSPACE_AGE_REFERENCE_FALLBACK_MS } from "./request-age-reference";
import { formatAge, formatDateTime, formatSize } from "./files.utils";

const ALL_COLUMN_IDS: FileColumnId[] = ["mtime", "size", "name"];

/** Padding for `px-2` cells in monospace ch units (leading + trailing). */
const COLUMN_CELL_PADDING_CH = 4;

const MIN_SIZE_DISPLAY_CH = 3;
const MIN_MTIME_AGE_CH = 10;
const MIN_MTIME_ABSOLUTE_CH = 19;

/** Default column config (matches DEFAULT_FILES_CONFIG). */
export const DEFAULT_FILE_COLUMNS: FilesColumnConfig[] = [
  { id: "mtime", visible: true, format: "age" },
  { id: "size", visible: true },
  { id: "name", visible: true },
];

/** Measured ch widths for fixed metadata columns (excludes name). */
export type MeasuredFileColumnWidths = Partial<Record<Exclude<FileColumnId, "name">, number>>;

/** Visible columns in configured order. */
export function getVisibleFileColumns(columns: FilesColumnConfig[]): FilesColumnConfig[] {
  return columns.filter((col) => col.visible !== false);
}

/** Reorder columns by id list; unknown ids omitted; missing ids appended in original order. */
export function reorderFileColumns(
  columns: FilesColumnConfig[],
  orderedIds: FileColumnId[],
): FilesColumnConfig[] {
  const byId = new Map(columns.map((c) => [c.id, c]));
  const result: FilesColumnConfig[] = [];
  const used = new Set<FileColumnId>();

  for (const id of orderedIds) {
    const col = byId.get(id);
    if (col) {
      result.push({ ...col });
      used.add(id);
    }
  }
  for (const col of columns) {
    if (!used.has(col.id)) {
      result.push({ ...col });
    }
  }
  return result;
}

/** Validate snapshot/config column array; fall back to yamlDefaults when invalid. */
export function normalizeFileColumns(
  raw: unknown,
  yamlDefaults: FilesColumnConfig[],
): FilesColumnConfig[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return yamlDefaults.map((c) => ({ ...c }));
  }
  const parsed: FilesColumnConfig[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const rec = item as Record<string, unknown>;
    const id = rec.id;
    if (id !== "mtime" && id !== "size" && id !== "name") continue;
    parsed.push({
      id,
      visible: rec.visible === false ? false : true,
      ...(id === "mtime" && (rec.format === "age" || rec.format === "absolute")
        ? { format: rec.format }
        : {}),
    });
  }
  if (parsed.length === 0) {
    return yamlDefaults.map((c) => ({ ...c }));
  }
  const seen = new Set(parsed.map((c) => c.id));
  for (const def of yamlDefaults) {
    if (!seen.has(def.id)) {
      parsed.push({ ...def });
    }
  }
  return parsed;
}

export type FormatFileColumnCellOptions = {
  /** Stable clock for relative mtime (SSR/hydration). */
  referenceNowMs?: number;
};

/** Formatted cell text for width measurement and display. */
export function formatFileColumnCell(
  file: FileStat,
  columnId: FileColumnId,
  columns: FilesColumnConfig[],
  options?: FormatFileColumnCellOptions,
): string {
  switch (columnId) {
    case "name":
      return file.name;
    case "size":
      if (file.isDirectory) return "";
      return formatSize(file.size);
    case "mtime": {
      const column = columns.find((c) => c.id === "mtime");
      const format = column?.format || "age";
      const ref = options?.referenceNowMs;
      return format === "age"
        ? formatAge(file.mtime, ref ?? WORKSPACE_AGE_REFERENCE_FALLBACK_MS)
        : formatDateTime(file.mtime);
    }
    default:
      return "";
  }
}

/** Max formatted width in ch for visible size/mtime columns. */
export function measureFileMetadataColumnWidths(
  files: FileStat[],
  visibleColumns: FilesColumnConfig[],
  referenceNowMs?: number,
): MeasuredFileColumnWidths {
  const measured: MeasuredFileColumnWidths = {};
  const cellOptions: FormatFileColumnCellOptions | undefined =
    referenceNowMs !== undefined ? { referenceNowMs } : undefined;

  for (const col of visibleColumns) {
    if (col.id === "name") continue;

    let maxLen =
      col.id === "size"
        ? MIN_SIZE_DISPLAY_CH
        : col.format === "absolute"
          ? MIN_MTIME_ABSOLUTE_CH
          : MIN_MTIME_AGE_CH;

    for (const file of files) {
      const text = formatFileColumnCell(file, col.id, visibleColumns, cellOptions);
      maxLen = Math.max(maxLen, text.length);
    }

    measured[col.id] = maxLen + COLUMN_CELL_PADDING_CH;
  }

  return measured;
}

/** Workspace-wide max Size/Time ch for OneColumn (stacked panes share tracks). */
export function measureFileMetadataColumnWidthsForPanes(
  panesFiles: FileStat[][],
  visibleColumns: FilesColumnConfig[],
  referenceNowMs?: number,
): MeasuredFileColumnWidths {
  const allFiles = panesFiles.flat();
  return measureFileMetadataColumnWidths(allFiles, visibleColumns, referenceNowMs);
}

/** CSS grid template for metadata columns (leading checkbox/icon tracks added by FilePane). */
export function buildFileRowGridTemplate(
  visibleIds: FileColumnId[],
  measured?: MeasuredFileColumnWidths,
): string {
  if (visibleIds.length === 0) {
    return "";
  }
  return visibleIds
    .map((id) => {
      if (id === "name") return "minmax(0, 1fr)";
      const ch = measured?.[id];
      if (ch != null && ch > 0) return `${ch}ch`;
      return "max-content";
    })
    .join(" ");
}

/** Human-readable column order for mesh summary and diff. */
export function formatFileColumnsLabel(columns: FilesColumnConfig[]): string {
  return getVisibleFileColumns(columns)
    .map((c) => c.id)
    .join(", ");
}

export function defaultFileColumnIds(): FileColumnId[] {
  return [...ALL_COLUMN_IDS];
}
