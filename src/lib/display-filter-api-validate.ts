// [IMPL-DISPLAY_FILTER_API] [REQ-PANE_DISPLAY_FILTER]

import path from "path";
import { listDirectory } from "./files.data";
import { filterFileStats } from "./display-filter-engine";
import { serverGetDisplaySpec } from "./display-spec-store-server";

/** Reject operation sources hidden by displaySpecId in their parent directory. */
export async function validateOperationSourcesForDisplaySpec(
  sources: string[],
  displaySpecId: string | undefined | null,
): Promise<string | null> {
  if (!displaySpecId) {
    return null;
  }
  const spec = await serverGetDisplaySpec(displaySpecId);
  if (!spec) {
    return "Display spec not found";
  }

  const byDir = new Map<string, Set<string>>();
  for (const src of sources) {
    const dir = path.dirname(src);
    const name = path.basename(src);
    if (!byDir.has(dir)) {
      byDir.set(dir, new Set());
    }
    byDir.get(dir)!.add(name);
  }

  for (const [dir, names] of byDir) {
    const raw = await listDirectory(dir);
    const { files: visible } = filterFileStats(raw, spec);
    const visibleNames = new Set(visible.map((f) => f.name));
    for (const name of names) {
      if (!visibleNames.has(name)) {
        return `Path not visible under active display spec: ${path.join(dir, name)}`;
      }
    }
  }
  return null;
}
