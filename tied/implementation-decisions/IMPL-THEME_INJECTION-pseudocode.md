# IMPL-THEME_INJECTION essence pseudocode

// [IMPL-THEME_INJECTION] [ARCH-THEME_INJECTION] [REQ-CONFIG_DRIVEN_UI]: Generate CSS custom properties from theme.yaml and inject into root layout head style element

## GenerateThemeCssFromConfig

// [IMPL-THEME_INJECTION] [ARCH-THEME_INJECTION] [REQ-CONFIG_DRIVEN_UI]: generateThemeCss maps light and dark color entries to :root variables and prefers-color-scheme dark block

```
IMPL-THEME_INJECTION_GenerateThemeCssFromConfig(theme):
  INPUT: theme ThemeConfig with colors.light and colors.dark record maps
  OUTPUT: CSS string containing :root light vars and @media (prefers-color-scheme: dark) :root dark vars
  DATA: key→--{key}: {value}; lines joined per mode
  PRE: theme.colors.light and theme.colors.dark are record maps
  POST: returned CSS includes :root light variables and dark-mode media query block
  EFFECTS: pure
  TERMINATION: total
  lightVars := FOR EACH (key, value) IN theme.colors.light EMIT "    --{key}: {value};"
  darkVars := FOR EACH (key, value) IN theme.colors.dark EMIT "    --{key}: {value};"
  RETURN ":root {\n" + lightVars + "\n  }\n  @media (prefers-color-scheme: dark) {\n    :root {\n" + darkVars + "\n    }\n  }"
```

## InjectThemeStyleInHead

// [IMPL-THEME_INJECTION] [ARCH-THEME_INJECTION] [REQ-CONFIG_DRIVEN_UI]: RootLayout loads theme config and renders generated CSS in head style tag (replaces hard-coded globals.css :root colors)

```
IMPL-THEME_INJECTION_InjectThemeStyleInHead():
  INPUT: children ReactNode (layout slot)
  OUTPUT: document head contains inline style with theme CSS variables
  DATA: getThemeConfig(), generateThemeCss()
  PRE: RootLayout render path active
  POST: head contains style element with generated theme CSS; body renders children
  EFFECTS: pure
  TERMINATION: total
  themeConfig := getThemeConfig()
  themeCss := generateThemeCss(themeConfig)
  RENDER head child style element with __html = themeCss
  RENDER body with font variables and children unchanged
```

## CodeLocations

// [IMPL-THEME_INJECTION] [ARCH-THEME_INJECTION] [REQ-CONFIG_DRIVEN_UI]: map implementing and verifying source files for this IMPL

// FILE: src/lib/config.ts — generateThemeCss
// FILE: src/lib/config.test.ts — generateThemeCss light/dark and custom color variables
// FILE: src/app/layout.tsx — theme style injection in RootLayout head
// FILE: src/app/layout.test.tsx — theme color values from config align with injection contract
// FILE: src/test/dark-mode.test.tsx — light/dark variables sourced from theme config
