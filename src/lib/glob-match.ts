// [IMPL-DISPLAY_FILTER_ENGINE] [IMPL-MESH_POLICY] [REQ-PANE_DISPLAY_FILTER]: Neutral glob matcher (* and ?)

/**
 * Match a string against a glob pattern (supports * and ? only).
 */
export function globMatch(value: string, pattern: string): boolean {
  const regex = new RegExp(
    `^${pattern.replace(/\./g, "\\.").replace(/\*/g, ".*").replace(/\?/g, ".")}$`,
  );
  return regex.test(value);
}
