# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-02-06

### Added

#### Configuration-Driven UI [REQ-CONFIG_DRIVEN_UI]
- **YAML configuration system** with two config files that control all page elements:
  - `config/site.yaml` -- site metadata, locale, branding, page content, navigation links, link security
  - `config/theme.yaml` -- color palette (light/dark), font variables, spacing, sizing, per-element class overrides
- **Typed config loader module** (`src/lib/config.ts`) that reads YAML files, deep-merges with built-in defaults, and caches results at module level
- **TypeScript config interfaces** (`src/lib/config.types.ts`) providing full type safety for `SiteConfig` and `ThemeConfig`
- **Theme CSS variable injection** -- layout.tsx renders a `<style>` tag with CSS custom properties from theme config, replacing hard-coded values in globals.css
- **Tailwind class override system** -- `config/theme.yaml` `overrides` section allows per-element Tailwind class customization via `tailwind-merge`
- **Placeholder syntax** in content description -- `{key}` tokens are replaced with inline link components from `navigation.inlineLinks`
- **Partial config support** -- missing fields gracefully fall back to built-in defaults; missing config files use full defaults
- **Helper components** in page.tsx: `ConfigImage` for config-driven images, `CtaButton` for config-driven buttons, `renderDescription` for placeholder-based inline links

#### New Dependencies
- `js-yaml` -- YAML parser for reading configuration files
- `@types/js-yaml` -- TypeScript type definitions for js-yaml
- `tailwind-merge` -- intelligent Tailwind CSS class merging for the override system

#### Testing [REQ-CONFIG_DRIVEN_UI]
- **31 new config loader tests** (`src/lib/config.test.ts`):
  - Site config loading and field validation
  - Theme config loading and field validation
  - Deep merge behavior (nested objects, arrays, immutability, edge cases)
  - `generateThemeCss()` output validation
  - `getOverride()` for all override keys
  - Cache behavior and reset
  - Default config structure validation
- **Updated all existing tests** to use config-driven assertions instead of hard-coded expected values
- Test count increased from 66 to **102 tests** across 6 test files
- Coverage includes `src/lib/` in addition to `src/app/`

#### STDD Documentation [REQ-CONFIG_DRIVEN_UI]
- New requirement: `[REQ-CONFIG_DRIVEN_UI]` in `stdd/requirements.md`
- New architecture decisions:
  - `[ARCH-CONFIG_DRIVEN_UI]` -- YAML config architecture with deep-merge and caching
  - `[ARCH-THEME_INJECTION]` -- CSS variable injection from config via `<style>` tag
  - `[ARCH-CLASS_OVERRIDES]` -- Tailwind class override system with `tailwind-merge`
- New implementation decisions:
  - `[IMPL-YAML_CONFIG]` -- YAML file structure and placeholder syntax
  - `[IMPL-CONFIG_LOADER]` -- Config loader module with public/internal API
  - `[IMPL-THEME_INJECTION]` -- `generateThemeCss()` and layout integration
  - `[IMPL-CLASS_OVERRIDES]` -- `getOverride()` and `twMerge` usage patterns
- Updated semantic tokens registry with 8 new tokens
- Updated tasks.md with completed configuration task

### Changed

#### Component Updates
- **`src/app/layout.tsx`**: Reads metadata and locale from `config/site.yaml`; injects theme CSS variables from `config/theme.yaml` via `<style>` tag in `<head>`
- **`src/app/page.tsx`**: All content (text, links, images, buttons) driven by `config/site.yaml`; all styling tokens (spacing, sizing, colors) driven by `config/theme.yaml`; class overrides applied via `tailwind-merge`
- **`src/app/globals.css`**: Removed hard-coded `:root` and dark mode color values; now references CSS variables injected by layout; body font-family uses CSS variable with fallback

#### Test Updates
- All component tests import config values for assertions instead of hard-coding expected strings
- Tests validate that rendered content matches config, ensuring config changes propagate correctly
- Integration tests verify end-to-end config-to-rendered-content pipeline

### Technical Details

#### Configuration Data Flow
```
config/site.yaml  --> readYamlFile() --> deepMerge(defaults) --> cache --> getSiteConfig()
config/theme.yaml --> readYamlFile() --> deepMerge(defaults) --> cache --> getThemeConfig()
                                                                    \
getSiteConfig() --> layout.tsx (metadata, locale)                    |
                --> page.tsx (content, navigation, branding)         |
getThemeConfig() --> layout.tsx (CSS variable injection)             |
                 --> page.tsx (spacing, sizing, class overrides) <--/
```

#### New Files
- `config/site.yaml` -- site content configuration
- `config/theme.yaml` -- visual design configuration
- `src/lib/config.ts` -- config loader module
- `src/lib/config.types.ts` -- TypeScript config interfaces
- `src/lib/config.test.ts` -- config loader unit tests
- `stdd/architecture-decisions/ARCH-CONFIG_DRIVEN_UI.md`
- `stdd/architecture-decisions/ARCH-THEME_INJECTION.md`
- `stdd/architecture-decisions/ARCH-CLASS_OVERRIDES.md`
- `stdd/implementation-decisions/IMPL-YAML_CONFIG.md`
- `stdd/implementation-decisions/IMPL-CONFIG_LOADER.md`
- `stdd/implementation-decisions/IMPL-THEME_INJECTION.md`
- `stdd/implementation-decisions/IMPL-CLASS_OVERRIDES.md`

#### New Semantic Tokens
- `[REQ-CONFIG_DRIVEN_UI]` -- Configuration-driven UI requirement
- `[ARCH-CONFIG_DRIVEN_UI]` -- YAML config architecture
- `[ARCH-THEME_INJECTION]` -- CSS variable injection architecture
- `[ARCH-CLASS_OVERRIDES]` -- Class override architecture
- `[IMPL-YAML_CONFIG]` -- YAML file structure implementation
- `[IMPL-CONFIG_LOADER]` -- Config loader implementation
- `[IMPL-THEME_INJECTION]` -- Theme injection implementation
- `[IMPL-CLASS_OVERRIDES]` -- Class override implementation

---

## [0.1.0] - 2026-02-06

### Added

#### Application Structure [REQ-APP_STRUCTURE]
- Next.js 16.1.6 with App Router for modern React application structure
- React 19.2.3 with Server Components enabled by default
- TypeScript 5.x for type safety throughout the application
- Root layout component (`src/app/layout.tsx`) with HTML structure and font configuration
- Home page component (`src/app/page.tsx`) with welcome content and navigation

#### Styling System [REQ-TAILWIND_STYLING] [REQ-DARK_MODE]
- Tailwind CSS v4 with PostCSS integration
- Dark mode support with automatic system preference detection
- CSS custom properties for theming (light and dark color schemes)
- Mobile-first responsive design with Tailwind breakpoints
- Global stylesheet (`src/app/globals.css`) with theme variables

#### Typography [REQ-FONT_SYSTEM]
- Geist Sans and Geist Mono fonts with next/font optimization
- Zero layout shift font loading
- CSS variables for flexible font application
- Automatic font subsetting (Latin characters only)

#### Content & Navigation [REQ-BRANDING] [REQ-NAVIGATION_LINKS]
- Next.js and Vercel logo branding with dark mode inversion
- External navigation links with security attributes (rel="noopener noreferrer")
- Call-to-action buttons (Deploy Now, Documentation)
- Inline links to Templates and Learning resources

#### Accessibility [REQ-ACCESSIBILITY]
- Semantic HTML with proper heading hierarchy
- Descriptive alt text for all images
- WCAG AAA contrast ratios in both light and dark modes
- Keyboard accessible navigation
- Screen reader friendly structure

#### Metadata & SEO [REQ-METADATA]
- Type-safe metadata configuration with Next.js Metadata API
- Default page title and description
- Proper HTML lang attribute

#### STDD Documentation [REQ-STDD_SETUP]
- Complete requirements documentation with 14 requirements
- Architecture decisions with 11 detailed decision files
- Implementation decisions with 9 detailed decision files
- Semantic token registry with 34 tokens (REQ, ARCH, IMPL)
- Full traceability from requirements through implementation
- Cross-referenced documentation across all layers

#### Testing Infrastructure [REQ-BUILD_SYSTEM] [ARCH-TEST_FRAMEWORK]
- Vitest 2.1.8 test framework with jsdom environment
- React Testing Library 16.1.0 for component testing
- Testing utilities and setup configuration with next/font mocking
- v8 coverage provider with 80% minimum thresholds
- Multiple coverage reporters (text, HTML, JSON, LCOV)
- 66 comprehensive tests across 5 test files:
  - Layout component tests (metadata, fonts, structure)
  - Home page tests (content, branding, navigation, accessibility)
  - Dark mode functionality tests (CSS variables, contrast ratios)
  - Responsive design tests (mobile-first, breakpoints)
  - Integration tests (full app rendering, feature integration)
- All tests reference semantic tokens for traceability
- **100% test coverage** for application code (statements, branches, functions, lines)
- **100% test success rate** (66/66 passing)
- Test documentation in TESTING.md with coverage explanation

#### Build System [REQ-BUILD_SYSTEM]
- Development server (`npm run dev`)
- Production build (`npm run build`)
- Production server (`npm run start`)
- Linting with ESLint (`npm run lint`)
- Testing scripts (`npm test`, `npm run test:watch`, `npm run test:coverage`)

#### Code Documentation
- Semantic token annotations in all source files:
  - `src/app/layout.tsx` - [IMPL-ROOT_LAYOUT] [IMPL-FONT_LOADING] [IMPL-METADATA]
  - `src/app/page.tsx` - [IMPL-HOME_PAGE] [IMPL-IMAGE_OPTIMIZATION] [IMPL-EXTERNAL_LINKS]
  - `src/app/globals.css` - [IMPL-DARK_MODE] [IMPL-FLEX_LAYOUT]
- Inline comments explaining implementation decisions
- Full cross-reference to requirements and architecture

### Technical Details

#### Framework & Runtime
- **Next.js**: 16.1.6 with App Router [ARCH-NEXTJS_FRAMEWORK]
- **React**: 19.2.3 with Server Components [ARCH-REACT_VERSION]
- **TypeScript**: 5.x with strict mode [ARCH-TYPESCRIPT_LANG]
- **Node.js**: Compatible with current LTS versions

#### Styling & Theming
- **Tailwind CSS**: v4 with PostCSS plugin [ARCH-TAILWIND_V4]
- **Dark Mode**: CSS variables with prefers-color-scheme [ARCH-CSS_VARIABLES]
- **Responsive**: Mobile-first breakpoints (sm: 640px, md: 768px, lg: 1024px) [ARCH-RESPONSIVE_FIRST]
- **Fonts**: next/font/google with Geist Sans & Geist Mono [ARCH-GOOGLE_FONTS]

#### Architecture Patterns
- **Server Components**: Default rendering mode for performance [ARCH-SERVER_COMPONENTS]
- **Layout Pattern**: Root layout with persistent structure [ARCH-LAYOUT_PATTERN]
- **File-Based Routing**: Next.js App Router conventions [ARCH-APP_ROUTER]
- **CSS Variables**: For theming and font assignment [ARCH-CSS_VARIABLES_FONTS]

#### Implementation Highlights
- Zero JavaScript for dark mode switching (pure CSS)
- Zero layout shift from font loading
- Automatic image optimization with next/image
- Security-first external links (noopener noreferrer)
- WCAG AAA contrast ratios (13.5:1 light, 14.7:1 dark)
- Flexbox layouts with Tailwind utilities

### Documentation Structure

```
stdd/
├── requirements.md                     # 14 requirements documented
├── architecture-decisions.md           # Architecture index
├── architecture-decisions/             # 11 detail files
│   ├── ARCH-NEXTJS_FRAMEWORK.md
│   ├── ARCH-TAILWIND_V4.md
│   ├── ARCH-APP_ROUTER.md
│   └── ... (8 more)
├── implementation-decisions.md         # Implementation index
├── implementation-decisions/           # 9 detail files
│   ├── IMPL-ROOT_LAYOUT.md
│   ├── IMPL-HOME_PAGE.md
│   ├── IMPL-DARK_MODE.md
│   └── ... (6 more)
├── semantic-tokens.md                  # 34 token registry
└── tasks.md                           # Task tracking

src/
├── app/
│   ├── layout.tsx                     # [IMPL-ROOT_LAYOUT]
│   ├── layout.test.tsx                # Layout tests
│   ├── page.tsx                       # [IMPL-HOME_PAGE]
│   ├── page.test.tsx                  # Home page tests
│   └── globals.css                    # [IMPL-DARK_MODE]
└── test/
    ├── setup.ts                       # Test configuration
    ├── utils.tsx                      # Test utilities
    ├── dark-mode.test.tsx             # Dark mode tests
    ├── responsive.test.tsx            # Responsive tests
    └── integration/
        └── app.test.tsx               # Integration tests
```

### Testing Coverage

- **Layout Tests**: 6 tests validating structure, fonts, and metadata
- **Page Tests**: 20 tests covering content, branding, navigation, and accessibility
- **Dark Mode Tests**: 10 tests for theming, contrast, and CSS variables
- **Responsive Tests**: 16 tests for mobile-first design and breakpoints
- **Integration Tests**: 14 tests for full application rendering
- **Total**: 66 tests, all passing

### STDD Methodology

This application follows Semantic Token-Driven Development (STDD) v1.3.0:

- **Requirements** define WHAT and WHY with [REQ-*] tokens
- **Architecture** decisions explain HOW (high-level) with [ARCH-*] tokens
- **Implementation** decisions explain HOW (low-level) with [IMPL-*] tokens
- **Tests** validate requirements with semantic token references
- **Code** maintains traceability with inline token comments

Every feature has complete traceability:
```
[REQ-*] → [ARCH-*] → [IMPL-*] → Code → Tests
```

### Performance Characteristics

- Server-side rendering by default (zero client JS for static content)
- Automatic code splitting per route
- Optimized font loading (WOFF2, preloaded, zero CLS)
- Optimized images (WebP/AVIF, responsive, lazy loading)
- Zero runtime cost for dark mode (pure CSS)
- Minimal JavaScript bundle (React Server Components)

### Browser Support

- Modern browsers with ES2017 support
- Automatic vendor prefixing via PostCSS
- Progressive enhancement approach
- Fallback fonts for loading states

### Known Limitations

- Template/starter content (placeholders for actual application content)
- Generic metadata (needs customization for production)
- No custom favicon beyond Next.js default
- No analytics or monitoring configured
- No error boundaries implemented
- No loading states for navigation

### Next Steps

This baseline establishes a solid foundation for feature development:

1. **Content**: Replace template content with actual application content
2. **Metadata**: Update title, description, and add Open Graph tags
3. **Branding**: Add custom favicon and brand-specific styling
4. **Features**: Add new features following STDD methodology
5. **Analytics**: Integrate analytics and monitoring
6. **Error Handling**: Add error boundaries and error pages
7. **Loading States**: Add loading UI for navigation and data fetching

---

**Note**: This version represents the initial STDD documentation baseline. All existing functionality has been documented with requirements, architecture decisions, implementation decisions, and comprehensive tests. The application is ready for feature development with full traceability.

[0.2.0]: https://github.com/yourusername/nx1/releases/tag/v0.2.0
[0.1.0]: https://github.com/yourusername/nx1/releases/tag/v0.1.0
