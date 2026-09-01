// [IMPL-NSYNC_MOVE_PLAN] [ARCH-NSYNC_MOVE_PLAN] [REQ-NSYNC_HYBRID_MOVE] [REQ-MOVE_SEMANTICS]: buildMovePlan unit tests — destination mix matrix and single-rename invariant

import { describe, it, expect } from "vitest";
import { buildMovePlan, type MoveLeg, type GetDevFn } from "./move-plan";

/** Map path → device id for mocked volume affinity */
function devMap(source: string, destDevs: Record<string, number>): GetDevFn {
  const sourceDir = source.replace(/\/[^/]+$/, "") || source;
  const table: Record<string, number> = { [source]: destDevs.__source ?? 1, [sourceDir]: destDevs.__source ?? 1 };
  for (const [dest, dev] of Object.entries(destDevs)) {
    if (dest.startsWith("__")) continue;
    const dir = dest.replace(/\/[^/]+$/, "") || dest;
    table[dir] = dev;
    table[dest] = dev;
  }
  return async (p: string) => table[p];
}

function countRename(legs: MoveLeg[]): number {
  return legs.filter((l) => l.op === "rename").length;
}

function legOps(legs: MoveLeg[]): string[] {
  return legs.map((l) => `${l.op}:${l.to}`);
}

describe("buildMovePlan [IMPL-NSYNC_MOVE_PLAN] [REQ-NSYNC_HYBRID_MOVE]", () => {
  const source = "/volA/source/file.txt";

  // [IMPL-NSYNC_MOVE_PLAN] [REQ-NSYNC_HYBRID_MOVE]: 0 same-volume, N cross-volume — copy-only + deferred delete
  it("0 same-volume, 2 cross-volume — two copies, no rename, omitDeferredDelete false", async () => {
    const dest1 = "/volB/dest1/file.txt";
    const dest2 = "/volC/dest2/file.txt";
    const getDev = devMap(source, { __source: 1, [dest1]: 2, [dest2]: 3 });

    const plan = await buildMovePlan(source, [dest1, dest2], getDev);

    expect(countRename(plan.legs)).toBe(0);
    expect(plan.omitDeferredDelete).toBe(false);
    expect(plan.legs).toHaveLength(2);
    expect(plan.legs.every((l) => l.op === "copy")).toBe(true);
    expect(plan.legs.every((l) => l.from === source)).toBe(true);
  });

  // [IMPL-NSYNC_MOVE_PLAN] [REQ-NSYNC_HYBRID_MOVE]: 1 same-volume, 0 cross-volume — single rename
  it("1 same-volume, 0 cross-volume — single rename, omitDeferredDelete true", async () => {
    const dest = "/volA/other/file.txt";
    const getDev = devMap(source, { __source: 1, [dest]: 1 });

    const plan = await buildMovePlan(source, [dest], getDev);

    expect(plan.legs).toEqual([
      { op: "rename", from: source, to: dest, volumeClass: "same-volume" },
    ]);
    expect(plan.omitDeferredDelete).toBe(true);
    expect(plan.renameTarget).toBe(dest);
  });

  // [IMPL-NSYNC_MOVE_PLAN] [REQ-NSYNC_HYBRID_MOVE]: 1 same-volume, M cross-volume — copies first then rename
  it("1 same-volume, 1 cross-volume (A+A+B) — cross copy then rename", async () => {
    const destSame = "/volA/dest1/file.txt";
    const destCross = "/volB/dest2/file.txt";
    const getDev = devMap(source, { __source: 1, [destSame]: 1, [destCross]: 2 });

    const plan = await buildMovePlan(source, [destSame, destCross], getDev);

    expect(countRename(plan.legs)).toBe(1);
    expect(plan.omitDeferredDelete).toBe(true);
    expect(legOps(plan.legs)).toEqual([`copy:${destCross}`, `rename:${destSame}`]);
    expect(plan.legs[0]!.volumeClass).toBe("cross-volume");
    expect(plan.legs[1]!.op).toBe("rename");
  });

  // [IMPL-NSYNC_MOVE_PLAN] [REQ-NSYNC_HYBRID_MOVE]: K same-volume, 0 cross-volume — K-1 copies + one rename
  it("2 same-volume, 0 cross-volume — one copy and one rename (single-rename invariant)", async () => {
    const destA = "/volA/z/file.txt";
    const destB = "/volA/a/file.txt"; // lex smaller → rename target
    const getDev = devMap(source, { __source: 1, [destA]: 1, [destB]: 1 });

    const plan = await buildMovePlan(source, [destA, destB], getDev);

    expect(countRename(plan.legs)).toBe(1);
    expect(plan.renameTarget).toBe(destB);
    expect(legOps(plan.legs)).toEqual([`copy:${destA}`, `rename:${destB}`]);
    expect(plan.omitDeferredDelete).toBe(true);
  });

  // [IMPL-NSYNC_MOVE_PLAN] [REQ-NSYNC_HYBRID_MOVE]: K same-volume, M cross-volume — full mixed plan
  it("2 same-volume, 1 cross-volume — cross copy, same-volume copy, rename last", async () => {
    const destCross = "/volB/cross/file.txt";
    const destSameA = "/volA/z/file.txt";
    const destSameB = "/volA/a/file.txt"; // rename target
    const getDev = devMap(source, {
      __source: 1,
      [destCross]: 2,
      [destSameA]: 1,
      [destSameB]: 1,
    });

    const plan = await buildMovePlan(source, [destSameA, destCross, destSameB], getDev);

    expect(countRename(plan.legs)).toBe(1);
    expect(plan.renameTarget).toBe(destSameB);
    expect(legOps(plan.legs)).toEqual([
      `copy:${destCross}`,
      `copy:${destSameA}`,
      `rename:${destSameB}`,
    ]);
  });

  // [IMPL-NSYNC_MOVE_PLAN] [REQ-NSYNC_HYBRID_MOVE]: unknown dev — conservative cross-volume copy
  it("unknown dev on dest dir — treated as cross-volume copy", async () => {
    const dest = "/volA/dest/file.txt";
    const getDev: GetDevFn = async (p) => (p === source ? 1 : undefined);

    const plan = await buildMovePlan(source, [dest], getDev);

    expect(plan.legs).toEqual([
      { op: "copy", from: source, to: dest, volumeClass: "cross-volume" },
    ]);
    expect(plan.omitDeferredDelete).toBe(false);
  });

  // [IMPL-NSYNC_MOVE_PLAN] [REQ-NSYNC_HYBRID_MOVE]: rename is always final leg
  it("rename leg is always last when present", async () => {
    const destCross = "/volB/x/file.txt";
    const destSame = "/volA/a/file.txt";
    const getDev = devMap(source, { __source: 1, [destCross]: 2, [destSame]: 1 });

    const plan = await buildMovePlan(source, [destSame, destCross], getDev);

    const last = plan.legs[plan.legs.length - 1];
    expect(last?.op).toBe("rename");
  });

  it("empty destPaths returns empty plan", async () => {
    const plan = await buildMovePlan(source, [], devMap(source, { __source: 1 }));
    expect(plan.legs).toEqual([]);
    expect(plan.omitDeferredDelete).toBe(false);
  });
});
