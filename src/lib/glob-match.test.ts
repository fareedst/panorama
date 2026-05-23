import { describe, it, expect } from "vitest";
import { globMatch } from "./glob-match";

describe("globMatch", () => {
  it("matches wildcards", () => {
    expect(globMatch("app.log", "*.log")).toBe(true);
    expect(globMatch("app.txt", "*.log")).toBe(false);
    expect(globMatch("a", "?")).toBe(true);
  });
});
