# IMPL-FLEX_LAYOUT essence pseudocode

// [IMPL-FLEX_LAYOUT] [ARCH-TAILWIND_V4] [REQ-ROOT_LAYOUT]: Tailwind flexbox utilities for application layout — file-manager UI and root shell use flex, flex-col, flex-row, gap, justify-*, and items-* for pane and dialog structure

## Summary contract

// [IMPL-FLEX_LAYOUT] [ARCH-TAILWIND_V4] [REQ-ROOT_LAYOUT]: how: layout composition uses utility classes instead of custom CSS flex rules; primary locus shifted from home page redirect to /files WorkspaceView and dialog components

```
IMPL-FLEX_LAYOUT_Summary():
  INPUT: component className strings
  OUTPUT: responsive flex containers and aligned children
  DATA: Tailwind v4 flex utilities in JSX className
  CONTROL: no runtime flex logic — declarative CSS utilities only
  PRE: components render with Tailwind utility classes applied
  POST: flex containers and aligned children visible per className tokens
  EFFECTS: pure
  TERMINATION: total
```

## RootPageRedirect

// [IMPL-FLEX_LAYOUT] [ARCH-TAILWIND_V4] [REQ-ROOT_LAYOUT]: how: src/app/page.tsx no longer renders flex layout; redirects to /files (IMPL-FILE_MANAGER_PAGE sole-purpose entry)

```
IMPL-FLEX_LAYOUT_RootPageRedirect():
  INPUT: GET /
  OUTPUT: redirect /files
  DATA: next/navigation redirect()
  PRE: root page route invoked
  POST: client navigates to /files; no flex layout rendered on home page
  EFFECTS: Control
  TERMINATION: total
  CALL redirect("/files")
  ASSERT no flex classNames remain on home page component
```

## FileManagerFlexContainers

// [IMPL-FLEX_LAYOUT] [ARCH-TAILWIND_V4] [REQ-ROOT_LAYOUT]: how: file manager uses flex-col for workspace shell, flex-row for toolbars and pane rows, gap for spacing, justify/align for dialog footers and centered overlays

```
IMPL-FLEX_LAYOUT_FileManagerFlexContainers():
  INPUT: WorkspaceView and files/components JSX
  OUTPUT: multi-pane grid via flex utilities (flex, flex-1, flex-col, items-center, justify-center, gap-*)
  DATA: src/app/files/WorkspaceView.tsx, dialog components (BookmarkDialog flex flex-col, modal overlays flex items-center justify-center)
  PRE: workspace and dialog components mounted
  POST: shell, toolbars, and modal overlays use documented flex utility classes
  EFFECTS: pure
  TERMINATION: total
  APPLY flex flex-col on full-height workspace wrapper
  APPLY flex flex-row OR flex with gap on toolbar groups and pane toolbars
  APPLY flex items-center justify-center on modal backdrops
  APPLY flex-1 overflow on scrollable dialog bodies
```

## CodeLocations

// [IMPL-FLEX_LAYOUT] [ARCH-TAILWIND_V4] [REQ-ROOT_LAYOUT]: map implementing and verifying source files for this IMPL

// FILE: src/app/page.tsx — redirect only (historical flex home layout retired)
// FILE: src/app/files/WorkspaceView.tsx — primary workspace flex shell
// FILE: src/app/files/components/*.tsx — dialogs and toolbars using flex utilities

## ErrorHandling

// [IMPL-FLEX_LAYOUT] [ARCH-TAILWIND_V4] [REQ-ROOT_LAYOUT]: how: not applicable — static CSS classes; jsdom tests may use size fallbacks (IMPL-USE_ELEMENT_SIZE) when flex layout reports zero dimensions

```
IMPL-FLEX_LAYOUT_on_error(context, error):
  INPUT: context, error (unused for presentational utilities)
  OUTPUT: not applicable
  PRE: static CSS utility classes only
  POST: no runtime error path for flex layout utilities
  EFFECTS: pure
  TERMINATION: total
  NOT APPLICABLE — presentational utilities only
```
