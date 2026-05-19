// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: Shared Vitest helpers for mesh domain tests (not production API)

import { expect } from "vitest";
import { isDomainValidationError } from "./internal";
import { defaultPolicy } from "./validators";
import type { DomainValidationError, Mesh, MeshSnapshot } from "./types";

export function minimalMesh(overrides: Partial<Mesh> = {}): Mesh {
  return {
    id: "m1",
    name: "M",
    tags: [],
    depots: [],
    links: [],
    policy: defaultPolicy(),
    ...overrides,
  };
}

export function minimalMeshSnapshot(overrides: Partial<MeshSnapshot> = {}): MeshSnapshot {
  return {
    snapshotId: "s1",
    capturedAt: "2026-05-19T00:00:00.000Z",
    mesh: minimalMesh(),
    ...overrides,
  };
}

export function expectValidationError(
  result: unknown,
  code: string,
): asserts result is DomainValidationError {
  expect(isDomainValidationError(result)).toBe(true);
  if (isDomainValidationError(result)) {
    expect(result.code).toBe(code);
  }
}

export function refuteValidationError<T>(
  result: T | DomainValidationError,
): asserts result is T {
  expect(isDomainValidationError(result)).toBe(false);
}
