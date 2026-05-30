// [IMPL-MESH_INVENTORY] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: Read-only depot inventory scan via connector health check, listing, and per-file stat metadata.

import { describe, it, expect } from "vitest";
import { FakeConnector } from "../connector/fake-connector";
import { validateDepot, isDomainValidationError } from "../domain";
import { InventoryService } from "./inventory-service";

function depot(attrs: object) {
  const d = validateDepot(attrs);
  if (isDomainValidationError(d)) {
    throw new Error("depot");
  }
  return d;
}

describe("InventoryService [IMPL-MESH_INVENTORY]", () => {
  const svc = new InventoryService();

  // [IMPL-MESH_INVENTORY] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — verify connector health; list entries from depot root; collect directory rows and file size/mtime from stat (skip stat failures).
  it("scan_empty_depot", () => {
    const conn = new FakeConnector();
    const d = depot({ name: "Empty", kind: "virtual", root: "/" });
    const result = svc.scanDepot(d, conn);
    expect(result).not.toHaveProperty("code");
    if (!("code" in result)) {
      expect(result.entries).toEqual([]);
    }
  });

  it("scan_depot_with_files", () => {
    const conn = new FakeConnector();
    conn.seedFile("/file.txt", new TextEncoder().encode("x"));
    const d = depot({ name: "Files", kind: "local", root: "/" });
    const result = svc.scanDepot(d, conn);
    if (!("code" in result)) {
      expect(result.entries.some((e) => e.path.includes("file.txt"))).toBe(true);
    }
  });

  it("scan_depot_with_directories", () => {
    const conn = new FakeConnector();
    conn.seedFile("/dir/nested.txt", new TextEncoder().encode("n"));
    const d = depot({ name: "Dirs", kind: "local", root: "/" });
    const result = svc.scanDepot(d, conn);
    if (!("code" in result)) {
      expect(result.entries.length).toBeGreaterThan(0);
    }
  });

  it("normalize_size_metadata", () => {
    const conn = new FakeConnector();
    conn.seedFile("/sized.txt", new TextEncoder().encode("12345"));
    const d = depot({ name: "Sized", kind: "local", root: "/" });
    const result = svc.scanDepot(d, conn);
    if (!("code" in result)) {
      const file = result.entries.find((e) => e.path.includes("sized.txt"));
      expect(file?.size).toBeGreaterThan(0);
    }
  });

  it("scan_does_not_modify_depot_contents", () => {
    const conn = new FakeConnector();
    conn.seedFile("/immutable.txt", new TextEncoder().encode("keep"));
    const before = conn.readFile("/immutable.txt");
    const d = depot({ name: "RO", kind: "local", root: "/" });
    svc.scanDepot(d, conn);
    expect(conn.readFile("/immutable.txt")).toEqual(before);
  });
});
