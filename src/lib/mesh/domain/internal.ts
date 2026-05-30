// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: Shared validation helpers (private; not exported from index)

import type { DomainValidationError } from "./types";

// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: how: Private helpers in internal.ts (not exported from index.ts); shared by validators and snapshot procedures.

// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: how: Allocate a new stable string id for entities missing an explicit id.

export function generateStableId(): string {
  return crypto.randomUUID();
}

// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: how: Prefer caller-supplied id when non-empty; otherwise generate a new id.

export function resolveEntityId(attrs: Record<string, unknown>): string {
  return typeof attrs.id === "string" && attrs.id.length > 0 ? attrs.id : generateStableId();
}

export function isDomainValidationError(
  value: unknown,
): value is DomainValidationError {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    "path" in value &&
    "message" in value
  );
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isOneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
): value is T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value);
}

export function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? (value as string[]) : [];
}

export function asUnknownArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function optionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function isPresent(value: unknown): boolean {
  return value !== undefined && value !== null;
}

/** True when value is provided but not a member of allowed. */
export function isPresentAndNotOneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
): boolean {
  return isPresent(value) && !isOneOf(value, allowed);
}

/** Validate a list in order; return first error or all validated values. */
export function validateEach<T>(
  items: unknown[],
  validate: (item: unknown) => T | DomainValidationError,
): T[] | DomainValidationError {
  const validated: T[] = [];
  for (const item of items) {
    const result = validate(item);
    if (isDomainValidationError(result)) {
      return result;
    }
    validated.push(result);
  }
  return validated;
}
