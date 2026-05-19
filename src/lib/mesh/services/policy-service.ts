// [IMPL-MESH_POLICY] [REQ-MESH_PLATFORM]: Filter and path mapping — phase 7

import type { Filter, Policy } from "../domain";

export type PathMapping = { fromPrefix: string; toPrefix: string };

export function defaultPolicy(): Policy {
  return {
    deletePolicy: "never",
    conflictPolicy: "prefer_authoritative",
    retryMaxAttempts: 3,
    verificationMode: "size_mtime",
  };
}

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

function globMatch(path: string, pattern: string): boolean {
  const regex = new RegExp(
    `^${pattern.replace(/\./g, "\\.").replace(/\*/g, ".*").replace(/\?/g, ".")}$`,
  );
  return regex.test(path);
}

export function applyPathMapping(path: string, mappings: PathMapping[]): string {
  for (const mapping of mappings) {
    if (path.startsWith(mapping.fromPrefix)) {
      return mapping.toPrefix + path.slice(mapping.fromPrefix.length);
    }
  }
  return path;
}

export function allowsDelete(policy: Policy): boolean {
  return policy.deletePolicy === "allow";
}
