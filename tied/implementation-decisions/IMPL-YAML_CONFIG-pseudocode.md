# IMPL-YAML_CONFIG essence pseudocode

## SITE_YAML_SCHEMA

// [IMPL-YAML_CONFIG] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_UI]: how: config/site.yaml holds metadata, locale, branding, content, and navigation sections typed as SiteConfig

```
IMPL-YAML_CONFIG_SiteYamlSchema():
  INPUT: config/site.yaml partial or complete document
  OUTPUT: SiteConfig shape after merge
  DATA: metadata (title, description), locale, branding.logo, content (heading, description with {placeholder} tokens), navigation (inlineLinks, buttons, security)
  PRE: site.yaml document parseable
  POST: SiteConfig fields populated per schema
  EFFECTS: pure
  TERMINATION: total
  metadata := page title and description for Next.js Metadata API
  locale := HTML lang attribute value
  branding.logo := ImageConfig (src, alt, width, height, darkInvert?)
  content.heading AND content.description := main page copy; description supports {templates} {learning} placeholders
  navigation.inlineLinks := keyed map for placeholder replacement
  navigation.buttons := ordered CTA list with variant primary|secondary
  navigation.security := target and rel for external links
```

## THEME_YAML_SCHEMA

// [IMPL-YAML_CONFIG] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_UI]: how: config/theme.yaml holds colors (light/dark modes), fonts, spacing, sizing, overrides, and optional files theme extensions typed as ThemeConfig

```
IMPL-YAML_CONFIG_ThemeYamlSchema():
  INPUT: config/theme.yaml partial or complete document
  OUTPUT: ThemeConfig shape after merge
  DATA: colors.light/dark, fonts.sans/mono, spacing, sizing, overrides, files.fileTypes optional
  PRE: theme.yaml document parseable
  POST: ThemeConfig fields populated per schema
  EFFECTS: pure
  TERMINATION: total
  colors.light AND colors.dark := background, foreground, plus optional custom CSS variable keys
  fonts.sans AND fonts.mono := CSS variable name and fallback stack
  spacing.page := paddingY, paddingX Tailwind tokens; contentGap, buttonGap
  sizing := maxContentWidth, buttonHeight, buttonDesktopWidth tokens
  overrides := optional ClassOverrides map (empty strings ignored at runtime)
  files := optional FilesThemeConfig (fileTypes patterns, layout classes) for file manager
```

## PARTIAL_CONFIG_WITH_DEFAULTS

// [IMPL-YAML_CONFIG] [IMPL-CONFIG_LOADER] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_UI]: how: DEFAULT_SITE_CONFIG and DEFAULT_THEME_CONFIG in config.ts supply fallbacks; getSiteConfig/getThemeConfig deep-merge user YAML then cache

```
IMPL-YAML_CONFIG_PartialConfigWithDefaults():
  INPUT: user YAML object (possibly empty or partial)
  OUTPUT: complete SiteConfig or ThemeConfig
  DATA: deepMerge (nested objects merge; arrays replace entirely; undefined skipped)
  PRE: config path and DEFAULT_* constants available
  POST: merged complete config cached for process lifetime
  EFFECTS: State, IO
  FAILURE_MODES: missing/invalid YAML → DEFAULT_* only with warning log
  TERMINATION: total
  IF cache hit THEN RETURN cached config
  userConfig := readYamlFile(config path)
  merged := deepMerge(DEFAULT_*, userConfig)
  CACHE merged at module level for server process lifetime
  RETURN merged
  ON missing YAML file OR invalid root OR parse error LOG warning AND use DEFAULT_* only
```

## DEFAULT_CONFIG_STRUCTURE

// [IMPL-YAML_CONFIG] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_UI]: how: exported _DEFAULT_SITE_CONFIG and _DEFAULT_THEME_CONFIG mirror original hard-coded template values; tests assert all required fields present

```
IMPL-YAML_CONFIG_DefaultConfigStructure():
  INPUT: none
  OUTPUT: DEFAULT_SITE_CONFIG, DEFAULT_THEME_CONFIG constant objects
  DATA: used when YAML omits keys or file absent
  PRE: config module initialized
  POST: default constant objects with all required fields
  EFFECTS: pure
  TERMINATION: total
  DEFAULT_SITE_CONFIG := metadata, locale, branding, content, navigation with create-next-app baseline values
  DEFAULT_THEME_CONFIG := colors, fonts, spacing, sizing, overrides empty object
  EXPOSE defaults to tests via _DEFAULT_SITE_CONFIG and _DEFAULT_THEME_CONFIG for structure assertions
```

## CodeLocations

// [IMPL-YAML_CONFIG] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_UI]: map implementing and verifying source files for this IMPL

// config/site.yaml, config/theme.yaml, src/lib/config.types.ts SiteConfig/ThemeConfig, src/lib/config.ts DEFAULT_* and getSiteConfig/getThemeConfig, src/lib/config.test.ts IMPL-YAML_CONFIG and Default configs describe blocks
