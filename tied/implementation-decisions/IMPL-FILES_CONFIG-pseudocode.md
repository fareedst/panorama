# IMPL-FILES_CONFIG essence pseudocode

// [IMPL-FILES_CONFIG] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_FILE_MANAGER]: Files configuration loader — types for copy/theme overrides, getFilesConfig with YAML merge and cache, getFilesOverride helper, config/files.yaml and theme.files sections

## Summary contract

// [IMPL-FILES_CONFIG] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_FILE_MANAGER]: how: extends IMPL-CONFIG_LOADER pattern for file-manager-specific YAML; defaults in DEFAULT_FILES_CONFIG; theme.files holds overrides and compare colors

```
IMPL-FILES_CONFIG_Summary():
  INPUT: config/files.yaml, config/theme.yaml (via getThemeConfig for overrides)
  OUTPUT: FilesConfig object, trimmed override class string
  DATA: _filesConfig cache, deepMerge with DEFAULT_FILES_CONFIG
  CONTROL: readYamlFile on first getFilesConfig call
  PRE: config paths resolve under project root; server runtime or test harness with cache reset
  POST: accessors return complete FilesConfig merged with defaults
  EFFECTS: IO, State
  TERMINATION: total
```

## TypesAndThemeFilesField

// [IMPL-FILES_CONFIG] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_FILE_MANAGER]: how: ThemeConfig gains optional files field; FilesCopyConfig, FilesThemeConfig, FilesThemeOverrides interfaces in config.types.ts

```
IMPL-FILES_CONFIG_TypesAndThemeFilesField():
  INPUT: TypeScript schema definitions
  OUTPUT: typed access to copy strings and theme.files.overrides keys
  DATA: config.types.ts FilesCopyConfig, FilesThemeConfig, FilesThemeOverrides, ThemeConfig.files?
  PRE: config.types.ts compiled with project
  POST: FilesCopyConfig, FilesThemeOverrides, and optional ThemeConfig.files exported
  EFFECTS: pure
  TERMINATION: total
  DEFINE FilesCopyConfig for UI copy sections
  DEFINE FilesThemeOverrides for per-element Tailwind class overrides
  ADD optional files?: FilesThemeConfig to ThemeConfig
```

## GetFilesConfig

// [IMPL-FILES_CONFIG] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_FILE_MANAGER]: how: return cached FilesConfig or load config/files.yaml merged with DEFAULT_FILES_CONFIG then cache

```
IMPL-FILES_CONFIG_getFilesConfig():
  INPUT: none (reads disk once)
  OUTPUT: merged FilesConfig
  DATA: DEFAULT_FILES_CONFIG, readYamlFile("config/files.yaml")
  PRE: server or test environment with readable config/files.yaml or acceptable missing file
  POST: returns cached or freshly merged FilesConfig
  EFFECTS: IO, State
  TERMINATION: total
  IF _filesConfig cached THEN RETURN _filesConfig
  loaded := readYamlFile("config/files.yaml") as FilesConfig
  _filesConfig := deepMerge(DEFAULT_FILES_CONFIG, loaded)
  RETURN _filesConfig
```

## GetFilesOverride

// [IMPL-FILES_CONFIG] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_FILE_MANAGER]: how: trim theme.files.overrides[key] or return empty string when unset

```
IMPL-FILES_CONFIG_getFilesOverride(overrides, key):
  INPUT: overrides object, key of FilesThemeOverrides
  OUTPUT: trimmed class string or ""
  PRE: key is a valid FilesThemeOverrides key
  POST: returns trimmed override string or empty string when unset
  EFFECTS: pure
  TERMINATION: total
  RETURN trim(overrides?.[key] ?? "")
```

## YamlSources

// [IMPL-FILES_CONFIG] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_FILE_MANAGER]: how: config/files.yaml supplies copy section; config/theme.yaml supplies files.overrides and compareColors under theme.files

```
IMPL-FILES_CONFIG_YamlSources():
  INPUT: YAML on disk
  OUTPUT: partial overrides merged into defaults
  DATA: config/files.yaml, config/theme.yaml files section
  PRE: config/files.yaml and optional theme.yaml files section on disk
  POST: partial YAML merged into DEFAULT_FILES_CONFIG via getFilesConfig
  EFFECTS: IO
  TERMINATION: total
  ASSERT config/files.yaml exists with copy defaults
  ASSERT theme.yaml defines files.overrides and compareColors when customized
```

## CodeLocations

// [IMPL-FILES_CONFIG] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_FILE_MANAGER]: map implementing and verifying source files for this IMPL

// FILE: config/files.yaml — files copy and keybindings
// FILE: config/theme.yaml — files.overrides and compareColors
// FILE: src/lib/config.types.ts — FilesCopyConfig, FilesThemeConfig, FilesThemeOverrides
// FILE: src/lib/config.ts — DEFAULT_FILES_CONFIG, getFilesConfig, getFilesOverride
// FILE: src/lib/config.test.ts — getFilesConfig tests (shared with IMPL-FILES_CONFIG_COMPLETE)

## ErrorHandling

// [IMPL-FILES_CONFIG] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_FILE_MANAGER]: how: missing YAML yields empty object merged with defaults via IMPL-CONFIG_LOADER readYamlFile

```
IMPL-FILES_CONFIG_on_error(context, error):
  INPUT: missing or invalid config/files.yaml
  OUTPUT: DEFAULT_FILES_CONFIG merged result without throw
  PRE: readYamlFile returns {} on missing or invalid file
  POST: getFilesConfig returns merged defaults
  EFFECTS: IO
  FAILURE_MODES: FILE_MISSING; PARSE_ERROR
  TERMINATION: total
  DELEGATE to IMPL-CONFIG_LOADER empty-file fallback
  RETURN DEFAULT_FILES_CONFIG merged result
```
