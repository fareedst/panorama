# IMPL-CONFIG_LOADER essence pseudocode

// [IMPL-CONFIG_LOADER] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_UI]: Top-level configuration loader — read YAML under config/, deep-merge with built-in defaults, cache per process

## Summary contract

// [IMPL-CONFIG_LOADER] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_UI]: how: module-level caches and shared merge/read utilities for site, theme, and files config accessors

```
IMPL-CONFIG_LOADER_Summary():
  INPUT: relative paths under project root (config/site.yaml, config/theme.yaml, config/files.yaml)
  OUTPUT: typed SiteConfig, ThemeConfig, or FilesConfig
  DATA: DEFAULT_* objects; module caches _siteConfig | _themeConfig | _filesConfig
  CONTROL: server-only fs.readFileSync; tests reset caches via _resetConfigCache
  PRE: config paths resolve under project root; server runtime or test harness with cache reset
  POST: accessors return complete typed config objects merged with defaults
  EFFECTS: IO, State
  TERMINATION: total
```

## DeepMerge

// [IMPL-CONFIG_LOADER] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_UI]: how: deep-merge partial user YAML into defaults without mutating inputs; arrays replace entirely

```
IMPL-CONFIG_LOADER_DeepMerge(target, source):
  INPUT: target object T, source partial object S
  OUTPUT: new merged object
  DATA: nested plain objects only (not arrays) recurse; undefined keys in S skipped
  PRE: T and S are plain objects
  POST: returned object is a new merge; T and S inputs unchanged
  EFFECTS: pure
  TERMINATION: total
  COPY target to result
  FOR each key IN keys(source)
    IF source[key] is plain object AND result[key] is plain object AND source[key] not array
      result[key] := DeepMerge(result[key], source[key])
    ELSE IF source[key] IS NOT undefined
      result[key] := source[key]
  RETURN result
```

## ReadYamlFile

// [IMPL-CONFIG_LOADER] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_UI]: how: read and parse YAML; missing file, parse error, or non-object root → empty object and log warning

```
IMPL-CONFIG_LOADER_ReadYamlFile(filePath):
  INPUT: filePath relative to process.cwd()
  OUTPUT: Record object (possibly empty)
  DATA: js-yaml load; logger warn on failure
  PRE: filePath is a non-empty string relative to cwd
  POST: returns non-array object or empty {}
  EFFECTS: IO
  FAILURE_MODES: FILE_MISSING; PARSE_ERROR; INVALID_ROOT
  TERMINATION: total
  TRY
    raw := READ file at resolve(cwd, filePath)
    parsed := YAML_LOAD(raw)
    IF parsed is non-array object THEN RETURN parsed
    LOG warn invalid format
    RETURN {}
  ON any error
    LOG warn file not found or unreadable
    RETURN {}
```

## GetSiteConfig

// [IMPL-CONFIG_LOADER] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_UI]: how: return cached SiteConfig or load config/site.yaml merged with DEFAULT_SITE_CONFIG then cache

```
IMPL-CONFIG_LOADER_GetSiteConfig():
  INPUT: none
  OUTPUT: SiteConfig
  DATA: _siteConfig cache
  PRE: server or test environment with readable config/site.yaml or acceptable missing file
  POST: returns cached or freshly merged SiteConfig
  EFFECTS: IO, State
  TERMINATION: total
  IF _siteConfig IS SET THEN RETURN _siteConfig
  user := ReadYamlFile("config/site.yaml")
  merged := DeepMerge(DEFAULT_SITE_CONFIG, user)
  _siteConfig := merged
  RETURN merged
```

## GetThemeConfig

// [IMPL-CONFIG_LOADER] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_UI]: how: return cached ThemeConfig or load config/theme.yaml merged with DEFAULT_THEME_CONFIG then cache

```
IMPL-CONFIG_LOADER_GetThemeConfig():
  INPUT: none
  OUTPUT: ThemeConfig
  DATA: _themeConfig cache
  PRE: server or test environment with readable config/theme.yaml or acceptable missing file
  POST: returns cached or freshly merged ThemeConfig
  EFFECTS: IO, State
  TERMINATION: total
  IF _themeConfig IS SET THEN RETURN _themeConfig
  user := ReadYamlFile("config/theme.yaml")
  merged := DeepMerge(DEFAULT_THEME_CONFIG, user)
  _themeConfig := merged
  RETURN merged
```

## GetFilesConfig

// [IMPL-CONFIG_LOADER] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_FILE_MANAGER]: how: return cached FilesConfig or load config/files.yaml merged with DEFAULT_FILES_CONFIG then cache

```
IMPL-CONFIG_LOADER_GetFilesConfig():
  INPUT: none
  OUTPUT: FilesConfig (copy, layout, startup, keybindings, columns)
  DATA: _filesConfig cache
  PRE: server or test environment with readable config/files.yaml or acceptable missing file
  POST: returns cached or freshly merged FilesConfig
  EFFECTS: IO, State
  TERMINATION: total
  IF _filesConfig IS SET THEN RETURN _filesConfig
  user := ReadYamlFile("config/files.yaml")
  merged := DeepMerge(DEFAULT_FILES_CONFIG, user)
  _filesConfig := merged
  RETURN merged
```

## ResetConfigCache

// [IMPL-CONFIG_LOADER] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_UI]: how: test-only reset clears all module caches for isolation between tests

```
IMPL-CONFIG_LOADER_ResetConfigCache():
  INPUT: test harness
  OUTPUT: caches null
  CONTROL: @internal export _resetConfigCache
  PRE: invoked from test harness only
  POST: _siteConfig, _themeConfig, and _filesConfig are null
  EFFECTS: State
  TERMINATION: total
  _siteConfig := null
  _themeConfig := null
  _filesConfig := null
```

## CodeLocations

// [IMPL-CONFIG_LOADER] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_UI]: map implementing and verifying source files for this IMPL

// FILE: src/lib/config.ts — loader, merge, getters
// FILE: src/lib/config.types.ts — TypeScript interfaces
// FILE: src/lib/config.test.ts — deepMerge, getSiteConfig, getThemeConfig caching
// FILE: src/test/integration/app.test.tsx — site config metadata integration
// FUNCTION: getSiteConfig, getThemeConfig, getFilesConfig in src/lib/config.ts

## ErrorHandling

// [IMPL-CONFIG_LOADER] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_UI]: how: missing or invalid YAML never throws from public getters; defaults always produce complete typed config

```
IMPL-CONFIG_LOADER_on_error(context, error):
  INPUT: context, error from read or parse
  OUTPUT: logged diagnostic; public getters still return merged defaults
  PRE: error surfaced from ReadYamlFile or YAML load path
  POST: no throw from public getters; ReadYamlFile returns {}
  EFFECTS: IO
  FAILURE_MODES: FILE_MISSING; PARSE_ERROR; INVALID_ROOT
  TERMINATION: total
  LOG diagnostic with IMPL, ARCH, REQ token refs
  ReadYamlFile RETURNS {} so merge still succeeds
  Public getters RETURN merged defaults
```
