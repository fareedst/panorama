# IMPL-ROOT_LAYOUT essence pseudocode

// [IMPL-ROOT_LAYOUT] [ARCH-LAYOUT_PATTERN] [REQ-ROOT_LAYOUT]: Root layout server component — metadata export, html/body shell, font variable classes, children slot

## ExportMetadataFromSiteConfig

// [IMPL-ROOT_LAYOUT] [ARCH-LAYOUT_PATTERN] [REQ-ROOT_LAYOUT] [REQ-CONFIG_DRIVEN_UI]: export metadata object from getSiteConfig at module load for Next.js Metadata API

```
IMPL-ROOT_LAYOUT_ExportMetadataFromSiteConfig():
  INPUT: site config YAML via getSiteConfig()
  OUTPUT: exported metadata { title, description }
  DATA: siteConfig.metadata.title, siteConfig.metadata.description
  PRE: config/site.yaml readable or defaults available via getSiteConfig
  POST: metadata export contains title and description from site config
  EFFECTS: IO
  TERMINATION: total
  siteConfig := getSiteConfig()
  EXPORT metadata.title := siteConfig.metadata.title
  EXPORT metadata.description := siteConfig.metadata.description
```

## RootShellDocumentStructure

// [IMPL-ROOT_LAYOUT] [ARCH-LAYOUT_PATTERN] [REQ-ROOT_LAYOUT] [REQ-CONFIG_DRIVEN_UI] [REQ-FONT_SYSTEM]: render html lang from site config, head theme style injection, body with Geist font variables and children

```
IMPL-ROOT_LAYOUT_RootShellDocumentStructure(children):
  INPUT: children ReactNode
  OUTPUT: html document wrapping all app routes
  DATA: locale, geistSans.variable, geistMono.variable, themeCss from generateThemeCss(getThemeConfig())
  PRE: RootLayout invoked with children slot
  POST: html/head/body shell rendered with locale, theme CSS, font variables, and children
  EFFECTS: pure
  TERMINATION: total
  themeConfig := getThemeConfig()
  themeCss := generateThemeCss(themeConfig)
  locale := getSiteConfig().locale
  RETURN
    html lang=locale
      head
        style dangerouslySetInnerHTML themeCss
      body className = geistSans.variable + geistMono.variable + antialiased
        RENDER children
```

## CodeLocations

// [IMPL-ROOT_LAYOUT] [ARCH-LAYOUT_PATTERN] [REQ-ROOT_LAYOUT]: map implementing and verifying source files for this IMPL

// FILE: src/app/layout.tsx — RootLayout default export and metadata export
// FILE: src/app/layout.test.tsx — children render, structure, metadata from config
// FILE: src/test/integration/app.test.tsx — layout composition integration
