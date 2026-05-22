// [IMPL-MESH_CONNECTOR] [REQ-MESH_PLATFORM]: Virtual connector — phase 4 / 28

import { describe, it, expect } from "vitest";
import { VirtualConnector } from "./virtual-connector";

describe("VirtualConnector [IMPL-MESH_CONNECTOR]", () => {
  it("virtual_connector_returns_synthetic_inventory", () => {
    const c = new VirtualConnector();
    const health = c.healthCheck();
    expect(health.ok).toBe(true);
    expect(health.message.toLowerCase()).toContain("virtual");

    const inv = c.listEntries("/virtual");
    expect(Array.isArray(inv)).toBe(true);
    if ("code" in inv) throw new Error("list failed");

    expect(inv.some((e) => !e.isDirectory && e.path.endsWith("/readme.txt"))).toBe(true);
    const readme = inv.find((e) => e.path === "/virtual/readme.txt");
    expect(readme?.isDirectory).toBe(false);
    expect(readme?.size ?? 0).toBeGreaterThan(0);

    const data = c.readFile("/virtual/readme.txt");
    expect("code" in data ? false : new TextDecoder().decode(data)).toContain("Synthetic inventory");
  });

  it("virtual_connector_lists_custom_seeded_tree", () => {
    const c = new VirtualConnector([
      { path: "/a/x.txt", content: "xo" },
      { path: "/a/y/z.txt", content: "yz" },
    ]);
    const atRoot = c.listEntries("/");
    if ("code" in atRoot) throw new Error("list");
    expect(atRoot.some((e) => e.path === "/a")).toBe(true);
  });
});
