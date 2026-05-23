# IMPL-DISPLAY_FILTER_ENGINE essence pseudocode

## EVALUATE_ENTRY
# [IMPL-DISPLAY_FILTER_ENGINE] [ARCH-DISPLAY_FILTER_ENGINE] [REQ-PANE_DISPLAY_FILTER]
# how: Last enabled matching rule by ascending order wins; default visible when no rule matches; target file|directory|both gates entry type.

```
EVALUATE_ENTRY(entry, rules):
  INPUT: entry { name, isDirectory }, rules[] ordered filter rules
  OUTPUT: boolean visible
  DATA: lastAction include|exclude|null
  SORT rules BY order ASC
  FOR rule IN rules
    IF NOT rule.enabled THEN CONTINUE
    IF NOT targetMatches(entry, rule.target) THEN CONTINUE
    IF NOT globMatch(entry.name, rule.pattern) THEN CONTINUE
    lastAction := rule.action
  IF lastAction = "exclude" THEN RETURN false
  IF lastAction = "include" THEN RETURN true
  RETURN true
```

## VALIDATE_RULE_PATTERN
# [IMPL-DISPLAY_FILTER_ENGINE] [REQ-PANE_DISPLAY_FILTER]
# how: Reject empty patterns and patterns that break globMatch probe.

```
VALIDATE_RULE_PATTERN(pattern):
  INPUT: pattern string
  OUTPUT: { ok, error? }
  IF pattern trimmed empty THEN RETURN { ok: false, error: "Pattern cannot be empty" }
  TRY globMatch("", pattern) CATCH RETURN { ok: false, error: "Invalid glob pattern" }
  RETURN { ok: true }
```

## VALIDATE_SPEC
# [IMPL-DISPLAY_FILTER_ENGINE] [IMPL-DISPLAY_SPEC_STORE] [REQ-PANE_DISPLAY_FILTER]
# how: Enforce unique spec name (case-insensitive), max rules per spec, per-rule pattern validity.

```
VALIDATE_SPEC(spec, existingNames):
  INPUT: spec { name, rules }, existingNames string[]
  OUTPUT: SpecValidationResult { ok, errors[] }
  IF name trimmed empty THEN errors.push("Spec name is required")
  IF existingNames contains name (case-insensitive) THEN errors.push duplicate name
  IF rules.length > MAX_RULES_PER_SPEC THEN errors.push max rules
  FOR each rule IN rules
    IF NOT VALIDATE_RULE_PATTERN(rule.pattern).ok THEN errors.push rule index + error
  RETURN { ok: errors empty, errors }
```

## APPLY_PANE_LISTING
# [IMPL-DISPLAY_FILTER_ENGINE] [ARCH-DISPLAY_FILTER_ENGINE] [REQ-PANE_DISPLAY_FILTER]
# how: Filter raw directory listing; null spec returns all files with hiddenCount 0.

```
APPLY_PANE_LISTING(rawFiles, spec):
  INPUT: rawFiles FileStat[], spec DisplayFilterSpec|null
  OUTPUT: { files visible[], hiddenCount number }
  IF spec IS null THEN RETURN { files: rawFiles, hiddenCount: 0 }
  visible := FILTER rawFiles WHERE EVALUATE_ENTRY(each, spec.rules)
  RETURN { files: visible, hiddenCount: rawFiles.length - visible.length }
```

## RECONCILE_PANE_SELECTION
# [IMPL-DISPLAY_FILTER_ENGINE] [REQ-PANE_DISPLAY_FILTER] [REQ-FILE_MARKING_WEB]
# how: Drop marks not in visible files; clamp cursor to [0, files.length - 1] or 0 when empty.

```
RECONCILE_PANE_SELECTION(pane):
  INPUT: pane { files, marks Set, cursor }
  OUTPUT: pane with marks and cursor reconciled
  visibleNames := SET(pane.files.map(name))
  marks := INTERSECTION(pane.marks, visibleNames)
  IF pane.files.length = 0 THEN cursor := 0
  ELSE IF cursor out of range THEN cursor := CLAMP(cursor, 0, pane.files.length - 1)
  RETURN pane with updated marks, cursor
```
