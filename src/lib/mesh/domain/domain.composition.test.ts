// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: Phase G composition — public barrel bindings without UI

import { describe, it, expect } from "vitest";
import {
  validateMesh,
  validateChangeSet,
  createMeshSnapshot,
  validateSyncSession,
  toDtoMesh,
  fromDtoMesh,
  fromDtoCredentialReference,
  isDomainValidationError,
} from "./index";
import { expectValidationError, refuteValidationError } from "./domain.test-helpers";

// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: how: VALIDATE_MESH → VALIDATE_SYNC_LINK(meshDepots) — link validation runs after depots; unknown target fails at link layer.

describe("IMPL-MESH_DOMAIN_TYPES composition VALIDATE_MESH → VALIDATE_SYNC_LINK [REQ-MESH_DOMAIN_MODEL]", () => {
  it("rejects link whose target depot id was never validated in mesh depots", () => {
    const result = validateMesh({
      name: "Linked Mesh",
      depots: [{ id: "d1", name: "A", kind: "local", root: "/a" }],
      links: [
        {
          sourceDepotId: "d1",
          targetDepotId: "missing",
          direction: "one_way",
        },
      ],
    });
    expectValidationError(result, "link_target_unknown_depot");
  });
});

// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: how: VALIDATE_MESH → DEFAULT_POLICY when policy omitted — mesh policy binding uses safe defaults.

describe("IMPL-MESH_DOMAIN_TYPES composition VALIDATE_MESH → DEFAULT_POLICY [REQ-MESH_DOMAIN_MODEL]", () => {
  it("applies default policy when mesh attrs omit policy", () => {
    const mesh = validateMesh({ name: "Default Policy Mesh" });
    refuteValidationError(mesh);
    expect(mesh.policy).toEqual({
      deletePolicy: "never",
      conflictPolicy: "prefer_authoritative",
      retryMaxAttempts: 3,
      verificationMode: "size_mtime",
    });
  });
});

// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: how: FROM_DTO_MESH → VALIDATE_MESH and TO_DTO_MESH → TO_DTO_* — serialize module delegates deserialization to validators.

describe("IMPL-MESH_DOMAIN_TYPES composition mesh DTO round-trip [REQ-MESH_DOMAIN_MODEL]", () => {
  it("round-trips mesh through toDtoMesh and fromDtoMesh on the public API", () => {
    const attrs = {
      name: "Compose Mesh",
      depots: [
        { id: "d1", name: "Src", kind: "local", root: "/src" },
        { id: "d2", name: "Dst", kind: "local", root: "/dst" },
      ],
      links: [
        {
          sourceDepotId: "d1",
          targetDepotId: "d2",
          direction: "bidirectional",
        },
      ],
    };
    const mesh = validateMesh(attrs);
    refuteValidationError(mesh);
    const dto = toDtoMesh(mesh);
    const restored = fromDtoMesh(dto);
    refuteValidationError(restored);
    expect(restored.name).toBe("Compose Mesh");
    expect(restored.depots).toHaveLength(2);
    expect(restored.links[0]?.direction).toBe("bidirectional");
  });

  it("fromDtoMesh rejects invalid DTO via validateMesh binding", () => {
    expectValidationError(
      fromDtoMesh({ name: "Bad", links: [{ sourceDepotId: "x", targetDepotId: "y", direction: "one_way" }] }),
      "link_source_unknown_depot",
    );
  });
});

// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: how: FROM_DTO_CREDENTIAL_REFERENCE → VALIDATE_CREDENTIAL_REFERENCE — deserialize path reuses validator.

describe("IMPL-MESH_DOMAIN_TYPES composition FROM_DTO_CREDENTIAL_REFERENCE [REQ-MESH_DOMAIN_MODEL]", () => {
  it("rejects secret material when deserializing through the public barrel", () => {
    expectValidationError(
      fromDtoCredentialReference({ id: "c1", label: "Vault", secret: "leak" }),
      "credential_secret_not_allowed_in_domain",
    );
  });
});

// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: how: VALIDATE_CHANGE_SET → VALIDATE_SYNC_OPERATION (ordered) — first invalid op aborts with operation error.

describe("IMPL-MESH_DOMAIN_TYPES composition VALIDATE_CHANGE_SET → VALIDATE_SYNC_OPERATION [REQ-MESH_DOMAIN_MODEL]", () => {
  it("fails on second operation when first operation is valid", () => {
    const result = validateChangeSet({
      operations: [
        { kind: "copy", sourcePath: "/a" },
        { kind: "invalid_kind", sourcePath: "/b" },
      ],
    });
    expectValidationError(result, "operation_kind_invalid");
  });
});

// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: how: CREATE_MESH_SNAPSHOT → deepCloneMesh — snapshot mesh does not alias live mesh after post-validation mutation.

describe("IMPL-MESH_DOMAIN_TYPES composition CREATE_MESH_SNAPSHOT isolation [REQ-MESH_DOMAIN_MODEL]", () => {
  it("isolates snapshot mesh from subsequent live mesh edits", () => {
    const mesh = validateMesh({
      name: "Snapshot Mesh",
      depots: [{ id: "d1", name: "Before", kind: "local", root: "/before" }],
      links: [],
    });
    refuteValidationError(mesh);
    const snapshot = createMeshSnapshot(mesh);
    mesh.depots[0]!.name = "After";
    expect(snapshot.mesh.depots[0]?.name).toBe("Before");
  });
});

// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: how: validateSyncSession consumes MeshSnapshot produced by createMeshSnapshot — session binding without UI.

describe("IMPL-MESH_DOMAIN_TYPES composition snapshot → session [REQ-MESH_DOMAIN_MODEL]", () => {
  it("accepts session wired to snapshot from createMeshSnapshot", () => {
    const mesh = validateMesh({ name: "Session Mesh" });
    refuteValidationError(mesh);
    const snapshot = createMeshSnapshot(mesh);
    const session = validateSyncSession({ meshSnapshot: snapshot, state: "idle" });
    refuteValidationError(session);
    expect(session.meshSnapshot.snapshotId).toBe(snapshot.snapshotId);
    expect(isDomainValidationError(session)).toBe(false);
  });
});
