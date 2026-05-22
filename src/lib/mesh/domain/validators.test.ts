// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: Validation unit tests per REQ-MESH_DOMAIN_MODEL satisfaction criteria

import { describe, it, expect } from "vitest";
import {
  makeValidationError,
  defaultPolicy,
  validateCredentialReference,
  validateDepot,
  validateSyncLink,
  validateMesh,
  createMeshSnapshot,
  validateSyncSession,
  validateSyncOperation,
  validateChangeSet,
  validateConflict,
  validateFilter,
  validateSyncEvent,
} from "./validators";
import type { CredentialReference, Mesh } from "./types";
import {
  expectValidationError,
  minimalMesh,
  minimalMeshSnapshot,
  refuteValidationError,
} from "./domain.test-helpers";

// how: Build structured validation errors with path, code, and message for all VALIDATE_* reject paths.

describe("IMPL-MESH_DOMAIN_TYPES_MakeValidationError [REQ-MESH_DOMAIN_MODEL]", () => {
  it("returns code, path, and message from inputs", () => {
    const err = makeValidationError("depot.name", "depot_name_required", "Name is required");
    expect(err).toEqual({
      code: "depot_name_required",
      path: "depot.name",
      message: "Name is required",
    });
  });

  it("rejects empty code with validation_code_required", () => {
    const err = makeValidationError("field", "", "message");
    expectValidationError(err, "validation_code_required");
  });
});

// how: Supply non-destructive policy defaults for policy_has_default_safe_values and mesh policy omission.

describe("IMPL-MESH_DOMAIN_TYPES_DEFAULT_POLICY [REQ-MESH_DOMAIN_MODEL]", () => {
  it("returns safe default policy fields", () => {
    const policy = defaultPolicy();
    expect(policy).toEqual({
      deletePolicy: "never",
      conflictPolicy: "prefer_authoritative",
      retryMaxAttempts: 3,
      verificationMode: "size_mtime",
    });
  });
});

// how: Validate optional inline policy fields on mesh DTOs before accepting a Mesh.policy value.

describe("IMPL-MESH_DOMAIN_TYPES_VALIDATE_POLICY [REQ-MESH_DOMAIN_MODEL]", () => {
  it("rejects invalid deletePolicy on mesh attrs", () => {
    expectValidationError(
      validateMesh({
        name: "Policy Mesh",
        policy: { deletePolicy: "wipe_all" },
      }),
      "policy_delete_invalid",
    );
  });

  it("merges omitted policy fields with safe defaults", () => {
    const result = validateMesh({
      name: "Partial Policy",
      policy: { deletePolicy: "prompt" },
    });
    refuteValidationError(result);
    expect(result.policy).toEqual({
      deletePolicy: "prompt",
      conflictPolicy: "prefer_authoritative",
      retryMaxAttempts: 3,
      verificationMode: "size_mtime",
    });
  });

  it("rejects retryMaxAttempts below 1", () => {
    expectValidationError(
      validateMesh({
        name: "Bad Retry",
        policy: { retryMaxAttempts: 0 },
      }),
      "policy_retry_max_invalid",
    );
  });
});

// how: Enforce credential_reference_does_not_expose_secret_material at construction and deserialization.

describe("IMPL-MESH_DOMAIN_TYPES_VALIDATE_CREDENTIAL_REFERENCE [REQ-MESH_DOMAIN_MODEL]", () => {
  it("accepts id and label", () => {
    const result = validateCredentialReference({ id: "cred-1", label: "Main" });
    refuteValidationError(result);
    expect(result).toEqual({ id: "cred-1", label: "Main" });
  });

  it("allocates_id_when_omitted", () => {
    const result = validateCredentialReference({ label: "Main" });
    refuteValidationError(result);
    expect(result).toMatchObject({ label: "Main" });
    expect(typeof (result as CredentialReference).id).toBe("string");
    expect((result as CredentialReference).id.length).toBeGreaterThan(0);
  });

  it("rejects secret on attrs", () => {
    expectValidationError(
      validateCredentialReference({ id: "c", label: "L", secret: "leak" }),
      "credential_secret_not_allowed_in_domain",
    );
  });
});

// how: Enforce depot_requires_name_kind_and_root and DepotKind enum for each depot in a mesh.

describe("IMPL-MESH_DOMAIN_TYPES_VALIDATE_DEPOT [REQ-MESH_DOMAIN_MODEL]", () => {
  it("accepts valid depot attrs", () => {
    const result = validateDepot({
      name: "Primary",
      kind: "local",
      root: "/data",
    });
    refuteValidationError(result);
    expect(result.name).toBe("Primary");
    expect(result.kind).toBe("local");
    expect(result.root).toBe("/data");
    expect(result.accessMode).toBe("read_write");
    expect(result.id).toBeTruthy();
  });

  it("rejects empty name", () => {
    expectValidationError(
      validateDepot({ name: "  ", kind: "local", root: "/data" }),
      "depot_name_required",
    );
  });

  it("rejects invalid kind", () => {
    expectValidationError(
      validateDepot({ name: "D", kind: "invalid", root: "/data" }),
      "depot_kind_invalid",
    );
  });
});

// how: Enforce sync_link_requires_valid_source_and_target_depots against mesh depot id set; reject self-loops.

describe("IMPL-MESH_DOMAIN_TYPES_VALIDATE_SYNC_LINK [REQ-MESH_DOMAIN_MODEL]", () => {
  const depotIds = new Set(["d1", "d2"]);

  it("accepts valid link between known depots", () => {
    const result = validateSyncLink(
      {
        sourceDepotId: "d1",
        targetDepotId: "d2",
        direction: "one_way",
      },
      depotIds,
    );
    refuteValidationError(result);
    expect(result.sourceDepotId).toBe("d1");
    expect(result.targetDepotId).toBe("d2");
  });

  it("rejects self-loop", () => {
    expectValidationError(
      validateSyncLink(
        { sourceDepotId: "d1", targetDepotId: "d1", direction: "one_way" },
        depotIds,
      ),
      "link_self_loop_not_supported",
    );
  });

  it("rejects unknown source depot", () => {
    expectValidationError(
      validateSyncLink(
        { sourceDepotId: "missing", targetDepotId: "d2", direction: "one_way" },
        depotIds,
      ),
      "link_source_unknown_depot",
    );
  });
});

// how: Orchestrate mesh_requires_name, zero-or-more depots, ordered depot-then-link validation, and policy default or VALIDATE_POLICY.

describe("IMPL-MESH_DOMAIN_TYPES_VALIDATE_MESH [REQ-MESH_DOMAIN_MODEL]", () => {
  it("accepts mesh with zero depots", () => {
    const result = validateMesh({ name: "Empty Mesh" });
    refuteValidationError(result);
    expect(result.name).toBe("Empty Mesh");
    expect(result.depots).toEqual([]);
    expect(result.links).toEqual([]);
    expect(result.policy.deletePolicy).toBe("never");
  });

  it("rejects mesh without name", () => {
    expectValidationError(validateMesh({ name: "" }), "mesh_name_required");
  });

  it("validates links against depot ids from same mesh", () => {
    const result = validateMesh({
      name: "Linked",
      depots: [{ name: "A", kind: "local", root: "/a" }],
      links: [
        {
          sourceDepotId: "unknown",
          targetDepotId: "also-unknown",
          direction: "bidirectional",
        },
      ],
    });
    expectValidationError(result, "link_source_unknown_depot");
  });
});

// how: Implement sync_session_requires_mesh_snapshot with deep clone and immutable snapshot metadata.

describe("IMPL-MESH_DOMAIN_TYPES_CREATE_MESH_SNAPSHOT [REQ-MESH_DOMAIN_MODEL]", () => {
  it("returns snapshot with id, capturedAt, and deep-copied mesh", () => {
    const mesh: Mesh = minimalMesh({ id: "m1", name: "Snap Mesh" });
    const snapshot = createMeshSnapshot(mesh);
    expect(snapshot.snapshotId).toBeTruthy();
    expect(snapshot.capturedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(snapshot.mesh).toEqual(mesh);
    expect(snapshot.mesh).not.toBe(mesh);
    mesh.name = "mutated";
    expect(snapshot.mesh.name).toBe("Snap Mesh");
  });
});

// how: Enforce sync_session_requires_mesh_snapshot and valid SessionState when state is provided.

describe("IMPL-MESH_DOMAIN_TYPES_VALIDATE_SYNC_SESSION [REQ-MESH_DOMAIN_MODEL]", () => {
  it("accepts session with meshSnapshot", () => {
    const meshSnapshot = minimalMeshSnapshot();
    const result = validateSyncSession({ meshSnapshot });
    refuteValidationError(result);
    expect(result.state).toBe("idle");
    expect(result.meshSnapshot).toEqual(meshSnapshot);
  });

  it("rejects missing meshSnapshot", () => {
    expectValidationError(validateSyncSession({}), "session_snapshot_required");
  });

  it("rejects invalid session state", () => {
    const meshSnapshot = minimalMeshSnapshot();
    expectValidationError(
      validateSyncSession({ meshSnapshot, state: "not_a_state" }),
      "session_state_invalid",
    );
  });
});

// how: Validate atomic SyncOperation kind and sourcePath for change-set membership.

describe("IMPL-MESH_DOMAIN_TYPES_VALIDATE_SYNC_OPERATION [REQ-MESH_DOMAIN_MODEL]", () => {
  it("accepts valid operation", () => {
    const result = validateSyncOperation({ kind: "copy", sourcePath: "/a.txt" });
    refuteValidationError(result);
    expect(result.kind).toBe("copy");
    expect(result.riskLevel).toBe("low");
  });

  it("rejects invalid kind", () => {
    expectValidationError(
      validateSyncOperation({ kind: "invalid", sourcePath: "/a" }),
      "operation_kind_invalid",
    );
  });
});

// how: Preserve change_set_contains_ordered_operations by validating each operation in list order.

describe("IMPL-MESH_DOMAIN_TYPES_VALIDATE_CHANGE_SET [REQ-MESH_DOMAIN_MODEL]", () => {
  it("preserves operation order", () => {
    const result = validateChangeSet({
      operations: [
        { kind: "mkdir", sourcePath: "/dir" },
        { kind: "copy", sourcePath: "/a", targetPath: "/b" },
      ],
    });
    refuteValidationError(result);
    expect(result.operations.map((o) => o.kind)).toEqual(["mkdir", "copy"]);
  });

  it("rejects missing operations", () => {
    expectValidationError(validateChangeSet({}), "change_set_operations_required");
  });
});

// how: Enforce conflict_has_type_participants_and_status with enum checks on type and status.

describe("IMPL-MESH_DOMAIN_TYPES_VALIDATE_CONFLICT [REQ-MESH_DOMAIN_MODEL]", () => {
  it("accepts valid conflict", () => {
    const result = validateConflict({
      type: "modify_modify",
      participants: ["a", "b"],
      status: "pending",
    });
    refuteValidationError(result);
    expect(result.participants).toHaveLength(2);
  });

  it("rejects fewer than two participants", () => {
    expectValidationError(
      validateConflict({ type: "modify_modify", participants: ["a"], status: "pending" }),
      "conflict_participants_required",
    );
  });

  it("rejects invalid conflict type", () => {
    expectValidationError(
      validateConflict({ type: "unknown_type", participants: ["a", "b"], status: "pending" }),
      "conflict_type_invalid",
    );
  });
});

// how: Phase-1 Filter shape (pattern + include/exclude mode) for later policy engine integration.

describe("IMPL-MESH_DOMAIN_TYPES_VALIDATE_FILTER [REQ-MESH_DOMAIN_MODEL]", () => {
  it("accepts include filter", () => {
    const result = validateFilter({ pattern: "*.txt", mode: "include" });
    refuteValidationError(result);
    expect(result).toEqual({ pattern: "*.txt", mode: "include" });
  });

  it("rejects empty pattern", () => {
    expectValidationError(validateFilter({ pattern: "", mode: "include" }), "filter_pattern_required");
  });
});

// how: Validate SyncEvent audit fields (timestamp, type, subject) for future event-log IMPL.

describe("IMPL-MESH_DOMAIN_TYPES_VALIDATE_SYNC_EVENT [REQ-MESH_DOMAIN_MODEL]", () => {
  it("accepts valid event with default empty payload", () => {
    const result = validateSyncEvent({
      timestamp: "2026-05-19T12:00:00.000Z",
      type: "scan.started",
      subject: "session-1",
    });
    refuteValidationError(result);
    expect(result.payload).toEqual({});
  });

  it("rejects missing timestamp", () => {
    expectValidationError(
      validateSyncEvent({ type: "t", subject: "s" }),
      "event_timestamp_required",
    );
  });
});
