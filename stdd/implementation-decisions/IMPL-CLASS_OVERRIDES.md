# [IMPL-CLASS_OVERRIDES] Tailwind Class Override Implementation

**Cross-References**: [ARCH-CLASS_OVERRIDES] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_UI]  
**Status**: Active  
**Created**: 2026-02-06  
**Last Updated**: 2026-02-06

---

## Decision

Per-element Tailwind class overrides from `config/theme.yaml` are merged with component default classes using `tailwind-merge` (`twMerge`).

## Rationale

- Simple string concatenation causes Tailwind conflicts (e.g., both `bg-white` and `bg-red-500` applied)
- `tailwind-merge` intelligently resolves conflicts, keeping only the last value per utility group
- `getOverride(overrides, key)` provides a clean API that returns empty string for missing/blank keys
- Override keys map to specific DOM elements, making customization targeted and predictable

## Implementation Approach

### Override Keys

| Key | Element | Default Classes (abbreviated) |
|-----|---------|------------------------------|
| `outerContainer` | Outer wrapper div | `flex min-h-screen items-center justify-center bg-zinc-50 ...` |
| `main` | Main content area | `flex min-h-screen w-full max-w-{size} flex-col ...` |
| `heading` | H1 heading | `max-w-xs text-3xl font-semibold ...` |
| `paragraph` | Description paragraph | `max-w-md text-lg leading-8 ...` |
| `contentSection` | Content wrapper div | `flex flex-col items-center gap-{size} ...` |
| `buttonGroup` | Button container | `flex flex-col gap-{size} ...` |
| `primaryButton` | Primary CTA button | `flex h-{size} w-full ... bg-foreground ...` |
| `secondaryButton` | Secondary CTA button | `flex h-{size} w-full ... border ...` |
| `inlineLink` | Inline paragraph link | `font-medium text-zinc-950 ...` |

### Usage Pattern

```tsx
const mainClass = twMerge(
  `flex min-h-screen w-full max-w-${theme.sizing.maxContentWidth} ...`,
  getOverride(overrides, "main"),
);
```

### Example Override

```yaml
# config/theme.yaml
overrides:
  heading: "text-4xl text-blue-600"     # Override font size and color
  primaryButton: "bg-blue-600 hover:bg-blue-700"  # Brand color buttons
```

## Code Markers

- `src/lib/config.ts`: `getOverride()` function
- `src/lib/config.types.ts`: `ClassOverrides` interface
- `src/app/page.tsx`: All `twMerge()` calls

## Token Coverage `[PROC-TOKEN_AUDIT]`

- [x] `src/lib/config.ts` - `[IMPL-CLASS_OVERRIDES] [ARCH-CLASS_OVERRIDES] [REQ-CONFIG_DRIVEN_UI]`
- [x] `src/app/page.tsx` - `[IMPL-CLASS_OVERRIDES] [ARCH-CLASS_OVERRIDES] [REQ-CONFIG_DRIVEN_UI]`
- [x] `src/lib/config.test.ts` - `getOverride` test suite

## Related Decisions

- Depends on: [ARCH-CLASS_OVERRIDES], [IMPL-CONFIG_LOADER]
- See also: [ARCH-TAILWIND_V4], [IMPL-FLEX_LAYOUT]

---

*Last validated: 2026-02-06 by AI agent*
