// [IMPL-RENAME_REGEX] [IMPL-FILE_SEARCH] [ARCH-SEARCH_ENGINE] [REQ-FILE_SEARCH] [REQ-BULK_FILE_OPS]: Shared regex pattern validation (ReDoS-safe)

export interface RegexValidationResult {
  valid: boolean;
  error?: string;
}

// [IMPL-RENAME_REGEX] [ARCH-SEARCH_ENGINE] [REQ-FILE_SEARCH] [REQ-BULK_FILE_OPS]: how — length cap 500, compile test, ReDoS heuristics for nested repetition and many groups
export function validateRegex(pattern: string): RegexValidationResult {
  if (pattern.length > 500) {
    return { valid: false, error: "Pattern too long" };
  }

  try {
    new RegExp(pattern);
  } catch {
    return { valid: false, error: "Invalid regex pattern" };
  }

  const dangerousPatterns = [
    /(\*|\+|\{)\s*(\*|\+|\{)/,
    /(\(.*\)){5,}/,
  ];

  for (const dangerous of dangerousPatterns) {
    if (dangerous.test(pattern)) {
      return { valid: false, error: "Potentially dangerous regex pattern" };
    }
  }

  return { valid: true };
}
