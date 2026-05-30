# IMPL-CLASS_OVERRIDES essence pseudocode

// [IMPL-CLASS_OVERRIDES] [ARCH-CLASS_OVERRIDES] [REQ-CONFIG_DRIVEN_UI]: how: theme.yaml overrides section supplies per-element Tailwind classes; getOverride resolves trimmed override strings for component merge

## DEFINE_OVERRIDES_SCHEMA

// [IMPL-CLASS_OVERRIDES] [ARCH-CLASS_OVERRIDES] [REQ-CONFIG_DRIVEN_UI]: how: ClassOverrides type and config/theme.yaml overrides keys define optional per-element class strings

```
CONTRACT DEFINE_OVERRIDES_SCHEMA
  INPUT: config/theme.yaml overrides block
  OUTPUT: ClassOverrides map loaded into ThemeConfig.overrides
  DATA: keys outerContainer, main, heading, paragraph, contentSection, buttonGroup, primaryButton, secondaryButton, inlineLink

PROCEDURE IMPL-CLASS_OVERRIDES_DefineOverridesSchema()
  PARSE theme.yaml overrides section into ClassOverrides
  ALL keys optional; empty string means use component defaults only
  tailwind-merge listed as dependency for intelligent utility conflict resolution at apply sites
```

## GET_OVERRIDE

// [IMPL-CLASS_OVERRIDES] [ARCH-CLASS_OVERRIDES] [REQ-CONFIG_DRIVEN_UI]: how: lookup override key, trim whitespace, return empty string when undefined or blank

```
CONTRACT GET_OVERRIDE
  INPUT: overrides ClassOverrides, key keyof ClassOverrides
  OUTPUT: trimmed override class string or empty string
  DATA: overrides[key] optional string

PROCEDURE IMPL-CLASS_OVERRIDES_GetOverride(overrides, key)
  raw := overrides[key] ?? ""
  trimmed := TRIM raw
  RETURN trimmed
  // empty trimmed result means caller applies default classes only
```

## MERGE_AT_COMPONENT

// [IMPL-CLASS_OVERRIDES] [ARCH-CLASS_OVERRIDES] [REQ-CONFIG_DRIVEN_UI]: how: components combine default Tailwind classes with getOverride output via twMerge when override non-empty

```
CONTRACT MERGE_AT_COMPONENT
  INPUT: defaultClassString, overrides, overrideKey
  OUTPUT: final className string with conflicting utilities resolved
  DATA: twMerge from tailwind-merge package

PROCEDURE IMPL-CLASS_OVERRIDES_MergeAtComponent(defaultClasses, overrides, key)
  override := GetOverride(overrides, key)
  IF override is empty THEN RETURN defaultClasses
  RETURN twMerge(defaultClasses, override)
  // twMerge resolves conflicts so override utilities win over defaults
```

## CodeLocations

// [IMPL-CLASS_OVERRIDES] [ARCH-CLASS_OVERRIDES] [REQ-CONFIG_DRIVEN_UI]: how: map implementing and verifying source files for this IMPL

// FILE: config/theme.yaml — overrides section schema and default empty values
// FILE: src/lib/config.types.ts — ClassOverrides interface on ThemeConfig
// FILE: src/lib/config.ts — getOverride resolver
// FILE: src/lib/config.test.ts — getOverride trim and key coverage tests
