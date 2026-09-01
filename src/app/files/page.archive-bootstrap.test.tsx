// [REQ-ARCHIVE_DIRECTORY_PANES] [IMPL-FILE_MANAGER_PAGE]: SSR bootstrap for virtual archive locators — Tranche 3

import { describe, it, expect, vi, beforeEach } from "vitest";
import { isValidElement, type ReactElement } from "react";
import FilesPage from "./page";
import { encodeVirtualArchivePath } from "@/lib/archive";

vi.mock("./FilesStartupMeshGate", () => ({
  FilesStartupMeshGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockListDirectoryForRequestPath = vi.fn();
const mockVolumeStatsSourcePath = vi.fn((path: string) => path);

vi.mock("@/lib/directory-listing", () => ({
  listDirectoryForRequestPath: (path: string) => mockListDirectoryForRequestPath(path),
  volumeStatsSourcePath: (path: string) => mockVolumeStatsSourcePath(path),
}));

vi.mock("@/lib/files.data", () => ({
  getUserHomeDirectory: vi.fn(() => "/home/test"),
  sortFiles: vi.fn((files: unknown[]) => files),
}));

vi.mock("@/lib/volume-stats", () => ({
  getVolumeStats: vi.fn(async (sourcePath: string) => ({
    totalBytes: 1000,
    availableBytes: 500,
    freePercent: 50,
    deviceId: 1,
    sourcePath,
    status: "available" as const,
  })),
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

describe("REQ-ARCHIVE_DIRECTORY_PANES SSR bootstrap [IMPL-FILE_MANAGER_PAGE]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListDirectoryForRequestPath.mockImplementation(async (dirPath: string) => {
      if (dirPath.startsWith("@archive/v1/")) {
        return [
          {
            name: "readme.txt",
            path: dirPath,
            isDirectory: false,
            size: 12,
            mtime: new Date(),
            extension: "txt",
            archiveSource: {
              archivePath: "/tmp/sample.zip",
              entryPath: "readme.txt",
              isArchiveRoot: true,
              isVirtual: true,
              format: "zip",
              readOnly: true,
            },
          },
        ];
      }
      return [];
    });
    mockVolumeStatsSourcePath.mockImplementation((path: string) => {
      if (path.startsWith("@archive/v1/")) {
        return "/tmp/sample.zip";
      }
      return path;
    });
  });

  it("bootstraps virtual archive locator via listDirectoryForRequestPath", async () => {
    const locator = encodeVirtualArchivePath("/tmp/sample.zip", "");
    const element = await FilesPage({
      searchParams: Promise.resolve({ panes: "1", pane0: locator }),
    });
    const props = workspaceViewProps(element);
    const initialPanes = props.initialPanes as {
      path: string;
      files: Array<{ archiveSource?: { readOnly: boolean } }>;
      volumeStats?: { sourcePath: string };
    }[];

    expect(initialPanes).toHaveLength(1);
    expect(initialPanes[0]?.path).toBe(locator);
    expect(mockListDirectoryForRequestPath).toHaveBeenCalledWith(locator);
    expect(initialPanes[0]?.files[0]?.archiveSource?.readOnly).toBe(true);
    expect(initialPanes[0]?.volumeStats?.sourcePath).toBe("/tmp/sample.zip");
  });
});
