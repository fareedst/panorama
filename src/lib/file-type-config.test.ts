// [IMPL-FILES_CONFIG_COMPLETE] [IMPL-CONFIG_DRIVEN_APPEARANCE] [REQ-FILES_CONFIG_COMPLETE] [REQ-CONFIG_DRIVEN_APPEARANCE]: Client-safe file type resolver tests

import { describe, it, expect } from "vitest";
import {
  DEFAULT_FILE_TYPES,
  resolveFileTypeConfig,
} from "./file-type-config";

describe("resolveFileTypeConfig [REQ-FILES_CONFIG_COMPLETE] [REQ-CONFIG_DRIVEN_APPEARANCE]", () => {
  it("returns directory config for directories", () => {
    const result = resolveFileTypeConfig(DEFAULT_FILE_TYPES, "folder", true);
    expect(result.icon).toBe("📁");
    expect(result.iconClass).toContain("blue");
  });

  it("returns file config for generic files", () => {
    const result = resolveFileTypeConfig(DEFAULT_FILE_TYPES, "unknown.xyz", false);
    expect(result.icon).toBe("📄");
    expect(result.iconClass).toContain("gray");
  });

  it("matches shell scripts to code type", () => {
    const result = resolveFileTypeConfig(DEFAULT_FILE_TYPES, "deploy.sh", false);
    expect(result.icon).toBe("💻");
  });

  it("matches Dockerfile to config type", () => {
    const result = resolveFileTypeConfig(DEFAULT_FILE_TYPES, "Dockerfile", false);
    expect(result.icon).toBe("⚙️");
  });

  it("matches .env to config type", () => {
    const result = resolveFileTypeConfig(DEFAULT_FILE_TYPES, ".env", false);
    expect(result.icon).toBe("⚙️");
  });

  it("matches .env.local to config type via .env.* pattern", () => {
    const result = resolveFileTypeConfig(DEFAULT_FILE_TYPES, ".env.local", false);
    expect(result.icon).toBe("⚙️");
  });

  it("handles files with no extension", () => {
    const result = resolveFileTypeConfig(DEFAULT_FILE_TYPES, "README", false);
    expect(result.icon).toBe("📄");
  });
});
