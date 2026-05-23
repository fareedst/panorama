"use client";

// [IMPL-PANE_DISPLAY_FILTER_UI] [REQ-PANE_DISPLAY_FILTER]

import type { DisplayFilterSpec } from "@/lib/display-filter.types";

interface DisplaySpecSelectorProps {
  specs: DisplayFilterSpec[];
  activeSpecId: string | null;
  recentSpecIds: string[];
  onSelect: (specId: string | null) => void;
  onManage: () => void;
}

/** [IMPL-PANE_DISPLAY_FILTER_UI] PANE_HEADER_SELECTOR — dropdown for active display spec */
export function DisplaySpecSelector({
  specs,
  activeSpecId,
  recentSpecIds,
  onSelect,
  onManage,
}: DisplaySpecSelectorProps) {
  const recentSpecs = recentSpecIds
    .map((id) => specs.find((s) => s.id === id))
    .filter((s): s is DisplayFilterSpec => !!s);

  return (
    <select
      data-testid="pane-display-spec-selector"
      value={activeSpecId ?? ""}
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
      title="Display filter spec"
    >
      <option value="">No filter</option>
      {recentSpecs.length > 0 && (
        <optgroup label="Recent">
          {recentSpecs.map((s) => (
            <option key={`recent-${s.id}`} value={s.id}>
              {s.name}
            </option>
          ))}
        </optgroup>
      )}
      <optgroup label="Saved">
        {specs.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </optgroup>
      <option value="__manage__">Manage specs…</option>
    </select>
  );
}
