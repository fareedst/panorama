# Server-Side File Manager with Multi-Pane Interface

**Version**: 0.5.0  
**Last Updated**: 2026-02-09

A modern **multi-pane file manager** built with Next.js, React 19, TypeScript, and Tailwind CSS v4, following **Semantic Token-Driven Development (STDD)** methodology for complete traceability from requirements through implementation.

Browse and manage server files with keyboard-driven navigation, dual-pane (or more) layouts, file operations, visual comparison, content search, and a comprehensive toolbar system with 36+ discoverable operations.

## Features

### Core File Manager
- **Multi-Pane Layout** – Dual-pane or more (up to 4 panes) with configurable startup paths and automatic layout calculation
- **Keyboard Navigation** – Vim-inspired keybindings with hjkl movement, Enter to open directories, Backspace for parent, Tab to switch panes
- **File Operations** – Copy, move, delete, rename with visual confirmation dialogs and progress feedback
- **Linked Navigation** [REQ-LINKED_PANES] – Toggleable mode (L key) synchronizes directory changes, cursor position, and sort settings across all panes; Parent button respects linked mode automatically
- **Visual Comparison** – Cross-pane file comparison with color-coded indicators (same, different, unique, size, time)
- **Parent Navigation Button** – Mouse-accessible `..` button in each pane header for navigating to parent directory (visible when not at root)
- **Content Search** – Full-text search across files with regex support, recursive directory scanning, and match highlighting
- **Finder Dialog** – Quick file filtering with fuzzy matching (press `/` to activate)
- **Directory History** – Navigate back/forward through visited directories with cursor position restoration
- **Bookmarks** – Save frequently accessed directories for quick navigation
- **Manual Refresh** – Force refresh current pane (Ctrl+R) or all panes to reflect external file system changes
- **Sort Options** – Sort by name, size, modification time, or extension (ascending/descending, directories first)
- **File Marking** – Mark multiple files for bulk operations (Space to mark, Shift+M to mark all)

### Visual Toolbar System [REQ-TOOLBAR_SYSTEM]
- **Three Toolbar Types**: Workspace (global actions like layout/refresh), Pane (file operations), System (help/search)
- **Compact Icon Design**: Icon + keystroke badges for maximum density (no overflow with 12+ buttons)
- **Context Awareness**: Active/disabled states reflect workspace context (e.g., Copy disabled without marks)
- **Configuration-Driven**: Complete customization via `config/files.yaml` and `config/theme.yaml`
- **Keyboard Consistency**: Toolbar actions dispatch to the same handlers as keyboard shortcuts

### Multi-Destination Sync [REQ-NSYNC_MULTI_TARGET]
- **Copy to All Panes / Move to All Panes** – Sync files from the focused pane to all other visible panes in one action (Shift+C, Shift+V)
- **Parallel Sync** – Multi-destination orchestration with parallel copy per source and observer pattern for progress
- **Safe Move Semantics** [REQ-MOVE_SEMANTICS] – Source files deleted only after ALL destinations succeed; partial failure leaves source intact
- **Comparison Methods** [REQ-COMPARE_METHODS] – Skip unchanged files via `none`, `size`, `mtime`, `size-mtime`, or `hash` (default: `size-mtime`)
- **Hash Computation** [REQ-HASH_COMPUTATION] – BLAKE3, SHA-256, and XXH3 with streaming for large files
- **Destination Verification** [REQ-VERIFY_DEST] – Optional recompute of destination hash after copy to detect corruption
- **Store Failure Detection** [REQ-STORE_FAILURE_DETECT] – Error streak tracking per destination; sync aborts when a store is marked unavailable

### Configuration System
- **YAML Configuration** – All file manager settings (keybindings, layout, columns, toolbars, startup paths) in `config/files.yaml`
- **Theme Customization** – Colors, fonts, spacing, and per-element class overrides in `config/theme.yaml`
- **Configurable Columns** [IMPL-FILE_COLUMN_CONFIG] – Show/hide columns (name, size, mtime) and format time display (age or absolute)
- **File Type Icons** – Configurable icons and colors for different file types (code, images, archives, documents, etc.)

### Technical Stack
- **Next.js 16.1** with App Router and React Server Components
- **React 19.2** with modern concurrent features
- **TypeScript 5.x** with strict mode for type safety
- **Tailwind CSS v4** with mobile-first responsive design
- **Dark Mode** with automatic system preference detection
- **Optimized Fonts** using next/font with Geist Sans and Geist Mono
- **STDD Documentation** with full requirements traceability
- **Comprehensive Testing** with Vitest and React Testing Library (576 tests passing)

## Quick Start

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd nx1
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open the file manager**:
   - Navigate to http://localhost:3000 (redirects to `/files`)
   - The file manager opens with your home directory in dual-pane mode

### Keyboard Shortcuts

The file manager is keyboard-driven for efficiency:

#### Navigation
- `↑/↓` or `k/j` – Move cursor up/down
- `Enter` – Enter directory or open file
- `Backspace` – Navigate to parent directory
- `Tab` – Switch to next pane
- `H` – Navigate to home directory
- `B` – Show bookmarks dialog
- `[` / `]` – Navigate back/forward in history

#### File Operations
- `Space` – Mark file under cursor (and move down)
- `M` – Toggle mark on current file
- `Shift+M` – Mark all files
- `U` – Clear all marks
- `C` – Copy marked files
- `V` – Move marked files
- `D` – Delete marked files
- `R` – Rename file under cursor
- `Shift+C` – Copy marked files to all other panes
- `Shift+V` – Move marked files to all other panes

#### View & Sort
- `S` – Show sort dialog
- `=` – Toggle comparison mode
- `.` – Toggle hidden files
- `L` – Toggle linked navigation mode
- `Ctrl+R` – Refresh current pane
- `Shift+R` – Refresh all panes

#### Search & Help
- `/` – Finder dialog (quick file filter)
- `Ctrl+F` – Content search dialog
- `P` – Command palette
- `?` – Show keyboard shortcuts help

### Customization

#### File Manager Configuration (`config/files.yaml`)

```yaml
layout:
  default: "tile"              # tile | oneRow | oneColumn | fullscreen
  defaultPaneCount: 2          # Number of panes on startup
  allowPaneManagement: true    # Allow adding/removing panes
  maxPanes: 4                  # Maximum number of panes
  defaultLinkedMode: true      # Start with linked navigation enabled

startup:
  mode: "home"                 # home | configured | last
  paths:                       # Startup paths when mode = "configured"
    pane1: "~"
    pane2: "~/Documents"
    pane3: "~/Downloads"
  rememberLastLocations: false # Remember last visited directories

columns:                       # Visible columns and their format
  - id: mtime
    visible: true
    format: "age"              # "age" for relative time, "absolute" for YYYY-MM-DD HH:MM:SS
  - id: size
    visible: true
  - id: name
    visible: true
```

#### Theme Configuration (`config/theme.yaml`)

```yaml
colors:
  light:
    background: "#ffffff"
    foreground: "#171717"
  dark:
    background: "#0a0a0a"
    foreground: "#ededed"

files:
  overrides:                   # Per-element class overrides
    paneContainer: ""
    paneFocused: ""
    fileRow: ""
    fileCursor: ""
  compareColors:               # File comparison colors
    same: "bg-zinc-100 dark:bg-zinc-800"
    different: "bg-red-100 dark:bg-red-900"
    unique: "bg-yellow-100 dark:bg-yellow-900"
  fileTypes:                   # File type icons and colors
    code:
      icon: "💻"
      iconClass: "text-purple-500 dark:text-purple-400"
      patterns: ["*.ts", "*.tsx", "*.js", "*.jsx", "*.py", "*.go"]
    image:
      icon: "🖼️"
      iconClass: "text-green-500 dark:text-green-400"
      patterns: ["*.jpg", "*.png", "*.gif", "*.webp"]
```

## Prerequisites

- **Node.js**: v18.17 or later (LTS recommended)
- **npm**: v9.x or later (comes with Node.js)

Check your versions:
```bash
node --version  # Should be v18.17+
npm --version   # Should be v9.x+
```

## Development Workflow

### Testing

**Run all tests**:
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

**Current Status**: 576 tests passing, 3 skipped

### Linting

Run ESLint to check code quality:
```bash
npm run lint
```

Fix auto-fixable issues:
```bash
npm run lint -- --fix
```

### Building for Production

Create an optimized production build:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

The production server runs at http://localhost:3000

## Project Structure

```
nx1/
├── config/                        # YAML configuration files
│   ├── site.yaml                 # Site metadata (minimal for file manager)
│   ├── theme.yaml                # Colors, fonts, spacing, file manager theme
│   └── files.yaml                # File manager configuration
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── layout.tsx            # Root layout [IMPL-ROOT_LAYOUT]
│   │   ├── page.tsx              # Redirects to /files [IMPL-FILE_MANAGER_PAGE]
│   │   ├── globals.css           # Global styles [IMPL-DARK_MODE]
│   │   ├── files/                # File manager pages
│   │   │   ├── page.tsx          # File manager server page
│   │   │   ├── WorkspaceView.tsx # Multi-pane workspace (client)
│   │   │   └── components/       # File manager components
│   │   │       ├── FilePane.tsx  # Single pane display
│   │   │       ├── Toolbar.tsx   # Toolbar system
│   │   │       ├── CommandPalette.tsx
│   │   │       ├── SearchDialog.tsx
│   │   │       └── ... (other dialogs)
│   │   └── api/                  # API routes
│   │       └── files/            # File operations API
│   │           ├── route.ts      # List, copy, move, delete, sync
│   │           ├── info/route.ts
│   │           ├── preview/route.ts
│   │           └── search/route.ts
│   ├── lib/                       # Shared modules
│   │   ├── config.ts             # Config loader [IMPL-CONFIG_LOADER]
│   │   ├── config.types.ts       # Configuration TypeScript interfaces
│   │   ├── files.*.ts            # File manager modules
│   │   │   ├── files.data.ts     # File operations
│   │   │   ├── files.types.ts    # TypeScript types
│   │   │   ├── files.utils.ts    # Utilities
│   │   │   ├── files.keybinds.ts # Keybinding system
│   │   │   ├── files.layout.ts   # Layout calculation
│   │   │   ├── files.history.ts  # Directory history
│   │   │   ├── files.bookmarks.ts # Bookmarks
│   │   │   ├── files.search.ts   # Content search
│   │   │   └── files.comparison.ts # File comparison
│   │   ├── sync/                 # Multi-destination sync engine
│   │   │   ├── engine.ts         # Sync orchestration
│   │   │   ├── operations.ts     # File operations
│   │   │   ├── compare.ts        # File comparison
│   │   │   ├── hash.ts           # Hash computation
│   │   │   ├── verify.ts         # Verification
│   │   │   └── store.ts          # Store failure detection
│   │   ├── logger.ts             # Logging system
│   │   └── *.test.ts             # Unit tests
│   └── test/                     # Integration tests
│       ├── setup.ts              # Test configuration
│       └── integration/
│           └── app.test.tsx      # Application integration tests
├── public/                       # Static assets
├── stdd/                         # STDD Documentation
│   ├── requirements.yaml         # Requirements [REQ-*]
│   ├── architecture-decisions.yaml # Architecture [ARCH-*]
│   ├── implementation-decisions.yaml # Implementation [IMPL-*]
│   ├── semantic-tokens.yaml      # Token registry
│   └── tasks.md                  # Task tracking
├── docs/                         # Additional documentation
│   ├── FILE_MANAGER_SOLE_PURPOSE.md # Refactor summary
│   ├── GOFUL_TRANSFER_SUMMARY.md # Feature transfer notes
│   └── LOGGING.md                # Logging system docs
├── .gitignore                    # Git ignore rules
├── CHANGELOG.md                  # Version history
├── README.md                     # This file
├── TESTING.md                    # Testing guide
├── AGENTS.md                     # AI agent instructions
├── ai-principles.md              # STDD methodology guide
├── eslint.config.mjs             # ESLint configuration
├── next.config.ts                # Next.js configuration
├── package.json                  # Dependencies and scripts
├── postcss.config.mjs            # PostCSS configuration
├── tsconfig.json                 # TypeScript configuration
└── vitest.config.ts              # Vitest test configuration
```

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `next dev` | Start development server with hot reload |
| `build` | `next build` | Create optimized production build |
| `start` | `next start` | Serve production build |
| `lint` | `eslint` | Check code quality and style |
| `test` | `vitest` | Run tests in CI mode |
| `test:watch` | `vitest --watch` | Run tests on file changes |
| `test:coverage` | `vitest --coverage` | Generate coverage report |

## Deployment

### Docker

Build and run:
```bash
docker build -t file-manager .
docker run -p 3000:3000 file-manager
```

### Self-Hosted Node.js

1. Build: `npm run build`
2. Upload `.next/`, `public/`, `config/`, `package.json`
3. Install production dependencies: `npm install --production`
4. Start: `npm start`
5. Use PM2 or systemd for process management

## STDD Methodology

This project follows **Semantic Token-Driven Development (STDD) v1.5.0**, creating a traceable chain from requirements to code:

```
[REQ-*] → [ARCH-*] → [IMPL-*] → Code → Tests
```

### Documentation

All STDD documentation is in the `stdd/` directory:

- **[Requirements](stdd/requirements.yaml)** – 40+ documented requirements
- **[Architecture Decisions](stdd/architecture-decisions.yaml)** – 25+ decision files
- **[Implementation Decisions](stdd/implementation-decisions.yaml)** – 35+ implementation files
- **[Semantic Tokens](stdd/semantic-tokens.yaml)** – Complete token registry
- **[Tasks](stdd/tasks.md)** – Task tracking with priorities

### For Developers

When adding new features:

1. Document the requirement with `[REQ-*]` token
2. Record architecture decision with `[ARCH-*]`
3. Document implementation with `[IMPL-*]`
4. Add semantic token comments to code
5. Write tests referencing the `[REQ-*]` token
6. Update the token registry

See `AGENTS.md` and `ai-principles.md` for complete guidelines.

## Key Features Deep Dive

### Multi-Pane Layout

The file manager supports up to 4 simultaneous panes with automatic layout calculation based on available space. Panes can be arranged in:
- **Tile** – Equal-size grid layout
- **One Row** – All panes in a horizontal row
- **One Column** – All panes in a vertical column
- **Fullscreen** – Single pane uses entire workspace

### Linked Navigation Mode

When enabled (L key), all panes navigate together:
- Entering a directory in one pane navigates all panes to equivalent subdirectories
- Cursor position syncs across panes (same relative position)
- Sort settings are synchronized
- Parent navigation (`..` button or Backspace) navigates all panes to their parents
- Automatically disables if directory structures diverge

### Multi-Destination Sync

Inspired by Goful's nsync integration:
- Copy or move marked files to **all other visible panes** simultaneously
- Parallel copy operations for speed
- Safe move: source deleted only after all destinations succeed
- Skip unchanged files based on size, time, or hash
- Optional verification by recomputing hash after copy
- Detects unavailable stores and aborts to prevent data loss

### Content Search

Full-text search across files with:
- Regex pattern matching
- Recursive directory scanning
- Case-sensitive/insensitive options
- File pattern filtering (glob syntax)
- Results grouped by file with line numbers
- Match highlighting in preview

## Browser Support

Modern browsers only:
- **Chrome/Edge**: Last 2 versions
- **Firefox**: Last 2 versions
- **Safari**: Last 2 versions
- **Mobile browsers**: iOS Safari 13+, Android Chrome

## Troubleshooting

**Port 3000 already in use**:
```bash
npx kill-port 3000
# Or use a different port
npm run dev -- -p 3001
```

**Build fails**:
```bash
rm -rf .next
npm run build
```

**Config changes not appearing**:
- Restart the development server
- Check YAML syntax (indentation matters)
- Verify file paths: `config/files.yaml`, `config/theme.yaml`

## License

[Add your license here]

## Contributing

Contributions welcome! Please follow STDD methodology:

1. Fork the repository
2. Create a feature branch
3. Document requirement in `stdd/requirements.yaml`
4. Implement with semantic token comments
5. Write tests with `[REQ-*]` references
6. Update documentation
7. Create a Pull Request

## Links

- **Next.js**: https://nextjs.org
- **React**: https://react.dev
- **Tailwind CSS**: https://tailwindcss.com
- **TypeScript**: https://www.typescriptlang.org
- **Vitest**: https://vitest.dev

---

**Built with Next.js, React, and STDD Methodology**

*Version 0.5.0 - File Manager as Sole Purpose*
