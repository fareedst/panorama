// [IMPL-FILE_COLUMN_CONFIG] [REQ-CONFIG_DRIVEN_FILE_MANAGER]

import { describe, it, expect } from "vitest";
import {
  buildFileRowGridTemplate,
  formatFileColumnCell,
  formatFileColumnsLabel,
  getVisibleFileColumns,
  measureFileMetadataColumnWidths,
  measureFileMetadataColumnWidthsForPanes,
  normalizeFileColumns,
  reorderFileColumns,
} from "./file-columns";
import type { FilesColumnConfig } from "./config.types";
import type { FileStat } from "./files.types";

const yamlDefaults: FilesColumnConfig[] = [
  { id: "mtime", visible: true, format: "age" },
  { id: "size", visible: true },
  { id: "name", visible: true },
];

const sampleFiles: FileStat[] = [
  {
    name: "tiny.txt",
    path: "/x/tiny.txt",
    isDirectory: false,
    size: 10,
    mtime: new Date("2024-01-01"),
    extension: ".txt",
  },
  {
    name: "huge.bin",
    path: "/x/huge.bin",
    isDirectory: false,
    size: 1024 * 1024 * 500,
    mtime: new Date("2024-06-15"),
    extension: ".bin",
  },
];

describe("file-columns [IMPL-FILE_COLUMN_CONFIG]", () => {
  it("getVisibleFileColumns filters hidden", () => {
    const cols: FilesColumnConfig[] = [
      { id: "mtime", visible: false },
      { id: "size", visible: true },
      { id: "name", visible: true },
    ];
    expect(getVisibleFileColumns(cols).map((c) => c.id)).toEqual(["size", "name"]);
  });

  it("reorderFileColumns reorders by id list", () => {
    const cols = [...yamlDefaults];
    const reordered = reorderFileColumns(cols, ["name", "mtime", "size"]);
    expect(reordered.map((c) => c.id)).toEqual(["name", "mtime", "size"]);
    expect(reordered.find((c) => c.id === "mtime")?.format).toBe("age");
  });

  it("normalizeFileColumns uses defaults for invalid raw", () => {
    expect(normalizeFileColumns(null, yamlDefaults)).toEqual(yamlDefaults);
    expect(normalizeFileColumns([{ id: "bogus" }], yamlDefaults).map((c) => c.id)).toEqual([
      "mtime",
      "size",
      "name",
    ]);
  });

  it("normalizeFileColumns preserves valid snapshot order", () => {
    const raw = [{ id: "name" }, { id: "size", visible: false }, { id: "mtime", format: "absolute" }];
    const out = normalizeFileColumns(raw, yamlDefaults);
    expect(out.map((c) => c.id)).toEqual(["name", "size", "mtime"]);
    expect(out.find((c) => c.id === "mtime")?.format).toBe("absolute");
    expect(out.find((c) => c.id === "size")?.visible).toBe(false);
  });

  it("formatFileColumnCell returns empty size for directories", () => {
    const dir: FileStat = {
      name: "Docs",
      path: "/Docs",
      isDirectory: true,
      size: 0,
      mtime: new Date("2024-01-01"),
      extension: "",
    };
    expect(formatFileColumnCell(dir, "size", yamlDefaults)).toBe("");
  });

  it("measureFileMetadataColumnWidths uses widest size string", () => {
    const visible = getVisibleFileColumns(yamlDefaults);
    const measured = measureFileMetadataColumnWidths(sampleFiles, visible);
    const hugeSize = formatFileColumnCell(sampleFiles[1], "size", yamlDefaults);
    expect(measured.size).toBe(hugeSize.length + 4);
  });

  it("measureFileMetadataColumnWidthsForPanes uses max across panes", () => {
    const visible = getVisibleFileColumns(yamlDefaults);
    const paneA: FileStat[] = [sampleFiles[0]];
    const paneB: FileStat[] = [sampleFiles[1]];
    const perPaneA = measureFileMetadataColumnWidths(paneA, visible);
    const perPaneB = measureFileMetadataColumnWidths(paneB, visible);
    const shared = measureFileMetadataColumnWidthsForPanes([paneA, paneB], visible);
    expect(shared.size).toBe(Math.max(perPaneA.size ?? 0, perPaneB.size ?? 0));
  });

  it("measureFileMetadataColumnWidths respects mtime absolute format minimum", () => {
    const cols: FilesColumnConfig[] = [
      { id: "mtime", visible: true, format: "absolute" },
      { id: "name", visible: true },
    ];
    const measured = measureFileMetadataColumnWidths([], cols);
    expect(measured.mtime).toBe(19 + 4);
  });

  it("measureFileMetadataColumnWidths skips hidden columns", () => {
    const cols: FilesColumnConfig[] = [
      { id: "mtime", visible: false },
      { id: "size", visible: true },
      { id: "name", visible: true },
    ];
    const measured = measureFileMetadataColumnWidths(sampleFiles, getVisibleFileColumns(cols));
    expect(measured.mtime).toBeUndefined();
    expect(measured.size).toBeDefined();
  });

  it("buildFileRowGridTemplate uses ch and 1fr for name", () => {
    const measured = { size: 12, mtime: 18 };
    const t = buildFileRowGridTemplate(["mtime", "size", "name"], measured);
    expect(t).toBe("18ch 12ch minmax(0, 1fr)");
  });

  it("buildFileRowGridTemplate honors column order", () => {
    const measured = { size: 10, mtime: 14 };
    const t = buildFileRowGridTemplate(["name", "size"], measured);
    expect(t).toBe("minmax(0, 1fr) 10ch");
  });

  it("formatFileColumnsLabel lists visible ids", () => {
    expect(
      formatFileColumnsLabel([
        { id: "name", visible: true },
        { id: "size", visible: false },
        { id: "mtime", visible: true },
      ]),
    ).toBe("name, mtime");
  });
});
