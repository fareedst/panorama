"use client";

// [IMPL-CROSS_PANE_VISIBILITY_UI] [ARCH-CROSS_PANE_VISIBILITY] [REQ-CROSS_PANE_VISIBILITY]: how: pane header preset selector; PANE_HEADER_SELECTOR block

import type { CrossPaneVisibilityPreset } from "@/lib/cross-pane-visibility.types";

interface CrossPaneVisibilitySelectorProps {
  presets: CrossPaneVisibilityPreset[];
  activePresetId: string | null;
  recentPresetIds: string[];
  draftDirty: boolean;
  onSelect: (presetId: string | null) => void;
  onManage: () => void;
}

/** [IMPL-CROSS_PANE_VISIBILITY_UI] PANE_HEADER_SELECTOR — dropdown for active cross-pane visibility preset */
export function CrossPaneVisibilitySelector({
  presets,
  activePresetId,
  recentPresetIds,
  draftDirty,
  onSelect,
  onManage,
}: CrossPaneVisibilitySelectorProps) {
  const recentPresets = recentPresetIds
    .map((id) => presets.find((p) => p.id === id))
    .filter((p): p is CrossPaneVisibilityPreset => !!p);

  const label =
    activePresetId && !draftDirty
      ? presets.find((p) => p.id === activePresetId)?.name ?? activePresetId
      : activePresetId && draftDirty
        ? "Draft"
        : draftDirty
          ? "Draft"
          : "";

  return (
    <select
      data-testid="pane-cross-pane-visibility-selector"
      value={activePresetId ?? ""}
      onChange={(e) => {
        const v = e.target.value;
        if (v === "__manage__") {
          onManage();
          return;
        }
        onSelect(v || null);
      }}
      onClick={(e) => e.stopPropagation()}
      className="ml-2 max-w-[10rem] text-xs border rounded px-1 py-0.5 dark:bg-zinc-800 truncate"
      title={label ? `Compare: ${label}` : "Cross-pane compare filter"}
    >
      <option value="">No compare filter</option>
      {recentPresets.length > 0 && (
        <optgroup label="Recent">
          {recentPresets.map((p) => (
            <option key={`recent-${p.id}`} value={p.id}>
              {p.name}
            </option>
          ))}
        </optgroup>
      )}
      <optgroup label="Saved">
        {presets.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </optgroup>
      <option value="__manage__">Manage compare filters…</option>
    </select>
  );
}
