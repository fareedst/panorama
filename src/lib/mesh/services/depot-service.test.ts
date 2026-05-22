// [IMPL-MESH_DEPOT] [REQ-MESH_PLATFORM]: Depot CRUD unit tests — phases 3–5

import { describe, it, expect } from "vitest";
import { isDomainValidationError } from "../domain";
import { InMemoryMeshRepository } from "../repositories/memory-mesh-repository";
import { MeshService } from "./mesh-service";
import { DepotService, discoverDepotCapabilities } from "./depot-service";

function setup() {
  const repo = new InMemoryMeshRepository();
  const meshSvc = new MeshService(repo);
  const depotSvc = new DepotService(repo);
  const created = meshSvc.createMesh({ name: "Depot Mesh" });
  if (isDomainValidationError(created) || "code" in created) {
    throw new Error("mesh setup failed");
  }
  return { repo, depotSvc, meshId: created.mesh.id };
}

describe("DepotService [IMPL-MESH_DEPOT]", () => {
  it("create_local_depot", () => {
    const { depotSvc, meshId } = setup();
    const depot = depotSvc.addDepot(meshId, {
      name: "Local",
      kind: "local",
      root: "/data/local",
    });
    expect(isDomainValidationError(depot)).toBe(false);
    if (!isDomainValidationError(depot) && !("code" in depot)) {
      expect(depot.kind).toBe("local");
      expect(depot.root).toBe("/data/local");
    }
  });

  it("create_remote_depot", () => {
    const { depotSvc, meshId } = setup();
    const depot = depotSvc.addDepot(meshId, {
      name: "Remote",
      kind: "remote",
      root: "sftp://host/path",
    });
    expect(isDomainValidationError(depot)).toBe(false);
    if (!isDomainValidationError(depot) && !("code" in depot)) {
      expect(depot.kind).toBe("remote");
    }
  });

  it("create_virtual_depot", () => {
    const { depotSvc, meshId } = setup();
    const depot = depotSvc.addDepot(meshId, {
      name: "Virtual",
      kind: "virtual",
      root: "/virtual",
    });
    expect(isDomainValidationError(depot)).toBe(false);
    if (!isDomainValidationError(depot) && !("code" in depot)) {
      expect(depot.kind).toBe("virtual");
    }
  });

  it("reject_depot_without_root", () => {
    const { depotSvc, meshId } = setup();
    const depot = depotSvc.addDepot(meshId, {
      name: "NoRoot",
      kind: "local",
      root: "",
    });
    expect(isDomainValidationError(depot)).toBe(true);
  });

  it("reject_depot_without_name", () => {
    const { depotSvc, meshId } = setup();
    const depot = depotSvc.addDepot(meshId, {
      name: "",
      kind: "local",
      root: "/x",
    });
    expect(isDomainValidationError(depot)).toBe(true);
  });

  it("depot_supports_read_only_mode", () => {
    const { depotSvc, meshId } = setup();
    const depot = depotSvc.addDepot(meshId, {
      name: "RO",
      kind: "local",
      root: "/ro",
      accessMode: "read_only",
    });
    if (!isDomainValidationError(depot) && !("code" in depot)) {
      expect(depot.accessMode).toBe("read_only");
    }
  });

  it("depot_supports_read_write_mode", () => {
    const { depotSvc, meshId } = setup();
    const depot = depotSvc.addDepot(meshId, {
      name: "RW",
      kind: "local",
      root: "/rw",
      accessMode: "read_write",
    });
    if (!isDomainValidationError(depot) && !("code" in depot)) {
      expect(depot.accessMode).toBe("read_write");
    }
  });

  it("depot_capabilities_are_discoverable", () => {
    expect(discoverDepotCapabilities("local").canWrite).toBe(true);
    expect(discoverDepotCapabilities("virtual").canWrite).toBe(false);
    expect(discoverDepotCapabilities("virtual").supportsArchiveMode).toBe(true);
    expect(discoverDepotCapabilities("remote").canList).toBe(true);
  });

  it("reject_duplicate_depot_name_in_mesh", () => {
    const { depotSvc, meshId } = setup();
    depotSvc.addDepot(meshId, { name: "Dup", kind: "local", root: "/a" });
    const second = depotSvc.addDepot(meshId, { name: "Dup", kind: "local", root: "/b" });
    expect(second).toEqual({
      code: "duplicate_depot_name",
      message: "Depot name already exists in mesh",
    });
  });

  it("add_first_depot_to_mesh", () => {
    const { repo, depotSvc, meshId } = setup();
    depotSvc.addDepot(meshId, { name: "First", kind: "local", root: "/f" });
    const record = repo.get(meshId)!;
    expect(record.mesh.depots).toHaveLength(1);
  });

  it("add_multiple_depots_to_mesh", () => {
    const { repo, depotSvc, meshId } = setup();
    depotSvc.addDepot(meshId, { name: "A", kind: "local", root: "/a" });
    depotSvc.addDepot(meshId, { name: "B", kind: "local", root: "/b" });
    expect(repo.get(meshId)!.mesh.depots).toHaveLength(2);
  });

  it("mesh_reports_depot_count", () => {
    const { repo, depotSvc, meshId } = setup();
    depotSvc.addDepot(meshId, { name: "A", kind: "local", root: "/a" });
    depotSvc.addDepot(meshId, { name: "B", kind: "local", root: "/b" });
    expect(repo.get(meshId)!.mesh.depots.length).toBe(2);
  });

  it("mesh_with_no_depots_is_new_or_incomplete", () => {
    const { repo, meshId } = setup();
    expect(repo.get(meshId)!.mesh.depots).toHaveLength(0);
  });

  it("removing_depot_removes_or_invalidates_links", () => {
    const { repo, depotSvc, meshId } = setup();
    const d1 = depotSvc.addDepot(meshId, { name: "A", kind: "local", root: "/a" });
    const d2 = depotSvc.addDepot(meshId, { name: "B", kind: "local", root: "/b" });
    if (isDomainValidationError(d1) || isDomainValidationError(d2) || "code" in d1 || "code" in d2) {
      throw new Error("depot setup");
    }
    const record = repo.get(meshId)!;
    record.mesh.links = [
      {
        id: "l1",
        sourceDepotId: d1.id,
        targetDepotId: d2.id,
        direction: "one_way",
      },
    ];
    repo.save(record);
    depotSvc.removeDepot(meshId, d1.id);
    const after = repo.get(meshId)!;
    expect(after.mesh.depots).toHaveLength(1);
    expect(after.mesh.links).toHaveLength(0);
  });
});
