# IMPL-CONFIG_DRIVEN_APPEARANCE essence pseudocode

// [IMPL-CONFIG_DRIVEN_APPEARANCE] [ARCH-CONFIG_DRIVEN_APPEARANCE] [REQ-CONFIG_DRIVEN_APPEARANCE]: File-manager appearance and copy from YAML — jobs tracker UI removed; remaining scope is site metadata, theme, and files config consumed by /files

## Summary contract

// [IMPL-CONFIG_DRIVEN_APPEARANCE] [ARCH-CONFIG_DRIVEN_APPEARANCE] [REQ-CONFIG_DRIVEN_APPEARANCE]: how: no hard-coded layout classes or user-facing strings in file-manager UI; values flow from config loaders

CONTRACT Summary
  INPUT: config/site.yaml, config/theme.yaml, config/files.yaml
  OUTPUT: server components receive typed copy and class overrides
  DATA: getSiteConfig, getThemeConfig, getFilesConfig, getFilesOverride, getFileTypeConfig (see IMPL-CONFIG_LOADER, IMPL-FILES_CONFIG_COMPLETE)
  CONTROL: jobs pages and config/jobs.yaml removed per file-manager sole-purpose refactor

## RetiredJobsScope

// [IMPL-CONFIG_DRIVEN_APPEARANCE] [ARCH-CONFIG_DRIVEN_APPEARANCE] [REQ-CONFIG_DRIVEN_APPEARANCE]: how: historical jobs appearance (getJobsConfig, jobs theme section) deleted — no production or test loci remain

CONTRACT RetiredJobsScope
  INPUT: none
  OUTPUT: no runtime jobs config accessors
  DATA: removed src/app/jobs/, config/jobs.yaml, getJobsConfig from config.ts

PROCEDURE IMPL-CONFIG_DRIVEN_APPEARANCE_RetiredJobsScope()
  ASSERT no getJobsConfig in src/lib/config.ts
  ASSERT no src/app/jobs routes
  DOCUMENT in CHANGELOG and docs/FILE_MANAGER_SOLE_PURPOSE.md

## FilesCopyAndLayoutFromYaml

// [IMPL-CONFIG_DRIVEN_APPEARANCE] [ARCH-CONFIG_DRIVEN_APPEARANCE] [REQ-CONFIG_DRIVEN_APPEARANCE] [REQ-CONFIG_DRIVEN_FILE_MANAGER]: how: WorkspaceView and file UI read copy.* and layout.* from getFilesConfig()

CONTRACT FilesCopyAndLayoutFromYaml
  INPUT: merged FilesConfig from getFilesConfig
  OUTPUT: props to WorkspaceView (title, shortcuts, operations labels, layout defaults)
  DATA: config/files.yaml overrides DEFAULT_FILES_CONFIG

PROCEDURE IMPL-CONFIG_DRIVEN_APPEARANCE_FilesCopyAndLayoutFromYaml()
  filesConfig := GetFilesConfig()
  PASS filesConfig.copy AND filesConfig.layout to file manager entry
  ASSERT no user-facing string literals for those fields in WorkspaceView props source

## ThemeClassesAndFileTypeIcons

// [IMPL-CONFIG_DRIVEN_APPEARANCE] [ARCH-CONFIG_DRIVEN_APPEARANCE] [REQ-CONFIG_DRIVEN_APPEARANCE]: how: theme.files overrides and fileTypes drive icon and iconClass via getFileTypeConfig and getFilesOverride

CONTRACT ThemeClassesAndFileTypeIcons
  INPUT: ThemeConfig from getThemeConfig, filename, isDirectory
  OUTPUT: icon string and iconClass string per row
  DATA: theme.files.fileTypes patterns (glob → regex), directory and file defaults

PROCEDURE IMPL-CONFIG_DRIVEN_APPEARANCE_ThemeClassesAndFileTypeIcons(theme, filename, isDirectory)
  IF isDirectory THEN RETURN fileTypes.directory OR default directory icon
  FOR each file type IN theme.files.fileTypes (skip directory, file keys for pattern loop)
    IF filename matches any pattern THEN RETURN type icon and iconClass
  RETURN fileTypes.file OR default file icon

## SiteMetadataForLayout

// [IMPL-CONFIG_DRIVEN_APPEARANCE] [ARCH-CONFIG_DRIVEN_APPEARANCE] [REQ-CONFIG_DRIVEN_APPEARANCE]: how: root layout uses getSiteConfig metadata for document title and description

CONTRACT SiteMetadataForLayout
  INPUT: getSiteConfig().metadata
  OUTPUT: HTML title and meta description
  DATA: config/site.yaml merged with defaults

PROCEDURE IMPL-CONFIG_DRIVEN_APPEARANCE_SiteMetadataForLayout()
  site := GetSiteConfig()
  APPLY site.metadata.title AND site.metadata.description to layout export

## CodeLocations

// [IMPL-CONFIG_DRIVEN_APPEARANCE] [ARCH-CONFIG_DRIVEN_APPEARANCE] [REQ-CONFIG_DRIVEN_APPEARANCE]: map implementing and verifying source files for this IMPL

// FILE: src/lib/config.ts — getFilesConfig, getFilesOverride, getFileTypeConfig
// FILE: config/files.yaml — file manager copy and layout
// FILE: config/theme.yaml — colors, fonts, files.fileTypes
// FILE: config/site.yaml — metadata
// FILE: src/app/files/page.tsx — server loads config into WorkspaceView
// FILE: src/lib/config.test.ts — files config and file type matching tests

## ErrorHandling

// [IMPL-CONFIG_DRIVEN_APPEARANCE] [ARCH-CONFIG_DRIVEN_APPEARANCE] [REQ-CONFIG_DRIVEN_APPEARANCE]: how: loader fallbacks via IMPL-CONFIG_LOADER ensure UI still renders with defaults when YAML missing

PROCEDURE IMPL-CONFIG_DRIVEN_APPEARANCE_on_error(context, error)
  LOG diagnostic with IMPL, ARCH, REQ token refs
  DELEGATE to IMPL-CONFIG_LOADER ReadYamlFile empty-object merge path
  UI uses DEFAULT_* copy and theme values
