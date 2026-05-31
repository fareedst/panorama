// [TEST-RENAME_REGEX] [IMPL-RENAME_REGEX] [ARCH-SEARCH_ENGINE] [REQ-FILE_SEARCH] [REQ-BULK_FILE_OPS]

import { describe, it, expect } from "vitest";
import { validateRegex } from "./regex-validation";

describe("[TEST-RENAME_REGEX] validateRegex [IMPL-RENAME_REGEX]", () => {
  // [IMPL-RENAME_REGEX] [ARCH-SEARCH_ENGINE] [REQ-FILE_SEARCH] [REQ-BULK_FILE_OPS]: how — accept compilable patterns within length cap
  it("accepts valid patterns", () => {
    expect(validateRegex("\\.txt$")).toEqual({ valid: true });
  });

  // [IMPL-RENAME_REGEX] [ARCH-SEARCH_ENGINE] [REQ-FILE_SEARCH] [REQ-BULK_FILE_OPS]: how — reject patterns over 500 characters
  it("rejects patterns that are too long", () => {
    const result = validateRegex("a".repeat(501));
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Pattern too long");
  });

  // [IMPL-RENAME_REGEX] [ARCH-SEARCH_ENGINE] [REQ-FILE_SEARCH] [REQ-BULK_FILE_OPS]: how — compile test catches invalid syntax
  it("rejects invalid regex syntax", () => {
    const result = validateRegex("(");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Invalid regex pattern");
  });

  // [IMPL-RENAME_REGEX] [ARCH-SEARCH_ENGINE] [REQ-FILE_SEARCH] [REQ-BULK_FILE_OPS]: how — ReDoS heuristics block excessive capturing groups
  it("rejects potentially dangerous excessive groups", () => {
    const result = validateRegex("(a)(b)(c)(d)(e)(f)");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Potentially dangerous regex pattern");
  });
});
