# Requirements Directory

**STDD Methodology Version**: 1.3.0

## Overview
This document serves as the **central listing/registry** for all requirements in this project. Each requirement has a unique semantic token `[REQ-IDENTIFIER]` for traceability.

**For detailed information about how requirements are fulfilled, see:**
- **Architecture decisions**: See `architecture-decisions.md` for high-level design choices that fulfill requirements
- **Implementation decisions**: See `implementation-decisions.md` for detailed implementation approaches, APIs, and algorithms
- **Semantic tokens**: See `semantic-tokens.md` for the complete token registry

### Requirement Structure

Each requirement includes:
- **Description**: What the requirement specifies (WHAT)
- **Rationale**: Why the requirement exists (WHY)
- **Satisfaction Criteria**: How we know the requirement is satisfied (acceptance criteria, success conditions)
- **Validation Criteria**: How we verify/validate the requirement is met (testing approach, verification methods, success metrics)

**Note**: 
- Satisfaction and validation criteria that involve architectural or implementation details reference the appropriate layers
- Architecture decisions in `architecture-decisions.md` explain HOW requirements are fulfilled at a high level
- Implementation decisions in `implementation-decisions.md` explain HOW requirements are fulfilled at a detailed level

## Requirements Registry

### Functional Requirements

| Token | Requirement | Priority | Status | Architecture | Implementation |
|-------|------------|----------|--------|--------------|----------------|
| [REQ-APP_STRUCTURE] | Next.js App Router application structure | P0 | ✅ | [ARCH-NEXTJS_FRAMEWORK], [ARCH-APP_ROUTER] | [IMPL-ROOT_LAYOUT], [IMPL-HOME_PAGE] |
| [REQ-ROOT_LAYOUT] | Root layout with HTML structure and body | P0 | ✅ | [ARCH-LAYOUT_PATTERN] | [IMPL-ROOT_LAYOUT] |
| [REQ-HOME_PAGE] | Home page with welcome content and links | P0 | ✅ | [ARCH-SERVER_COMPONENTS] | [IMPL-HOME_PAGE] |
| [REQ-NAVIGATION_LINKS] | External navigation links | P1 | ✅ | [ARCH-APP_ROUTER] | [IMPL-EXTERNAL_LINKS] |
| [REQ-BRANDING] | Next.js branding (logo, title) | P1 | ✅ | [ARCH-NEXTJS_FRAMEWORK] | [IMPL-IMAGE_OPTIMIZATION] |

### Non-Functional Requirements

| Token | Requirement | Priority | Status | Architecture | Implementation |
|-------|------------|----------|--------|--------------|----------------|
| [REQ-RESPONSIVE_DESIGN] | Responsive layout that adapts to mobile/desktop | P0 | ✅ | [ARCH-RESPONSIVE_FIRST] | [IMPL-RESPONSIVE_CLASSES] |
| [REQ-DARK_MODE] | Dark mode support with automatic theme detection | P0 | ✅ | [ARCH-CSS_VARIABLES] | [IMPL-DARK_MODE] |
| [REQ-FONT_SYSTEM] | Custom font loading (Geist Sans & Geist Mono) | P1 | ✅ | [ARCH-GOOGLE_FONTS], [ARCH-CSS_VARIABLES_FONTS] | [IMPL-FONT_LOADING] |
| [REQ-TAILWIND_STYLING] | Tailwind CSS v4 for styling system | P0 | ✅ | [ARCH-TAILWIND_V4] | [IMPL-FLEX_LAYOUT] |
| [REQ-GLOBAL_STYLES] | Global CSS with CSS variables for theming | P1 | ✅ | [ARCH-CSS_VARIABLES] | [IMPL-DARK_MODE] |
| [REQ-ACCESSIBILITY] | Semantic HTML and accessible image alt text | P1 | ✅ | [ARCH-SERVER_COMPONENTS] | [IMPL-IMAGE_OPTIMIZATION] |
| [REQ-METADATA] | Page metadata (title, description) | P1 | ✅ | [ARCH-NEXTJS_FRAMEWORK] | [IMPL-METADATA] |
| [REQ-TYPESCRIPT] | TypeScript type safety throughout | P0 | ✅ | [ARCH-TYPESCRIPT_LANG] | Multiple implementations |
| [REQ-BUILD_SYSTEM] | Next.js build, development, and testing scripts | P0 | ✅ | [ARCH-NEXTJS_FRAMEWORK], [ARCH-TEST_FRAMEWORK] | [IMPL-BUILD_SCRIPTS], [IMPL-TEST_CONFIG] |

### Configurability Requirements

| Token | Requirement | Priority | Status | Architecture | Implementation |
|-------|------------|----------|--------|--------------|----------------|
| [REQ-CONFIG_DRIVEN_UI] | Configuration-driven UI via YAML files | P0 | ✅ | [ARCH-CONFIG_DRIVEN_UI], [ARCH-THEME_INJECTION], [ARCH-CLASS_OVERRIDES] | [IMPL-YAML_CONFIG], [IMPL-CONFIG_LOADER], [IMPL-THEME_INJECTION], [IMPL-CLASS_OVERRIDES] |
| [REQ-CONFIG_DRIVEN_APPEARANCE] | All page elements appearance and layout from config (template scope) | P0 | ✅ | [ARCH-CONFIG_DRIVEN_UI], [ARCH-CONFIG_DRIVEN_APPEARANCE] | [IMPL-CONFIG_LOADER], [IMPL-CONFIG_DRIVEN_APPEARANCE] |

### Job Search Tracking Requirements

| Token | Requirement | Priority | Status | Architecture | Implementation |
|-------|------------|----------|--------|--------------|----------------|
| [REQ-JOB_TRACKER_DATA] | Job position data storage and retrieval | P0 | ⏳ | [ARCH-JOB_TRACKER_STORAGE] | [IMPL-JOBS_CONFIG] |
| [REQ-JOB_TRACKER_LIST] | View all job positions in a table | P0 | ⏳ | [ARCH-JOB_TRACKER_UI] | [IMPL-JOBS_LIST_PAGE] |
| [REQ-JOB_TRACKER_EDIT] | Edit job position records | P0 | ⏳ | [ARCH-JOB_TRACKER_UI] | [IMPL-JOBS_EDIT_PAGE] |
| [REQ-JOB_TRACKER_STATUS] | Track application status with dates and notes | P1 | ⏳ | [ARCH-JOB_TRACKER_STORAGE] | [IMPL-JOBS_CONFIG] |
| [REQ-JOB_TRACKER_CRUD] | Create, update, and delete job positions | P0 | ⏳ | [ARCH-JOB_TRACKER_API] | [IMPL-JOBS_API] |

### Immutable Requirements (Major Version Change Required)

| Token | Requirement | Priority | Status | Architecture | Implementation |
|-------|------------|----------|--------|--------------|----------------|

### Incomplete Requirements

| Token | Requirement | Priority | Status | Architecture | Implementation |
|-------|------------|----------|--------|--------------|----------------|
---

## Detailed Requirements

### Application Structure

### [REQ-APP_STRUCTURE] Next.js App Router Application Structure

**Priority: P0 (Critical)**

- **Description**: The application must use Next.js 16+ with the App Router pattern for file-based routing, server components by default, and modern React features. The structure follows Next.js conventions with `src/app/` directory for routes and components.
- **Rationale**: App Router provides better performance through server components, improved data fetching patterns, and simplified routing. It represents the current best practice for Next.js applications and enables future scalability.
- **Satisfaction Criteria**:
  - Next.js 16.1+ is installed and configured
  - App Router directory structure (`src/app/`) exists
  - File-based routing works correctly
  - Server components render by default
  - Build and development scripts execute successfully
- **Validation Criteria**:
  - Application starts without errors using `npm run dev`
  - Application builds successfully using `npm run build`
  - Routes defined in `src/app/` are accessible
  - Server components render on the server (verified through React DevTools or Network tab)
- **Architecture**: See `architecture-decisions.md` § Next.js Framework Choice [ARCH-NEXTJS_FRAMEWORK], App Router Pattern [ARCH-APP_ROUTER]
- **Implementation**: See `implementation-decisions.md` § Root Layout Implementation [IMPL-ROOT_LAYOUT], Home Page Implementation [IMPL-HOME_PAGE]

**Status**: ✅ Implemented

### [REQ-ROOT_LAYOUT] Root Layout with HTML Structure

**Priority: P0 (Critical)**

- **Description**: The application must provide a root layout component that wraps all pages with consistent HTML structure, including `<html>` and `<body>` tags, font configuration, and shared UI elements. The layout uses TypeScript for type safety.
- **Rationale**: Root layouts in Next.js App Router enable shared UI across all routes, consistent font loading, and metadata management. This pattern reduces code duplication and ensures consistent styling and behavior throughout the application.
- **Satisfaction Criteria**:
  - Root layout exists at `src/app/layout.tsx`
  - Layout exports default function matching Next.js RootLayout type
  - Layout includes `<html>` tag with lang attribute
  - Layout includes `<body>` tag with appropriate styling
  - Layout renders children prop correctly
  - Font variables are applied to body element
- **Validation Criteria**:
  - Layout component renders without errors
  - All pages are wrapped by the layout automatically
  - Font classes are applied to body element (verifiable in DOM inspection)
  - Children content appears within the layout structure
  - TypeScript compilation passes without layout-related errors
- **Architecture**: See `architecture-decisions.md` § Layout Pattern [ARCH-LAYOUT_PATTERN]
- **Implementation**: See `implementation-decisions.md` § Root Layout Implementation [IMPL-ROOT_LAYOUT]

**Status**: ✅ Implemented

### [REQ-HOME_PAGE] Home Page with Welcome Content

**Priority: P0 (Critical)**

- **Description**: The application must display a home page with welcome content, including a Next.js logo, heading text, descriptive paragraph, and call-to-action links. The page serves as the entry point and guides users to learning resources and deployment options.
- **Rationale**: A welcoming home page provides immediate value to users, guides them to next steps, and demonstrates the application's capabilities. It serves as a template for future page development.
- **Satisfaction Criteria**:
  - Home page exists at `src/app/page.tsx`
  - Page displays Next.js logo using Next.js Image component
  - Page includes heading text ("To get started, edit the page.tsx file")
  - Page includes descriptive paragraph with external links
  - Page includes call-to-action buttons (Deploy Now, Documentation)
  - All links open in new tabs with security attributes
- **Validation Criteria**:
  - Home page renders at root URL (/)
  - All text content is visible and readable
  - Logo image loads without errors
  - All links are clickable and navigate to correct URLs
  - Links include `rel="noopener noreferrer"` for security
  - Page is accessible (proper heading hierarchy, alt text)
- **Architecture**: See `architecture-decisions.md` § Server Components [ARCH-SERVER_COMPONENTS]
- **Implementation**: See `implementation-decisions.md` § Home Page Implementation [IMPL-HOME_PAGE]

**Status**: ✅ Implemented

### Styling & Theming

### [REQ-RESPONSIVE_DESIGN] Responsive Layout Design

**Priority: P0 (Critical)**

- **Description**: The application must provide a responsive layout that adapts seamlessly to different screen sizes, from mobile devices to desktop monitors. The design uses mobile-first approach with Tailwind CSS breakpoints (sm, md, lg, xl).
- **Rationale**: Modern web applications must work on all device types. A mobile-first approach ensures good performance on smaller devices while progressively enhancing the experience for larger screens. This approach aligns with web best practices and user expectations.
- **Satisfaction Criteria**:
  - Layout adjusts based on viewport width
  - Mobile-first breakpoints are used (default styles for mobile, then sm:, md:, etc.)
  - Content is readable and accessible on mobile devices (320px+)
  - Layout expands and reorganizes for tablet (768px+) and desktop (1024px+)
  - No horizontal scrolling on any screen size
  - Touch targets are appropriately sized for mobile (44px minimum)
- **Validation Criteria**:
  - Visual inspection at various viewport sizes (320px, 768px, 1024px, 1920px)
  - Content flows properly without overflow
  - Flexbox and grid layouts adapt correctly
  - Text remains readable at all sizes
  - Interactive elements are usable on touch devices
- **Architecture**: See `architecture-decisions.md` § Mobile-First Responsive Design [ARCH-RESPONSIVE_FIRST]
- **Implementation**: See `implementation-decisions.md` § Responsive Classes [IMPL-RESPONSIVE_CLASSES]

**Status**: ✅ Implemented

### [REQ-DARK_MODE] Dark Mode Theme Support

**Priority: P0 (Critical)**

- **Description**: The application must support dark mode that automatically detects and responds to the user's system color scheme preference. Dark mode uses appropriate colors for backgrounds, text, and UI elements to reduce eye strain in low-light environments.
- **Rationale**: Dark mode is a modern UI expectation that improves user experience in low-light conditions, reduces eye strain, and saves battery on OLED displays. System preference detection ensures the app respects user choices without manual configuration.
- **Satisfaction Criteria**:
  - Application detects system dark mode preference automatically
  - Color scheme switches between light and dark modes
  - All UI elements have appropriate dark mode variants
  - Text remains readable in both modes (sufficient contrast)
  - CSS uses `prefers-color-scheme: dark` media query
  - Tailwind classes use `dark:` prefix for dark mode variants
- **Validation Criteria**:
  - Application switches theme when system preference changes
  - All text has sufficient contrast in both modes (WCAG AA minimum)
  - No missing styles in dark mode
  - CSS variables update correctly in dark mode
  - Visual inspection confirms all elements are styled appropriately
- **Architecture**: See `architecture-decisions.md` § CSS Variables for Dark Mode [ARCH-CSS_VARIABLES]
- **Implementation**: See `implementation-decisions.md` § Dark Mode Implementation [IMPL-DARK_MODE]

**Status**: ✅ Implemented

### [REQ-FONT_SYSTEM] Custom Font Loading System

**Priority: P1 (Important)**

- **Description**: The application must load and apply custom fonts (Geist Sans and Geist Mono) using Next.js font optimization. Fonts are loaded from Google Fonts with automatic subsetting, preloading, and CSS variable assignment.
- **Rationale**: Custom fonts improve brand consistency and visual appeal. Next.js font optimization ensures fonts load efficiently without layout shift (CLS), and are automatically subsetted to reduce file size. CSS variables enable flexible font application throughout the application.
- **Satisfaction Criteria**:
  - Geist Sans font loads for body text
  - Geist Mono font loads for monospace text
  - Fonts use `next/font/google` for optimization
  - Font loading doesn't cause layout shift
  - CSS variables are created for font families (--font-geist-sans, --font-geist-mono)
  - Fonts are preloaded for improved performance
- **Validation Criteria**:
  - Fonts are visible and correctly applied in the browser
  - Network tab shows fonts are loaded from optimized Next.js endpoint
  - No Flash of Unstyled Text (FOUT) occurs
  - CSS variables are defined in DOM
  - Lighthouse audit shows no layout shift from fonts
  - Font files are subsetted (only include 'latin' subset)
- **Architecture**: See `architecture-decisions.md` § Google Fonts Optimization [ARCH-GOOGLE_FONTS], CSS Variable Fonts [ARCH-CSS_VARIABLES_FONTS]
- **Implementation**: See `implementation-decisions.md` § Font Loading Implementation [IMPL-FONT_LOADING]

**Status**: ✅ Implemented

### [REQ-TAILWIND_STYLING] Tailwind CSS Styling System

**Priority: P0 (Critical)**

- **Description**: The application must use Tailwind CSS v4 as its primary styling system, providing utility-first CSS classes for rapid UI development. Tailwind is configured with PostCSS and integrates with the Next.js build system.
- **Rationale**: Tailwind CSS enables rapid UI development with utility classes, reduces CSS bundle size through purging unused styles, and provides consistent design tokens. Version 4 offers improved performance and modern features. Utility-first approach reduces naming complexity and ensures consistent spacing/colors.
- **Satisfaction Criteria**:
  - Tailwind CSS v4 is installed and configured
  - PostCSS configuration includes Tailwind plugin
  - Utility classes work in all components
  - Tailwind's design tokens are accessible (colors, spacing, fonts)
  - CSS is optimized/purged in production builds
  - Custom theme configuration is available via @theme directive
- **Validation Criteria**:
  - Tailwind classes apply correctly in browser
  - Production CSS bundle is optimized (unused styles removed)
  - Custom theme tokens work correctly
  - Build process completes without Tailwind errors
  - Tailwind's color, spacing, and other utilities function as expected
- **Architecture**: See `architecture-decisions.md` § Tailwind CSS v4 [ARCH-TAILWIND_V4]
- **Implementation**: See `implementation-decisions.md` § Flexbox Layout [IMPL-FLEX_LAYOUT]

**Status**: ✅ Implemented

### [REQ-GLOBAL_STYLES] Global CSS with Theme Variables

**Priority: P1 (Important)**

- **Description**: The application must define global CSS styles with CSS custom properties (variables) for theming, including background and foreground colors that adapt to dark mode. Global styles are defined in `globals.css` and imported in the root layout.
- **Rationale**: CSS custom properties enable dynamic theming and consistent color usage throughout the application. Global styles reduce duplication and ensure base styling is applied universally. This approach enables runtime theme switching if needed in the future.
- **Satisfaction Criteria**:
  - globals.css file exists and is imported in layout
  - CSS variables defined for --background and --foreground colors
  - Variables have different values for light and dark modes
  - Tailwind can access these variables via theme configuration
  - Base body styles are applied globally
- **Validation Criteria**:
  - CSS variables are defined in :root
  - Variables change when dark mode is active
  - Body element uses these variables
  - No style conflicts or overrides
  - Computed styles in DevTools show correct variable values
- **Architecture**: See `architecture-decisions.md` § CSS Variables for Theming [ARCH-CSS_VARIABLES]
- **Implementation**: See `implementation-decisions.md` § Dark Mode Implementation [IMPL-DARK_MODE]

**Status**: ✅ Implemented

### Content & Navigation

### [REQ-BRANDING] Next.js Branding Elements

**Priority: P1 (Important)**

- **Description**: The application must display Next.js branding elements including the Next.js logo and Vercel logo, properly optimized using Next.js Image component. Logos invert colors in dark mode for proper visibility.
- **Rationale**: Branding elements provide visual identity and attribution. Using Next.js Image component ensures optimal loading performance, automatic responsive sizing, and modern image format support (WebP, AVIF).
- **Satisfaction Criteria**:
  - Next.js logo displays at top of home page
  - Vercel logo displays in deploy button
  - Logos use Next.js Image component
  - Logos have appropriate alt text for accessibility
  - Logos invert in dark mode (dark:invert class)
  - Images are optimized (responsive, modern formats)
- **Validation Criteria**:
  - Logos render without errors
  - Images are optimized (check Network tab for format, size)
  - Alt text is present and descriptive
  - Dark mode inversion works correctly
  - No Cumulative Layout Shift from images
  - Proper width/height attributes prevent layout shift
- **Architecture**: See `architecture-decisions.md` § Next.js Framework [ARCH-NEXTJS_FRAMEWORK]
- **Implementation**: See `implementation-decisions.md` § Image Optimization [IMPL-IMAGE_OPTIMIZATION]

**Status**: ✅ Implemented

### [REQ-NAVIGATION_LINKS] External Navigation Links

**Priority: P1 (Important)**

- **Description**: The application must provide navigation links to external resources including Vercel Templates, Next.js Learning Center, Vercel Deployment, and Next.js Documentation. Links open in new tabs with proper security attributes.
- **Rationale**: External links guide users to additional resources for learning and deployment. Opening in new tabs preserves the application state. Security attributes (rel="noopener noreferrer") prevent security vulnerabilities and maintain referrer privacy.
- **Satisfaction Criteria**:
  - Links to Templates, Learning Center, Deploy, and Documentation are present
  - Links include correct URLs with UTM parameters for tracking
  - Links have `target="_blank"` to open in new tabs
  - Links have `rel="noopener noreferrer"` for security
  - Links are styled consistently
  - Links have appropriate hover states
- **Validation Criteria**:
  - All links are clickable and navigate correctly
  - New tabs open when links are clicked
  - Security attributes are present (verify in DOM)
  - URLs include proper UTM tracking parameters
  - Links are keyboard accessible (tab navigation works)
  - Hover states provide visual feedback
- **Architecture**: See `architecture-decisions.md` § App Router [ARCH-APP_ROUTER]
- **Implementation**: See `implementation-decisions.md` § External Links [IMPL-EXTERNAL_LINKS]

**Status**: ✅ Implemented

### [REQ-ACCESSIBILITY] Semantic HTML and Accessibility

**Priority: P1 (Important)**

- **Description**: The application must use semantic HTML elements and include accessibility features such as descriptive alt text for images, proper heading hierarchy, and ARIA attributes where necessary. The application should be usable with keyboard navigation and screen readers.
- **Rationale**: Accessibility ensures the application is usable by everyone, including people with disabilities. Semantic HTML improves SEO and screen reader compatibility. Accessibility is a legal requirement in many jurisdictions and a best practice for inclusive design.
- **Satisfaction Criteria**:
  - HTML uses semantic elements (main, nav, header, etc.)
  - Images have descriptive alt attributes
  - Heading hierarchy is logical (h1, then h2, etc.)
  - Links are keyboard accessible
  - Color contrast meets WCAG AA standards
  - Interactive elements have focus states
- **Validation Criteria**:
  - Lighthouse accessibility audit passes with 90+ score
  - Screen reader testing shows proper element identification
  - Keyboard navigation works for all interactive elements
  - Color contrast checker confirms WCAG AA compliance
  - No accessibility errors in automated testing tools
  - Tab order is logical and predictable
- **Architecture**: See `architecture-decisions.md` § Server Components [ARCH-SERVER_COMPONENTS]
- **Implementation**: See `implementation-decisions.md` § Image Optimization [IMPL-IMAGE_OPTIMIZATION]

**Status**: ✅ Implemented

### Configurability

### [REQ-CONFIG_DRIVEN_UI] Configuration-Driven UI

**Priority: P0 (Critical)**

- **Description**: All page element appearance, layout, and content must be dictated by YAML configuration files rather than hard-coded values. Two configuration files control the template: `config/site.yaml` (what the site shows: metadata, branding, content, navigation) and `config/theme.yaml` (how it looks: colors, fonts, spacing, sizing, per-element class overrides). A typed config loader module reads these files, merges user values with built-in defaults, and provides typed configuration objects to server components.
- **Rationale**: The project serves as a highly-configurable template. Users must be able to customize appearance and content by editing YAML files without modifying source code. Separating content from visual design follows separation of concerns. Deep-merge with defaults ensures partial configs work – users only override what they need.
- **Satisfaction Criteria**:
  - Two YAML config files exist at `config/site.yaml` and `config/theme.yaml`
  - All page text content (headings, paragraphs, link labels) comes from config
  - All navigation links (URLs, labels, security attributes) come from config
  - All branding assets (logo source, alt text, dimensions) come from config
  - All theme colors (light/dark mode CSS variables) come from config
  - Page metadata (title, description) comes from config
  - HTML locale attribute comes from config
  - Spacing and sizing values (padding, gaps, max-widths, button dimensions) come from config
  - Per-element Tailwind class overrides are supported via config
  - Partial config files work (missing values use built-in defaults)
  - Missing config files gracefully fall back to full defaults
- **Validation Criteria**:
  - Config loader unit tests pass (31 tests for parsing, defaults, merging, caching)
  - Component tests validate content comes from config (not hard-coded assertions)
  - Integration tests verify config changes propagate to rendered output
  - TypeScript compilation passes with config type safety
  - Changing a value in YAML config changes the rendered output
- **Architecture**: See `architecture-decisions.md` § Config-Driven UI [ARCH-CONFIG_DRIVEN_UI], Theme Injection [ARCH-THEME_INJECTION], Class Overrides [ARCH-CLASS_OVERRIDES]
- **Implementation**: See `implementation-decisions.md` § YAML Config [IMPL-YAML_CONFIG], Config Loader [IMPL-CONFIG_LOADER], Theme Injection [IMPL-THEME_INJECTION], Class Overrides [IMPL-CLASS_OVERRIDES]

**Status**: ✅ Implemented

### [REQ-CONFIG_DRIVEN_APPEARANCE] All Page Elements Appearance and Layout from Config

**Priority: P0 (Critical)**

- **Description**: For the project to serve as a highly-configurable template, the appearance and layout of **all** page elements must be dictated by one or more configuration files instead of hard-coded values. This applies to every route (home, jobs list, jobs new, jobs edit) and every shared component (tables, forms, buttons, cards). No layout classes, spacing, colors, copy, or visual tokens may remain hard-coded in TSX or CSS; they must be sourced from `config/site.yaml`, `config/theme.yaml`, `config/jobs.yaml`, or extended config sections.
- **Rationale**: The template is only truly configurable if a user can change look and feel entirely via YAML. Gaps (e.g. jobs app using hard-coded classes and copy) undermine the template promise and force code edits for customization.
- **Satisfaction Criteria**:
  - Home and root layout already use config for all appearance and layout (existing).
  - Jobs list page: container, padding, max-width, page title, subtitle, primary button label and classes come from config.
  - Jobs new/edit pages: same layout and copy from config; section headings and form labels from jobs config (field definitions).
  - Jobs table: column headers, empty-state copy, link labels, status badge colors and classes from config.
  - Jobs forms: labels from field definitions; input/button/card classes from theme or jobs layout config.
  - Status badge colors (e.g. applied, rejected, interested) are defined in config and applied by key, not hard-coded in components.
  - Per-element class overrides extend to jobs UI (e.g. theme overrides for jobs page, table, cards, buttons) where applicable.
  - Single source of truth: `config/jobs.yaml` for jobs copy and schema; `config/theme.yaml` (or extended section) for layout tokens and class overrides used by jobs pages and components.
- **Validation Criteria**:
  - Changing values in the relevant config file(s) changes the rendered appearance/layout/copy without code changes.
  - No grep for layout or copy strings in jobs TSX yields hard-coded user-facing text or layout-only class strings that belong in config.
  - Tests assert config-driven values where appropriate; token audit confirms [REQ-CONFIG_DRIVEN_APPEARANCE] coverage.
- **Architecture**: See `architecture-decisions.md` § Config-Driven UI [ARCH-CONFIG_DRIVEN_UI], Config-Driven Appearance for All Pages [ARCH-CONFIG_DRIVEN_APPEARANCE]
- **Implementation**: See `implementation-decisions.md` § Config Loader [IMPL-CONFIG_LOADER], Config-Driven Appearance [IMPL-CONFIG_DRIVEN_APPEARANCE]

**Status**: ✅ Implemented

### Configuration & Build

### [REQ-METADATA] Page Metadata Configuration

**Priority: P1 (Important)**

- **Description**: The application must define metadata for each page including title and description tags. Metadata is exported from page/layout components using Next.js Metadata API for SEO optimization.
- **Rationale**: Proper metadata improves SEO, enables social media sharing with appropriate previews, and provides context to search engines. Next.js Metadata API ensures type-safe metadata that's automatically applied to the HTML head.
- **Satisfaction Criteria**:
  - Root layout exports metadata object
  - Metadata includes title field
  - Metadata includes description field
  - Metadata follows Next.js Metadata type
  - Metadata appears in HTML <head> when rendered
- **Validation Criteria**:
  - View source shows <title> and <meta description> tags
  - Metadata values match exported metadata object
  - TypeScript compilation validates metadata structure
  - Social media preview tools show correct metadata
  - Search engine crawlers can access metadata
- **Architecture**: See `architecture-decisions.md` § Next.js Framework [ARCH-NEXTJS_FRAMEWORK]
- **Implementation**: See `implementation-decisions.md` § Metadata Implementation [IMPL-METADATA]

**Status**: ✅ Implemented

### [REQ-TYPESCRIPT] TypeScript Type Safety

**Priority: P0 (Critical)**

- **Description**: The application must use TypeScript throughout for type safety, including all components, pages, and configuration files. TypeScript configuration enables strict mode for maximum type checking and catches potential errors at compile time.
- **Rationale**: TypeScript prevents runtime errors through compile-time type checking, improves code maintainability through explicit types, enhances IDE intelligence (autocomplete, refactoring), and serves as living documentation of data structures and APIs.
- **Satisfaction Criteria**:
  - All .tsx and .ts files use TypeScript
  - tsconfig.json exists with strict mode enabled
  - No TypeScript errors in compilation
  - Component props are typed
  - Next.js types are imported and used (Metadata, etc.)
  - Configuration files use TypeScript (.ts extension)
- **Validation Criteria**:
  - `npm run build` completes without TypeScript errors
  - IDE shows proper type hints and autocomplete
  - Invalid types are caught at compile time
  - Type definitions exist for all components
  - No 'any' types used (except where explicitly necessary)
- **Architecture**: See `architecture-decisions.md` § TypeScript Language [ARCH-TYPESCRIPT_LANG]
- **Implementation**: Multiple implementations across all code files

**Status**: ✅ Implemented

### [REQ-BUILD_SYSTEM] Next.js Build, Development, and Testing Scripts

**Priority: P0 (Critical)**

- **Description**: The application must include npm scripts for development, production build, production server, linting, and comprehensive testing. Scripts use Next.js CLI and Vitest commands to enable efficient development, testing, and deployment workflows.
- **Rationale**: Standardized build and test scripts ensure consistent development environments across team members, enable CI/CD integration, provide clear workflows for development and deployment, and maintain code quality through automated testing. Next.js CLI handles complex build optimization automatically, while Vitest provides fast test execution with excellent developer experience.
- **Satisfaction Criteria**:
  - `npm run dev` starts development server with hot reload
  - `npm run build` creates optimized production build
  - `npm run start` runs production server
  - `npm run lint` runs ESLint for code quality
  - `npm test` runs all tests once (CI mode)
  - `npm run test:watch` runs tests in watch mode (development)
  - `npm run test:coverage` generates coverage report with 80%+ coverage
  - Scripts are defined in package.json
  - Next.js CLI is used for all build operations
  - Vitest is used for all test operations
- **Validation Criteria**:
  - Development server starts without errors at http://localhost:3000
  - Production build completes successfully with optimized output
  - Production server serves optimized application correctly
  - Linting identifies code issues and style violations
  - All tests pass (66/66 tests passing)
  - Test coverage meets or exceeds 80% threshold (currently 100%)
  - Coverage report excludes config files and test utilities
  - Build output is optimized (code splitting, minification, tree shaking)
  - Build process completes in reasonable time (<2 minutes)
  - Test execution completes in reasonable time (<5 seconds)
- **Architecture**: See `architecture-decisions.md` § Next.js Framework [ARCH-NEXTJS_FRAMEWORK], Test Framework [ARCH-TEST_FRAMEWORK]
- **Implementation**: See `implementation-decisions.md` § Build Scripts [IMPL-BUILD_SCRIPTS], Test Configuration [IMPL-TEST_CONFIG]

**Status**: ✅ Implemented

### Application Features

### [REQ-JOB_SEARCH_TRACKER] Job Search Activity Tracker

**Priority: P1 (Important)**

- **Description**: The application must provide a job search activity tracker that allows users to record, view, edit, and delete open positions. Each position record includes posting date, URLs, title, description, application status, status date, and notes. Application status options include none, interested, to apply, applied, and rejected. All field definitions, status options, labels, and table column visibility must be driven by a YAML configuration file so the schema can be customized without code changes. Records are persisted in a YAML data file.
- **Rationale**: Job seekers need a structured way to track positions and application progress. Extending the existing config-driven architecture to data-backed CRUD features demonstrates the template's flexibility and provides real utility. YAML data storage keeps the app self-contained without requiring a database.
- **Satisfaction Criteria**:
  - YAML config file (`config/jobs.yaml`) defines field names, labels, types, required flags, table visibility, and select options
  - YAML data file (`data/jobs.yaml`) persists position records
  - Table page (`/jobs`) displays all records with columns driven by config
  - Edit page (`/jobs/[id]/edit`) loads and saves existing records
  - New page (`/jobs/new`) creates records with config-driven form fields
  - API routes provide GET, POST, PUT, DELETE operations
  - Form dynamically renders text, date, textarea, select, and url-list field types based on config
  - Application status field provides configurable enum options
  - All labels, columns, and options are customizable via YAML without code changes
- **Validation Criteria**:
  - All routes return 200 (table, new, edit pages)
  - Full CRUD cycle works: POST creates (201), GET lists, PUT updates (200), DELETE removes (204)
  - Data persists to `data/jobs.yaml` across requests
  - Changing field definitions in `config/jobs.yaml` changes form and table rendering
  - TypeScript compilation passes without errors
- **Architecture**: See `architecture-decisions.md` § YAML Data Storage [ARCH-YAML_DATA_STORAGE], Config-Driven CRUD [ARCH-CONFIG_DRIVEN_CRUD]
- **Implementation**: See `implementation-decisions.md` § Job Search Tracker [IMPL-JOB_SEARCH_TRACKER], Jobs Data Layer [IMPL-JOBS_DATA_LAYER], Jobs API Routes [IMPL-JOBS_API_ROUTES], Jobs UI Pages [IMPL-JOBS_UI_PAGES]

**Status**: ✅ Implemented

### Core Functionality

### [REQ-STDD_SETUP] STDD Methodology Setup

**Priority: P0 (Critical)**

- **Description**: The project must follow the Semantic Token-Driven Development (STDD) methodology, including a specific directory structure (`stdd/`) and documentation files (`requirements.md`, `architecture-decisions.md`, etc.).
- **Rationale**: To ensure traceability of intent from requirements to code and to maintain a consistent development process.
- **Satisfaction Criteria**:
  - `stdd/` directory exists.
  - All required documentation files exist and are populated from templates.
  - `.cursorrules` contains the STDD rules.
- **Validation Criteria**:
  - Manual verification of file existence.
  - AI agent acknowledgment of principles.
- **Architecture**: See `architecture-decisions.md` § STDD Project Structure [ARCH-STDD_STRUCTURE]
- **Implementation**: See `implementation-decisions.md` § STDD File Creation [IMPL-STDD_FILES]

**Status**: ✅ Implemented

### [REQ-MODULE_VALIDATION] Independent Module Validation Before Integration

**Priority: P0 (Critical)**

- **Description**: Logical modules must be developed and validated independently before integration into code satisfying specific requirements. Each module must have clear boundaries, interfaces, and validation criteria defined before development begins.
- **Rationale**: To eliminate bugs related to code complexity by ensuring each module works correctly in isolation before combining with other modules. Independent validation reduces integration complexity, catches bugs early in the development cycle, and ensures each module meets its defined contract before integration.
- **Satisfaction Criteria**:
  - All logical modules are identified and documented with clear boundaries before development.
  - Module interfaces and contracts are defined and documented.
  - Module validation criteria are specified (what "validated" means for each module).
  - Each module is developed independently.
  - Each module passes independent validation (unit tests with mocks, integration tests with test doubles, contract validation, edge case testing, error handling validation) before integration.
  - Module validation results are documented.
  - Integration tasks are separate from module development and validation tasks.
  - Integration only occurs after module validation passes.
- **Validation Criteria**:
  - Manual verification that modules are identified and documented before development.
  - Automated verification that module validation tests exist and pass before integration.
  - Code review verification that integration code references validated modules.
  - Verification that module validation results are documented.
  - Verification that integration tests validate the combined behavior of validated modules.
- **Architecture**: See `architecture-decisions.md` § Module Validation Strategy [ARCH-MODULE_VALIDATION]
- **Implementation**: See `implementation-decisions.md` § Module Validation Implementation [IMPL-MODULE_VALIDATION]

**Status**: ✅ Implemented

---

## Job Search Tracking

### [REQ-JOB_TRACKER_DATA] Job Position Data Storage and Retrieval

**Priority: P0 (Critical)**

- **Description**: The application must store job position information including title, posting date, URLs, description, application status (with date and notes), and general notes. Data must be persisted in YAML format following the existing configuration-driven architecture pattern. Each position must have a unique identifier.
- **Rationale**: Users need to track job opportunities throughout their job search process. Using YAML storage maintains consistency with the existing configuration system and allows data to be version-controlled, human-readable, and easily editable.
- **Satisfaction Criteria**:
  - Job position data is stored in `config/jobs.yaml`
  - Each position has a unique ID, title, posting date, URLs array, description, application status object, and notes
  - Application status includes: status type (none/interested/to apply/applied/rejected), date, and notes
  - Data persists across application restarts
  - YAML format is valid and parseable
- **Validation Criteria**:
  - Config loader successfully reads and parses `config/jobs.yaml`
  - TypeScript types enforce correct data structure
  - Unit tests verify YAML parsing and data retrieval
  - Manual verification that data persists after server restart
- **Architecture**: See `architecture-decisions.md` § Job Tracker Storage Architecture [ARCH-JOB_TRACKER_STORAGE]
- **Implementation**: See `implementation-decisions.md` § Jobs Configuration Implementation [IMPL-JOBS_CONFIG]

**Status**: ⏳ Planned

### [REQ-JOB_TRACKER_LIST] View All Job Positions in Table

**Priority: P0 (Critical)**

- **Description**: The application must provide a page that displays all job positions in a responsive table format showing key information: title, posting date, application status, and action links. The table must be accessible on both desktop and mobile devices.
- **Rationale**: Users need to see an overview of all job positions at a glance to track their job search progress, identify opportunities, and manage their pipeline effectively.
- **Satisfaction Criteria**:
  - Page accessible at `/jobs` route
  - Table displays: position title, posting date, application status, and actions (edit/view)
  - Application status is color-coded by type
  - Table is responsive (stacks on mobile, horizontal scroll if needed)
  - "New Position" button to create new records
  - Empty state message when no positions exist
- **Validation Criteria**:
  - Page renders without errors
  - All position data displays correctly
  - Status colors match defined palette (gray/blue/yellow/purple/red)
  - Table is usable on mobile viewport (320px+)
  - Links navigate to correct edit pages
  - Tests verify table rendering and data display
- **Architecture**: See `architecture-decisions.md` § Job Tracker UI Architecture [ARCH-JOB_TRACKER_UI]
- **Implementation**: See `implementation-decisions.md` § Jobs List Page Implementation [IMPL-JOBS_LIST_PAGE]

**Status**: ⏳ Planned

### [REQ-JOB_TRACKER_EDIT] Edit Job Position Records

**Priority: P0 (Critical)**

- **Description**: The application must provide a page with a form to create new job positions and edit existing ones. The form must include all position fields: title, posting date, URLs (multiple), description, application status (type, date, notes), and general notes. Form must validate required fields and save data to YAML storage.
- **Rationale**: Users need to capture detailed information about job opportunities as they find them and update records as they progress through the application process.
- **Satisfaction Criteria**:
  - Page accessible at `/jobs/edit/[id]` route
  - Form includes all fields: title, posting date, URLs, description, status dropdown, status date, status notes, general notes
  - Required fields are validated (title, posting date)
  - Form submits data via API route
  - Success redirects to jobs list page
  - Cancel button returns to jobs list
  - Support for creating new positions (id = "new")
  - Support for editing existing positions
- **Validation Criteria**:
  - Form renders with correct fields
  - Validation prevents submission with missing required fields
  - Successful submission saves data to `config/jobs.yaml`
  - Redirect occurs after successful save
  - Cancel button navigates back without saving
  - Tests verify form rendering, validation, and submission
- **Architecture**: See `architecture-decisions.md` § Job Tracker UI Architecture [ARCH-JOB_TRACKER_UI]
- **Implementation**: See `implementation-decisions.md` § Jobs Edit Page Implementation [IMPL-JOBS_EDIT_PAGE]

**Status**: ⏳ Planned

### [REQ-JOB_TRACKER_STATUS] Track Application Status with Dates and Notes

**Priority: P1 (Important)**

- **Description**: Each job position must track its application status with a status type (none, interested, to apply, applied, rejected), an optional date when the status changed, and optional notes about the status. The interface must make it easy to update status as the job search progresses.
- **Rationale**: Tracking application status helps users manage their job search pipeline, follow up on applications at appropriate times, and maintain records of their job search activity for personal tracking and potential follow-up.
- **Satisfaction Criteria**:
  - Five status types available: none, interested, to apply, applied, rejected
  - Status includes optional date field
  - Status includes optional notes field
  - Status type is required, date and notes are optional
  - Status displays with color coding in list view
  - Status can be updated via edit form
- **Validation Criteria**:
  - Status dropdown includes all five status types
  - Status date field accepts valid dates
  - Status notes field accepts multi-line text
  - Status changes persist to YAML storage
  - Status colors display correctly in list view
  - Tests verify status tracking and display
- **Architecture**: See `architecture-decisions.md` § Job Tracker Storage Architecture [ARCH-JOB_TRACKER_STORAGE]
- **Implementation**: See `implementation-decisions.md` § Jobs Configuration Implementation [IMPL-JOBS_CONFIG]

**Status**: ⏳ Planned

### [REQ-JOB_TRACKER_CRUD] Create, Update, and Delete Job Positions

**Priority: P0 (Critical)**

- **Description**: The application must provide API endpoints to create new job positions, update existing positions, and delete positions. All operations must persist changes to the YAML storage file and maintain data integrity.
- **Rationale**: Users need full control over their job position data to manage their job search effectively, including adding new opportunities, updating information as it changes, and removing positions that are no longer relevant.
- **Satisfaction Criteria**:
  - API endpoint accepts POST requests to create/update positions
  - API endpoint accepts DELETE requests to remove positions
  - Create operation generates unique ID for new positions
  - Update operation preserves existing ID
  - Delete operation removes position from storage
  - All operations write to `config/jobs.yaml`
  - Operations maintain YAML file validity
- **Validation Criteria**:
  - POST endpoint successfully creates new positions
  - POST endpoint successfully updates existing positions
  - DELETE endpoint successfully removes positions
  - YAML file remains valid after all operations
  - Concurrent operations don't corrupt data
  - Tests verify all CRUD operations
  - Error handling for invalid requests
- **Architecture**: See `architecture-decisions.md` § Job Tracker API Architecture [ARCH-JOB_TRACKER_API]
- **Implementation**: See `implementation-decisions.md` § Jobs API Implementation [IMPL-JOBS_API]

**Status**: ⏳ Planned

---

## Notes

- All requirements MUST be documented here with `[REQ-*]` tokens
- Requirements describe WHAT the system should do and WHY, not HOW
- Requirements MUST NOT describe bugs or implementation details
- **Language-Agnostic Requirements**: Requirements MUST be language-agnostic. Language selection, runtime choices, and language-specific implementation details belong in architecture decisions (`architecture-decisions.md`) or implementation decisions (`implementation-decisions.md`), NOT in requirements. The ONLY exception is when language selection is itself a specific requirement (e.g., `[REQ-USE_PYTHON]` for a Python-specific project requirement). When documenting requirements, focus on behavior and capabilities, not on how they are implemented in a specific language.

---

## Requirement Template

Use this template when adding new requirements:

```markdown
### [REQ-IDENTIFIER] Requirement Name

**Priority: P0 (Critical) | P1 (Important) | P2 (Nice-to-have) | P3 (Future)**

- **Description**: What the requirement specifies
- **Rationale**: Why the requirement exists
- **Satisfaction Criteria**:
  - How we know the requirement is satisfied
  - Acceptance criteria
  - Success conditions
- **Validation Criteria**: 
  - How we verify/validate the requirement is met
  - Testing approach
  - Verification methods
  - Success metrics
- **Architecture**: See `architecture-decisions.md` § Decision Name [ARCH-IDENTIFIER]
- **Implementation**: See `implementation-decisions.md` § Implementation Name [IMPL-IDENTIFIER]

**Status**: ✅ Implemented | ⏳ Planned
```

