// [TEST-TOUCH_FILE] [IMPL-TOUCH_MTIME] [REQ-TOUCH_MTIME]

import { describe, it, expect } from "vitest";
import {
  buildTouchEntries,
  isEarliestLatestModeAvailable,
  resolveTouchBasenames,
  resolveTouchPaths,
  resolveTouchMtimeForBasename,
} from "./touch-file";
import { resolveAggregateMtime } from "./files.comparison";
import type { FileStat } from "./files.types";

function file(
  name: string,
  filePath: string,
  mtime: Date,
  isDirectory = false,
): FileStat {
  return {
    name,
    path: filePath,
    isDirectory,
    size: 100,
    mtime,
    extension: isDirectory ? "" : ".txt",
  };
}

describe("[TEST-TOUCH_FILE] resolveAggregateMtime [IMPL-TOUCH_MTIME]", () => {
  it("returns null for single mtime", () => {
    expect(resolveAggregateMtime([new Date()], "earliest")).toBeNull();
  });

  it("returns earliest and latest across two panes", () => {
    const early = new Date("2024-01-01T00:00:00.000Z");
    const late = new Date("2024-06-01T00:00:00.000Z");
    expect(resolveAggregateMtime([early, late], "earliest")?.getTime()).toBe(
      early.getTime(),
    );
    expect(resolveAggregateMtime([early, late], "latest")?.getTime()).toBe(
      late.getTime(),
    );
  });

  it("uses min/max with middle pane in three-way comparison", () => {
    const t1 = new Date("2024-01-01T00:00:00.000Z");
    const t2 = new Date("2024-03-01T00:00:00.000Z");
    const t3 = new Date("2024-06-01T00:00:00.000Z");
    expect(
      resolveAggregateMtime([t1, t2, t3], "earliest")?.getTime(),
    ).toBe(t1.getTime());
    expect(resolveAggregateMtime([t1, t2, t3], "latest")?.getTime()).toBe(
      t3.getTime(),
    );
  });
});

describe("[TEST-TOUCH_FILE] touch-file resolution [IMPL-TOUCH_MTIME]", () => {
  const t1 = new Date("2024-01-01T00:00:00.000Z");
  const t2 = new Date("2024-06-01T00:00:00.000Z");

  const panes: FileStat[][] = [
    [file("shared.txt", "/left/shared.txt", t1)],
    [file("shared.txt", "/right/shared.txt", t2)],
    [file("unique.log", "/third/unique.log", t1)],
  ];

  it("resolveTouchBasenames uses mark paths when non-empty", () => {
    expect(
      resolveTouchBasenames(new Set(["/p/a.txt", "/p/b.txt"]), panes[0][0]),
    ).toEqual(["/p/a.txt", "/p/b.txt"]);
  });

  it("resolveTouchBasenames falls back to clicked file path", () => {
    expect(resolveTouchBasenames(new Set(), panes[0][0])).toEqual([
      "/left/shared.txt",
    ]);
  });

  it("resolveTouchPaths thisPane resolves by path or basename", () => {
    expect(
      resolveTouchPaths("thisPane", 0, panes, ["/left/shared.txt"]),
    ).toEqual([{ path: "/left/shared.txt", basename: "shared.txt" }]);
    expect(
      resolveTouchPaths("thisPane", 0, panes, ["shared.txt"]),
    ).toEqual([{ path: "/left/shared.txt", basename: "shared.txt" }]);
  });

  it("resolveTouchPaths allPanes returns cross-pane paths", () => {
    expect(
      resolveTouchPaths("allPanes", 0, panes, ["shared.txt"]),
    ).toEqual([
      { path: "/left/shared.txt", basename: "shared.txt" },
      { path: "/right/shared.txt", basename: "shared.txt" },
    ]);
  });

  it("isEarliestLatestModeAvailable true when any basename shared", () => {
    expect(isEarliestLatestModeAvailable(panes, ["unique.log"])).toBe(false);
    expect(isEarliestLatestModeAvailable(panes, ["shared.txt"])).toBe(true);
    expect(
      isEarliestLatestModeAvailable(panes, ["unique.log", "shared.txt"]),
    ).toBe(true);
  });

  it("buildTouchEntries allPanes earliest sets min mtime on all copies", () => {
    const entries = buildTouchEntries(
      "allPanes",
      "earliest",
      null,
      0,
      panes,
      new Set(),
      panes[0][0],
    );
    expect(entries).toHaveLength(2);
    expect(entries.every((e) => e.mtime.getTime() === t1.getTime())).toBe(true);
  });

  it("buildTouchEntries bulk marks thisPane touches each marked file in pane", () => {
    const multiPane: FileStat[][] = [
      [
        file("a.txt", "/p/a.txt", t1),
        file("b.txt", "/p/b.txt", t2),
      ],
      [],
    ];
    const entries = buildTouchEntries(
      "thisPane",
      "now",
      null,
      0,
      multiPane,
      new Set(["/p/a.txt", "/p/b.txt"]),
      multiPane[0][0],
    );
    expect(entries.map((e) => e.path).sort()).toEqual(["/p/a.txt", "/p/b.txt"]);
  });

  it("resolveTouchMtimeForBasename specified returns provided date", () => {
    const d = new Date("2025-01-01T00:00:00.000Z");
    expect(resolveTouchMtimeForBasename("specified", d, null)?.getTime()).toBe(
      d.getTime(),
    );
  });

  it("skips entries when earliest unavailable for unique basename", () => {
    const entries = buildTouchEntries(
      "thisPane",
      "earliest",
      null,
      2,
      panes,
      new Set(),
      panes[2][0],
    );
    expect(entries).toHaveLength(0);
  });
});
