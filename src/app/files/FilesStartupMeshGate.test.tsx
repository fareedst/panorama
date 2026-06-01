// [REQ-WORKSPACE_MESH_BRIDGE] [IMPL-WORKSPACE_MESH_BRIDGE]: FILES_STARTUP_MESH_GATE client redirect before WorkspaceView

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import {
  FILES_STARTUP_MESH_STORAGE_KEY,
  setFilesStartupMeshId,
} from "@/lib/files-startup-mesh";
import { FilesStartupMeshGate } from "./FilesStartupMeshGate";

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => ({
    get: (key: string) => searchParamsGet(key),
  }),
}));

let searchParamsGet: (key: string) => string | null = () => null;

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});

describe("FILES_STARTUP_MESH_GATE [IMPL-WORKSPACE_MESH_BRIDGE]", () => {
  beforeEach(() => {
    localStorageMock.clear();
    replaceMock.mockReset();
    searchParamsGet = () => null;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("/api/mesh/mesh-valid")) {
          return new Response(JSON.stringify({ mesh: { id: "mesh-valid", name: "Valid" } }), {
            status: 200,
          });
        }
        return new Response(JSON.stringify({ error: { message: "Not found" } }), {
          status: 404,
        });
      }),
    );
  });

  it("renders_children_immediately_when_meshId_in_url", async () => {
    searchParamsGet = (key) => (key === "meshId" ? "mesh-explicit" : null);
    render(
      <FilesStartupMeshGate>
        <div data-testid="workspace-child">workspace</div>
      </FilesStartupMeshGate>,
    );
    expect(screen.getByTestId("workspace-child")).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("renders_children_when_no_startup_pref", async () => {
    render(
      <FilesStartupMeshGate>
        <div data-testid="workspace-child">workspace</div>
      </FilesStartupMeshGate>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("workspace-child")).toBeInTheDocument();
    });
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("redirects_when_valid_startup_pref", async () => {
    setFilesStartupMeshId("mesh-valid");
    render(
      <FilesStartupMeshGate>
        <div data-testid="workspace-child">workspace</div>
      </FilesStartupMeshGate>,
    );
    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/files?meshId=mesh-valid");
    });
    expect(screen.getByTestId("files-startup-mesh-pending")).toBeInTheDocument();
    expect(screen.queryByTestId("workspace-child")).not.toBeInTheDocument();
  });

  it("clears_invalid_pref_and_renders_children", async () => {
    setFilesStartupMeshId("mesh-missing");
    localStorageMock.setItem(FILES_STARTUP_MESH_STORAGE_KEY, "mesh-missing");
    render(
      <FilesStartupMeshGate>
        <div data-testid="workspace-child">workspace</div>
      </FilesStartupMeshGate>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("workspace-child")).toBeInTheDocument();
    });
    expect(replaceMock).not.toHaveBeenCalled();
    expect(localStorageMock.getItem(FILES_STARTUP_MESH_STORAGE_KEY)).toBeNull();
  });
});
