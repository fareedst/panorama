# IMPL-FONT_LOADING essence pseudocode

// [IMPL-FONT_LOADING] [ARCH-GOOGLE_FONTS] [ARCH-CSS_VARIABLES_FONTS] [REQ-FONT_SYSTEM]: Load Geist Sans and Geist Mono via next/font/google with latin subset and CSS variables applied to body in root layout

## Summary contract

// [IMPL-FONT_LOADING] [ARCH-GOOGLE_FONTS] [ARCH-CSS_VARIABLES_FONTS] [REQ-FONT_SYSTEM]: how: build-time font optimization; variables --font-geist-sans and --font-geist-mono on body alongside antialiased

```
IMPL-FONT_LOADING_Summary():
  INPUT: next/font/google Geist and Geist_Mono constructors
  OUTPUT: CSS variable class names on body element
  DATA: subsets ["latin"], variable names for sans and mono
  PRE: Next.js build environment available
  POST: font CSS variables active on body for entire app including /files
  EFFECTS: pure (build-time configuration)
  CONTROL: static import required at build time (cannot be YAML-driven family name)
  TERMINATION: total
```

## ImportGeistFonts

// [IMPL-FONT_LOADING] [ARCH-GOOGLE_FONTS] [ARCH-CSS_VARIABLES_FONTS] [REQ-FONT_SYSTEM]: how: instantiate Geist with variable --font-geist-sans and Geist_Mono with --font-geist-mono; latin subset only

```
IMPL-FONT_LOADING_ImportGeistFonts():
  INPUT: next/font/google module
  OUTPUT: geistSans.variable, geistMono.variable class fragments
  DATA: Geist({ variable, subsets }), Geist_Mono({ variable, subsets })
  PRE: next/font/google module importable at build time
  POST: geistSans and geistMono instances with latin subset and CSS variable names
  EFFECTS: pure
  TERMINATION: total
  geistSans := Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
  geistMono := Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })
```

## ApplyToBodyElement

// [IMPL-FONT_LOADING] [ARCH-GOOGLE_FONTS] [ARCH-CSS_VARIABLES_FONTS] [REQ-FONT_SYSTEM]: how: RootLayout body className concatenates both font variable classes and antialiased

```
IMPL-FONT_LOADING_ApplyToBodyElement(children):
  INPUT: geistSans.variable, geistMono.variable, children
  OUTPUT: body element with font CSS variables active for entire app including /files
  DATA: RootLayout in src/app/layout.tsx
  PRE: geistSans and geistMono font instances initialized
  POST: body className includes both font variable classes and antialiased
  EFFECTS: render
  TERMINATION: total
  RETURN html/body structure with body className `${geistSans.variable} ${geistMono.variable} antialiased`
  RENDER children inside body
```

## CodeLocations

// [IMPL-FONT_LOADING] [ARCH-GOOGLE_FONTS] [ARCH-CSS_VARIABLES_FONTS] [REQ-FONT_SYSTEM]: map implementing and verifying source files for this IMPL

// FILE: src/app/layout.tsx — Geist imports and body className
// FILE: src/app/layout.test.tsx — applies font variables to body test

## ErrorHandling

// [IMPL-FONT_LOADING] [ARCH-GOOGLE_FONTS] [ARCH-CSS_VARIABLES_FONTS] [REQ-FONT_SYSTEM]: how: next/font handles fetch/subset failures at build time; runtime has no font-loading error path

```
IMPL-FONT_LOADING_on_error(context, error):
  INPUT: build-time font fetch failure OR runtime context (no runtime path)
  OUTPUT: build failure OR no-op at runtime
  PRE: error during font optimization or normal runtime
  POST: build aborted on compile-time failure; runtime fonts already self-hosted
  EFFECTS: none at runtime
  TERMINATION: total
  BUILD fails if google font unavailable at compile time
  RUNTIME: fonts already self-hosted by Next.js optimizer
```
