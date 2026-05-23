# IMPL-DISPLAY_SPEC_STORE essence pseudocode

## LOAD_CATALOG
# [IMPL-DISPLAY_SPEC_STORE] [ARCH-DISPLAY_SPEC_STORE] [REQ-PANE_DISPLAY_FILTER]
# how: Hydrate in-memory specs from localStorage key panorama.displaySpecs.v1; empty on parse failure.

```
LOAD_CATALOG(store):
  INPUT: store with storage adapter
  OUTPUT: specs[] in memory
  READ JSON FROM storage KEY panorama.displaySpecs.v1
  IF missing OR invalid THEN specs := []
  ELSE specs := parsed.specs OR []
  RETURN specs
```

## CREATE_SPEC
# [IMPL-DISPLAY_SPEC_STORE] [REQ-PANE_DISPLAY_FILTER]
# how: Validate name/rules; assign uuid id, version 1, timestamps; persist and emit updated event.

```
CREATE_SPEC(store, input):
  INPUT: { name, description?, rules[] }
  OUTPUT: DisplayFilterSpec | SpecValidationResult
  validation := VALIDATE_SPEC(input, store.getNames())
  IF NOT validation.ok THEN RETURN validation
  spec := { id: uuid(), name trimmed, rules, version: 1, createdAt, updatedAt }
  APPEND spec TO store.specs
  PERSIST catalog JSON
  EMIT { type: "updated", spec }
  RETURN spec
```

## UPDATE_SPEC
# [IMPL-DISPLAY_SPEC_STORE] [REQ-PANE_DISPLAY_FILTER]
# how: Merge patch; increment version; reject duplicate names excluding self.

```
UPDATE_SPEC(store, id, patch):
  INPUT: spec id, partial { name, description, rules }
  OUTPUT: DisplayFilterSpec | SpecValidationResult | undefined
  existing := store.get(id)
  IF NOT existing THEN RETURN undefined
  next := merge existing with patch
  validation := VALIDATE_SPEC(next, store.getNames(exclude id))
  IF NOT validation.ok THEN RETURN validation
  spec := { ...next, version: existing.version + 1, updatedAt: now }
  REPLACE spec IN catalog
  PERSIST and EMIT updated
  RETURN spec
```

## DUPLICATE_SPEC
# [IMPL-DISPLAY_SPEC_STORE] [REQ-PANE_DISPLAY_FILTER]
# how: Clone rules with new rule ids; CREATE_SPEC with newName.

```
DUPLICATE_SPEC(store, id, newName):
  INPUT: source spec id, newName string
  OUTPUT: DisplayFilterSpec | SpecValidationResult | undefined
  existing := store.get(id)
  IF NOT existing THEN RETURN undefined
  RETURN CREATE_SPEC(store, { name: newName, description: existing.description, rules: clone rules with new ids })
```

## DELETE_SPEC
# [IMPL-DISPLAY_SPEC_STORE] [REQ-PANE_DISPLAY_FILTER]
# how: Remove from catalog; emit deleted; panes fall back via UI subscriber.

```
DELETE_SPEC(store, id):
  INPUT: spec id
  OUTPUT: boolean deleted
  IF id not in catalog THEN RETURN false
  REMOVE spec FROM catalog
  PERSIST
  EMIT { type: "deleted", specId: id }
  RETURN true
```

## SUBSCRIBE_CATALOG
# [IMPL-DISPLAY_SPEC_STORE] [IMPL-PANE_DISPLAY_FILTER_UI] [REQ-PANE_DISPLAY_FILTER]
# how: Register listener for updated/deleted; return unsubscribe function.

```
SUBSCRIBE_CATALOG(store, listener):
  INPUT: listener(DisplaySpecChangeEvent)
  OUTPUT: unsubscribe function
  ADD listener TO store.listeners
  RETURN () => REMOVE listener
```
