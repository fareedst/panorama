# [IMPL-YAML_CONFIG] YAML Configuration File Structure

**Cross-References**: [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_UI]  
**Status**: Active  
**Created**: 2026-02-06  
**Last Updated**: 2026-02-06

---

## Decision

Two YAML configuration files define all customizable aspects of the template UI.

## Rationale

- YAML is human-readable with comment support, ideal for template configuration
- Separating site content from visual theme follows separation of concerns
- Deep-merge with defaults means users only need to specify values they want to change
- TypeScript interfaces (`SiteConfig`, `ThemeConfig`) provide type safety for consumers

## Implementation Approach

### `config/site.yaml` – Site Content Configuration

```yaml
metadata:         # MetadataConfig – title, description for SEO
locale:           # string – HTML lang attribute (BCP 47 tag)
branding:         # BrandingConfig – logo image config
content:          # ContentConfig – heading + description with {placeholder} syntax
navigation:       # NavigationConfig
  inlineLinks:    # Record<string, InlineLinkConfig> – links embedded in description
  buttons:        # ButtonConfig[] – CTA buttons with variant + optional icon
  security:       # LinkSecurityConfig – target, rel for all external links
```

### `config/theme.yaml` – Visual Theme Configuration

```yaml
colors:           # ColorsConfig
  light:          # ColorMode – background, foreground, + custom vars
  dark:           # ColorMode – dark mode equivalents
fonts:            # FontsConfig – CSS variable names + fallback stacks
spacing:          # SpacingConfig – page padding, gaps (Tailwind tokens)
sizing:           # SizingConfig – max-width, button height/width
overrides:        # ClassOverrides – per-element Tailwind class strings
```

### Placeholder Syntax

The `content.description` field supports `{key}` placeholders that map to `navigation.inlineLinks` keys. At render time, `renderDescription()` in `page.tsx` replaces them with anchor elements.

## Code Markers

- `config/site.yaml`: Site content and metadata
- `config/theme.yaml`: Visual design tokens and class overrides
- `src/lib/config.types.ts`: TypeScript interfaces for all config shapes

## Token Coverage `[PROC-TOKEN_AUDIT]`

- [x] `config/site.yaml` - `[REQ-CONFIG_DRIVEN_UI]` comment header
- [x] `config/theme.yaml` - `[REQ-CONFIG_DRIVEN_UI]` comment header
- [x] `src/lib/config.types.ts` - `[IMPL-YAML_CONFIG] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_UI]`

## Related Decisions

- Depends on: [ARCH-CONFIG_DRIVEN_UI]
- Informs: [IMPL-CONFIG_LOADER]
- See also: [IMPL-THEME_INJECTION], [IMPL-CLASS_OVERRIDES]

---

*Last validated: 2026-02-06 by AI agent*
