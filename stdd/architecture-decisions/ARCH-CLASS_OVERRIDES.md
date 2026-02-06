# [ARCH-CLASS_OVERRIDES] Tailwind Class Override Architecture

**Cross-References**: [REQ-CONFIG_DRIVEN_UI] [ARCH-CONFIG_DRIVEN_UI] [ARCH-TAILWIND_V4]  
**Status**: Active  
**Created**: 2026-02-06  
**Last Updated**: 2026-02-06

---

## Decision

Per-element Tailwind CSS class overrides are supported via the `overrides` section in `config/theme.yaml`. Override strings are merged with default component classes using `tailwind-merge`, which intelligently resolves conflicting utilities (e.g., `bg-red-500` overrides `bg-white`).

## Rationale

- Semantic design tokens (colors, spacing, sizing) cover common customization needs, but advanced users may want to change specific element styling
- Direct Tailwind class strings are powerful and familiar to Tailwind users
- `tailwind-merge` prevents class conflicts that would occur with simple string concatenation
- Empty override strings are ignored, so the config is non-intrusive by default
- This provides a "hybrid" approach: semantic tokens for simple theming + class overrides for advanced customization

## Alternatives Considered

- **CSS class names only (no merge)**: Leads to conflicting utilities; unpredictable results
- **Component variants/props**: More type-safe but limited; doesn't cover arbitrary styling
- **Separate CSS file for overrides**: Loses Tailwind's utility-first benefits; harder to maintain
- **Styled-components / CSS modules**: Adds runtime cost; conflicts with Server Components

## Implementation Approach

1. `config/theme.yaml` defines optional `overrides` keys for each customizable element
2. `getOverride(overrides, key)` returns the trimmed override string (or empty string)
3. Components use `twMerge(defaultClasses, getOverride(...))` to produce final class strings
4. Override keys: `outerContainer`, `main`, `heading`, `paragraph`, `contentSection`, `buttonGroup`, `primaryButton`, `secondaryButton`, `inlineLink`

## Token Coverage `[PROC-TOKEN_AUDIT]`

- [x] `src/lib/config.ts` - `getOverride()` function
- [x] `src/lib/config.types.ts` - `ClassOverrides` interface
- [x] `src/app/page.tsx` - `twMerge()` usage for all elements
- [x] `config/theme.yaml` - `overrides` section

## Related Decisions

- Depends on: [ARCH-CONFIG_DRIVEN_UI], [ARCH-TAILWIND_V4]
- Informs: [IMPL-CLASS_OVERRIDES]

---

*Last validated: 2026-02-06 by AI agent*
