// [TEST-PANE_COMMAND_EXEC] [IMPL-PANE_COMMAND_EXEC] [REQ-PANE_COMMAND_EXEC]

import { describe, it, expect } from "vitest";
import type { FileStat } from "@/lib/files.types";
import {
  buildExecuteEntries,
  expandCommandPlaceholders,
  resolveExecuteTargets,
} from "./execute-command";

const fileA: FileStat = {
  name: "a.txt",
  path: "/left/a.txt",
  isDirectory: false,
  size: 10,
  mtime: new Date("2024-01-01T00:00:00.000Z"),
  extension: ".txt",
};

const fileB: FileStat = {
  name: "b.txt",
  path: "/left/b.txt",
  isDirectory: false,
  size: 20,
  mtime: new Date("2024-02-01T00:00:00.000Z"),
  extension: ".txt",
};

const sharedLeft: FileStat = {
  name: "shared.txt",
  path: "/left/shared.txt",
  isDirectory: false,
  size: 10,
  mtime: new Date("2024-01-01T00:00:00.000Z"),
  extension: ".txt",
};

const sharedRight: FileStat = {
  ...sharedLeft,
  path: "/right/shared.txt",
};

const panes = [
  { path: "/left", files: [fileA, fileB, sharedLeft] },
  { path: "/right", files: [sharedRight] },
];

describe("expandCommandPlaceholders [IMPL-PANE_COMMAND_EXEC]", () => {
  it("replaces $FILE and $MARKED in command string", () => {
    expect(
      expandCommandPlaceholders("echo $FILE && cat $MARKED", "/left/a.txt", [
        "/left/a.txt",
        "/left/b.txt",
      ]),
    ).toBe("echo /left/a.txt && cat /left/a.txt\n/left/b.txt");
  });

  it("uses empty string when file path missing", () => {
    expect(expandCommandPlaceholders("echo $FILE", "", [])).toBe("echo ");
  });
});

describe("resolveExecuteTargets [IMPL-PANE_COMMAND_EXEC]", () => {
  it("thisPane returns single target with initiating pane cwd and context file", () => {
    const targets = resolveExecuteTargets(
      "thisPane",
      0,
      panes,
      new Set<string>(),
      sharedLeft,
    );
    expect(targets).toEqual([
      {
        paneIndex: 0,
        cwd: "/left",
        filePath: "/left/shared.txt",
        markedPaths: [],
      },
    ]);
  });

  it("thisPane with marks resolves marked paths in initiating pane", () => {
    const targets = resolveExecuteTargets(
      "thisPane",
      0,
      panes,
      new Set(["a.txt", "b.txt"]),
      fileA,
    );
    expect(targets).toHaveLength(1);
    expect(targets[0].markedPaths.sort()).toEqual(["/left/a.txt", "/left/b.txt"]);
    expect(targets[0].filePath).toBe("/left/a.txt");
  });

  it("allPanes returns one target per pane with cross-pane file paths", () => {
    const targets = resolveExecuteTargets(
      "allPanes",
      0,
      panes,
      new Set<string>(),
      sharedLeft,
    );
    expect(targets).toEqual([
      {
        paneIndex: 0,
        cwd: "/left",
        filePath: "/left/shared.txt",
        markedPaths: [],
      },
      {
        paneIndex: 1,
        cwd: "/right",
        filePath: "/right/shared.txt",
        markedPaths: [],
      },
    ]);
  });

  it("allPanes with marks resolves marked paths per pane listing", () => {
    const targets = resolveExecuteTargets(
      "allPanes",
      0,
      panes,
      new Set(["shared.txt"]),
      sharedLeft,
    );
    expect(targets[0].markedPaths).toEqual(["/left/shared.txt"]);
    expect(targets[1].markedPaths).toEqual(["/right/shared.txt"]);
  });
});

describe("buildExecuteEntries [IMPL-PANE_COMMAND_EXEC]", () => {
  it("builds API entries with expanded commands", () => {
    const entries = buildExecuteEntries(
      "thisPane",
      "echo $FILE",
      0,
      panes,
      new Set<string>(),
      sharedLeft,
    );
    expect(entries).toEqual([
      {
        paneIndex: 0,
        cwd: "/left",
        command: "echo /left/shared.txt",
        filePath: "/left/shared.txt",
        markedPaths: [],
      },
    ]);
  });
});
