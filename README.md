# Next.js Application with STDD Methodology

**Version**: 0.4.7  
**Last Updated**: 2026-02-09

A modern, **highly configurable** Next.js template built with React 19, TypeScript, and Tailwind CSS v4, following **Semantic Token-Driven Development (STDD)** methodology for complete traceability from requirements through implementation.

All page content, appearance, and layout are driven by YAML configuration files -- customize everything without touching source code. Includes a **Job Search Tracker** app demonstrating config-driven CRUD with YAML data storage.

## Features

- **Configuration-Driven UI** -- all content, colors, fonts, spacing, and layout controlled via YAML files
- **Job Search Tracker** -- config-driven CRUD app to track positions and applications, with table view, calendar month view, edit/new forms, and RESTful API (field definitions, status options, and table columns all customizable via `config/jobs.yaml`)
- **Calendar Month View** -- visual timeline of positions and applications on a single-month grid with interactive detail panel (at `/jobs/calendar`). From the calendar, "Edit Position" opens the edit page and the Return button goes back to the calendar with label "Return to Calendar"; from the list view, Return goes to the list with "Back to List".
- **YAML Data Storage** -- position records persisted in `data/jobs.yaml` with no external database required
- **Next.js 16.1** with App Router and React Server Components
- **React 19.2** with modern concurrent features
- **TypeScript 5.x** with strict mode for type safety
- **Tailwind CSS v4** with mobile-first responsive design and per-element class overrides
- **Dark Mode** with automatic system preference detection (colors configurable)
- **Optimized Fonts** using next/font with Geist Sans and Geist Mono
- **STDD Documentation** with full requirements traceability
- **Comprehensive Testing** with Vitest and React Testing Library (120 tests)
- **Multi-Pane File Manager** with keyboard-driven navigation, file operations, comparison, search, manual refresh (Ctrl+R), and **visual toolbar system** with 36+ discoverable operations:
  - **Three Toolbar Types**: Workspace (global actions), Pane (file operations), System (help/search)
  - **Compact Icon Design**: Icon + keystroke badges for maximum density (no overflow with 12+ buttons)
  - **Context Awareness**: Active/disabled states reflect workspace context
  - **Configuration-Driven**: Complete customization via `config/files.yaml` and `config/theme.yaml`
  - **Keyboard Consistency**: Toolbar actions dispatch to same handlers as keyboard shortcuts
  - **Parent Navigation Button**: Mouse-accessible `..` button in each pane header for navigating to parent directory (visible when not at root)
  - **Linked Navigation** [REQ-LINKED_PANES]: Toggleable mode (L key) synchronizes directory changes, cursor position, and sort settings across all panes; Parent button respects linked mode automatically
- **Multi-Destination Sync** [REQ-NSYNC_MULTI_TARGET]: Copy or move files to **all other visible panes** in one action (Copy to All Panes / Move to All Panes), inspired by Goful's nsync usage. Parallel sync to multiple destinations, optional hash verification [REQ-HASH_COMPUTATION] [REQ-VERIFY_DEST], configurable comparison methods to skip unchanged files [REQ-COMPARE_METHODS], safe move semantics (source deleted only after all destinations succeed) [REQ-MOVE_SEMANTICS], and store failure detection to abort when a destination becomes unavailable [REQ-STORE_FAILURE_DETECT]

## Quick Start: Customizing the Template

Edit the two YAML files in the `config/` directory to customize the template:

### `config/site.yaml` -- What the site shows

```yaml
metadata:
  title: "My App"                    # Browser tab title
  description: "My app description"  # SEO meta description

locale: "en"                          # HTML lang attribute

branding:
  logo:
    src: "/my-logo.svg"              # Logo image path (in public/)
    alt: "My App logo"
    width: 120
    height: 30
    darkInvert: true                 # Invert logo in dark mode

content:
  heading: "Welcome to My App"       # Main heading text
  description: "Get started by visiting {docs} or browsing {examples}."

navigation:
  inlineLinks:                       # Links embedded in description text
    docs:
      label: "our docs"
      href: "https://docs.example.com"
    examples:
      label: "examples"
      href: "https://examples.example.com"
  buttons:                           # Call-to-action buttons
    - label: "Get Started"
      href: "https://example.com/start"
      variant: "primary"             # "primary" (filled) or "secondary" (outlined)
    - label: "Learn More"
      href: "https://example.com/docs"
      variant: "secondary"
  security:                          # Applied to all external links
    target: "_blank"
    rel: "noopener noreferrer"
```

### `config/theme.yaml` -- How the site looks

```yaml
colors:
  light:
    background: "#ffffff"
    foreground: "#171717"
  dark:
    background: "#0a0a0a"
    foreground: "#ededed"

spacing:
  page:
    paddingY: "32"                   # Tailwind size tokens
    paddingX: "16"
  contentGap: "6"
  buttonGap: "4"

sizing:
  maxContentWidth: "3xl"             # Tailwind max-width token
  buttonHeight: "12"
  buttonDesktopWidth: "158px"

# Advanced: override Tailwind classes on any element
overrides:
  heading: "text-4xl text-blue-600"
  primaryButton: "bg-blue-600 hover:bg-blue-700"
```

Partial configs work -- omit any field and the built-in default is used.

### `config/jobs.yaml` -- Job Search Tracker schema

```yaml
app:
  title: "Job Search Tracker"
  description: "Track open positions and applications"

fields:
  - name: title
    label: "Position Title"
    type: text                     # text | date | textarea | select | url-list
    required: true
    showInTable: true              # Show as column in table view
  - name: applicationStatus
    label: "Application Status"
    type: select
    showInTable: true
    options:                       # Options for select fields
      - value: none
        label: "None"
      - value: interested
        label: "Interested"
      - value: to_apply
        label: "To Apply"
      - value: applied
        label: "Applied"
      - value: rejected
        label: "Rejected"
  # ... more fields (postingDate, urls, description, statusDate, notes)

table:
  defaultSort: "postingDate"       # Field to sort by
  defaultSortDirection: "desc"     # "asc" or "desc"
```

Add, remove, or reorder fields -- the form and table update automatically. Customize status options, labels, and table columns without touching any code.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18.17 or later (LTS recommended)
- **npm**: v9.x or later (comes with Node.js)
- **Git**: For version control

Check your versions:
```bash
node --version  # Should be v18.17+
npm --version   # Should be v9.x+
```

## Installation

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd nx1
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

   This will install all production and development dependencies including:
   - Next.js, React, and React DOM
   - TypeScript and type definitions
   - Tailwind CSS v4 and PostCSS
   - js-yaml and tailwind-merge (for configuration system)
   - Vitest and React Testing Library
   - ESLint for code quality

3. **Verify installation**:
   ```bash
   npm run lint  # Should complete without errors
   ```

## Development Workflow

### Starting Development Server

Run the development server with hot reload:

```bash
npm run dev
```

The application will be available at:
- **Local**: http://localhost:3000
- **Network**: http://[your-ip]:3000

The page auto-updates as you edit files. Changes to `config/site.yaml` or `config/theme.yaml` are picked up on the next page load (restart the dev server for immediate effect).

### Customizing the Template

1. **Edit `config/site.yaml`** to change content, metadata, branding, and navigation
2. **Edit `config/theme.yaml`** to change colors, fonts, spacing, sizing, and element styles
3. **Place assets** (logos, images) in the `public/` directory
4. **Restart dev server** to see config changes reflected

### Development Best Practices

1. **Follow STDD Methodology**:
   - Document requirements in `stdd/requirements.md` with `[REQ-*]` tokens
   - Record architecture decisions in `stdd/architecture-decisions/` with `[ARCH-*]` tokens
   - Document implementations in `stdd/implementation-decisions/` with `[IMPL-*]` tokens
   - Update `stdd/semantic-tokens.md` registry

2. **Write Tests First**:
   - Create tests that reference requirements: `[REQ-*]` in test names
   - Run tests in watch mode: `npm run test:watch`
   - Ensure all tests pass before committing

3. **Code Quality**:
   - Run linter before commits: `npm run lint`
   - Add semantic token comments to code
   - Maintain type safety with TypeScript

## Configuration System

### Architecture

Two YAML configuration files feed a typed config loader module, which Next.js server components consume at render time:

```
config/site.yaml   -->  src/lib/config.ts  -->  layout.tsx (metadata, locale, theme CSS)
config/theme.yaml  -->  (typed loader)     -->  page.tsx   (content, links, styling)
```

### `config/site.yaml` -- Site Content

| Section | Controls |
|---------|----------|
| `metadata` | Page title and description (SEO) |
| `locale` | HTML lang attribute (e.g. "en", "fr") |
| `branding` | Logo image (src, alt, dimensions, dark mode inversion) |
| `content` | Heading text, description with `{placeholder}` syntax for inline links |
| `navigation.inlineLinks` | Links embedded in description text (keyed by placeholder name) |
| `navigation.buttons` | CTA buttons with label, URL, variant (primary/secondary), optional icon |
| `navigation.security` | `target` and `rel` attributes for all external links |

### `config/theme.yaml` -- Visual Design

| Section | Controls |
|---------|----------|
| `colors.light` | Light mode CSS custom properties (background, foreground, + custom) |
| `colors.dark` | Dark mode CSS custom properties |
| `fonts` | Font CSS variable names and fallback stacks |
| `spacing` | Page padding and gap values (Tailwind size tokens) |
| `sizing` | Max content width, button height, button desktop width |
| `overrides` | Per-element Tailwind class strings merged onto defaults |

### Class Overrides (Advanced)

The `overrides` section in `config/theme.yaml` lets you add or replace Tailwind classes on specific elements. Override strings are merged intelligently with `tailwind-merge` so conflicting utilities resolve correctly (e.g. `bg-red-500` properly overrides `bg-white`).

Available override keys: `outerContainer`, `main`, `heading`, `paragraph`, `contentSection`, `buttonGroup`, `primaryButton`, `secondaryButton`, `inlineLink`.

### Fonts

Font CSS variable names and fallback stacks are configurable in `config/theme.yaml`. However, changing the actual Google Font family requires editing `src/app/layout.tsx` because `next/font/google` requires static analysis at build time. This is documented in the font config comments.

### Defaults

Every configuration field has a built-in default. If a YAML file is missing or a field is omitted, the default value is used. This means you can start with an empty config and only override what you need.

## Testing

### Running Tests

The project uses **Vitest** with **React Testing Library** for comprehensive testing.

**Run all tests once**:
```bash
npm test
```

**Run tests in watch mode** (recommended during development):
```bash
npm run test:watch
```

**Generate coverage report**:
```bash
npm run test:coverage
```

### Test Coverage

**Current Status**: 120 tests, all passing

**Coverage**: Application code (`src/app/`) and library code (`src/lib/`)

View detailed coverage report:
```bash
npm run test:coverage
open coverage/index.html  # View HTML report
```

### Test Structure

Tests are organized by feature and include semantic token references:

```
src/
├── app/
│   ├── layout.test.tsx        # Layout, fonts, metadata, theme injection tests
│   └── page.test.tsx          # Home page, navigation, accessibility, config tests
├── lib/
│   └── config.test.ts         # Config loader: parsing, merging, caching, overrides
└── test/
    ├── dark-mode.test.tsx     # Dark mode functionality
    ├── responsive.test.tsx    # Responsive design
    └── integration/
        └── app.test.tsx       # Full application integration with config
```

### Test Categories

- **Config Loader Tests**: YAML parsing, defaults merging, caching, theme CSS generation, class overrides
- **Component Tests**: Layout, page, and UI component testing with config-driven assertions
- **Integration Tests**: Full application rendering and config propagation
- **Accessibility Tests**: WCAG compliance and screen reader support
- **Responsive Tests**: Mobile-first design validation with config-driven sizing
- **Dark Mode Tests**: Theme switching, contrast ratios, config-driven colors

**For detailed testing documentation**, see **[TESTING.md](TESTING.md)**

## Building for Production

### Build Process

Create an optimized production build:

```bash
npm run build
```

This command:
1. Compiles TypeScript to JavaScript
2. Reads YAML configuration files and bakes values into the build
3. Optimizes React components with React Compiler
4. Generates static pages where possible
5. Optimizes images, fonts, and CSS
6. Creates minified bundles with code splitting
7. Outputs to `.next/` directory

**Build output includes**:
- Optimized JavaScript bundles (code-split per route)
- Static HTML pages (pre-rendered with config values)
- Optimized images (WebP/AVIF)
- CSS with unused styles purged
- Font files (WOFF2, self-hosted)

### Testing the Production Build

Start the production server locally:

```bash
npm run build    # Build first
npm start        # Start production server
```

The production server runs at http://localhost:3000

**Verify production build**:
- Check page load performance (should be fast)
- Test dark mode switching (should be instant)
- Verify all links work correctly
- Check responsive design on different screen sizes
- Verify config values are reflected in the rendered page

## Deployment

### Deployment Options

#### Option 1: Vercel (Recommended)

**Deploy with one click**:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/nx1)

**Or deploy via CLI**:

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Follow prompts to configure your deployment

**Vercel Features**:
- Automatic deployments on git push
- Preview deployments for pull requests
- Edge network with CDN
- Automatic HTTPS
- Environment variable management
- Analytics and monitoring

#### Option 2: Docker

**Build Docker image**:

```bash
docker build -t nx1-app .
```

**Run container**:

```bash
docker run -p 3000:3000 nx1-app
```

**Note**: Create a `Dockerfile` following [Next.js Docker example](https://github.com/vercel/next.js/tree/canary/examples/with-docker). Ensure the `config/` directory is included in the image.

#### Option 3: Static Export

For static hosting (Netlify, GitHub Pages, etc.):

1. Update `next.config.ts`:
   ```typescript
   const config = {
     output: 'export',
     // ... other config
   };
   ```

2. Build static files:
   ```bash
   npm run build
   ```

3. Deploy the `out/` directory to your static host

**Note**: Static export has limitations (no server-side features).

#### Option 4: Self-Hosted Node.js

Deploy to any Node.js hosting:

1. Build the application:
   ```bash
   npm run build
   ```

2. Upload files to your server:
   - `.next/` directory
   - `public/` directory
   - `config/` directory
   - `package.json`
   - `package-lock.json`

3. Install dependencies on server:
   ```bash
   npm install --production
   ```

4. Start the server:
   ```bash
   npm start
   ```

5. Use a process manager (PM2, systemd) for production

### Environment Variables

Create `.env.local` for local development:

```bash
# Example environment variables
NEXT_PUBLIC_SITE_URL=http://localhost:3000
# Add your environment variables here
```

**For production**, set environment variables in your deployment platform:
- Vercel: Project Settings -> Environment Variables
- Docker: Use `-e` flag or docker-compose
- Self-hosted: System environment or .env file

**Security Note**: Never commit `.env.local` or `.env` files with secrets!

## Project Structure

```
nx1/
├── config/                        # YAML configuration files
│   ├── site.yaml                 # Site content, metadata, navigation
│   ├── theme.yaml                # Colors, fonts, spacing, class overrides
│   └── jobs.yaml                 # Job search tracker schema (fields, statuses, table)
├── data/                          # YAML data storage
│   └── jobs.yaml                 # Job position records
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── layout.tsx            # Root layout [IMPL-ROOT_LAYOUT]
│   │   ├── page.tsx              # Home page [IMPL-HOME_PAGE]
│   │   ├── globals.css           # Global styles [IMPL-DARK_MODE]
│   │   ├── api/jobs/             # Job search API routes
│   │   │   ├── route.ts          # GET (list) + POST (create)
│   │   │   └── [id]/route.ts     # GET + PUT + DELETE
│   │   ├── jobs/                  # Job search tracker pages
│   │   │   ├── page.tsx          # Table view [IMPL-JOBS_UI_PAGES]
│   │   │   ├── new/page.tsx      # New record form
│   │   │   ├── [id]/edit/page.tsx # Edit record form [IMPL-JOBS_EDIT_PAGE] [IMPL-EDIT_PAGE_RETURN_SOURCE]
│   │   │   ├── calendar/         # Calendar month view
│   │   │   │   ├── page.tsx      # Calendar page [IMPL-CALENDAR_PAGE]
│   │   │   │   └── CalendarView.tsx # Calendar grid component [IMPL-CALENDAR_GRID]
│   │   │   └── components/       # Shared components
│   │   │       └── JobForm.tsx   # Dynamic form (client component)
│   │   └── *.test.tsx            # Component tests
│   ├── lib/                       # Shared modules
│   │   ├── config.ts             # Site/theme config loader [IMPL-CONFIG_LOADER]
│   │   ├── config.types.ts       # Site/theme TypeScript interfaces
│   │   ├── jobs.ts               # Jobs config + data CRUD [IMPL-JOBS_DATA_LAYER]
│   │   ├── jobs.types.ts         # Jobs TypeScript interfaces
│   │   └── config.test.ts        # Config loader tests
│   └── test/                     # Test utilities and tests
│       ├── setup.ts              # Test configuration
│       ├── utils.tsx             # Test helpers
│       └── *.test.tsx            # Feature tests
├── public/                       # Static assets
│   ├── next.svg                  # Next.js logo
│   ├── vercel.svg                # Vercel logo
│   └── *.svg                     # Other static files
├── stdd/                         # STDD Documentation
│   ├── requirements.md           # Requirements [REQ-*]
│   ├── architecture-decisions.md # Architecture index
│   ├── architecture-decisions/   # Detailed decisions [ARCH-*]
│   ├── implementation-decisions.md # Implementation index
│   ├── implementation-decisions/ # Detailed implementations [IMPL-*]
│   ├── semantic-tokens.md        # Token registry
│   └── tasks.md                  # Task tracking
├── .gitignore                    # Git ignore rules
├── CHANGELOG.md                  # Version history
├── README.md                     # This file
├── TESTING.md                    # Testing guide
├── eslint.config.mjs             # ESLint configuration
├── next.config.ts                # Next.js configuration
├── package.json                  # Dependencies and scripts
├── postcss.config.mjs            # PostCSS configuration
├── tsconfig.json                 # TypeScript configuration
└── vitest.config.ts              # Vitest test configuration
```

## Available Scripts

### Development
- `npm run dev` - Start development server with hot reload
- `npm run lint` - Run ESLint to check code quality

### Testing
- `npm test` - Run all tests once (CI mode)
- `npm run test:watch` - Run tests in watch mode (development)
- `npm run test:coverage` - Generate test coverage report

### Production
- `npm run build` - Create optimized production build
- `npm start` - Start production server (requires build first)

### Script Details

| Script | Command | Description | Use Case |
|--------|---------|-------------|----------|
| `dev` | `next dev` | Starts dev server with Fast Refresh | Development |
| `build` | `next build` | Creates optimized production build | Pre-deployment |
| `start` | `next start` | Serves production build | Production |
| `lint` | `eslint` | Checks code quality and style | Before commit |
| `test` | `vitest` | Runs tests in CI mode | CI/CD pipeline |
| `test:watch` | `vitest --watch` | Runs tests on file changes | Development |
| `test:coverage` | `vitest --coverage` | Generates coverage report | Code review |

## Technology Stack

### Core Framework
- **Next.js 16.1.6** - React framework with App Router
- **React 19.2.3** - UI library with Server Components
- **TypeScript 5.x** - Type-safe JavaScript

### Configuration
- **js-yaml** - YAML parser for configuration files
- **tailwind-merge** - Intelligent Tailwind CSS class merging for overrides

### Styling
- **Tailwind CSS v4** - Utility-first CSS framework
- **PostCSS** - CSS transformation tool
- **CSS Custom Properties** - For theming (dark mode), injected from config

### Fonts
- **next/font/google** - Optimized font loading
- **Geist Sans** - Primary sans-serif font
- **Geist Mono** - Monospace font for code

### Testing
- **Vitest 2.1.8** - Fast test runner with jsdom
- **React Testing Library 16.1.0** - Component testing utilities
- **@testing-library/jest-dom** - Custom matchers
- **jsdom 25.0.1** - DOM implementation for Node.js

### Development Tools
- **ESLint** - Code linting with Next.js rules
- **TypeScript Compiler** - Type checking
- **React Compiler** - Optimizing compiler (babel plugin)

## STDD Methodology

This project follows **Semantic Token-Driven Development (STDD) v1.3.0**.

### What is STDD?

STDD creates a traceable chain of intent from requirements to code:

```
[REQ-*] -> [ARCH-*] -> [IMPL-*] -> Code -> Tests
```

**Every feature includes**:
1. **Requirement** (`[REQ-*]`) - WHAT and WHY
2. **Architecture Decision** (`[ARCH-*]`) - HOW (high-level)
3. **Implementation Decision** (`[IMPL-*]`) - HOW (detailed)
4. **Code** - With semantic token comments
5. **Tests** - Validating the requirement

### Documentation

All STDD documentation is in the `stdd/` directory:

- **[Requirements](stdd/requirements.md)** - 25+ documented requirements (including toolbar system and multi-destination sync)
- **[Architecture Decisions](stdd/architecture-decisions.md)** - 22+ decision files (including toolbar layout and nsync integration)
- **[Implementation Decisions](stdd/implementation-decisions.md)** - 30+ implementation files (including toolbar components and sync engine)
- **[Semantic Tokens](stdd/semantic-tokens.md)** - token registry (REQ/ARCH/IMPL)
- **[Tasks](stdd/tasks.md)** - Task tracking with priorities

### For Developers

When adding new features:

1. **Document the requirement** in `stdd/requirements.md` with `[REQ-*]` token
2. **Record architecture decision** in `stdd/architecture-decisions/`
3. **Document implementation** in `stdd/implementation-decisions/`
4. **Add semantic token comments** to your code
5. **Write tests** that reference the `[REQ-*]` token
6. **Update** `stdd/semantic-tokens.md` registry

See `stdd/AGENTS.md` and `ai-principles.md` for complete guidelines.

## Code Quality

### Linting

Run ESLint to check code quality:

```bash
npm run lint
```

**ESLint checks**:
- Next.js best practices
- React hooks rules
- TypeScript type usage
- Code style consistency
- Potential bugs

Fix auto-fixable issues:
```bash
npm run lint -- --fix
```

### Type Checking

TypeScript is configured with strict mode:

```bash
npx tsc --noEmit  # Type check without building
```

### Pre-Commit Checklist

Before committing code:
- [ ] All tests pass: `npm test`
- [ ] No linting errors: `npm run lint`
- [ ] Type checking passes: `npx tsc --noEmit`
- [ ] Code has semantic token comments
- [ ] Documentation is updated
- [ ] CHANGELOG.md is updated (for releases)

## Browser Support

This application supports modern browsers:

- **Chrome/Edge**: Last 2 versions
- **Firefox**: Last 2 versions
- **Safari**: Last 2 versions
- **Mobile browsers**: iOS Safari 13+, Android Chrome

**ES2017+ features are used**, which excludes:
- Internet Explorer (all versions)
- Very old browser versions

## Troubleshooting

### Common Issues

**Port 3000 already in use**:
```bash
# Kill process on port 3000
npx kill-port 3000
# Or use a different port
npm run dev -- -p 3001
```

**Build fails with TypeScript errors**:
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

**Tests fail with module errors**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Dark mode not working**:
- Check browser DevTools -> Application -> Appearance
- Verify system dark mode is enabled
- Check browser cache (try hard refresh: Ctrl+Shift+R)

**Config changes not appearing**:
- Restart the development server (`npm run dev`)
- Check YAML syntax is valid (indentation matters)
- Verify config file paths: `config/site.yaml`, `config/theme.yaml`
- Check for YAML parsing errors in the terminal output

## License

[Add your license here]

## Contributing

Contributions are welcome! Please follow the STDD methodology:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Document requirement in `stdd/requirements.md`
4. Implement with semantic token comments
5. Write tests with `[REQ-*]` references
6. Update documentation
7. Commit: `git commit -m "feat: add feature [REQ-MY_FEATURE]"`
8. Push: `git push origin feature/my-feature`
9. Create a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## Support

- **Documentation**: See `stdd/` directory for complete documentation
- **Issues**: [GitHub Issues](https://github.com/yourusername/nx1/issues)
- **Next.js Docs**: https://nextjs.org/docs
- **STDD Methodology**: See `ai-principles.md` and `AGENTS.md`

## Links

- **Next.js**: https://nextjs.org
- **React**: https://react.dev
- **Tailwind CSS**: https://tailwindcss.com
- **TypeScript**: https://www.typescriptlang.org
- **Vitest**: https://vitest.dev
- **Vercel**: https://vercel.com

---

**Built with Next.js, React, and STDD Methodology**

*Version 0.4.7 - Parent Navigation Button with Linked Mode Support*
