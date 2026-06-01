# Screenshots for README

Committed **README demo assets** for [README.md](../README.md). Regenerate everything:

```bash
npm run demo:screenshots
```

`npm run demo:record` is an alias. Requires Playwright, ffmpeg, and (optionally) gifsicle.

## Workspace (`/files`)

| File | Description |
|------|-------------|
| `workspace-shell.png` | Full-page 3-pane workspace |
| `3-pane-workspace.png` | Legacy alias of workspace shell |
| `workspace-cross-surface-nav.png` | Header cross-surface links |
| `workspace-pane-listing.png` | Tabular file rows in pane 0 |
| `workspace-pane-filter-controls.png` | Per-pane display spec and cross-pane visibility selectors (distinct active values) |
| `workspace-pane-filter-header.png` | Focused pane header with both filter selectors and Filter/Compare indicators |
| `workspace-toolbar-compact.png` | Compact merged toolbar |
| `workspace-toolbar-expanded.png` | Expanded three-tier toolbar |
| `workspace-toolbar-named.png` | Named three-tier toolbar |
| `workspace-header-status.png` | Header with loaded mesh name |
| `3-pane-comparison.png` | Comparison mode coloring (static) |

## Motion GIFs

| File | Description |
|------|-------------|
| `copyall-demo.gif` | Copy to all panes workflow |
| `linked-mode-demo.gif` | Linked directory navigation |
| `comparison-cycle-demo.gif` | Comparison mode cycling |
| `cross-pane-visibility-demo.gif` | Tri-state compare filters |
| `pane-management-demo.gif` | Layout, add/swap panes, pane order |

## Workspace dialogs and menus

| File | Description |
|------|-------------|
| `menu-file-context.png` | Unified file context menu |
| `dialog-set-base-directory.png` | Set base directory |
| `dialog-touch-file.png` | Touch file mtime |
| `dialog-execute-file.png` | Execute file command |
| `dialog-make-directory.png` | Make directory |
| `dialog-rename-regex.png` | Rename Regex |
| `dialog-pane-order.png` | Pane order |
| `dialog-column-order.png` | Column order |
| `popover-layout-picker.png` | Layout picker popover |
| `dialog-display-spec-manager.png` | Manage display specs — catalog overview |
| `dialog-display-spec-construct.png` | Display spec manager — rule editor (constructing a spec) |
| `dialog-cross-pane-visibility-manager.png` | Manage compare filters — catalog overview |
| `dialog-cross-pane-visibility-construct.png` | Compare filter preset — new from focused draft |
| `dialog-compare-filter-threshold.png` | Compare filter thresholds |
| `dialog-save-workspace-mesh-create.png` | Save workspace as mesh (create) |
| `dialog-save-workspace-mesh-update.png` | Save workspace as mesh (update) |
| `dialog-workspace-diff.png` | Workspace diff |

## Mesh GUI

| File | Description |
|------|-------------|
| `mesh-list.png` | Sortable mesh list |
| `mesh-detail-overview.png` | Detail with workspace snapshot summary |
| `mesh-topology.png` | Topology graph |
| `mesh-plan-approval.png` | Plan approval |
| `mesh-sync-session.png` | Sync session / Start Sync |
| `mesh-depots.png` | Per-mesh depots |
| `mesh-export.png` | Per-mesh export |
| `mesh-schedule.png` | Schedule |
| `mesh-archive-settings.png` | Archive settings |
| `mesh-open-workspace.png` | Open workspace from mesh link |

## CopyAll step PNGs (legacy)

| File | Description |
|------|-------------|
| `demo-01-initial-state.png` | Before marking |
| `demo-02-marked-files.png` | Marked files |
| `demo-03-copyall-dialog.png` | Confirmation dialog |
| `demo-04-progress.png` | Progress (optional) |
| `demo-05-final-result.png` | After sync |

## Fixtures

- **Comparison / workspace demos:** `npm run demo:setup-readme` → `/tmp/test-dirs/{alpha,beta,gamma}`
- **CopyAll demo:** `npm run demo:setup` → alpha populated, beta/gamma empty
- **Mesh demos:** ephemeral `mkdtemp` depot dirs via Playwright (see `e2e/readme-mesh-*.spec.ts`)

## E2E specs

- `e2e/readme-workspace-surfaces.spec.ts`
- `e2e/readme-workspace-pane-filters.spec.ts`
- `e2e/readme-workspace-dialogs.spec.ts`
- `e2e/readme-workspace-motion.spec.ts`
- `e2e/readme-mesh-surfaces.spec.ts`
- `e2e/readme-mesh-bridge.spec.ts`
- `e2e/z-copyall-demo.spec.ts`

Verify: `npm run demo:verify` / `scripts/verify_demo_screenshots.sh`
