# IMPL-IMAGE_OPTIMIZATION essence pseudocode

// [IMPL-IMAGE_OPTIMIZATION] [ARCH-NEXTJS_FRAMEWORK] [REQ-BRANDING]: Branding image contract and dark-mode visibility — logo metadata in site config with darkInvert flag; SVG logos use dark:invert Tailwind class (home page Image usage retired with root redirect)

## Summary contract

// [IMPL-IMAGE_OPTIMIZATION] [ARCH-NEXTJS_FRAMEWORK] [REQ-BRANDING]: how: typed branding.logo in SiteConfig; dark-mode tests document invert class; no next/image imports in current production tree

```
IMPL-IMAGE_OPTIMIZATION_Summary():
  INPUT: config/site.yaml branding.logo (src, alt, width, height, darkInvert)
  OUTPUT: consumers apply alt text and optional dark:invert class when rendering logos
  DATA: SiteConfig.branding.logo, config.types LogoConfig.darkInvert
  PRE: site config loaded via IMPL-CONFIG_LOADER
  POST: LogoConfig available with defaults
  EFFECTS: pure (config read)
  CONTROL: see IMPL-CONFIG_LOADER for load path; rendering locus may be future layout/header
  TERMINATION: total
```

## BrandingLogoConfigShape

// [IMPL-IMAGE_OPTIMIZATION] [ARCH-NEXTJS_FRAMEWORK] [REQ-BRANDING]: how: defaults in config.ts include src, alt, width, height, darkInvert true

```
IMPL-IMAGE_OPTIMIZATION_BrandingLogoConfigShape():
  INPUT: merged site YAML
  OUTPUT: LogoConfig object
  DATA: DEFAULT_SITE_CONFIG.branding.logo
  PRE: config merge complete
  POST: logo fields exposed on SiteConfig
  EFFECTS: pure
  TERMINATION: total
  MERGE site YAML into SiteConfig
  EXPOSE logo.src, logo.alt, logo.width, logo.height, logo.darkInvert
  ASSERT config.test.ts expects default logo fields present
```

## DarkModeInvertClassPattern

// [IMPL-IMAGE_OPTIMIZATION] [ARCH-NEXTJS_FRAMEWORK] [REQ-BRANDING] [REQ-DARK_MODE]: how: when darkInvert true, UI applies Tailwind dark:invert on SVG logos for contrast on dark backgrounds

```
IMPL-IMAGE_OPTIMIZATION_DarkModeInvertClassPattern():
  INPUT: theme dark mode active
  OUTPUT: logo element class list includes dark:invert
  DATA: invertClass constant 'dark:invert' verified in tests
  PRE: darkInvert enabled on logo config
  POST: dark:invert class applied when rendering
  EFFECTS: render (when consumer renders logo)
  TERMINATION: total
  WHEN rendering branding logo AND darkInvert enabled
  APPLY class dark:invert alongside size dimensions from config
  TEST asserts invertClass equals 'dark:invert' in dark-mode.test.tsx
```

## RetiredHomePageImageUsage

// [IMPL-IMAGE_OPTIMIZATION] [ARCH-NEXTJS_FRAMEWORK] [REQ-BRANDING]: how: prior home page next/image logo removed; root redirects to /files per IMPL-HOME_PAGE

```
IMPL-IMAGE_OPTIMIZATION_RetiredHomePageImageUsage():
  INPUT: none
  OUTPUT: no next/image import in src/app/page.tsx
  DATA: REQ-BRANDING criterion "logo at top of home page" superseded by file-manager sole purpose
  PRE: home page redirect in place
  POST: no home page Image usage
  EFFECTS: none (documentation/assertion)
  TERMINATION: total
  ASSERT grep next/image in app routes returns empty for home
  DOCUMENT branding contract remains in site config for future UI surfaces
```

## CodeLocations

// [IMPL-IMAGE_OPTIMIZATION] [ARCH-NEXTJS_FRAMEWORK] [REQ-BRANDING]: map implementing and verifying source files

// FILE: src/lib/config.ts — DEFAULT_SITE_CONFIG.branding.logo
// FILE: src/lib/config.types.ts — LogoConfig.darkInvert
// FILE: src/lib/config.test.ts — logo default field assertions
// FILE: src/test/dark-mode.test.tsx — dark:invert pattern test

## ErrorHandling

// [IMPL-IMAGE_OPTIMIZATION] [ARCH-NEXTJS_FRAMEWORK] [REQ-BRANDING]: how: missing logo src falls back via IMPL-CONFIG_LOADER defaults; render errors are consumer responsibility

```
IMPL-IMAGE_OPTIMIZATION_on_error(context, error):
  INPUT: config load or render failure
  OUTPUT: delegated or consumer-surfaced error
  PRE: error in config or render path
  POST: load failures delegated; render failures isolated
  EFFECTS: depends on consumer
  TERMINATION: total
  DELEGATE config load failures to IMPL-CONFIG_LOADER
  IF logo render fails THEN surface at consuming component without breaking file manager panes
```
