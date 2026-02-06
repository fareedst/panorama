# [ARCH-THEME_INJECTION] Theme CSS Variable Injection Architecture

**Cross-References**: [REQ-CONFIG_DRIVEN_UI] [ARCH-CONFIG_DRIVEN_UI] [ARCH-CSS_VARIABLES]  
**Status**: Active  
**Created**: 2026-02-06  
**Last Updated**: 2026-02-06

---

## Decision

Theme color values are injected into the document via a `<style>` tag rendered by the root layout component, replacing the previously hard-coded CSS custom property values in `globals.css`. The style tag contains `:root` declarations for light mode and `@media (prefers-color-scheme: dark)` declarations for dark mode, all sourced from `config/theme.yaml`.

## Rationale

- CSS custom properties in `globals.css` cannot dynamically consume YAML config at build time without a custom build step
- Injecting a `<style>` tag from a server component is simple, requires no additional tooling, and works with Next.js's rendering pipeline
- The `@theme inline` directive in `globals.css` continues to reference the same CSS variables, so Tailwind utility classes work unchanged
- Dark mode remains pure CSS (no JavaScript) via `@media (prefers-color-scheme: dark)`
- Color values are fully configurable via `config/theme.yaml` without touching any source files

## Alternatives Considered

- **Build-time CSS generation**: Requires custom build scripts; adds complexity
- **Inline styles on body**: Cannot handle `@media` queries for dark mode
- **CSS-in-JS runtime**: Adds client JavaScript; conflicts with Server Components model
- **PostCSS plugin**: Over-engineered for variable injection; version-coupling risk

## Implementation Approach

1. `generateThemeCss(theme)` in `src/lib/config.ts` converts `ThemeConfig.colors` to a CSS string
2. `layout.tsx` calls `generateThemeCss()` and renders `<style dangerouslySetInnerHTML={{ __html: themeCss }} />` in `<head>`
3. `globals.css` is simplified to only reference variables (no hard-coded color values)
4. Additional custom color variables (beyond background/foreground) are supported via the `ColorMode` index signature

## Token Coverage `[PROC-TOKEN_AUDIT]`

- [x] `src/lib/config.ts` - `generateThemeCss()` function
- [x] `src/app/layout.tsx` - Style tag injection
- [x] `src/app/globals.css` - Variable references only

## Related Decisions

- Depends on: [ARCH-CONFIG_DRIVEN_UI], [ARCH-CSS_VARIABLES]
- Informs: [IMPL-THEME_INJECTION]
- See also: [ARCH-TAILWIND_V4]

---

*Last validated: 2026-02-06 by AI agent*
