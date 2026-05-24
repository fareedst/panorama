// [IMPL-CROSS_PANE_VISIBILITY_CATALOG] [ARCH-CROSS_PANE_VISIBILITY] [REQ-CROSS_PANE_VISIBILITY]

import type { CrossPaneVisibilityState } from "./cross-pane-visibility";

export type CrossPaneVisibilityPreset = {
  id: string;
  name: string;
  description?: string;
  state: CrossPaneVisibilityState;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type CrossPaneVisibilityCatalog = {
  presets: CrossPaneVisibilityPreset[];
};

export type PresetValidationResult =
  | { ok: true }
  | { ok: false; errors: string[] };
