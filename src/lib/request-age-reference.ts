// [IMPL-FILE_AGE_DISPLAY] [REQ-REACT_SSR_STABILITY]: per-request clock for SSR-safe relative mtime (non-React module)

/** Capture once per server request; safe to call from RSC render. */
export function captureRequestAgeReferenceMs(): number {
  return Date.now();
}

/** Stable clock for client-only mounts (unit tests) when no server prop is passed. */
export const WORKSPACE_AGE_REFERENCE_FALLBACK_MS = 1_735_689_600_000;
