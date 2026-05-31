// [IMPL-CONFIG_DRIVEN_APPEARANCE] [REQ-CONFIG_DRIVEN_APPEARANCE]: Tests for theme-driven file type icon component

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FileTypeIcon } from "./FileTypeIcon";
import { DEFAULT_FILE_TYPES } from "@/lib/file-type-config";

describe("FileTypeIcon [REQ-CONFIG_DRIVEN_APPEARANCE] [IMPL-CONFIG_DRIVEN_APPEARANCE]", () => {
  it("renders directory icon with theme iconClass", () => {
    render(
      <FileTypeIcon
        fileTypes={DEFAULT_FILE_TYPES}
        filename="Documents"
        isDirectory={true}
      />,
    );

    const icon = screen.getByTestId("file-type-icon");
    expect(icon).toHaveTextContent("📁");
    expect(icon.className).toContain("text-blue-500");
  });

  it("renders code icon for TypeScript files", () => {
    render(
      <FileTypeIcon
        fileTypes={DEFAULT_FILE_TYPES}
        filename="app.ts"
        isDirectory={false}
      />,
    );

    const icon = screen.getByTestId("file-type-icon");
    expect(icon).toHaveTextContent("💻");
    expect(icon.className).toContain("text-purple-500");
  });

  it("renders generic file icon for unknown extensions", () => {
    render(
      <FileTypeIcon
        fileTypes={DEFAULT_FILE_TYPES}
        filename="unknown.xyz"
        isDirectory={false}
      />,
    );

    const icon = screen.getByTestId("file-type-icon");
    expect(icon).toHaveTextContent("📄");
    expect(icon.className).toContain("text-gray-500");
  });
});
