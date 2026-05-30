// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: Serialization and round-trip unit tests

import { describe, it, expect } from "vitest";
import {
  toDtoCredentialReference,
  fromDtoCredentialReference,
  toDtoDepot,
  toDtoSyncLink,
  toDtoPolicy,
  toDtoMesh,
  fromDtoMesh,
} from "./serialize";
import { defaultPolicy } from "./validators";
import type { CredentialReference, Depot, Mesh, Policy, SyncLink } from "./types";
import { expectValidationError, refuteValidationError } from "./domain.test-helpers";

// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: how: Emit id and label only on DTO (no secret field).

describe("IMPL-MESH_DOMAIN_TYPES_TO_DTO_CREDENTIAL_REFERENCE [REQ-MESH_DOMAIN_MODEL]", () => {
  it("returns id and label only", () => {
    const ref: CredentialReference = { id: "c1", label: "Vault" };
    const dto = toDtoCredentialReference(ref);
    expect(dto).toEqual({ id: "c1", label: "Vault" });
    expect(dto).not.toHaveProperty("secret");
  });
});

// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: how: Deserialize DTO by delegating to VALIDATE_CREDENTIAL_REFERENCE (intra-IMPL call).

describe("IMPL-MESH_DOMAIN_TYPES_FROM_DTO_CREDENTIAL_REFERENCE [REQ-MESH_DOMAIN_MODEL]", () => {
  it("round-trips valid credential DTO", () => {
    const result = fromDtoCredentialReference({ id: "c1", label: "Vault" });
    refuteValidationError(result);
    expect(result).toEqual({ id: "c1", label: "Vault" });
  });

  it("rejects secret in DTO", () => {
    expectValidationError(
      fromDtoCredentialReference({ id: "c1", label: "L", secret: "x" }),
      "credential_secret_not_allowed_in_domain",
    );
  });
});

// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: how: Map validated Depot entity to JSON-safe DTO for mesh serialization.

describe("IMPL-MESH_DOMAIN_TYPES_TO_DTO_DEPOT [REQ-MESH_DOMAIN_MODEL]", () => {
  it("maps depot fields to DTO", () => {
    const depot: Depot = {
      id: "d1",
      name: "Primary",
      kind: "local",
      root: "/data",
      accessMode: "read_write",
    };
    expect(toDtoDepot(depot)).toEqual({
      id: "d1",
      name: "Primary",
      kind: "local",
      root: "/data",
      credentialReferenceId: undefined,
      accessMode: "read_write",
    });
  });
});

// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: how: Map validated SyncLink entity to JSON-safe DTO for mesh serialization.

describe("IMPL-MESH_DOMAIN_TYPES_TO_DTO_SYNC_LINK [REQ-MESH_DOMAIN_MODEL]", () => {
  it("maps link fields to DTO", () => {
    const link: SyncLink = {
      id: "l1",
      sourceDepotId: "d1",
      targetDepotId: "d2",
      direction: "bidirectional",
    };
    expect(toDtoSyncLink(link)).toEqual({
      id: "l1",
      sourceDepotId: "d1",
      targetDepotId: "d2",
      direction: "bidirectional",
    });
  });
});

// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: how: Map validated Policy entity to JSON-safe DTO embedded in mesh DTO.

describe("IMPL-MESH_DOMAIN_TYPES_TO_DTO_POLICY [REQ-MESH_DOMAIN_MODEL]", () => {
  it("maps policy fields to plain object", () => {
    const policy: Policy = defaultPolicy();
    expect(toDtoPolicy(policy)).toEqual({
      deletePolicy: "never",
      conflictPolicy: "prefer_authoritative",
      retryMaxAttempts: 3,
      verificationMode: "size_mtime",
    });
  });
});

// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: how: Serialize mesh by mapping depots, links, and policy to DTO parts.

describe("IMPL-MESH_DOMAIN_TYPES_TO_DTO_MESH [REQ-MESH_DOMAIN_MODEL]", () => {
  it("serializes mesh with depots, links, and policy", () => {
    const mesh: Mesh = {
      id: "m1",
      name: "Test Mesh",
      tags: ["t1"],
      depots: [
        {
          id: "d1",
          name: "A",
          kind: "local",
          root: "/a",
          accessMode: "read_write",
        },
      ],
      links: [
        {
          id: "l1",
          sourceDepotId: "d1",
          targetDepotId: "d1",
          direction: "one_way",
        },
      ],
      policy: defaultPolicy(),
    };
    const dto = toDtoMesh(mesh);
    expect(dto.id).toBe("m1");
    expect(dto.name).toBe("Test Mesh");
    expect(dto.tags).toEqual(["t1"]);
    expect(Array.isArray(dto.depots)).toBe(true);
    expect((dto.depots as unknown[]).length).toBe(1);
    expect(dto.policy).toEqual({
      deletePolicy: "never",
      conflictPolicy: "prefer_authoritative",
      retryMaxAttempts: 3,
      verificationMode: "size_mtime",
    });
  });
});

// [IMPL-MESH_DOMAIN_TYPES] [ARCH-MESH_DOMAIN] [ARCH-MESH_LAYERED] [REQ-MESH_DOMAIN_MODEL] [REQ-MESH_PLATFORM]: how: Deserialize mesh DTO by CALL VALIDATE_MESH so invalid_core_objects_are_rejected on FROM_DTO.

describe("IMPL-MESH_DOMAIN_TYPES_FROM_DTO_MESH [REQ-MESH_DOMAIN_MODEL]", () => {
  it("reconstructs mesh from valid DTO", () => {
    const dto = {
      name: "Round Trip",
      depots: [{ name: "A", kind: "local", root: "/a" }],
      links: [],
    };
    const result = fromDtoMesh(dto);
    refuteValidationError(result);
    expect(result.name).toBe("Round Trip");
    expect(result.depots).toHaveLength(1);
  });

  it("rejects invalid mesh DTO", () => {
    expectValidationError(fromDtoMesh({ name: "" }), "mesh_name_required");
  });
});
