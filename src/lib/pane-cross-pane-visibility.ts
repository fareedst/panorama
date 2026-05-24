// [IMPL-CROSS_PANE_VISIBILITY_CATALOG] [IMPL-CROSS_PANE_VISIBILITY_UI] [REQ-CROSS_PANE_VISIBILITY]

import {
  copyCrossPaneVisibilityState,
  crossPaneVisibilityStatesEqual,
  DEFAULT_CROSS_PANE_VISIBILITY,
  isCrossPaneVisibilityActive,
  normalizeCrossPaneVisibility,
  type CrossPaneVisibilityState,
} from "./cross-pane-visibility";
import type { CrossPaneVisibilityStore } from "./cross-pane-visibility-store";
import type { PaneWithDisplayFilter } from "./pane-display-filter";

export interface PaneCrossPaneVisibilityFields {
  activeCrossPaneVisibilityId: string | null;
  crossPaneVisibilityDraft: CrossPaneVisibilityState;
  /** Catalog preset version when draft was loaded from a preset */
  crossPaneVisibilityDraftSourceVersion: number | null;
}

export function initialPaneCrossPaneVisibilityFields(
  meta?: {
    crossPaneVisibilityId?: string | null;
    crossPaneVisibility?: CrossPaneVisibilityState;
  },
  store?: CrossPaneVisibilityStore,
): PaneCrossPaneVisibilityFields {
  const id = meta?.crossPaneVisibilityId ?? null;
  if (meta?.crossPaneVisibility) {
    const draft = copyCrossPaneVisibilityState(
      normalizeCrossPaneVisibility(meta.crossPaneVisibility),
    );
    const preset = id && store ? store.get(id) : undefined;
    return {
      activeCrossPaneVisibilityId: id,
      crossPaneVisibilityDraft: draft,
      crossPaneVisibilityDraftSourceVersion: preset?.version ?? null,
    };
  }
  if (id && store) {
    const preset = store.get(id);
    if (preset) {
      return {
        activeCrossPaneVisibilityId: id,
        crossPaneVisibilityDraft: copyCrossPaneVisibilityState(preset.state),
        crossPaneVisibilityDraftSourceVersion: preset.version,
      };
    }
  }
  return {
    activeCrossPaneVisibilityId: id,
    crossPaneVisibilityDraft: copyCrossPaneVisibilityState(DEFAULT_CROSS_PANE_VISIBILITY),
    crossPaneVisibilityDraftSourceVersion: null,
  };
}

/** [IMPL-CROSS_PANE_VISIBILITY_UI] RESOLVE_PANE_VISIBILITY — draft is the working copy for toolbar and engine */
export function resolvePaneCrossPaneVisibility(
  pane: PaneCrossPaneVisibilityFields,
): CrossPaneVisibilityState {
  return pane.crossPaneVisibilityDraft;
}

export function isCrossPaneVisibilityDraftDirty(
  pane: PaneCrossPaneVisibilityFields,
  store: CrossPaneVisibilityStore,
): boolean {
  if (!pane.activeCrossPaneVisibilityId) {
    return isCrossPaneVisibilityActive(pane.crossPaneVisibilityDraft);
  }
  const preset = store.get(pane.activeCrossPaneVisibilityId);
  if (!preset) {
    return isCrossPaneVisibilityActive(pane.crossPaneVisibilityDraft);
  }
  return !crossPaneVisibilityStatesEqual(pane.crossPaneVisibilityDraft, preset.state);
}

export function shouldSnapshotInlineCrossPaneVisibility(
  pane: PaneCrossPaneVisibilityFields,
  store: CrossPaneVisibilityStore,
): boolean {
  if (!pane.activeCrossPaneVisibilityId) {
    return isCrossPaneVisibilityActive(pane.crossPaneVisibilityDraft);
  }
  return isCrossPaneVisibilityDraftDirty(pane, store);
}

export function snapshotPaneCrossPaneVisibilityFields(
  pane: PaneCrossPaneVisibilityFields,
  store: CrossPaneVisibilityStore,
): {
  crossPaneVisibilityId?: string | null;
  crossPaneVisibility?: CrossPaneVisibilityState;
} {
  const id = pane.activeCrossPaneVisibilityId;
  const inline = shouldSnapshotInlineCrossPaneVisibility(pane, store);
  return {
    ...(id !== undefined ? { crossPaneVisibilityId: id } : {}),
    ...(inline
      ? { crossPaneVisibility: copyCrossPaneVisibilityState(pane.crossPaneVisibilityDraft) }
      : {}),
  };
}

export type PaneWithCrossPaneVisibility = PaneWithDisplayFilter & PaneCrossPaneVisibilityFields;

export function mergePaneListingWithCrossPaneFields(
  listingPane: PaneWithDisplayFilter,
  crossPane: PaneCrossPaneVisibilityFields,
): PaneWithCrossPaneVisibility {
  return { ...listingPane, ...crossPane };
}

export function loadPresetIntoPane(
  pane: PaneCrossPaneVisibilityFields,
  presetId: string | null,
  store: CrossPaneVisibilityStore,
): PaneCrossPaneVisibilityFields {
  if (!presetId) {
    return {
      activeCrossPaneVisibilityId: null,
      crossPaneVisibilityDraft: copyCrossPaneVisibilityState(DEFAULT_CROSS_PANE_VISIBILITY),
      crossPaneVisibilityDraftSourceVersion: null,
    };
  }
  const preset = store.get(presetId);
  if (!preset) {
    return {
      activeCrossPaneVisibilityId: null,
      crossPaneVisibilityDraft: copyCrossPaneVisibilityState(DEFAULT_CROSS_PANE_VISIBILITY),
      crossPaneVisibilityDraftSourceVersion: null,
    };
  }
  return {
    activeCrossPaneVisibilityId: presetId,
    crossPaneVisibilityDraft: copyCrossPaneVisibilityState(preset.state),
    crossPaneVisibilityDraftSourceVersion: preset.version,
  };
}
