// [REQ-MULTI_PANE_LAYOUT] [REQ-DIRECTORY_NAVIGATION] [IMPL-FILE_MANAGER_PAGE]: SinglePaneWorkspaceUrl server bootstrap

import { describe, it, expect, vi, beforeEach } from "vitest";
import { isValidElement, type ReactElement } from "react";
import FilesPage from "./page";

vi.mock("./FilesStartupMeshGate", () => ({
  FilesStartupMeshGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/lib/files.data", () => ({
  listDirectory: vi.fn(async (dirPath: string) => {
    if (dirPath === "/custom/base") {
      return [{ name: "only.txt", path: "/custom/base/only.txt", isDirectory: false, size: 1, mtime: new Date(), extension: ".txt" }];
    }
    if (dirPath.startsWith("/tmp/")) {
      return [{ name: "stub.txt", path: `${dirPath}/stub.txt`, isDirectory: false, size: 1, mtime: new Date(), extension: ".txt" }];
    }
    return [];
  }),
  getUserHomeDirectory: vi.fn(() => "/home/test"),
  sortFiles: vi.fn((files: unknown[]) => files),
}));

function workspaceViewProps(
  element: ReactElement | Awaited<ReturnType<typeof FilesPage>>,
): Record<string, unknown> {
  if (!isValidElement(element)) {
    throw new Error("FilesPage did not return a valid element");
  }
  const props = element.props as { children?: ReactElement };
  if (props.children && isValidElement(props.children)) {
    return props.children.props as Record<string, unknown>;
  }
  return element.props as Record<string, unknown>;
}

describe("REQ-MULTI_PANE_LAYOUT SinglePaneWorkspaceUrl [IMPL-FILE_MANAGER_PAGE]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // SinglePaneWorkspaceUrl — [IMPL-FILE_MANAGER_PAGE] [ARCH-PANE_LIFECYCLE] [REQ-DIRECTORY_NAVIGATION] [REQ-MULTI_PANE_LAYOUT]: how — panes=1 and pane0 bootstrap one pane at path
  it("bootstraps_one_pane_at_pane0_when_panes_query_is_1", async () => {
    const element = await FilesPage({
      searchParams: Promise.resolve({ panes: "1", pane0: "/custom/base" }),
    });
    const props = workspaceViewProps(element);
    const initialPanes = props.initialPanes as { path: string; files: unknown[] }[];

    expect(initialPanes).toHaveLength(1);
    expect(initialPanes[0]?.path).toBe("/custom/base");
    expect(initialPanes[0]?.files).toHaveLength(1);
  });

  it("uses_default_pane_count_when_panes_query_not_1", async () => {
    const element = await FilesPage({
      searchParams: Promise.resolve({}),
    });
    const props = workspaceViewProps(element);
    const initialPanes = props.initialPanes as { path: string }[];

    expect(initialPanes.length).toBeGreaterThanOrEqual(1);
    expect(initialPanes[0]?.path).toBe("/home/test");
  });

  // [REQ-README_DEMO_AUTOMATION] [REQ-MULTI_PANE_LAYOUT]: how — pane0..paneN deep link bootstraps every listed pane
  it("bootstraps_all_pane_deep_link_paths_when_pane0_pane1_pane2_present", async () => {
    const element = await FilesPage({
      searchParams: Promise.resolve({
        pane0: "/tmp/alpha",
        pane1: "/tmp/beta",
        pane2: "/tmp/gamma",
      }),
    });
    const props = workspaceViewProps(element);
    const initialPanes = props.initialPanes as { path: string }[];

    expect(initialPanes).toHaveLength(3);
    expect(initialPanes.map((p) => p.path)).toEqual(["/tmp/alpha", "/tmp/beta", "/tmp/gamma"]);
  });
});
