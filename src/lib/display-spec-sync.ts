// [IMPL-DISPLAY_FILTER_API] [IMPL-DISPLAY_SPEC_STORE] [REQ-PANE_DISPLAY_FILTER]

import type { DisplayFilterSpec } from "./display-filter.types";
import type { DisplaySpecStore } from "./display-spec-store";

/** [IMPL-DISPLAY_FILTER_API] DISPLAY_SPECS_SYNC_CATALOG — push client catalog to server mirror */
export async function syncDisplaySpecCatalogToServer(
  store: DisplaySpecStore,
): Promise<void> {
  const specs = store.list();
  if (specs.length === 0) return;
  const response = await fetch("/api/display-specs", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ specs }),
  });
  if (!response.ok) {
    console.error(
      "DEBUG: [IMPL-DISPLAY_FILTER_API] Failed to sync display specs to server",
      response.status,
    );
  }
}

/** [IMPL-DISPLAY_FILTER_API] SERVER_FILTER_LISTING — upsert one spec before filtered GET /api/files */
export async function ensureDisplaySpecOnServer(
  spec: DisplayFilterSpec | undefined,
): Promise<void> {
  if (!spec) return;
  const response = await fetch("/api/display-specs", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ specs: [spec] }),
  });
  if (!response.ok) {
    console.error(
      "DEBUG: [IMPL-DISPLAY_FILTER_API] Failed to upsert display spec on server",
      spec.id,
      response.status,
    );
  }
}
