// [IMPL-BULK_OPS] [IMPL-NSYNC_ENGINE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-DIRECTORY_TREE] [REQ-BULK_FILE_OPS] [REQ-NSYNC_MULTI_TARGET]: how: map source absolute path to destination under destBase preserving relative position under sourceBase

/** Normalize directory base for prefix / relative comparisons */
export function normalizeBaseDir(base: string): string {
  if (base === "" || base === "/") return "/";
  return base.replace(/\/+$/, "");
}

/** Whether sourcePath is the base itself or a path under it */
export function isPathUnderBase(sourcePath: string, sourceBase: string): boolean {
  const normBase = normalizeBaseDir(sourceBase);
  const normSource = sourcePath;

  if (normSource === normBase) return true;
  if (normBase === "/") {
    return normSource.startsWith("/") && normSource.length > 1;
  }
  return normSource.startsWith(`${normBase}/`);
}

/**
 * Map a source file path to the corresponding path under a destination pane base.
 * Aligns with linked-nav relative slice rules in WorkspaceView handleNavigate.
 */
export function resolveCrossPaneDestPath(
  sourcePath: string,
  sourceBase: string,
  destBase: string,
): string {
  const normSourceBase = normalizeBaseDir(sourceBase);
  const normDestBase = normalizeBaseDir(destBase);

  if (!isPathUnderBase(sourcePath, normSourceBase)) {
    throw new Error(
      `Source path is not under source base: ${sourcePath} (base: ${normSourceBase})`,
    );
  }

  const relative =
    normSourceBase === "/"
      ? sourcePath.slice(1)
      : sourcePath.slice(normSourceBase.length + 1);

  const joined =
    normDestBase === "/"
      ? `/${relative}`
      : `${normDestBase}/${relative}`;

  return joined.replace(/\\/g, "/").replace(/\/+/g, "/");
}
