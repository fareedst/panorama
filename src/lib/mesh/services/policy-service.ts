// [IMPL-MESH_POLICY] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: Path include/exclude glob filters, prefix path mapping, and delete-policy helpers for mesh sync planning and execution.

import type { Filter, Policy } from "../domain";
import { globMatch } from "@/lib/glob-match";

export type PathMapping = { fromPrefix: string; toPrefix: string };

export function defaultPolicy(): Policy {
  return {
    deletePolicy: "never",
    conflictPolicy: "prefer_authoritative",
    retryMaxAttempts: 3,
    verificationMode: "size_mtime",
  };
}

// [IMPL-MESH_POLICY] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — evaluate filter list with globMatch; default allow when no filters; exclude match wins over include.
export function pathMatchesFilter(path: string, filters: Filter[]): boolean {
  let included = filters.length === 0;
  let excluded = false;
  for (const filter of filters) {
    const match = globMatch(path, filter.pattern);
    if (!match) {
      continue;
    }
    if (filter.mode === "include") {
      included = true;
    } else {
      excluded = true;
    }
  }
  if (excluded) {
    return false;
  }
  return included;
}

// [IMPL-MESH_POLICY] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — rewrite path when it starts with mapping.fromPrefix; first matching mapping wins.
export function applyPathMapping(path: string, mappings: PathMapping[]): string {
  for (const mapping of mappings) {
    if (path.startsWith(mapping.fromPrefix)) {
      return mapping.toPrefix + path.slice(mapping.fromPrefix.length);
    }
  }
  return path;
}

// [IMPL-MESH_POLICY] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — return true only when policy.deletePolicy = allow.
export function allowsDelete(policy: Policy): boolean {
  return policy.deletePolicy === "allow";
}
