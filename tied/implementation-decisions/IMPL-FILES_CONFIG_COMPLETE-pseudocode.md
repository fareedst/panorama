# IMPL-FILES_CONFIG_COMPLETE essence pseudocode

// [IMPL-FILES_CONFIG_COMPLETE] [ARCH-CONFIG_DRIVEN_UI] [REQ-FILES_CONFIG_COMPLETE] [REQ-CONFIG_DRIVEN_FILE_MANAGER]: Complete file-manager YAML configuration — layout/startup/fileTypes types, extended files.yaml and theme.yaml, DEFAULT_FILES_CONFIG defaults, getFileTypeConfig pattern matcher

## Summary contract

// [IMPL-FILES_CONFIG_COMPLETE] [ARCH-CONFIG_DRIVEN_UI] [REQ-FILES_CONFIG_COMPLETE] [REQ-CONFIG_DRIVEN_FILE_MANAGER]: how: builds on IMPL-FILES_CONFIG with layout, startup, marking/help/commandPalette copy, and theme fileTypes for icons

```
IMPL-FILES_CONFIG_COMPLETE_Summary():
  INPUT: config/files.yaml, theme from getThemeConfig(), filename, isDirectory flag
  OUTPUT: complete FilesConfig, { icon, iconClass } per file row
  DATA: FileTypeConfig patterns as glob-to-regex, directory and file defaults
  PRE: YAML config and theme available
  POST: complete FilesConfig and per-row icon config
  EFFECTS: pure
  CONTROL: first matching type wins; case-insensitive pattern test
  TERMINATION: total
```

## ExtendedTypes

// [IMPL-FILES_CONFIG_COMPLETE] [ARCH-CONFIG_DRIVEN_UI] [REQ-FILES_CONFIG_COMPLETE] [REQ-CONFIG_DRIVEN_FILE_MANAGER]: how: FileTypeConfig, FilesLayoutConfig, FilesStartupConfig extend config.types.ts; FilesThemeConfig.fileTypes record

```
IMPL-FILES_CONFIG_COMPLETE_ExtendedTypes():
  INPUT: schema definitions
  OUTPUT: typed layout.default, startup.mode/paths, fileTypes with patterns
  DATA: config.types.ts interfaces
  PRE: config.types.ts module
  POST: FileTypeConfig, FilesLayoutConfig, FilesStartupConfig, extended FilesThemeConfig defined
  EFFECTS: pure
  TERMINATION: total
  DEFINE FileTypeConfig { icon, iconClass, patterns? }
  DEFINE FilesLayoutConfig { default, defaultPaneCount, allowPaneManagement, maxPanes, defaultLinkedMode }
  DEFINE FilesStartupConfig { mode, paths?, rememberLastLocations? }
  EXTEND FilesThemeConfig with fileTypes record
```

## ExtendedFilesYaml

// [IMPL-FILES_CONFIG_COMPLETE] [ARCH-CONFIG_DRIVEN_UI] [REQ-FILES_CONFIG_COMPLETE] [REQ-CONFIG_DRIVEN_FILE_MANAGER]: how: config/files.yaml adds marking, help, commandPalette, layout, startup, columns, keybindings beyond base copy section

```
IMPL-FILES_CONFIG_COMPLETE_ExtendedFilesYaml():
  INPUT: config/files.yaml on disk
  OUTPUT: merged FilesConfig with layout and startup sections populated
  DATA: DEFAULT_FILES_CONFIG layout { default tile, defaultPaneCount 3, maxPanes 0 }, startup { mode home, paths pane1-3 }
  PRE: files.yaml loadable
  POST: merged config with copy, layout, startup, columns, keybindings
  EFFECTS: pure
  TERMINATION: total
  loaded := merge files.yaml into DEFAULT_FILES_CONFIG
  ASSERT copy.marking, copy.help, copy.commandPalette strings available
  ASSERT layout.default, startup.mode, startup.paths present after merge
```

## ExtendedThemeYaml

// [IMPL-FILES_CONFIG_COMPLETE] [ARCH-CONFIG_DRIVEN_UI] [REQ-FILES_CONFIG_COMPLETE] [REQ-CONFIG_DRIVEN_FILE_MANAGER]: how: theme.files.fileTypes defines directory, file defaults, and typed patterns (code, image, archive, etc.)

```
IMPL-FILES_CONFIG_COMPLETE_ExtendedThemeYaml(theme):
  INPUT: ThemeConfig from getThemeConfig
  OUTPUT: fileTypes map with icon, iconClass, patterns per type
  DATA: config/theme.yaml fileTypes section (~9 common types)
  PRE: theme config loaded
  POST: fileTypes includes directory, file, and specialized pattern entries
  EFFECTS: pure
  TERMINATION: total
  ASSERT theme.files.fileTypes includes directory and file entries
  FOR each specialized type ASSERT patterns array when configured
```

## GetFileTypeConfig

// [IMPL-FILES_CONFIG_COMPLETE] [ARCH-CONFIG_DRIVEN_UI] [REQ-FILES_CONFIG_COMPLETE] [REQ-CONFIG_DRIVEN_FILE_MANAGER]: how: directories always use fileTypes.directory; iterate types skipping directory/file keys; glob pattern to case-insensitive regex; first match wins; fallback fileTypes.file or generic defaults

```
IMPL-FILES_CONFIG_COMPLETE_getFileTypeConfig(theme, filename, isDirectory):
  INPUT: theme, filename, isDirectory
  OUTPUT: { icon, iconClass }
  PRE: theme and filename available
  POST: icon and iconClass for row display; never throws
  EFFECTS: pure
  FAILURE_MODES: no match → default file or directory icon
  TERMINATION: total
  IF isDirectory THEN RETURN fileTypes.directory OR defaultDir { folder icon, blue classes }
  IF NOT fileTypes THEN RETURN defaultFile { document icon, gray classes }
  FOR EACH typeName, typeConfig IN fileTypes ENTRIES
    SKIP typeName directory OR file
    SKIP when patterns empty
    FOR EACH pattern
      regex := globToRegex(pattern) // . escaped, * -> .*
      IF regex matches filename case-insensitive THEN RETURN typeConfig icon fields
  RETURN fileTypes.file OR defaultFile
```

## CodeLocations

// [IMPL-FILES_CONFIG_COMPLETE] [ARCH-CONFIG_DRIVEN_UI] [REQ-FILES_CONFIG_COMPLETE] [REQ-CONFIG_DRIVEN_FILE_MANAGER]: map implementing and verifying source files for this IMPL

// FILE: config/files.yaml — extended copy, layout, startup, columns, keybindings
// FILE: config/theme.yaml — files.fileTypes patterns
// FILE: src/lib/config.types.ts — FileTypeConfig, FilesLayoutConfig, FilesStartupConfig
// FILE: src/lib/config.ts — DEFAULT_FILES_CONFIG extensions, getFileTypeConfig
// FILE: src/lib/config.test.ts — describe getFilesConfig, describe getFileTypeConfig

## ErrorHandling

// [IMPL-FILES_CONFIG_COMPLETE] [ARCH-CONFIG_DRIVEN_UI] [REQ-FILES_CONFIG_COMPLETE] [REQ-CONFIG_DRIVEN_FILE_MANAGER]: how: getFileTypeConfig never throws; missing types fall back to hard-coded default icon/class pairs

```
IMPL-FILES_CONFIG_COMPLETE_on_error(context, error):
  INPUT: missing fileTypes or pattern match failure
  OUTPUT: default icon/class pair
  PRE: getFileTypeConfig invoked
  POST: default returned; YAML load errors delegated to IMPL-CONFIG_LOADER
  EFFECTS: pure
  TERMINATION: total
  IF no fileTypes OR no pattern match THEN RETURN default file or directory icon
  DELEGATE YAML load errors to IMPL-CONFIG_LOADER defaults
```
