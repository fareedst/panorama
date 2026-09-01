# Panorama - Multi-Target File Manager with Visual Sync

**Version**: 0.5.1  
**Last Updated**: 2026-05-31

**Panorama** is a modern **multi-pane file manager** built for **visual multi-destination sync with verification** — see all targets at once and confirm every copy. Built with Next.js, React 19, TypeScript, and Tailwind CSS v4, following **TIED** (Traceability-Integrated Engineering Documentation) methodology for complete traceability from requirements through implementation. Project records live under [`tied/`](tied/).

Browse and manage server files with keyboard-driven navigation, **1 pane or more** (no upper limit; 3 panes by default), file operations, visual comparison across panes, content search, and a comprehensive toolbar system with 36+ discoverable operations.

## Why Panorama?

**The Problem**: Traditional file managers only show two panes. When syncing files to multiple destinations (backup drives, cloud storage, network shares), you can't see all targets simultaneously, making it hard to verify what went where.

**The Solution**: Panorama's multi-pane layout shows **all** your destinations at once. Copy or move files to every visible pane in a single operation, with visual comparison to verify results instantly.

**Use Cases**:
- **Multi-Target Backup**: Copy important files to 2-3 backup drives simultaneously and verify each destination
- **Directory Comparison**: Open 3-5 versions of a project and see differences across all at once with color-coded indicators
- **Parallel Deployment**: Sync files to multiple servers and visually confirm each deployment
- **USB Drive Sync**: Copy media to multiple devices in one operation, see all targets' contents side-by-side
- **Archive Distribution**: Distribute files to multiple locations and verify nothing was missed

## Features

### Core File Manager
- **Multi-Pane Layout** – 1 pane or more, no upper limit; 3 panes by default. Add or remove panes via the Layout toolbar; configurable startup paths and automatic layout calculation
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

### Multi-Destination Sync [REQ-NSYNC_MULTI_TARGET] - Panorama's Signature Feature

**The Core Value**: See all destinations while syncing. Mark files in one pane, press Shift+C, and watch them copy to **every other visible pane** simultaneously. No switching between destinations, no uncertainty about what went where.

**How It Works**:
1. **Open multiple panes** – Your source + all destinations (e.g., source drive + 3 backup drives = 4 panes)
2. **Mark files** in the source pane (Space key to mark each file, or Shift+M for all)
3. **Press Shift+C** (Copy to All Panes) or **Shift+V** (Move to All Panes)
4. **Confirm once** – Dialog shows exactly which panes will receive the files
5. **Visual verification** – Watch files appear in all destination panes; color-coded comparison confirms success

**Key Features**:
- **Copy to All Panes / Move to All Panes** – Sync files from the focused pane to all other visible panes in one action (Shift+C, Shift+V)
- **Parallel Sync** – Multi-destination orchestration with parallel copy per source and observer pattern for progress
- **Safe Move Semantics** [REQ-MOVE_SEMANTICS] – Source files deleted only after ALL destinations succeed; partial failure leaves source intact
- **Smart Skip** [REQ-COMPARE_METHODS] – Skip unchanged files via `none`, `size`, `mtime`, `size-mtime`, or `hash` (default: `size-mtime`)
- **Hash Verification** [REQ-HASH_COMPUTATION] – BLAKE3, SHA-256, and XXH3 with streaming for large files; optional post-copy verification
- **Destination Verification** [REQ-VERIFY_DEST] – Optional recompute of destination hash after copy to detect corruption
- **Store Failure Detection** [REQ-STORE_FAILURE_DETECT] – Error streak tracking per destination; sync aborts when a store is marked unavailable (e.g., ejected USB drive)

**Why This Matters**: 
- **Speed**: One operation syncs to N destinations (not N separate operations)
- **Safety**: Move deletes source only after ALL destinations succeed
- **Confidence**: Visual comparison confirms every file reached every destination
- **Efficiency**: Skips files that are already up-to-date using fast comparisons

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
- **TIED documentation** with full requirements traceability (`tied/`)
- **Comprehensive Testing** with Vitest and React Testing Library (576 tests passing)

## Quick Start

### Installation

1. **Clone the repository**:
   ```bash @eval
   git clone <repository-url>
   cd panorama
   ```

2. **Install dependencies**:
   ```bash @eval
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open the file manager**:
   - Navigate to http://localhost:3000 (redirects to `/files`)
   - The file manager opens with your home directory in **3-pane mode** (use the Layout toolbar to add or remove panes; 1 pane minimum, no upper limit)

### Screenshots & Product Tour

Panorama ships committed **README demo assets** under `docs/screenshots/`, regenerated by `npm run demo:screenshots` ([REQ-README_DEMO_AUTOMATION]). Demos use `/tmp/test-dirs/{alpha,beta,gamma}` (see `scripts/setup_readme_screenshots.sh`) or ephemeral mesh depot dirs for Mesh routes.

#### Files page / Workspace (`/files`)

The **Workspace** is the multi-pane client shell: a **workspace header banner** (status row, loaded mesh name, diff control), **cross-surface nav** to Mesh, **workspace area** with **pane** listings in **tabular file row** layout, and three **toolbar** tiers (workspace, pane, system). Toggle **toolbar compact mode** → **toolbar expanded mode** (keystroke badges) → **toolbar named mode** (visible Action labels) via the compact toggle.

**Workspace shell** — Full-page 3-pane default layout with header, workspace area, and three toolbar tiers.

![Workspace shell — 3-pane default](docs/screenshots/workspace-shell.png)

**Cross-surface nav** — **Open Mesh** and File Manager links open the other surface in a new tab.

![Cross-surface nav](docs/screenshots/workspace-cross-surface-nav.png)

**Pane listing** — Tabular **file row** grid with name, size, and mtime columns.

![Pane listing](docs/screenshots/workspace-pane-listing.png)

**Toolbar compact** — Default merged icon row for maximum density.

![Toolbar compact](docs/screenshots/workspace-toolbar-compact.png)

**Toolbar expanded** — Three tiers with keystroke badges on each action.

![Toolbar expanded](docs/screenshots/workspace-toolbar-expanded.png)

**Toolbar named** — Three tiers with visible Action labels (no keystroke badges).

![Toolbar named](docs/screenshots/workspace-toolbar-named.png)

##### Per-pane filter controls

Each **pane** in the **workspace** applies two distinct filter stages to its listing pipeline. **Display spec** runs first (glob include/exclude on the raw directory listing). **Cross-pane visibility** runs second on the **focused pane**, with **mirrored visibility** in other panes (tri-state compare criteria on the comparison index). Every pane keeps its own **active display spec** (`activeDisplaySpecId`) and **active cross-pane visibility preset** (`activeCrossPaneVisibilityId`) independently — pane 0, 1, and 2 can each show different selector values and indicator lines.

```mermaid
flowchart LR
  rawListing[Raw directory listing]
  displaySpec[Display spec layer per pane]
  crossPane[Cross-pane visibility on focused pane]
  mirror[Mirrored visibility in other panes]
  rawListing --> displaySpec --> crossPane --> mirror
```

**Per-pane filter controls** — Three panes with distinct active display specs and cross-pane visibility presets.

![Per-pane filter controls](docs/screenshots/workspace-pane-filter-controls.png)

**Focused pane filter header** — Display spec and cross-pane visibility selectors with Filter/Compare indicators.

![Focused pane filter header](docs/screenshots/workspace-pane-filter-header.png)

**Layer 1 — Display spec** (glob filter; see [pane-display-filter vocabulary](tied/vocab/pane-display-filter.md)):

| Control | Component | Action |
|---------|-----------|--------|
| Pane-header **spec selector** | `DisplaySpecSelector` (`pane-display-spec-selector`) | Choose **No filter** or an **active display spec** from the **spec catalog** |
| **Manage display specs…** | Workspace toolbar `view.displaySpec` *or* selector option **Manage specs…** | Opens `DisplaySpecManagerDialog` for **spec catalog** CRUD (include/exclude glob rules) |

**Layer 2 — Cross-pane visibility** (compare filter; see [cross-pane visibility vocabulary](tied/vocab/cross-pane-visibility.md)):

| Control | Component | Action |
|---------|-----------|--------|
| Pane-header **preset selector** | `CrossPaneVisibilitySelector` (`pane-cross-pane-visibility-selector`) | Choose **No compare filter** or an **active cross-pane visibility preset** from the **visibility catalog** |
| **Manage compare filters…** | Selector option **Manage compare filters…** | Opens `CrossPaneVisibilityManagerDialog` for **visibility catalog** CRUD |
| Toolbar tri-state buttons | `view.compareFilter.*` | Edit the **visibility draft** on the focused pane (**tri-state toggle** per criterion) |
| Compare filter thresholds | `view.compareFilter.thresholds` (or threshold criteria without a set value) | Opens compare filter **thresholds** dialog for size/time inputs |

**Cross-pane visibility manager** — **Manage compare filters…** — **visibility catalog** overview.

![Cross-pane visibility manager](docs/screenshots/dialog-cross-pane-visibility-manager.png)

**Compare filter thresholds** — Size/time threshold inputs for compare filters.

![Compare filter thresholds](docs/screenshots/dialog-compare-filter-threshold.png)

###### Constructing the two pane filters

Every **pane** (file-manager panel) exposes the same two header controls. **Construction** happens in shared **catalog** dialogs; **activation** is per pane via the selectors above.

**Filter 1 — Build a display spec** (glob **spec catalog**):

```mermaid
flowchart TD
  openManager[Open DisplaySpecManagerDialog]
  newOrSelect["+ New spec or select catalog entry"]
  editRules[Name description and filter rules]
  saveSpec[Save to spec catalog]
  applyPane[Pane header spec selector on each pane]
  openManager --> newOrSelect --> editRules --> saveSpec --> applyPane
```

1. On any **pane**, open **Manage display specs…** (workspace toolbar `view.displaySpec` or **Manage specs…** in the pane-header **spec selector**).
2. Click **+ New spec** (or **From preset…** for a starter rule set), or select an existing entry in the catalog list.
3. Set name and description, then add **filter rules** in the rule editor: include/exclude × file/directory/both × glob pattern.
4. **Save** — the spec is stored in the **spec catalog** (`panorama.displaySpecs.v1`).
5. On **each pane** independently, choose that spec in the **spec selector** or **No filter**.

**Display spec manager** — **Manage display specs…** — **spec catalog** overview (list of saved specs).

![Display spec manager](docs/screenshots/dialog-display-spec-manager.png)

**Display spec construct** — **DisplaySpecManagerDialog** with **filter rules** editor (constructing a spec).

![Display spec construct](docs/screenshots/dialog-display-spec-construct.png)

**Filter 2 — Build a cross-pane visibility preset** (**visibility catalog**):

```mermaid
flowchart TD
  compareOn[Enable comparison mode]
  draftToolbar[Toolbar tri-state toggles on focused pane]
  thresholds[Compare filter thresholds when needed]
  openPresetMgr[Open CrossPaneVisibilityManagerDialog]
  newFromDraft["+ New from focused draft or edit preset"]
  savePreset[Save to visibility catalog]
  applyPane[Pane header preset selector per pane]
  compareOn --> draftToolbar --> thresholds
  draftToolbar --> openPresetMgr --> newFromDraft --> savePreset --> applyPane
```

1. Enable comparison mode (required for the comparison index).
2. On the **focused pane**, click toolbar `view.compareFilter.*` buttons to build a **visibility draft** (**tri-state toggle**: inactive → include → exclude per **criterion**).
3. When a threshold **criterion** needs a value, use the compare filter **thresholds** dialog (see image above).
4. Open **Manage compare filters…** — click **+ New from focused draft** to snapshot the draft into a named preset, or select an existing preset and edit name/description, then **Save**. The helper text explains that save copies tri-state toggles and thresholds from the focused pane toolbar.
5. On **each pane**, pick the preset in the **preset selector** or **No compare filter**.

**Compare filter preset manager** — **Manage compare filters…** — **visibility catalog** overview.

![Compare filter preset manager](docs/screenshots/dialog-cross-pane-visibility-manager.png)

**Compare filter preset construct** — **CrossPaneVisibilityManagerDialog** **+ New from focused draft** (saving toolbar draft to catalog).

![Compare filter preset construct](docs/screenshots/dialog-cross-pane-visibility-construct.png)

The amber indicator under each pane header shows `Filter: {name}` when a **display spec** is active (optional `Hidden: N` count) and `Compare: {name}` or **Draft** when **cross-pane visibility** is active. The motion GIF [`cross-pane-visibility-demo.gif`](docs/screenshots/cross-pane-visibility-demo.gif) demonstrates toolbar **tri-state toggle** editing of the **visibility draft**; it complements — but does not replace — pane-header preset selection.

**Motion workflows** (GIFs where movement clarifies behavior):

**Multi-target sync** — Mark files → Copy to all panes → confirm → files appear in every destination.

![Multi-target sync](docs/screenshots/copyall-demo.gif)

**Linked mode** — Linked directory navigation keeps equivalent paths aligned across panes.

![Linked mode](docs/screenshots/linked-mode-demo.gif)

**Comparison cycle** — Comparison mode cycles off → name → size → time coloring.

![Comparison cycle](docs/screenshots/comparison-cycle-demo.gif)

**Cross-pane visibility** — Toolbar **tri-state toggle** buttons edit the **visibility draft** on the focused pane (complements pane-header preset selectors).

![Cross-pane visibility](docs/screenshots/cross-pane-visibility-demo.gif)

**Pane management** — Layout picker, add/swap panes, and pane order dialog.

![Pane management](docs/screenshots/pane-management-demo.gif)

**3-pane comparison** — Comparison mode coloring (static snapshot across three panes).

![3-pane comparison](docs/screenshots/3-pane-comparison.png)

#### Dialogs, pop-overs, and menus

##### File actions

**File context menu** — Unified right-click menu: copy/move/delete, **Touch…**, **Execute…**, **Make directory…**, **Rename Regex…**, **Set as Base directory**, column clipboard.

![File context menu](docs/screenshots/menu-file-context.png)

**Set base directory** — Choose which pane(s) receive a new base path.

![Set base directory](docs/screenshots/dialog-set-base-directory.png)

**Touch file** — Adjust mtime (now, specified, earliest, latest).

![Touch file](docs/screenshots/dialog-touch-file.png)

**Execute file** — Run a shell command against marked files.

![Execute file](docs/screenshots/dialog-execute-file.png)

**Make directory** — Create a folder in this pane or all panes.

![Make directory](docs/screenshots/dialog-make-directory.png)

**Rename Regex** — Bulk rename with match/replacement patterns.

![Rename Regex](docs/screenshots/dialog-rename-regex.png)

##### Layout and columns

**Pane order** — Reorder panes in the workspace layout.

![Pane order](docs/screenshots/dialog-pane-order.png)

**Column order** — Show/hide and reorder file columns.

![Column order](docs/screenshots/dialog-column-order.png)

**Layout picker** — Tile, One Row, One Column, or Fullscreen layout.

![Layout picker](docs/screenshots/popover-layout-picker.png)

##### Display and compare filters

**Display spec manager** — **Manage display specs…** — **spec catalog** overview (list of saved specs).

![Display spec manager](docs/screenshots/dialog-display-spec-manager.png)

**Display spec construct** — **DisplaySpecManagerDialog** with **filter rules** editor (constructing a spec).

![Display spec construct](docs/screenshots/dialog-display-spec-construct.png)

**Cross-pane visibility manager** — **Manage compare filters…** — **visibility catalog** overview.

![Cross-pane visibility manager](docs/screenshots/dialog-cross-pane-visibility-manager.png)

**Cross-pane visibility construct** — **CrossPaneVisibilityManagerDialog** **+ New from focused draft** (saving toolbar draft to catalog).

![Cross-pane visibility construct](docs/screenshots/dialog-cross-pane-visibility-construct.png)

**Compare filter thresholds** — Size/time threshold inputs for compare filters.

![Compare filter thresholds](docs/screenshots/dialog-compare-filter-threshold.png)

##### Mesh save and diff

**Save workspace as mesh (create)** — Save pane paths and layout as a new mesh workspace snapshot.

![Save workspace as mesh (create)](docs/screenshots/dialog-save-workspace-mesh-create.png)

**Save workspace as mesh (update)** — Update an loaded mesh after layout or path changes.

![Save workspace as mesh (update)](docs/screenshots/dialog-save-workspace-mesh-update.png)

**Workspace diff** — Drift table when restored workspace differs from mesh snapshot.

![Workspace diff](docs/screenshots/dialog-workspace-diff.png)

#### Mesh GUI (`/mesh`, `/mesh/:meshId/**`)

The **Mesh hub** lists sortable meshes; **mesh detail** routes cover topology, **plan approval**, **Sync Now**, per-mesh **depots**, export, schedule, and archive. When a **workspace snapshot** is present, the overview shows a **workspace snapshot summary**.

**Mesh list** (`/mesh`) — Sortable columns (name, status, depots, note, updated).

![Mesh list](docs/screenshots/mesh-list.png)

**Mesh detail overview** — Depots, links, and workspace snapshot summary after save.

![Mesh detail overview](docs/screenshots/mesh-detail-overview.png)

**Topology** — Fan-out graph of depots and sync links.

![Topology](docs/screenshots/mesh-topology.png)

**Plan approval** — Generated change set with approve/discard controls.

![Plan approval](docs/screenshots/mesh-plan-approval.png)

**Sync session** — Active session view with Start Sync.

![Sync session](docs/screenshots/mesh-sync-session.png)

**Per-mesh depots** — Depot CRUD for one mesh.

![Per-mesh depots](docs/screenshots/mesh-depots.png)

**Export** — Per-mesh export bundle.

![Export](docs/screenshots/mesh-export.png)

**Schedule** — Interval enable/disable for scheduled sync.

![Schedule](docs/screenshots/mesh-schedule.png)

**Archive settings** — Archive mesh controls.

![Archive settings](docs/screenshots/mesh-archive-settings.png)

**Open workspace from mesh** — Cross-surface restore link back to `/files`.

![Open workspace from mesh](docs/screenshots/mesh-open-workspace.png)

#### Workspace ↔ Mesh bridge

Save a **workspace snapshot** from `/files` (Ctrl+Shift+M) to capture pane paths and layout on a mesh. Restore via **Open workspace from mesh** or `?meshId=` — the **workspace header status row** shows the loaded mesh name. After local changes, the **workspace diff** dialog lists drift; save again in **update** mode to reconcile.

**Workspace header with loaded mesh** — Status row showing loaded mesh name after restore from Mesh.

![Workspace header with loaded mesh](docs/screenshots/workspace-header-status.png)

### Automated Demo Recording

All assets above are produced by **fully automated Playwright** tests — no manual clicking.

**One command:**

```bash
npm run demo:screenshots
```

This command:

1. Seeds comparison and CopyAll fixtures under `/tmp/test-dirs/`
2. Starts the dev server on the Playwright port
3. Runs seven E2E specs (workspace surfaces, pane filters, dialogs, motion GIFs, mesh routes, mesh bridge, CopyAll)
4. Converts five motion webms to GIFs (`scripts/convert_all_readme_gifs.sh`)
5. Verifies the full asset manifest (`scripts/verify_demo_screenshots.sh`)

`npm run demo:record` is an alias for the same command.

**Individual commands:**
```bash @eval
echo_exec npm run demo:setup-readme   # Comparison fixture only
```
```bash @eval
echo_exec npm run demo:setup          # CopyAll fixture only
```
```bash @eval
echo_exec npm run test:e2e            # All E2E tests (headless)
```
```bash @eval
echo_exec npm run demo:convert        # Convert recorded webms to GIFs
```
```bash @eval
echo_exec npm run demo:verify         # Check docs/screenshots manifest
```
```bash @eval
echo_exec npm run test:e2e:headed     # Visible browser (debugging)
```

See [`docs/screenshots/README.md`](docs/screenshots/README.md) for the full asset catalog.

### URL Deep Linking

**New Feature**: Pre-configure panes via URL query parameters for instant setup:

```
http://localhost:3000/files?pane0=/path1&pane1=/path2&pane2=/path3
```

**Example**:
```bash @eval
npm run dev
open "http://localhost:3000/files?pane0=/tmp/test-dirs/alpha&pane1=/tmp/test-dirs/beta&pane2=/tmp/test-dirs/gamma"
```

Panes instantly load with the specified directories—perfect for:
- **Bookmarkable workflows**: Save complex multi-pane setups as browser bookmarks
- **Testing**: E2E tests use URL params to set up scenarios instantly (no UI navigation)
- **Documentation**: Share exact file manager states via shareable links
- **Reproducibility**: Demo scripts can create consistent starting states

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
  defaultPaneCount: 3          # Number of panes on startup (3 recommended)
  allowPaneManagement: true    # Allow adding/removing panes
  maxPanes: 0                  # 0 = no upper limit; set a number to cap panes
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
```bash @eval
node --version  # Should be v18.17+
npm --version   # Should be v9.x+
```

## Development Workflow

### Testing

**Run all tests**:
```bash @eval
npm test
```

**Run tests in watch mode** (recommended during development):
```bash @eval
npm run test:watch
```

**Generate coverage report**:
```bash @eval
npm run test:coverage
```

**Current Status**: 576 tests passing, 3 skipped

### Linting

Run ESLint to check code quality:
```bash @eval
npm run lint
```

Fix auto-fixable issues:
```bash @eval
npm run lint -- --fix
```

### Building for Production

Create an optimized production build:
```bash @eval
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
├── tied/                         # TIED documentation (project + methodology/)
│   ├── requirements.yaml         # Project requirements [REQ-*]
│   ├── architecture-decisions.yaml
│   ├── implementation-decisions.yaml
│   ├── semantic-tokens.yaml
│   ├── requirements/             # REQ detail YAML
│   ├── architecture-decisions/   # ARCH detail YAML
│   └── implementation-decisions/ # IMPL detail + *-pseudocode.md
├── docs/                         # Additional documentation
│   ├── FILE_MANAGER_SOLE_PURPOSE.md # Refactor summary
│   ├── GOFUL_TRANSFER_SUMMARY.md # Feature transfer notes
│   └── LOGGING.md                # Logging system docs
├── .gitignore                    # Git ignore rules
├── CHANGELOG.md                  # Version history
├── README.md                     # This file
├── TESTING.md                    # Testing guide
├── AGENTS.md                     # AI agent operating guide (TIED)
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
```bash @eval
docker build -t file-manager .
docker run -p 3000:3000 file-manager
```

### Self-Hosted Node.js

1. Build: `npm run build`
2. Upload `.next/`, `public/`, `config/`, `package.json`
3. Install production dependencies: `npm install --production`
4. Start: `npm start`
5. Use PM2 or systemd for process management

## TIED Methodology

This project follows **TIED 2.2** (see [AGENTS.md](AGENTS.md)), creating a traceable chain from requirements to code:

```
[REQ-*] → [ARCH-*] → [IMPL-*] (essence_pseudocode) → Tests → Code
```

### Documentation

Project records are under **`tied/`** (methodology templates are read-only in `tied/methodology/`):

- **[Requirements](tied/requirements.yaml)** – product requirements
- **[Architecture](tied/architecture-decisions.yaml)** – architecture decisions
- **[Implementation](tied/implementation-decisions.yaml)** – implementation decisions and pseudocode sidecars
- **[Semantic tokens](tied/semantic-tokens.yaml)** – token registry
- Guides: [tied/docs/](tied/docs/) (agent checklist, pseudocode validation, MCP runbook)
- **Domain vocabulary (canonical terms for REQ/IMPL):** [docs/panorama-domain-references.md](docs/panorama-domain-references.md)
- **Vocabulary standards & PR checklist:** [docs/vocabulary-index-analysis-and-standards.md](docs/vocabulary-index-analysis-and-standards.md)

### For Developers

When adding new features:

1. Document the requirement with `[REQ-*]` in `tied/requirements.yaml` (use `tied-cli.sh` / TIED MCP)
2. Record architecture with `[ARCH-*]`
3. Author `[IMPL-*]` with `essence_pseudocode` in `tied/implementation-decisions/IMPL-*-pseudocode.md`
4. Write failing tests, then code, aligned to pseudocode blocks
5. Run `tied_validate_consistency` before merging

See [AGENTS.md](AGENTS.md) and [tied/docs/ai-principles.md](tied/docs/ai-principles.md) for complete guidelines.

## Key Features Deep Dive

### Multi-Pane Layout

The file manager defaults to **3 panes** and supports **1 pane or more with no upper limit**. Layout is calculated automatically from available space. Use the Layout toolbar to add or remove panes (pane management can be disabled in config). Panes can be arranged in:
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

### Multi-Destination Sync (Panorama's Core Feature)

Inspired by Goful's nsync integration, this is what makes Panorama unique:

**The Workflow**:
1. **Set up your view**: Open panes for your source + all destinations (3-5 panes recommended)
2. **Mark files**: Space to mark individual files, Shift+M for all
3. **Sync**: Shift+C (copy to all) or Shift+V (move to all)
4. **Verify visually**: All panes show the synced files; comparison mode color-codes the results

**Why It's Better Than Traditional Approaches**:
- **Traditional**: Copy to drive 1 → verify → copy to drive 2 → verify → copy to drive 3 → verify (3× the time)
- **Panorama**: Mark files once → Shift+C → all 3 drives receive files in parallel → visual confirmation shows all destinations

**Technical Advantages**:
- **Parallel copy operations** for speed (copies to all destinations concurrently per source file)
- **Safe move semantics**: source deleted only after ALL destinations succeed (prevents data loss on partial failure)
- **Smart skip**: unchanged files detected via size, timestamp, or hash (saves time on incremental syncs)
- **Optional hash verification**: recompute hash after copy to detect silent corruption
- **Store failure detection**: aborts sync if a destination becomes unavailable (detects ejected USB drives, network failures)

**Real-World Example**:
You have important project files on your laptop and three backup drives (USB, NAS, cloud mount). Traditional workflow: copy to USB, verify, copy to NAS, verify, copy to cloud, verify. **Panorama workflow**: Open 4 panes (laptop + 3 destinations), mark files in laptop pane, Shift+C, done. Visual comparison confirms all three backups instantly.

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
```bash @eval
npx kill-port 3000
# Or use a different port
npm run dev -- -p 3001
```

**Build fails**:
```bash @eval
npm run clean
npm run build
```

**Config changes not appearing**:
- Restart the development server
- Check YAML syntax (indentation matters)
- Verify file paths: `config/files.yaml`, `config/theme.yaml`

## License

[Add your license here]

## Contributing

Contributions welcome! Please follow TIED (see [AGENTS.md](AGENTS.md)):

1. Fork the repository
2. Create a feature branch
3. Document requirement in `tied/requirements.yaml` via TIED MCP / `tied-cli.sh`
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

**Built with Next.js, React, and TIED**

*Version 0.5.1 — Multi-pane file manager with Mesh sync platform*
