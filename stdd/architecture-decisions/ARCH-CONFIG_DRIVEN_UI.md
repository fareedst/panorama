# [ARCH-CONFIG_DRIVEN_UI] Configuration-Driven UI Architecture

**Cross-References**: [REQ-CONFIG_DRIVEN_UI]  
**Status**: Active  
**Created**: 2026-02-06  
**Last Updated**: 2026-02-06

---

## Decision

All page element appearance, layout, and content are driven by two YAML configuration files rather than hard-coded values in TSX and CSS. A typed config loader module reads these files at server render time, merges user values with built-in defaults, and provides them to server components.

## Rationale

- The project serves as a **highly configurable template** – users should customize appearance and content without editing source code
- YAML is human-readable, widely understood, and easy to edit for non-developers
- TypeScript interfaces provide compile-time safety for config consumers while YAML stays approachable
- Separating "what" (site.yaml) from "how" (theme.yaml) follows separation of concerns
- Deep-merge with defaults means partial configs work – users only override what they need
- Server-side YAML parsing via `fs.readFileSync` works naturally with Next.js Server Components

## Alternatives Considered

- **TypeScript config files (.ts)**: Better type safety at authoring time, but less approachable for non-developers and requires build step understanding
- **JSON config files**: Verbose (no comments), harder to read for humans
- **Single monolithic config file**: Simpler but doesn't scale; mixing content with visual design tokens is unwieldy
- **Environment variables**: Limited to flat key-value pairs; can't represent nested structures like navigation links or theme palettes
- **CMS / headless API**: Over-engineered for a local template project; adds deployment complexity

## Implementation Approach

### Config Files

| File | Purpose | Schema |
|------|---------|--------|
| `config/site.yaml` | Metadata, locale, branding, page content, navigation links, link security | `SiteConfig` |
| `config/theme.yaml` | Color palette, font variables, spacing, sizing, per-element class overrides | `ThemeConfig` |

### Config Loader (`src/lib/config.ts`)

- Reads YAML via `js-yaml` + `fs.readFileSync` (server-only)
- Deep-merges user config with `DEFAULT_SITE_CONFIG` / `DEFAULT_THEME_CONFIG`
- Module-level caching (`_siteConfig`, `_themeConfig`) – read once per server restart / HMR cycle
- Exports `getSiteConfig()`, `getThemeConfig()`, `generateThemeCss()`, `getOverride()`
- Graceful fallback: missing YAML file → full defaults used

### Component Consumption

- `layout.tsx`: reads site config for metadata + locale; injects theme CSS variables via `<style>` tag
- `page.tsx`: reads site config for content/links/images; reads theme config for class construction; uses `tailwind-merge` for class overrides

## Token Coverage `[PROC-TOKEN_AUDIT]`

Code files expected to carry `[IMPL-*] [ARCH-*] [REQ-*]` comments:
- [x] `src/lib/config.types.ts` - TypeScript config schemas
- [x] `src/lib/config.ts` - Config loader module
- [x] `src/app/layout.tsx` - Layout with config consumption
- [x] `src/app/page.tsx` - Page with config consumption
- [x] `src/app/globals.css` - Simplified CSS referencing config variables
- [x] `config/site.yaml` - Site configuration
- [x] `config/theme.yaml` - Theme configuration

Tests expected to reference `[REQ-*]` / `[TEST-*]` tokens:
- [x] `src/lib/config.test.ts` - Config loader unit tests (31 tests)
- [x] `src/app/page.test.tsx` - Page tests with config assertions (20 tests)
- [x] `src/app/layout.test.tsx` - Layout tests with config assertions (8 tests)
- [x] `src/test/dark-mode.test.tsx` - Dark mode tests (11 tests)
- [x] `src/test/responsive.test.tsx` - Responsive tests (16 tests)
- [x] `src/test/integration/app.test.tsx` - Integration tests (16 tests)

## Validation Evidence `[PROC-TOKEN_VALIDATION]`

| Date | Commit | Validation Result | Notes |
|------|--------|-------------------|-------|
| 2026-02-06 | pending | ✅ Pass | 102/102 tests passing |

## Related Decisions

- Depends on: [REQ-CONFIG_DRIVEN_UI]
- Informs: [IMPL-YAML_CONFIG], [IMPL-CONFIG_LOADER], [ARCH-THEME_INJECTION], [ARCH-CLASS_OVERRIDES]
- See also: [ARCH-CSS_VARIABLES], [ARCH-TAILWIND_V4]

---

*Last validated: 2026-02-06 by AI agent*
