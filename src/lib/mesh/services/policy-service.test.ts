// [IMPL-MESH_POLICY] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: Path include/exclude glob filters, prefix path mapping, and delete-policy helpers for mesh sync planning and execution.

import { describe, it, expect } from "vitest";
import { defaultPolicy } from "../domain";
import {
  pathMatchesFilter,
  applyPathMapping,
  allowsDelete,
  defaultPolicy as serviceDefaultPolicy,
} from "./policy-service";

describe("PolicyService [IMPL-MESH_POLICY]", () => {
  it("default_policy_is_non_destructive", () => {
    const policy = serviceDefaultPolicy();
    expect(policy.deletePolicy).toBe("never");
    expect(allowsDelete(policy)).toBe(false);
  });

  // [IMPL-MESH_POLICY] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — evaluate filter list with globMatch; default allow when no filters; exclude match wins over include.
  it("include_filter_matches_expected_paths", () => {
    const filters = [{ mode: "include" as const, pattern: "*.txt" }];
    expect(pathMatchesFilter("/foo.txt", filters)).toBe(true);
    expect(pathMatchesFilter("/foo.log", filters)).toBe(false);
  });

  it("exclude_filter_blocks_expected_paths", () => {
    const filters = [{ mode: "exclude" as const, pattern: "*.tmp" }];
    expect(pathMatchesFilter("/a.tmp", filters)).toBe(false);
  });

  it("exclude_filter_wins_over_include_filter", () => {
    const filters = [
      { mode: "include" as const, pattern: "*" },
      { mode: "exclude" as const, pattern: "*.tmp" },
    ];
    expect(pathMatchesFilter("/ok.txt", filters)).toBe(true);
    expect(pathMatchesFilter("/bad.tmp", filters)).toBe(false);
  });

  // [IMPL-MESH_POLICY] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — rewrite path when it starts with mapping.fromPrefix; first matching mapping wins.
  it("path_mapping_translates_source_to_target", () => {
    const mapped = applyPathMapping("/src/file.txt", [
      { fromPrefix: "/src", toPrefix: "/dst" },
    ]);
    expect(mapped).toBe("/dst/file.txt");
  });

  // [IMPL-MESH_POLICY] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — return true only when policy.deletePolicy = allow.
  it("delete_policy_never_delete", () => {
    expect(allowsDelete(defaultPolicy())).toBe(false);
  });

  it("delete_policy_allow", () => {
    expect(allowsDelete({ ...defaultPolicy(), deletePolicy: "allow" })).toBe(true);
  });
});
