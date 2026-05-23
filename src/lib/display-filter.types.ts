// [IMPL-DISPLAY_FILTER_ENGINE] [IMPL-DISPLAY_SPEC_STORE] [REQ-PANE_DISPLAY_FILTER]

export type FilterRuleAction = "include" | "exclude";
export type FilterRuleTarget = "file" | "directory" | "both";

export interface DisplayFilterRule {
  id: string;
  action: FilterRuleAction;
  target: FilterRuleTarget;
  pattern: string;
  order: number;
  enabled: boolean;
  comment?: string;
}

export interface DisplayFilterSpec {
  id: string;
  name: string;
  description?: string;
  rules: DisplayFilterRule[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface DisplayFilterCatalog {
  specs: DisplayFilterSpec[];
}

export const MAX_RULES_PER_SPEC = 200;

export interface SpecValidationResult {
  ok: boolean;
  errors: string[];
}

export interface PaneListingApplyResult {
  files: import("./files.types").FileStat[];
  hiddenCount: number;
}

/** Minimal pane fields for listing apply + reconcile */
export interface PaneListingState {
  files: import("./files.types").FileStat[];
  cursor: number;
  marks: Set<string>;
}
