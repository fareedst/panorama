"use client";

// [IMPL-PANE_DISPLAY_FILTER_UI] [REQ-PANE_DISPLAY_FILTER]

import type { DisplayFilterRule } from "@/lib/display-filter.types";

interface DisplaySpecRuleEditorProps {
  rules: DisplayFilterRule[];
  onChange: (rules: DisplayFilterRule[]) => void;
}

function newRuleId(): string {
  return `rule-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function DisplaySpecRuleEditor({ rules, onChange }: DisplaySpecRuleEditorProps) {
  const sorted = [...rules].sort((a, b) => a.order - b.order);

  const updateRule = (id: string, patch: Partial<DisplayFilterRule>) => {
    onChange(rules.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeRule = (id: string) => {
    const next = rules.filter((r) => r.id !== id).map((r, i) => ({ ...r, order: i }));
    onChange(next);
  };

  const moveRule = (id: string, dir: -1 | 1) => {
    const idx = sorted.findIndex((r) => r.id === id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const reordered = [...sorted];
    [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
    onChange(reordered.map((r, i) => ({ ...r, order: i })));
  };

  const addRule = () => {
    onChange([
      ...rules,
      {
        id: newRuleId(),
        action: "exclude",
        target: "both",
        pattern: "*",
        order: rules.length,
        enabled: true,
      },
    ]);
  };

  return (
    <div className="space-y-2" data-testid="display-spec-rule-editor">
      {sorted.map((rule) => (
        <div
          key={rule.id}
          className="flex flex-wrap gap-2 items-center p-2 border border-zinc-200 dark:border-zinc-700 rounded"
        >
          <select
            aria-label="Rule action"
            value={rule.action}
            onChange={(e) => updateRule(rule.id, { action: e.target.value as DisplayFilterRule["action"] })}
            className="text-sm border rounded px-1 dark:bg-zinc-800"
          >
            <option value="exclude">Exclude</option>
            <option value="include">Include</option>
          </select>
          <select
            aria-label="Rule target"
            value={rule.target}
            onChange={(e) => updateRule(rule.id, { target: e.target.value as DisplayFilterRule["target"] })}
            className="text-sm border rounded px-1 dark:bg-zinc-800"
          >
            <option value="file">File</option>
            <option value="directory">Directory</option>
            <option value="both">Both</option>
          </select>
          <input
            aria-label="Glob pattern"
            value={rule.pattern}
            onChange={(e) => updateRule(rule.id, { pattern: e.target.value })}
            className="flex-1 min-w-[8rem] text-sm font-mono border rounded px-2 py-1 dark:bg-zinc-800"
          />
          <label className="flex items-center gap-1 text-xs">
            <input
              type="checkbox"
              checked={rule.enabled}
              onChange={(e) => updateRule(rule.id, { enabled: e.target.checked })}
            />
            On
          </label>
          <button type="button" onClick={() => moveRule(rule.id, -1)} className="text-xs px-1">
            ↑
          </button>
          <button type="button" onClick={() => moveRule(rule.id, 1)} className="text-xs px-1">
            ↓
          </button>
          <button
            type="button"
            onClick={() => removeRule(rule.id)}
            className="text-xs text-red-600 dark:text-red-400"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addRule}
        className="text-sm text-blue-600 dark:text-blue-400"
        data-testid="display-spec-add-rule"
      >
        + Add rule
      </button>
    </div>
  );
}
