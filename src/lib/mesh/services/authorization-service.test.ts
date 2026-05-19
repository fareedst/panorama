// [REQ-MESH_AUTH]: Authorization unit tests — phase 24

import { describe, it, expect } from "vitest";
import { AuthorizationService } from "./authorization-service";

describe("AuthorizationService [IMPL-MESH_AUTH]", () => {
  it("viewer_can_read_mesh", () => {
    const auth = new AuthorizationService();
    expect(auth.can("viewer", "view_mesh")).toBe(true);
  });

  it("viewer_cannot_edit_mesh", () => {
    const auth = new AuthorizationService();
    expect(auth.can("viewer", "edit_mesh")).toBe(false);
  });

  it("operator_can_run_sync", () => {
    const auth = new AuthorizationService();
    expect(auth.can("operator", "run_sync")).toBe(true);
  });

  it("operator_cannot_manage_credentials", () => {
    const auth = new AuthorizationService();
    expect(auth.can("operator", "manage_credentials")).toBe(false);
  });

  it("admin_can_manage_credentials", () => {
    const auth = new AuthorizationService();
    expect(auth.can("admin", "manage_credentials")).toBe(true);
  });

  it("permission_denial_is_audited", () => {
    const audits: unknown[] = [];
    const auth = new AuthorizationService((e) => audits.push(e));
    auth.require("viewer", "delete_mesh");
    expect(audits).toHaveLength(1);
  });
});
