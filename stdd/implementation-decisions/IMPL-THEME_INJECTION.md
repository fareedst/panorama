# [IMPL-THEME_INJECTION] Theme CSS Variable Injection

**Cross-References**: [ARCH-THEME_INJECTION] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_UI]  
**Status**: Active  
**Created**: 2026-02-06  
**Last Updated**: 2026-02-06

---

## Decision

The root layout component renders a `<style>` tag in `<head>` containing CSS custom properties for both light and dark modes, generated from `config/theme.yaml` via `generateThemeCss()`.

## Rationale

- Replaces hard-coded color values previously in `globals.css`
- Dark mode support via `@media (prefers-color-scheme: dark)` requires a style block (not inline styles)
- `dangerouslySetInnerHTML` is safe here because the CSS is server-generated from trusted config
- Tailwind's `@theme inline` in `globals.css` references the same CSS variables, so all utility classes work unchanged

## Implementation Approach

### `generateThemeCss(theme: ThemeConfig): string`

Generates CSS like:
```css
:root {
  --background: #ffffff;
  --foreground: #171717;
}
@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}
```

Supports additional custom variables beyond `background`/`foreground` via the `ColorMode` index signature.

### Layout Integration

```tsx
// layout.tsx
const themeCss = generateThemeCss(themeConfig);
// ...
<head>
  <style dangerouslySetInnerHTML={{ __html: themeCss }} />
</head>
```

### globals.css Simplification

`globals.css` no longer contains `:root` or `@media (prefers-color-scheme: dark)` blocks with color values. It only:
1. Imports Tailwind CSS
2. Defines `@theme inline` referencing CSS variables
3. Sets base body styles using CSS variables

## Code Markers

- `src/lib/config.ts`: `generateThemeCss()` function
- `src/app/layout.tsx`: `<style>` tag injection
- `src/app/globals.css`: Variable-only references

## Token Coverage `[PROC-TOKEN_AUDIT]`

- [x] `src/lib/config.ts` - `[IMPL-THEME_INJECTION] [ARCH-THEME_INJECTION] [REQ-CONFIG_DRIVEN_UI]`
- [x] `src/app/layout.tsx` - `[IMPL-THEME_INJECTION] [ARCH-THEME_INJECTION] [REQ-CONFIG_DRIVEN_UI]`

## Related Decisions

- Depends on: [ARCH-THEME_INJECTION], [IMPL-CONFIG_LOADER]
- See also: [ARCH-CSS_VARIABLES], [IMPL-DARK_MODE]

---

*Last validated: 2026-02-06 by AI agent*
