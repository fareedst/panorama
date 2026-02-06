# [IMPL-CONFIG_LOADER] Configuration Loader Module

**Cross-References**: [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_UI]  
**Status**: Active  
**Created**: 2026-02-06  
**Last Updated**: 2026-02-06

---

## Decision

A server-only TypeScript module (`src/lib/config.ts`) reads YAML configuration files, deep-merges them with built-in defaults, caches the result, and exports typed accessor functions.

## Rationale

- Server components in Next.js can use Node.js `fs` API directly
- Module-level caching avoids re-reading/re-parsing YAML on every render
- Deep merge with defaults ensures partial configs work (users override only what they need)
- Graceful fallback when files are missing (returns full defaults)
- Exported test helpers (`_resetConfigCache`, `_deepMerge`, etc.) enable isolated unit testing

## Implementation Approach

### Public API

| Function | Returns | Description |
|----------|---------|-------------|
| `getSiteConfig()` | `SiteConfig` | Merged site config (cached) |
| `getThemeConfig()` | `ThemeConfig` | Merged theme config (cached) |
| `generateThemeCss(theme)` | `string` | CSS string with `:root` + dark mode variables |
| `getOverride(overrides, key)` | `string` | Trimmed override class string or empty |

### Internal Helpers

| Function | Purpose |
|----------|---------|
| `deepMerge(target, source)` | Recursive merge; arrays replaced, objects deep-merged |
| `readYamlFile(path)` | `fs.readFileSync` + `yaml.load` with graceful error handling |
| `_resetConfigCache()` | Clears module-level cache (test-only) |

### Dependencies

- `js-yaml` – YAML parsing
- `tailwind-merge` – Used by consumers (page.tsx) for class merging

### Data Flow

```
config/site.yaml → readYamlFile() → deepMerge(DEFAULT_SITE_CONFIG, userConfig) → cache → getSiteConfig()
config/theme.yaml → readYamlFile() → deepMerge(DEFAULT_THEME_CONFIG, userConfig) → cache → getThemeConfig()
```

## Code Markers

- `src/lib/config.ts`: Main config loader module
- `src/lib/config.types.ts`: TypeScript interfaces
- `src/lib/config.test.ts`: Unit tests (31 tests)

## Token Coverage `[PROC-TOKEN_AUDIT]`

- [x] `src/lib/config.ts` - `[IMPL-CONFIG_LOADER] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_UI]`
- [x] `src/lib/config.test.ts` - `[REQ-CONFIG_DRIVEN_UI] [IMPL-CONFIG_LOADER]`

## Related Decisions

- Depends on: [ARCH-CONFIG_DRIVEN_UI], [IMPL-YAML_CONFIG]
- Informs: [IMPL-THEME_INJECTION], [IMPL-CLASS_OVERRIDES]

---

*Last validated: 2026-02-06 by AI agent*
