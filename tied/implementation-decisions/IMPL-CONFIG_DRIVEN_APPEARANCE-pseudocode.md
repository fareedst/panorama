# IMPL-CONFIG_DRIVEN_APPEARANCE essence pseudocode

// [IMPL-CONFIG_DRIVEN_APPEARANCE] [ARCH-CONFIG_DRIVEN_APPEARANCE] [REQ-CONFIG_DRIVEN_APPEARANCE]: File-manager appearance and copy from YAML — jobs tracker UI removed; remaining scope is site metadata, theme, and files config consumed by /files

## Summary contract

// [IMPL-CONFIG_DRIVEN_APPEARANCE] [ARCH-CONFIG_DRIVEN_APPEARANCE] [REQ-CONFIG_DRIVEN_APPEARANCE]: how: no hard-coded layout classes or user-facing strings in file-manager UI; values flow from config loaders

```
IMPL-CONFIG_DRIVEN_APPEARANCE_Summary():
  INPUT: config/site.yaml, config/theme.yaml, config/files.yaml
  OUTPUT: server components receive typed copy and class overrides
  DATA: getSiteConfig, getThemeConfig, getFilesConfig, getFilesOverride, getFileTypeConfig (see IMPL-CONFIG_LOADER, IMPL-FILES_CONFIG_COMPLETE)
  PRE: YAML config loaders available
  POST: file-manager UI receives copy, layout, theme, and fileTypes from config
  EFFECTS: pure
  CONTROL: jobs pages and config/jobs.yaml removed per file-manager sole-purpose refactor
  TERMINATION: total
```

## RetiredJobsScope

// [IMPL-CONFIG_DRIVEN_APPEARANCE] [ARCH-CONFIG_DRIVEN_APPEARANCE] [REQ-CONFIG_DRIVEN_APPEARANCE]: how: historical jobs appearance (getJobsConfig, jobs theme section) deleted — no production or test loci remain

```
IMPL-CONFIG_DRIVEN_APPEARANCE_RetiredJobsScope():
  INPUT: none
  OUTPUT: no runtime jobs config accessors
  DATA: removed src/app/jobs/, config/jobs.yaml, getJobsConfig from config.ts
  PRE: file-manager sole-purpose refactor applied
  POST: no jobs routes or getJobsConfig in production tree
  EFFECTS: none
  TERMINATION: total
  ASSERT no getJobsConfig in src/lib/config.ts
  ASSERT no src/app/jobs routes
  DOCUMENT in CHANGELOG and docs/FILE_MANAGER_SOLE_PURPOSE.md
```

## FilesCopyAndLayoutFromYaml

// [IMPL-CONFIG_DRIVEN_APPEARANCE] [ARCH-CONFIG_DRIVEN_APPEARANCE] [REQ-CONFIG_DRIVEN_APPEARANCE] [REQ-CONFIG_DRIVEN_FILE_MANAGER]: how: WorkspaceView and file UI read copy.* and layout.* from getFilesConfig()

```
IMPL-CONFIG_DRIVEN_APPEARANCE_FilesCopyAndLayoutFromYaml():
  INPUT: merged FilesConfig from getFilesConfig
  OUTPUT: props to WorkspaceView (title, shortcuts, operations labels, layout defaults)
  DATA: config/files.yaml overrides DEFAULT_FILES_CONFIG
  PRE: getFilesConfig returns merged config
  POST: copy and layout props passed to file manager entry
  EFFECTS: pure
  TERMINATION: total
  filesConfig := GetFilesConfig()
  PASS filesConfig.copy AND filesConfig.layout to file manager entry
  ASSERT no user-facing string literals for those fields in WorkspaceView props source
```

## ThemeClassesAndFileTypeIcons

// [IMPL-CONFIG_DRIVEN_APPEARANCE] [ARCH-CONFIG_DRIVEN_APPEARANCE] [REQ-CONFIG_DRIVEN_APPEARANCE]: how: theme.files.fileTypes drive icon and iconClass via client-safe resolveFileTypeConfig; server passes fileTypes prop through page.tsx → WorkspaceView → FilePane and FinderDialog; FileTypeIcon renders every row

```
IMPL-CONFIG_DRIVEN_APPEARANCE_ThemeClassesAndFileTypeIcons(fileTypes, filename, isDirectory):
  INPUT: fileTypes from getThemeConfig().files.fileTypes (or DEFAULT_FILE_TYPES), filename, isDirectory
  OUTPUT: icon string and iconClass string per file row in FilePane and FinderDialog
  DATA: theme.files.fileTypes patterns (glob → regex), directory and file defaults; src/lib/file-type-config.ts (client-safe)
  PRE: fileTypes map and row filename available
  POST: FileTypeIcon rendered with resolved icon and iconClass
  EFFECTS: pure
  TERMINATION: total
  resolved := resolveFileTypeConfig(fileTypes, filename, isDirectory)
  RENDER FileTypeIcon with resolved.icon and resolved.iconClass for every file row (directories and files)

IMPL-CONFIG_DRIVEN_APPEARANCE_FileTypesPropFlow():
  INPUT: getThemeConfig().files.fileTypes
  OUTPUT: fileTypes prop on FilePane and FinderDialog
  PRE: server page loads theme config
  POST: every file row uses FileTypeIcon; no hard-coded emoji icons
  EFFECTS: State
  TERMINATION: total
  page.tsx := getThemeConfig().files.fileTypes OR DEFAULT_FILE_TYPES
  PASS fileTypes to WorkspaceView
  WorkspaceView PASS fileTypes to each FilePane and FinderDialog
  FilePane and FinderDialog RENDER FileTypeIcon per row — no hard-coded emoji icons
```

## SiteMetadataForLayout

// [IMPL-CONFIG_DRIVEN_APPEARANCE] [ARCH-CONFIG_DRIVEN_APPEARANCE] [REQ-CONFIG_DRIVEN_APPEARANCE]: how: root layout uses getSiteConfig metadata for document title and description

```
IMPL-CONFIG_DRIVEN_APPEARANCE_SiteMetadataForLayout():
  INPUT: getSiteConfig().metadata
  OUTPUT: HTML title and meta description
  DATA: config/site.yaml merged with defaults
  PRE: getSiteConfig available at layout render
  POST: site.metadata.title and description applied to layout export
  EFFECTS: pure
  TERMINATION: total
  site := GetSiteConfig()
  APPLY site.metadata.title AND site.metadata.description to layout export
```

## CodeLocations

// [IMPL-CONFIG_DRIVEN_APPEARANCE] [ARCH-CONFIG_DRIVEN_APPEARANCE] [REQ-CONFIG_DRIVEN_APPEARANCE]: map implementing and verifying source files for this IMPL

// FILE: src/lib/config.ts — getFilesConfig, getFilesOverride, getFileTypeConfig (server wrapper)
// FILE: src/lib/file-type-config.ts — DEFAULT_FILE_TYPES, resolveFileTypeConfig (client-safe)
// FILE: src/app/files/components/FileTypeIcon.tsx — theme-driven row icon component
// FILE: src/app/files/components/FilePane.tsx — FileTypeIcon per row
// FILE: src/app/files/components/FinderDialog.tsx — FileTypeIcon per result
// FILE: config/files.yaml — file manager copy and layout
// FILE: config/theme.yaml — colors, fonts, files.fileTypes
// FILE: config/site.yaml — metadata
// FILE: src/app/files/page.tsx — server loads config and fileTypes into WorkspaceView
// FILE: src/lib/config.test.ts — files config and file type matching tests
// FILE: src/lib/file-type-config.test.ts — resolveFileTypeConfig pattern tests
// FILE: src/app/files/components/FileTypeIcon.test.tsx — icon component tests

## ErrorHandling

// [IMPL-CONFIG_DRIVEN_APPEARANCE] [ARCH-CONFIG_DRIVEN_APPEARANCE] [REQ-CONFIG_DRIVEN_APPEARANCE]: how: loader fallbacks via IMPL-CONFIG_LOADER ensure UI still renders with defaults when YAML missing

```
IMPL-CONFIG_DRIVEN_APPEARANCE_on_error(context, error):
  INPUT: YAML load or merge error
  OUTPUT: UI renders with DEFAULT_* copy and theme values
  PRE: config load failure
  POST: defaults applied via IMPL-CONFIG_LOADER path
  EFFECTS: IO
  TERMINATION: total
  LOG diagnostic with IMPL, ARCH, REQ token refs
  DELEGATE to IMPL-CONFIG_LOADER ReadYamlFile empty-object merge path
  UI uses DEFAULT_* copy and theme values
```
