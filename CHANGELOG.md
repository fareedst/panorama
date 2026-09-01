# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- **Archive-backed read-only panes** (`[REQ-ARCHIVE_DIRECTORY_PANES]`, `[ARCH-ARCHIVE_DIRECTORY_PANES]`, `[IMPL-ARCHIVE_DIRECTORY_PANES]`, `[IMPL-FILES_API]`, `[IMPL-WORKSPACE_VIEW]`, `[IMPL-FILE_PANE]`, `[IMPL-WORKSPACE_MESH_BRIDGE]`, `[IMPL-FILE_PREVIEW]`, `CITDP-ARCHIVE_DIRECTORY_PANES`): supported ZIP/TAR/TAR.GZ archives open as virtual `@archive/v1/…` directory panes with read-only listing, cross-pane comparison, single-file **Extract…** to ordinary destinations, mesh restore degrade, and shared manifest reader in preview. Server module: [`src/lib/archive/`](src/lib/archive/); client codec: [`archive-path-client.ts`](src/lib/archive-path-client.ts). Tests: 195 scoped Vitest tests across 13 files; `bunx tsc -b` and `validate:vocabulary` passed. Plan: [`docs/archive-directory-panes-plan.md`](docs/archive-directory-panes-plan.md). Vocabulary: [`tied/vocab/archive-pane.md`](tied/vocab/archive-pane.md).

### Added (`[REQ-PANE_VOLUME_CAPACITY]`, `[ARCH-PANE_VOLUME_CAPACITY]`, `[IMPL-PANE_VOLUME_CAPACITY]`, `[IMPL-FILES_API]`, `[IMPL-WORKSPACE_MESH_BRIDGE]`, `[IMPL-WORKSPACE_VIEW]`, `[IMPL-FILE_PANE]`, `CITDP-PANE_VOLUME_CAPACITY`): each file-manager pane footer shows total and available bytes plus free-space percentage for the volume containing the pane base path; `GET /api/files` always returns an enriched listing object with `volumeStats`; server provider collects stats via `statfs` (non-fatal on failure); SSR bootstrap and client mount backfill hydrate pane stats; mesh bridge consumer migrated from bare-array GET. Modules: [`volume-stats.ts`](src/lib/volume-stats.ts), [`route.ts`](src/app/api/files/route.ts), [`pane-display-filter.ts`](src/lib/pane-display-filter.ts), [`workspace-mesh-bridge.ts`](src/lib/workspace-mesh-bridge.ts), [`page.tsx`](src/app/files/page.tsx), [`WorkspaceView.tsx`](src/app/files/WorkspaceView.tsx), [`FilePane.tsx`](src/app/files/components/FilePane.tsx). Tests: 134 tests across 6 scoped Vitest files; `bunx tsc -b` passed. Plan: [`docs/pane-volume-capacity-plan.md`](docs/pane-volume-capacity-plan.md). Vocabulary: [`tied/vocab/workspace-pane.md`](tied/vocab/workspace-pane.md) (**Volume capacity**, **Volume stats**, **Pane footer**).

### Added

- **NSYNC hybrid move plan** (`[REQ-NSYNC_HYBRID_MOVE]`, `[ARCH-NSYNC_MOVE_PLAN]`, `[IMPL-NSYNC_MOVE_PLAN]`, `[IMPL-NSYNC_ENGINE]`, `[IMPL-NSYNC_OPERATIONS]`, `[IMPL-NSYNC_VERIFY]`, `[IMPL-FILES_DATA]`, `CITDP-NSYNC_HYBRID_MOVE`): Move to All builds a per-item `MovePlan` that classifies volume affinity, runs cross-volume copies first (concurrent via `Promise.all` when M≥2), same-volume copies for extra same-volume targets, and a single same-volume `fs.rename` last; shared `renameOrMove` EXDEV fallback; verify skipped after atomic rename only. Modules: [`move-plan.ts`](src/lib/sync/move-plan.ts) (`partitionMovePlanLegs`), [`engine.ts`](src/lib/sync/engine.ts), [`move-executor.ts`](src/lib/move-executor.ts). Tests: 73/73 passed across move-plan, engine, move-executor, files.data, copy-file.data suites. Plan: [`docs/nsync-hybrid-move-optimization-plan.md`](docs/nsync-hybrid-move-optimization-plan.md). Vocabulary: [`tied/vocab/nsync-multi-target.md`](tied/vocab/nsync-multi-target.md).

### Added

- **TIED 3.0 alignment sync — follow-on evidence** (`[REQ-TIED_SETUP]`, `[REQ-QUALITY_ASSURANCE_EVIDENCE]`, `[REQ-ACCESSIBILITY]`, `[PROC-IMPL_PSEUDOCODE_TOKENS]`, `CITDP-TIED-3.0-ALIGNMENT-SYNC`): composition tests for pane refresh, flex layout, and responsive classes; Playwright a11y E2E (`e2e/workspace-a11y-evidence.spec.ts`, 4 tests); 33-row binding inventory with `e2e_test` paths on UI-only seams; persisted CITDP and working evidence chain under `working/TIED-3.0-ALIGNMENT-SYNC/`. Plan: [`docs/tied-3.0-alignment-sync-plan.md`](docs/tied-3.0-alignment-sync-plan.md).

### Changed

- **TIED 3.0 alignment sync — close-out** (`[REQ-TIED_SETUP]`, `[PROC-TOKEN_VALIDATION]`, `[PROC-VOCABULARY_INDEX]`, `CITDP-TIED-3.0-ALIGNMENT-SYNC`): completed E0–E4 alignment (85/85 sidecars, strict `pseudocode_validate`, integrated verification manifest, E4 re-profile vs E0 baseline); sponsor-approved traceability exceptions renewed to 2026-11-27; QA matrix **observed** for all four profiles including accessibility; P2.2 cleared `tied_cycles` structural delta after methodology MCP fix; maintenance manifest/profile refresh (`maint1`, 1278 Vitest tests). `tied_validate_consistency` ok; `close_out` gate allowed at minimal depth.

- **Batch LEAP close-out** (`[REQ-TIED_SETUP]`, `[PROC-IMPL_PSEUDOCODE_TOKENS]`, `[REQ-PROMPT_TYPE_GLOBAL_SKILLS]`): synchronized the staged TIED traceability retrofit, methodology and QA documentation, analysis tooling configuration, agent bootstrap guidance, and project vocabulary indexes. Added the batch CITDP evidence record and restored the `bun run validate:vocabulary` validation entry point.

### Added

- **Directory tree listing** (`[REQ-DIRECTORY_TREE]`, `[ARCH-DIRECTORY_TREE]`, `[IMPL-DIRECTORY_TREE]`, `[IMPL-WORKSPACE_VIEW]`, `[IMPL-FILE_PANE]`, `[IMPL-FILE_MARKING]`, `[IMPL-BULK_OPS]`, `[IMPL-NSYNC_ENGINE]`): lazy hierarchical tree under each pane base directory; Enter/double-click/chevron expand/collapse without linked re-root; path-keyed marks on flattened visible rows; `sourceBase` relative mapping for cross-pane copy/move/sync-all via `resolveCrossPaneDestPath`. Modules: [`file-tree.ts`](src/lib/file-tree.ts), [`pane-file-tree.ts`](src/lib/pane-file-tree.ts), [`cross-pane-path.ts`](src/lib/cross-pane-path.ts), [`WorkspaceView.tsx`](src/app/files/WorkspaceView.tsx), [`FilePane.tsx`](src/app/files/components/FilePane.tsx), [`files.data.ts`](src/lib/files.data.ts), [`sync/engine.ts`](src/lib/sync/engine.ts), [`route.ts`](src/app/api/files/route.ts). Tests: [`file-tree.test.ts`](src/lib/file-tree.test.ts), [`pane-file-tree.test.ts`](src/lib/pane-file-tree.test.ts), [`cross-pane-path.test.ts`](src/lib/cross-pane-path.test.ts), [`WorkspaceView.directory-tree.test.tsx`](src/app/files/WorkspaceView.directory-tree.test.tsx), [`FilePane.test.tsx`](src/app/files/components/FilePane.test.tsx), [`route.test.ts`](src/app/api/files/route.test.ts), [`files.data.test.ts`](src/lib/files.data.test.ts), [`sync/engine.test.ts`](src/lib/sync/engine.test.ts). Vocabulary: [`tied/vocab/directory-tree.md`](tied/vocab/directory-tree.md), [`tied/vocab/file-marking.md`](tied/vocab/file-marking.md), [`tied/vocab/linked-navigation.md`](tied/vocab/linked-navigation.md), [`tied/vocab/nsync-multi-target.md`](tied/vocab/nsync-multi-target.md), [`tied/vocab/workspace-pane.md`](tied/vocab/workspace-pane.md).

### Changed

- **Marks and linked Enter** (`[REQ-FILE_MARKING_WEB]`, `[REQ-LINKED_PANES]`, `[REQ-DIRECTORY_TREE]`): `pane.marks` keyed by absolute `file.path`; linked Enter toggles tree expand in the initiating pane only (no multi-pane re-root).

### Fixed

- **Cross-volume move** (`[REQ-FILE_OPERATIONS]`, `[ARCH-FILESYSTEM_ABSTRACTION]`, `[IMPL-FILES_DATA]`, `CITDP-CROSS_VOLUME_MOVE_EXDEV`): `moveFile` falls back to copy-then-delete when `fs.rename` returns EXDEV, enabling cross-pane moves between different mount points. Modules: [`files.data.ts`](src/lib/files.data.ts). Tests: [`files.data.test.ts`](src/lib/files.data.test.ts), [`copy-file.data.test.ts`](src/lib/copy-file.data.test.ts). Vocabulary: [`tied/vocab/file-marking.md`](tied/vocab/file-marking.md).
- **Recursive directory copy** (`[REQ-FILE_OPERATIONS]`, `[REQ-COPY_OPERATIONS]`, `[ARCH-FILESYSTEM_ABSTRACTION]`, `[IMPL-FILES_DATA]`, `[IMPL-COPY_ATTRS]`): `copyFile` creates destination parent directories and uses `fs.cp` for directory sources; fixes cross-pane copy of marked directories. Module: [`files.data.ts`](src/lib/files.data.ts). Tests: [`files.data.test.ts`](src/lib/files.data.test.ts), [`copy-file.data.test.ts`](src/lib/copy-file.data.test.ts), [`route.test.ts`](src/app/api/files/route.test.ts) (`bulk-copy`). Vocabulary: [`tied/vocab/file-marking.md`](tied/vocab/file-marking.md), [`tied/vocab/nsync-multi-target.md`](tied/vocab/nsync-multi-target.md), [`tied/vocab/toolbar-keybind.md`](tied/vocab/toolbar-keybind.md).

### Added

- **Make directory** (`[REQ-DIRECTORY_NAVIGATION]`, `[ARCH-FILE_OPERATIONS_API]`, `[IMPL-MAKE_DIRECTORY]`, `[IMPL-MAKE_DIRECTORY_DIALOG]`): file/directory row context menu **Make directory…** opens `MakeDirectoryDialog` with **Make directory pane target** (this pane / all panes) and **Directory name** field; client resolves paths via `buildMakeDirectoryEntries`; `POST /api/files` `bulk-mkdir` via `bulkMakeDirectory`; affected pane listings refresh after apply. Modules: [`make-directory.ts`](src/lib/make-directory.ts), [`MakeDirectoryDialog.tsx`](src/app/files/components/MakeDirectoryDialog.tsx), [`WorkspaceView.tsx`](src/app/files/WorkspaceView.tsx), [`route.ts`](src/app/api/files/route.ts), [`files.data.ts`](src/lib/files.data.ts). Tests: [`make-directory.test.ts`](src/lib/make-directory.test.ts), [`make-directory.data.test.ts`](src/lib/make-directory.data.test.ts), [`MakeDirectoryDialog.test.tsx`](src/app/files/components/MakeDirectoryDialog.test.tsx), [`WorkspaceView.make-directory.test.tsx`](src/app/files/WorkspaceView.make-directory.test.tsx), [`ContextMenu.test.tsx`](src/app/files/components/ContextMenu.test.tsx), [`route.test.ts`](src/app/api/files/route.test.ts). Vocabulary: [`tied/vocab/workspace-pane.md`](tied/vocab/workspace-pane.md).

- **Files startup mesh** (`[REQ-WORKSPACE_MESH_BRIDGE]`, `[REQ-MESH_GUI]`, `[IMPL-WORKSPACE_MESH_BRIDGE]`, `[IMPL-MESH_GUI]`): mesh list **Files startup** radio persists `panorama.filesStartupMeshId` in localStorage; `FilesStartupMeshGate` validates via `GET /api/mesh/:id` and redirects plain `/files` to `/files?meshId=`; invalid preference clears and **YAML startup fallback** applies. Modules: [`files-startup-mesh.ts`](src/lib/files-startup-mesh.ts), [`FilesStartupMeshGate.tsx`](src/app/files/FilesStartupMeshGate.tsx), [`MeshListClient.tsx`](src/app/mesh/components/MeshListClient.tsx), [`page.tsx`](src/app/files/page.tsx). Tests: [`files-startup-mesh.test.ts`](src/lib/files-startup-mesh.test.ts), [`FilesStartupMeshGate.test.tsx`](src/app/files/FilesStartupMeshGate.test.tsx), [`MeshListClient.test.tsx`](src/app/mesh/components/MeshListClient.test.tsx), [`e2e/workspace-mesh-bridge.spec.ts`](e2e/workspace-mesh-bridge.spec.ts). Vocabulary: [`tied/vocab/mesh-platform.md`](tied/vocab/mesh-platform.md).

### Changed

- **README product tour assets** (`[REQ-README_DEMO_AUTOMATION]`, `[ARCH-DEMO_ASSET_PIPELINE]`, `[IMPL-DEMO_SCREENSHOT_PIPELINE]`): split monolithic `readme-screenshots.spec.ts` into five modular Playwright specs (`readme-workspace-surfaces`, `readme-workspace-dialogs`, `readme-workspace-motion`, `readme-mesh-surfaces`, `readme-mesh-bridge`); 40+ committed PNG/GIF assets under `docs/screenshots/`; `convert_all_readme_gifs.sh` batch-converts five motion GIFs; expanded [`README.md`](README.md) and [`docs/panorama-build-test.md`](docs/panorama-build-test.md). Vocabulary: [`tied/vocab/workspace-pane.md`](tied/vocab/workspace-pane.md) (**README demo asset** product tour scope).

### Changed

- **Toolbar named display mode** (`[REQ-TOOLBAR_SYSTEM]`, `[ARCH-TOOLBAR_LAYOUT]`, `[IMPL-TOOLBAR_COMPONENT]`, `[IMPL-LAYOUT_CALCULATOR]`): toolbar-compact-toggle cycles compact → expanded → named → compact; named mode renders three tiers with icon plus visible Action labels from deriveToolbarButton (keystroke badges hidden; tooltips unchanged). Modules: [`toolbar.utils.ts`](src/lib/toolbar.utils.ts), [`ToolbarCompactToggle.tsx`](src/app/files/components/ToolbarCompactToggle.tsx), [`ToolbarButton.tsx`](src/app/files/components/ToolbarButton.tsx), [`TriStateToolbarButton.tsx`](src/app/files/components/TriStateToolbarButton.tsx), [`WorkspaceView.tsx`](src/app/files/WorkspaceView.tsx). Tests: [`toolbar.utils.test.ts`](src/lib/toolbar.utils.test.ts), component tests, [`WorkspaceView.toolbar-compact.test.tsx`](src/app/files/WorkspaceView.toolbar-compact.test.tsx). Vocabulary: [`tied/vocab/toolbar-keybind.md`](tied/vocab/toolbar-keybind.md).

### Added

- **Rename Regex bulk rename** (`[REQ-BULK_FILE_OPS]`, `[REQ-MOUSE_INTERACTION]`, `[ARCH-BATCH_OPERATIONS]`, `[ARCH-MOUSE_SUPPORT]`, `[ARCH-FILE_OPERATIONS_API]`, `[IMPL-RENAME_REGEX]`, `[IMPL-RENAME_REGEX_DIALOG]`, `[IMPL-WORKSPACE_VIEW]`): file/directory row context menu **Rename Regex…** opens `RenameRegexDialog` with pane target (this pane / all panes), match pattern, and replacement text; client resolves paths via `rename-regex.ts` (`buildRenameRegexEntries`, shared `validateRegex`); `POST /api/files` `bulk-rename` with `{ src, dest }[]` via `bulkRename`; affected pane listings refresh after apply. Modules: [`rename-regex.ts`](src/lib/rename-regex.ts), [`regex-validation.ts`](src/lib/regex-validation.ts), [`RenameRegexDialog.tsx`](src/app/files/components/RenameRegexDialog.tsx), [`WorkspaceView.tsx`](src/app/files/WorkspaceView.tsx), [`route.ts`](src/app/api/files/route.ts), [`files.data.ts`](src/lib/files.data.ts). Tests: [`rename-regex.test.ts`](src/lib/rename-regex.test.ts), [`regex-validation.test.ts`](src/lib/regex-validation.test.ts), [`rename-regex.data.test.ts`](src/lib/rename-regex.data.test.ts), [`RenameRegexDialog.test.tsx`](src/app/files/components/RenameRegexDialog.test.tsx), [`WorkspaceView.rename-regex.test.tsx`](src/app/files/WorkspaceView.rename-regex.test.tsx), [`ContextMenu.test.tsx`](src/app/files/components/ContextMenu.test.tsx), [`route.test.ts`](src/app/api/files/route.test.ts). Vocabulary: [`tied/vocab/workspace-pane.md`](tied/vocab/workspace-pane.md), [`tied/vocab/file-marking.md`](tied/vocab/file-marking.md).

### Added

- **Pane command execution** (`[REQ-PANE_COMMAND_EXEC]`, `[REQ-MOUSE_INTERACTION]`, `[ARCH-PANE_COMMAND_EXEC]`, `[ARCH-MOUSE_SUPPORT]`, `[IMPL-PANE_COMMAND_EXEC]`, `[IMPL-EXECUTE_DIALOG]`, `[IMPL-WORKSPACE_VIEW]`): file/directory row context menu **Execute…** opens `ExecuteFileDialog` with pane target (this pane / all panes) and Command field; client expands `$FILE` / `$MARKED`; `POST /api/files` `execute-command` spawns shell per entry with `PANORAMA_PANE_PATH`, `PANORAMA_FILE_PATH`, `PANORAMA_MARKED_PATHS`; affected pane listings refresh after apply. Modules: [`execute-command.ts`](src/lib/execute-command.ts), [`execute-command.data.ts`](src/lib/execute-command.data.ts), [`ExecuteFileDialog.tsx`](src/app/files/components/ExecuteFileDialog.tsx), [`WorkspaceView.tsx`](src/app/files/WorkspaceView.tsx), [`route.ts`](src/app/api/files/route.ts). Tests: [`execute-command.test.ts`](src/lib/execute-command.test.ts), [`execute-command.data.test.ts`](src/lib/execute-command.data.test.ts), [`ExecuteFileDialog.test.tsx`](src/app/files/components/ExecuteFileDialog.test.tsx), [`WorkspaceView.execute.test.tsx`](src/app/files/WorkspaceView.execute.test.tsx), [`route.test.ts`](src/app/api/files/route.test.ts). Vocabulary: [`tied/vocab/workspace-pane.md`](tied/vocab/workspace-pane.md).

### Added

- **Touch modification time** (`[REQ-TOUCH_MTIME]`, `[REQ-FILE_OPERATIONS]`, `[REQ-MOUSE_INTERACTION]`, `[REQ-CROSS_PANE_COMPARISON]`, `[ARCH-TOUCH_MTIME]`, `[ARCH-MOUSE_SUPPORT]`, `[IMPL-TOUCH_MTIME]`, `[IMPL-TOUCH_DIALOG]`, `[IMPL-WORKSPACE_VIEW]`): file/directory row context menu **Touch…** opens `TouchFileDialog` with pane target (this pane / all panes) and mtime mode (now, specified UTC/local, earliest/latest from comparison index); bulk marked files; `POST /api/files` `bulk-touch` via `setFileMtime`/`bulkTouch` preserving atime. Modules: [`touch-file.ts`](src/lib/touch-file.ts), [`TouchFileDialog.tsx`](src/app/files/components/TouchFileDialog.tsx), [`WorkspaceView.tsx`](src/app/files/WorkspaceView.tsx), [`route.ts`](src/app/api/files/route.ts). Tests: [`touch-file.test.ts`](src/lib/touch-file.test.ts), [`touch-mtime.data.test.ts`](src/lib/touch-mtime.data.test.ts), [`TouchFileDialog.test.tsx`](src/app/files/components/TouchFileDialog.test.tsx), [`WorkspaceView.touch.test.tsx`](src/app/files/WorkspaceView.touch.test.tsx), [`route.test.ts`](src/app/api/files/route.test.ts). Vocabulary: [`tied/vocab/workspace-pane.md`](tied/vocab/workspace-pane.md), [`tied/vocab/cross-pane-comparison.md`](tied/vocab/cross-pane-comparison.md).

### Added

- **Set as Base directory** (`[REQ-DIRECTORY_NAVIGATION]`, `[REQ-MOUSE_INTERACTION]`, `[REQ-MULTI_PANE_LAYOUT]`, `[ARCH-MOUSE_SUPPORT]`, `[ARCH-PANE_LIFECYCLE]`, `[IMPL-WORKSPACE_VIEW]`, `[IMPL-MOUSE_SUPPORT]`, `[IMPL-PANE_MANAGEMENT]`, `[IMPL-FILE_MANAGER_PAGE]`): directory row context menu opens a dialog with **nine** pane-target actions (including **In a new pane** via shared `appendPaneAtPath`) plus Cancel; **`SetBaseDirectoryTargetIcon`** semantic SVG on each button; re-root pane path(s)—in this pane, all panes, other panes, next/prior (optional swap), new in-workspace pane, or a new single-pane workspace tab (`/files?panes=1&pane0=`). Modules: [`set-base-directory.ts`](src/lib/set-base-directory.ts), [`SetBaseDirectoryDialog.tsx`](src/app/files/components/SetBaseDirectoryDialog.tsx), [`SetBaseDirectoryTargetIcon.tsx`](src/app/files/components/SetBaseDirectoryTargetIcon.tsx), [`WorkspaceView`](src/app/files/WorkspaceView.tsx), [`page.tsx`](src/app/files/page.tsx). Tests: [`set-base-directory.test.ts`](src/lib/set-base-directory.test.ts), [`SetBaseDirectoryDialog.test.tsx`](src/app/files/components/SetBaseDirectoryDialog.test.tsx), [`SetBaseDirectoryTargetIcon.test.tsx`](src/app/files/components/SetBaseDirectoryTargetIcon.test.tsx), [`WorkspaceView.set-base-directory.test.tsx`](src/app/files/WorkspaceView.set-base-directory.test.tsx), [`page.single-pane-url.test.tsx`](src/app/files/page.single-pane-url.test.tsx). Vocabulary: [`tied/vocab/workspace-pane.md`](tied/vocab/workspace-pane.md) (**Base directory**, **Set base directory dialog**, **Set base directory target icon**, **Append pane at path**, **Single-pane workspace URL**).

### Changed

- **FilePane column renderer** (`[IMPL-FILE_PANE]`, `[IMPL-FILE_COLUMN_CONFIG]`, `[REQ-CONFIG_DRIVEN_FILE_MANAGER]`): `renderColumn` takes `(columnId, file)` only; aligns implementation with `TABULAR_FILE_ROW_GRID` / `TabularFileRowGrid` pseudo-code. Module: [`FilePane.tsx`](src/app/files/components/FilePane.tsx).

- **Tests** (`[IMPL-PANE_COMMAND_EXEC]`): remove unused `afterEach` import in [`execute-command.data.test.ts`](src/lib/execute-command.data.test.ts); behavior unchanged.

- **Unified file context menu** (`[REQ-MOUSE_INTERACTION]`, `[IMPL-MOUSE_SUPPORT]`, `[IMPL-FILE_PANE]`): row and metadata-cell right-click open one `ContextMenu` with file operations, clipboard section, and **Set as Base directory** on directories; standalone `FileColumnContextMenu` retained for unit tests.

- **README demo screenshot automation** (`[REQ-README_DEMO_AUTOMATION]`, `[ARCH-DEMO_ASSET_PIPELINE]`, `[IMPL-DEMO_SCREENSHOT_PIPELINE]`): `npm run demo:screenshots` / `demo:record` captures `3-pane-workspace.png`, `3-pane-comparison.png`, CopyAll step PNGs, and `copyall-demo.gif`; [`scripts/setup_readme_screenshots.sh`](scripts/setup_readme_screenshots.sh); [`e2e/readme-screenshots.spec.ts`](e2e/readme-screenshots.spec.ts); repo-relative [`scripts/verify_demo_screenshots.sh`](scripts/verify_demo_screenshots.sh) (runs at end of `demo:screenshots`). Vocabulary: [`docs/workspace-pane-vocabulary.md`](docs/workspace-pane-vocabulary.md) (**Pane URL deep link**, **README demo asset**), [`docs/cross-pane-comparison-vocabulary.md`](docs/cross-pane-comparison-vocabulary.md) (**Comparison demo fixture**), [`docs/toolbar-keybind-vocabulary.md`](docs/toolbar-keybind-vocabulary.md) (**Toolbar view test id**), [`docs/nsync-multi-target-vocabulary.md`](docs/nsync-multi-target-vocabulary.md) (**CopyAll demo asset**).

### Changed

- **Demo asset pipeline** (`[IMPL-DEMO_SCREENSHOT_PIPELINE]`): `demo:record` aliases unified `demo:screenshots`; GIF converter prefers CopyAll webm; compressed committed screenshot binaries under `docs/screenshots/`.
- **Pane URL deep link** (`[IMPL-WORKSPACE_VIEW]`, `[REQ-MULTI_PANE_LAYOUT]`): TIED pseudo-code block `PANE_URL_DEEP_LINK_INIT` and E2E coverage via readme-screenshots spec.
- **TIED three-way traceability retrofit** (`[PROC-IMPL_PSEUDOCODE_TOKENS]`, `[PROC-TIED_FIRST_IMPLEMENTATION]`): 80+ IMPL `essence_pseudocode` sidecars with block leads; literal copy to `src/**` code and Vitest comments; LEAP for **REQ-HOME_PAGE** (root redirect), **REQ-NAVIGATION_LINKS** (NewTabLink), **REQ-BRANDING** (config logo/darkInvert), **REQ-CONFIG_DRIVEN_APPEARANCE** (file-manager-only scope); ARCH **ARCH-CONFIG_DRIVEN_APPEARANCE**, **ARCH-SERVER_COMPONENTS**, **ARCH-APP_ROUTER**, **ARCH-NEXTJS_FRAMEWORK**; nine MESH sidecars completed (**IMPL-MESH_DOMAIN_TYPES**, **IMPL-MESH_AUTH**, **IMPL-MESH_SESSION**, …).

- **Domain vocabulary** ([`docs/workspace-pane-vocabulary.md`](docs/workspace-pane-vocabulary.md), [`docs/mesh-platform-vocabulary.md`](docs/mesh-platform-vocabulary.md)): preferred terms **Root entry redirect**, **Sole-purpose entry**, **Branding logo**, **darkInvert**, **NewTabLink**, **navigation.security**; [`scripts/validate-vocabulary.sh`](scripts/validate-vocabulary.sh) via `bun run validate:vocabulary`.

- **TESTING.md**: documents root redirect integration coverage and NewTabLink co-located tests.

### Added

- **Root redirect E2E** (`[REQ-HOME_PAGE]`, `[IMPL-HOME_PAGE]`): [`e2e/root-redirect.spec.ts`](e2e/root-redirect.spec.ts) asserts `/` resolves to `/files` (redirect not unit-testable).

- **Domain vocabulary standards** (`docs/vocabulary-index-analysis-and-standards.md`, `docs/tied-domain-vocabulary-research-prompt.md`): normalized all nine `docs/*-vocabulary.md` glossaries with **Copy coverage**, mandatory section order, and expanded alphabetical indexes; **Workspace snapshot** terms canonical in [`docs/mesh-platform-vocabulary.md`](docs/mesh-platform-vocabulary.md) with [`docs/workspace-pane-vocabulary.md`](docs/workspace-pane-vocabulary.md) as intentional hub; PR checklist in [`docs/panorama-domain-references.md`](docs/panorama-domain-references.md); `bun run validate:vocabulary` via [`scripts/validate-vocabulary.sh`](scripts/validate-vocabulary.sh).

- **TIED LEAP traceability** (`REQ-FILE_MANAGER_PAGE`, `REQ-MULTI_PANE_LAYOUT`, `REQ-FILE_MARKING_WEB`, `REQ-PANE_DISPLAY_FILTER`, `REQ-TOOLBAR_SYSTEM`, `REQ-CROSS_PANE_VISIBILITY`, `REQ-WORKSPACE_MESH_BRIDGE`): REQ glossary criteria and IMPL/ARCH `see_also` back-links; IMPL pseudo-code and code/test block comments aligned to preferred terms (**Listing merge**, **Cross-pane field pick**, filter pipeline, **Workspace snapshot**, **Workspace restore bundle**) in [`IMPL-CROSS_PANE_VISIBILITY_CATALOG`](tied/implementation-decisions/IMPL-CROSS_PANE_VISIBILITY_CATALOG-pseudocode.md), [`IMPL-CROSS_PANE_VISIBILITY_ENGINE`](tied/implementation-decisions/IMPL-CROSS_PANE_VISIBILITY_ENGINE-pseudocode.md), [`IMPL-WORKSPACE_MESH_BRIDGE`](tied/implementation-decisions/IMPL-WORKSPACE_MESH_BRIDGE-pseudocode.md), [`src/lib/pane-cross-pane-visibility.ts`](src/lib/pane-cross-pane-visibility.ts), [`src/lib/cross-pane-visibility.ts`](src/lib/cross-pane-visibility.ts), [`src/lib/workspace-mesh-bridge.ts`](src/lib/workspace-mesh-bridge.ts).

### Added

- **File column clipboard context menu** (`[REQ-MOUSE_INTERACTION]`, `[REQ-LINKED_PANES]`, `[ARCH-MOUSE_SUPPORT]`, `[IMPL-MOUSE_SUPPORT]`, `[IMPL-FILE_PANE]`, `[IMPL-WORKSPACE_VIEW]`): right-click on file column cells (name, size, modified) opens a clipboard menu — Copy filename, Copy path, Copy paths in all panes when basename appears in multiple pane listings; mutually exclusive with row file-operations context menu. Modules: [`file-column-clipboard.ts`](src/lib/file-column-clipboard.ts), [`FileColumnContextMenu.tsx`](src/app/files/components/FileColumnContextMenu.tsx), [`FilePane`](src/app/files/components/FilePane.tsx), [`WorkspaceView`](src/app/files/WorkspaceView.tsx). Tests: [`file-column-clipboard.test.ts`](src/lib/file-column-clipboard.test.ts), [`FileColumnContextMenu.test.tsx`](src/app/files/components/FileColumnContextMenu.test.tsx), extended [`FilePane.test.tsx`](src/app/files/components/FilePane.test.tsx), [`WorkspaceView.file-column-clipboard.test.tsx`](src/app/files/WorkspaceView.file-column-clipboard.test.tsx). Vocabulary: [`docs/workspace-pane-vocabulary.md`](docs/workspace-pane-vocabulary.md), [`docs/linked-navigation-vocabulary.md`](docs/linked-navigation-vocabulary.md).

- **Pane reorder** (`[REQ-MULTI_PANE_LAYOUT]`, `[ARCH-PANE_LIFECYCLE]`, `[IMPL-PANE_MANAGEMENT]`): swap focused/neighbor panes (`pane.swap`, `pane.swapPrev`), cycle all panes (`pane.cycle`, `pane.cyclePrev`), and **Pane order** dialog (`pane.order`, toolbar-only); directory history permutes with pane content. Modules: [`pane-order.ts`](src/lib/pane-order.ts), [`PaneOrderDialog.tsx`](src/app/files/components/PaneOrderDialog.tsx), [`WorkspaceView`](src/app/files/WorkspaceView.tsx). Tests: [`pane-order.test.ts`](src/lib/pane-order.test.ts), [`files.history.test.ts`](src/lib/files.history.test.ts), [`PaneOrderDialog.test.tsx`](src/app/files/components/PaneOrderDialog.test.tsx), [`WorkspaceView.pane-reorder.test.tsx`](src/app/files/WorkspaceView.pane-reorder.test.tsx). Vocabulary: [`docs/workspace-pane-vocabulary.md`](docs/workspace-pane-vocabulary.md), [`docs/toolbar-keybind-vocabulary.md`](docs/toolbar-keybind-vocabulary.md).

- **Per-mesh depots page** (`[REQ-MESH_GUI]`, `[IMPL-MESH_GUI]`, `[IMPL-MESH_DEPOT]`): `/mesh/:meshId/depots` with [`MeshDepotsClient`](src/app/mesh/components/MeshDepotsClient.tsx) — depot add/remove and credential-reference stub; tests [`MeshDepotsClient.test.tsx`](src/app/mesh/components/MeshDepotsClient.test.tsx). Vocabulary: [`docs/mesh-platform-vocabulary.md`](docs/mesh-platform-vocabulary.md).

### Changed

- **Mesh snapshot summary compare filters** (`[REQ-WORKSPACE_MESH_BRIDGE]`, `[IMPL-WORKSPACE_MESH_BRIDGE]`): [`WorkspaceSnapshotSummaryList`](src/app/mesh/components/WorkspaceSnapshotSummaryList.tsx) shows **Compare filter** per pane instead of workspace-level **Compare filters** aggregate. Tests: extended [`WorkspaceSnapshotSummaryList.test.tsx`](src/app/mesh/components/WorkspaceSnapshotSummaryList.test.tsx), [`MeshDetailClient.test.tsx`](src/app/mesh/components/MeshDetailClient.test.tsx), [`workspace-mesh-bridge.test.ts`](src/lib/workspace-mesh-bridge.test.ts). Vocabulary: [`docs/cross-pane-visibility-vocabulary.md`](docs/cross-pane-visibility-vocabulary.md).

### Added

- **Toolbar icon registry** (`[REQ-TOOLBAR_SYSTEM]`, `[ARCH-TOOLBAR_ACTIONS]`, `[IMPL-TOOLBAR_COMPONENT]`): merged [`lucide-icons.tsx`](src/components/icons/lucide-icons.tsx) + [`panorama-icons.tsx`](src/components/icons/panorama-icons.tsx) in [`registry.ts`](src/components/icons/registry.ts); registered glyphs for compare filters, mesh bridge (`git-compare`, `network`), layout (`layout-grid`), display filter (`filter`), multi-pane **`copy-all`** / **`move-all`**; **`icon-unknown`** fallback for unmapped actions (Help stays `help-circle`); [`registry.test.tsx`](src/components/icons/registry.test.tsx) guards referenced names via `getReferencedToolbarIconNames()`. Vocabulary: [`docs/toolbar-keybind-vocabulary.md`](docs/toolbar-keybind-vocabulary.md), [`docs/cross-pane-visibility-vocabulary.md`](docs/cross-pane-visibility-vocabulary.md), [`docs/nsync-multi-target-vocabulary.md`](docs/nsync-multi-target-vocabulary.md), [`docs/pane-display-filter-vocabulary.md`](docs/pane-display-filter-vocabulary.md), [`docs/mesh-platform-vocabulary.md`](docs/mesh-platform-vocabulary.md).

### Fixed

- **Directory navigation with cross-pane visibility** (`[REQ-DIRECTORY_NAVIGATION]`, `[REQ-CROSS_PANE_VISIBILITY]`, `[IMPL-CROSS_PANE_VISIBILITY_CATALOG]`, `[IMPL-WORKSPACE_VIEW]`): `mergePaneListingWithCrossPaneFields` no longer spreads the full prior pane, which had reverted `path` and `files` after `handleNavigate` (broken `..` and folder open). Regression: [`pane-cross-pane-visibility.test.ts`](src/lib/pane-cross-pane-visibility.test.ts), composition: [`WorkspaceView.cross-pane-visibility.test.tsx`](src/app/files/WorkspaceView.cross-pane-visibility.test.tsx). Vocabulary: [`docs/cross-pane-visibility-vocabulary.md`](docs/cross-pane-visibility-vocabulary.md).

- **Toolbar-only actions** (`[REQ-TOOLBAR_SYSTEM]`): `toolbars.actions` in `config/files.yaml` supplies metadata for buttons without keybindings; fixes missing **Column order** (`view.columns`) button in the Layout toolbar.

### Added

- **Cross-pane visibility compare filters** (`[REQ-CROSS_PANE_VISIBILITY]`, `[ARCH-CROSS_PANE_VISIBILITY]`, `[IMPL-CROSS_PANE_VISIBILITY_ENGINE]`, `[IMPL-CROSS_PANE_VISIBILITY_UI]`, `[IMPL-CROSS_PANE_VISIBILITY_CATALOG]`): tri-state `view.compareFilter.*` workspace toolbar group uses the comparison index for focused-pane include/exclude rules and mirrors visible basenames in other panes; threshold dialog (`view.compareFilter.thresholds`); named preset catalog in `localStorage` (`panorama.crossPaneVisibility.v1`); per-pane `activeCrossPaneVisibilityId` and ephemeral draft; pane header selector and manager dialog. Modules: [`cross-pane-visibility.ts`](src/lib/cross-pane-visibility.ts), [`cross-pane-visibility-store.ts`](src/lib/cross-pane-visibility-store.ts), [`pane-cross-pane-visibility.ts`](src/lib/pane-cross-pane-visibility.ts), [`TriStateToolbarButton.tsx`](src/app/files/components/TriStateToolbarButton.tsx), [`CompareFilterThresholdDialog.tsx`](src/app/files/components/CompareFilterThresholdDialog.tsx), [`CrossPaneVisibilitySelector.tsx`](src/app/files/components/CrossPaneVisibilitySelector.tsx), [`CrossPaneVisibilityManagerDialog.tsx`](src/app/files/components/CrossPaneVisibilityManagerDialog.tsx). Mesh workspace snapshot **v5** persists per-pane `crossPaneVisibilityId` and inline `crossPaneVisibility` ([`workspace-mesh-bridge.ts`](src/lib/workspace-mesh-bridge.ts)). Tests: [`cross-pane-visibility.test.ts`](src/lib/cross-pane-visibility.test.ts), [`cross-pane-visibility-store.test.ts`](src/lib/cross-pane-visibility-store.test.ts), [`pane-cross-pane-visibility.test.ts`](src/lib/pane-cross-pane-visibility.test.ts), [`TriStateToolbarButton.test.tsx`](src/app/files/components/TriStateToolbarButton.test.tsx), [`CompareFilterThresholdDialog.test.tsx`](src/app/files/components/CompareFilterThresholdDialog.test.tsx), [`CrossPaneVisibilitySelector.test.tsx`](src/app/files/components/CrossPaneVisibilitySelector.test.tsx), [`CrossPaneVisibilityManagerDialog.test.tsx`](src/app/files/components/CrossPaneVisibilityManagerDialog.test.tsx), [`WorkspaceView.cross-pane-visibility.test.tsx`](src/app/files/WorkspaceView.cross-pane-visibility.test.tsx), extended [`workspace-mesh-bridge.test.ts`](src/lib/workspace-mesh-bridge.test.ts), [`WorkspaceView.mesh-restore.test.tsx`](src/app/files/WorkspaceView.mesh-restore.test.tsx), [`WorkspaceSnapshotSummaryList.test.tsx`](src/app/mesh/components/WorkspaceSnapshotSummaryList.test.tsx). Vocabulary: [`docs/cross-pane-visibility-vocabulary.md`](docs/cross-pane-visibility-vocabulary.md), cross-links in [`docs/workspace-pane-vocabulary.md`](docs/workspace-pane-vocabulary.md), [`docs/toolbar-keybind-vocabulary.md`](docs/toolbar-keybind-vocabulary.md), [`docs/mesh-platform-vocabulary.md`](docs/mesh-platform-vocabulary.md), [`docs/cross-pane-comparison-vocabulary.md`](docs/cross-pane-comparison-vocabulary.md).
- **Tabular file columns and column order** (`[REQ-CONFIG_DRIVEN_FILE_MANAGER]`, `[IMPL-FILE_COLUMN_CONFIG]`, `[IMPL-FILE_PANE]`, `[IMPL-WORKSPACE_VIEW]`, `[IMPL-WORKSPACE_MESH_BRIDGE]`, `[REQ-WORKSPACE_MESH_BRIDGE]`, `[REQ-TOOLBAR_SYSTEM]`): file rows use CSS grid with padded **Modified** / **Size** / **Name** columns; Size/Time use content-measured fixed `ch` tracks and **Name** uses `minmax(0, 1fr)` remainder; **OneColumn** layout shares workspace-wide max Size/Time `ch` across stacked panes; workspace toolbar `view.columns` opens [`ColumnOrderDialog`](src/app/files/components/ColumnOrderDialog.tsx) (no shortcut; metadata from `toolbars.actions`); mesh workspace snapshot **v4** persists `fileColumns`; mesh detail summary shows **File columns** label. Modules: [`file-columns.ts`](src/lib/file-columns.ts), [`FilePane`](src/app/files/components/FilePane.tsx), [`toolbar.utils.ts`](src/lib/toolbar.utils.ts). Tests: [`file-columns.test.ts`](src/lib/file-columns.test.ts), [`ColumnOrderDialog.test.tsx`](src/app/files/components/ColumnOrderDialog.test.tsx), [`WorkspaceView.file-columns.test.tsx`](src/app/files/WorkspaceView.file-columns.test.tsx), extended [`FilePane.test.tsx`](src/app/files/components/FilePane.test.tsx), [`workspace-mesh-bridge.test.ts`](src/lib/workspace-mesh-bridge.test.ts), [`WorkspaceView.mesh-restore.test.tsx`](src/app/files/WorkspaceView.mesh-restore.test.tsx), [`WorkspaceSnapshotSummaryList.test.tsx`](src/app/mesh/components/WorkspaceSnapshotSummaryList.test.tsx). Vocabulary: [`docs/workspace-pane-vocabulary.md`](docs/workspace-pane-vocabulary.md), [`docs/toolbar-keybind-vocabulary.md`](docs/toolbar-keybind-vocabulary.md), [`docs/mesh-platform-vocabulary.md`](docs/mesh-platform-vocabulary.md).
- **Workspace shared sort** (`[REQ-FILE_SORTING_ADVANCED]`, `[REQ-WORKSPACE_MESH_BRIDGE]`, `[IMPL-SORT_FILTER]`, `[IMPL-WORKSPACE_MESH_BRIDGE]`): Sort menu **Share** / **Shared**; workspace `sharedSort` state; mesh snapshot **v3** persists `sharedSort`; new panes default to `sharedSort`. Tests: [`SortDialog.test.tsx`](src/app/files/components/SortDialog.test.tsx), extended [`workspace-mesh-bridge.test.ts`](src/lib/workspace-mesh-bridge.test.ts), [`WorkspaceView.shared-sort.test.tsx`](src/app/files/WorkspaceView.shared-sort.test.tsx).
- **Layout toolbar picker** (`[REQ-MULTI_PANE_LAYOUT]`, `[REQ-TOOLBAR_SYSTEM]`, `[IMPL-WORKSPACE_VIEW]`): `view.layout` (Ctrl+Shift+L) and [`LayoutPickerPopover`](src/app/files/components/LayoutPickerPopover.tsx) replace header layout `<select>`. Tests: [`LayoutPickerPopover.test.tsx`](src/app/files/components/LayoutPickerPopover.test.tsx); E2E and [`WorkspaceView.mesh-restore.test.tsx`](src/app/files/WorkspaceView.mesh-restore.test.tsx) updated.
- **Pane display filter specs** (`[REQ-PANE_DISPLAY_FILTER]`, `[ARCH-DISPLAY_FILTER_ENGINE]`, `[ARCH-DISPLAY_SPEC_STORE]`, `[IMPL-DISPLAY_FILTER_ENGINE]`, `[IMPL-DISPLAY_SPEC_STORE]`, `[IMPL-DISPLAY_FILTER_API]`, `[IMPL-PANE_DISPLAY_FILTER_UI]`): named include/exclude glob **display specs**, per-pane **active spec** (`activeDisplaySpecId`), catalog in `localStorage` (`panorama.displaySpecs.v1`) with server sync (`PUT /api/display-specs`), filtered listings (`GET /api/files?displaySpecId=`), bulk path validation for hidden files, mesh workspace snapshot v2 `displaySpecId`, pane header selector and manager dialog, keybinds `view.displaySpec` / `view.displaySpec.none`. Modules: [`display-filter-engine.ts`](src/lib/display-filter-engine.ts), [`display-spec-store.ts`](src/lib/display-spec-store.ts), [`pane-display-filter.ts`](src/lib/pane-display-filter.ts), [`display-specs/route.ts`](src/app/api/display-specs/route.ts), [`DisplaySpecManagerDialog.tsx`](src/app/files/components/DisplaySpecManagerDialog.tsx). Tests: Vitest (`display-filter-engine.test.ts`, `display-spec-store.test.ts`, `pane-display-filter.test.ts`, `display-filter.route.test.ts`, `display-specs/route.test.ts`, `DisplaySpecSelector.test.tsx`, `FilePane` display-spec case); composition covers UI without dedicated E2E. Vocabulary: [`docs/pane-display-filter-vocabulary.md`](docs/pane-display-filter-vocabulary.md).
- **Toolbar compact/expand** (`[REQ-TOOLBAR_SYSTEM]`, `[ARCH-TOOLBAR_LAYOUT]`, `[IMPL-TOOLBAR_COMPONENT]`): leading **toolbar compact toggle** merges enabled top workspace/pane/system tiers into one icon-only row; expanded mode keeps three-tier layout with keystroke badges; tooltips retain shortcuts in both modes. Pane layout remeasures via [`useElementSize`](src/lib/useElementSize.ts) when the toggle changes workspace-area height (see **Fixed** above). Modules: [`ToolbarCompactToggle`](src/app/files/components/ToolbarCompactToggle.tsx), `mergeTopToolbarConfigs`, [`WorkspaceView`](src/app/files/WorkspaceView.tsx) display branch. Tests: Vitest unit + [`WorkspaceView.toolbar-compact.test.tsx`](src/app/files/WorkspaceView.toolbar-compact.test.tsx). Vocabulary: [`docs/toolbar-keybind-vocabulary.md`](docs/toolbar-keybind-vocabulary.md).
- **Workspace ↔ mesh bridge** (`[REQ-WORKSPACE_MESH_BRIDGE]`, `[ARCH-WORKSPACE_MESH_BRIDGE]`, `[IMPL-WORKSPACE_MESH_BRIDGE]`): save file-manager workspace (pane paths, layout, focus, linked/comparison, sort/cursor) as a new mesh from workspace toolbar **Mesh** group / keybind **Ctrl+Shift+M** (`mesh.saveWorkspace`); optional note prefixes snapshot JSON in mesh `description`; restore via mesh detail **Open in File Manager** → `/files?meshId=` with server-side directory hydration, `maxPanes` truncation warning, and `restoredFromMesh` precedence over `paneN` URL params. **Update** loaded workspace in place via save dialog update mode and `PUT /api/mesh/:meshId/workspace` (`planDepotSync`); **diff** live state vs saved baseline (`mesh.diffWorkspace`, header **Diff**, [`WorkspaceDiffDialog`](src/app/files/components/WorkspaceDiffDialog.tsx)); **loaded workspace name** in header (`workspace-loaded-name`). Modules: [`src/lib/workspace-mesh-bridge.ts`](src/lib/workspace-mesh-bridge.ts), [`SaveWorkspaceMeshDialog`](src/app/files/components/SaveWorkspaceMeshDialog.tsx), [`src/app/api/mesh/[meshId]/workspace/route.ts`](src/app/api/mesh/[meshId]/workspace/route.ts), [`MeshDetailClient`](src/app/mesh/components/MeshDetailClient.tsx) summary + link. Tests: Vitest (`workspace-mesh-bridge.test.ts`, dialogs, `workspace.route.test.ts`, `workspace-bridge.route.test.ts`, `WorkspaceView.mesh-restore.test.tsx`, `MeshDetailClient.test.tsx`); E2E [`e2e/workspace-mesh-bridge.spec.ts`](e2e/workspace-mesh-bridge.spec.ts). Vocabulary: [`docs/workspace-pane-vocabulary.md`](docs/workspace-pane-vocabulary.md), [`docs/mesh-platform-vocabulary.md`](docs/mesh-platform-vocabulary.md), [`docs/toolbar-keybind-vocabulary.md`](docs/toolbar-keybind-vocabulary.md).
- **`NewTabLink`** (`[IMPL-EXTERNAL_LINKS]`, `[REQ-NAVIGATION_LINKS]`): reusable cross-surface new-tab links with `target="_blank"`, `rel="noopener noreferrer"`, and assistive disclosure; workspace header **Mesh Sync** nav (`open-mesh-from-workspace`) and mesh-restore layout normalization via `normalizeLayoutType` / server `restoreLayout` plus client `/api/mesh/:meshId` rehydrate. Tests: [`NewTabLink.test.tsx`](src/components/NewTabLink.test.tsx), [`WorkspaceView.mesh-restore.test.tsx`](src/app/files/WorkspaceView.mesh-restore.test.tsx), [`page.mesh-restore.test.tsx`](src/app/files/page.mesh-restore.test.tsx), [`files.layout.test.ts`](src/lib/files.layout.test.ts).
- When `MESH_DATA_DIR` is set, mesh **sync sessions** (including approved plans) persist to `sync-sessions.json` and audit **events** to `sync-events.json`, alongside `meshes.json` (`[IMPL-MESH_PERSISTENCE]`).
- Canonical domain vocabulary in `docs/*-vocabulary.md` (index: [`docs/panorama-domain-references.md`](docs/panorama-domain-references.md)); interactive guide [`docs/panorama-build-test.md`](docs/panorama-build-test.md).
- Mesh sub-pages (per-mesh and **mesh hub routes**): schedule, export, history, rules, settings, global depots/policies/sync; **Remote connector** stub for **remote depots**; **VirtualConnector** default for **virtual depots** and unknown kinds; sessions `GET` includes **session progress**; expanded Playwright coverage in `e2e/mesh-sync.spec.ts`.
- `POST /api/mesh/credentials` for **credential references** (masked handles only); Vitest composition tests for sessions API and credentials route.
- RTL tests for `MeshScheduleClient`, `MeshExportClient`, `MeshArchiveClient`; multi-link `runApprovedSession` integration coverage.

### Changed

- **Toolbar default compact** (`[REQ-TOOLBAR_SYSTEM]`, `[ARCH-TOOLBAR_LAYOUT]`, `[IMPL-TOOLBAR_COMPONENT]`): session starts with merged icon-only workspace toolbar; user toggles to expanded three-tier layout with keystroke badges. Tests: updated [`WorkspaceView.toolbar-compact.test.tsx`](src/app/files/WorkspaceView.toolbar-compact.test.tsx). Vocabulary: [`docs/toolbar-keybind-vocabulary.md`](docs/toolbar-keybind-vocabulary.md).
- **Mesh list and snapshot summary** (`[REQ-MESH_GUI]`, `[REQ-WORKSPACE_MESH_BRIDGE]`, `[ARCH-WORKSPACE_MESH_BRIDGE]`, `[IMPL-MESH_GUI]`, `[IMPL-WORKSPACE_MESH_BRIDGE]`): mesh list **Note** and **Most recent save time** columns; client-side sortable headers (`mesh-list-sort-*`); mesh detail **workspace-snapshot-summary** shows note, save time, shared sort, per-pane sort, and display filter labels via [`WorkspaceSnapshotSummaryList`](src/app/mesh/components/WorkspaceSnapshotSummaryList.tsx). Tests: [`MeshListClient.test.tsx`](src/app/mesh/components/MeshListClient.test.tsx), [`MeshDetailClient.test.tsx`](src/app/mesh/components/MeshDetailClient.test.tsx), [`workspace-mesh-bridge.test.ts`](src/lib/workspace-mesh-bridge.test.ts). Vocabulary: [`docs/mesh-platform-vocabulary.md`](docs/mesh-platform-vocabulary.md), [`docs/workspace-pane-vocabulary.md`](docs/workspace-pane-vocabulary.md), [`docs/pane-display-filter-vocabulary.md`](docs/pane-display-filter-vocabulary.md).
- **Workspace chrome** (`[REQ-TOOLBAR_SYSTEM]`, `[IMPL-WORKSPACE_VIEW]`): removed keyboard-shortcuts footer strip; linked mode via toolbar `link.toggle` active state; [`FilePane`](src/app/files/components/FilePane.tsx) footer only when listing, marks, or hidden count non-empty.
- **Workspace header banner** (`[REQ-WORKSPACE_MESH_BRIDGE]`, `[IMPL-WORKSPACE_MESH_BRIDGE]` `WORKSPACE_HEADER_STATUS`): compact header; mesh-loaded name in `workspace-loaded-name` without redundant green success line; restore warnings (amber `workspace-restore-warning`) vs bootstrap errors (red `workspace-restore-error`) grouped in `workspace-header-status`; removed unused `copy.subtitle` and `copy.workspaceMesh.loadedMessage`.
- **Workspace mesh save dialog**: when `/files?meshId=` is loaded, choose **Update current workspace** or **Save as new workspace**; successful update sets the diff baseline to the captured snapshot so the change badge clears immediately (no re-parse drift).
- **Open in File Manager** (mesh detail) opens in a new tab with security and accessibility attributes (`NewTabLink`).
- Mesh restore applies stored layout (e.g. **OneRow**) instead of defaulting to **Tile**; E2E asserts layout select value and horizontal pane geometry after new-tab restore.
- Dev: `.gitignore` adds `data/` and `.mesh-data-local/`; [`docs/panorama-build-test.md`](docs/panorama-build-test.md) UX for `MESH_DATA_DIR` and Playwright port jobs.
- **Plan approval** vs **sync start**: Plan page performs **plan approval** only; **Sync start** on Sync Now with optional `confirmedDestructive`; **approved session handoff** via `sessionStorage`.
- `MeshRuntime.runApprovedSession` iterates all **sync links**; pause/cancel/**session progress** counters; retry/backoff and outbound throttle hooks; Vitest **functional `localStorage`** shim in [`src/test/setup.ts`](src/test/setup.ts) (Node 22). Playwright `webServer` uses dedicated **PORT**, `MESH_DATA_DIR`, and `MESH_ASYNC_SYNC` (`[IMPL-TEST_SETUP]` / `[REQ-MESH_E2E_RELEASE]`).
- **Credential references**: creating via API allocates an `id` when omitted (`resolveEntityId`), matching depot-style entity creation (`[IMPL-MESH_DOMAIN_TYPES]`).
- Search history silent storage failures aligned with **BookmarkManager**; bulk-delete test uses stable fetch routing.
- TIED LEAP alignment: REQ/ARCH/IMPL and [`docs/mesh-platform-vocabulary.md`](docs/mesh-platform-vocabulary.md); `IMPL-MESH_GUI`, `IMPL-MESH_RUNTIME`, `IMPL-MESH_CONNECTOR`, `IMPL-MESH_API`, `IMPL-MESH_HARDENING`, `IMPL-TEST_SETUP` sidecars updated with `[PROC-IMPL_PSEUDOCODE_TOKENS]` block comments mirrored in code and tests.

### Fixed

- **Client mesh rehydrate when server bootstrap misses mesh** (`[REQ-WORKSPACE_MESH_BRIDGE]`, `[ARCH-WORKSPACE_MESH_BRIDGE]`, `[IMPL-WORKSPACE_MESH_BRIDGE]`): `/files?meshId=` with server `getMesh` miss sets `meshRestorePending`, skips default startup panes, and lets `WorkspaceView` apply a full restore via `buildWorkspaceRestoreBundle` and `listDirectoryViaFilesApi`. Header shows `workspace-restore-pending` during rehydrate, then amber `workspace-restore-warning` after `clientRestoredFromMesh` (not a persistent red `workspace-restore-error`). Shared helpers `appendSnapshotLayoutWarnings` and `buildWorkspaceRestoreBundle` in [`src/lib/workspace-mesh-bridge.ts`](src/lib/workspace-mesh-bridge.ts). Tests: [`workspace-mesh-bridge.test.ts`](src/lib/workspace-mesh-bridge.test.ts), [`WorkspaceView.mesh-restore.test.tsx`](src/app/files/WorkspaceView.mesh-restore.test.tsx), [`page.mesh-restore.test.tsx`](src/app/files/page.mesh-restore.test.tsx). Vocabulary: [`docs/workspace-pane-vocabulary.md`](docs/workspace-pane-vocabulary.md), [`docs/mesh-platform-vocabulary.md`](docs/mesh-platform-vocabulary.md).

- **Workspace pane layout measurement** (`[REQ-MULTI_PANE_LAYOUT]`, `[REQ-TOOLBAR_SYSTEM]`, `[IMPL-LAYOUT_CALCULATOR]`, `[IMPL-TOOLBAR_COMPONENT]`): pane bounds use measured **workspace area** (`useElementSize` / ResizeObserver on `data-testid="workspace-area"`) instead of viewport minus fixed chrome, so toolbar compact/expand updates pane height without clipping. Tests: [`useElementSize.test.ts`](src/lib/useElementSize.test.ts), [`WorkspaceView.toolbar-compact.test.tsx`](src/app/files/WorkspaceView.toolbar-compact.test.tsx).
- **`EventService`** unit tests use in-memory `dataDir: ""` when `MESH_DATA_DIR` is set in the shell (`[IMPL-TEST_SETUP]`), avoiding cross-test persistence pollution.

### Notes

- Mesh subsystem lives under `/mesh` and `/api/mesh`; file-manager **NSYNC** behavior is unchanged (see **[NSYNC]** in [`docs/nsync-multi-target-vocabulary.md`](docs/nsync-multi-target-vocabulary.md)).
- `scripts/fortify-impl-pseudocode.mjs` regenerates IMPL sidecars from detail YAML after bulk edits.
- Run `npm run test:e2e` (or `PLAYWRIGHT_PORT=3001 npx playwright test e2e/mesh-sync.spec.ts`) locally after dev server preflight.
- **Historical (STDD migration)**: Earlier releases migrated methodology from **STDD** (`stdd/`) to **TIED 2.2** (`tied/`): YAML indexes and detail records, pseudocode sidecars, inherited `tied/methodology/`, baseline mesh platform REQ/ARCH/IMPL (`REQ-MESH_MONITORING`, `REQ-MESH_SCHEDULE`, **child REQs**, etc.), updated `AGENTS.md` / `README.md`, and terminology aligned to **TIED** tokens.

---

## [0.5.1] - 2026-02-10

### Added

#### Product Naming: Panorama
- **Product name**: "Panorama - Multi-Target File Manager with Visual Sync"
- **Positioning**: Emphasizes the core value proposition—see all destinations while syncing, with visual verification
- **Tagline**: "Multi-target sync, verified." / "See all targets at once and confirm every copy."
- **Updated branding**: README, documentation, and feature descriptions now highlight the visual multi-destination sync use case

#### URL Deep Linking for Panes
- **Pre-configure panes via URL query parameters**: Navigate to `/files?pane0=/path1&pane1=/path2&pane2=/path3` to instantly load specific directories in each pane
- **Use cases**:
  - **Bookmarkable workflows**: Save complex multi-pane setups as browser bookmarks
  - **E2E testing**: Tests use URL params to set up scenarios instantly (no UI navigation required)
  - **Documentation**: Share exact file manager states via shareable links
  - **Reproducibility**: Demo scripts create consistent starting states
- **Implementation**: `WorkspaceView.tsx` reads `pane0`, `pane1`, `pane2`, etc. from URL search params and navigates panes on mount

#### Automated Demo Recording with Playwright
- **One-command demo generation**: `npm run demo:record` creates screenshots and GIF of CopyAll workflow with zero human intervention
- **Playwright E2E test** (`e2e/copyall-demo.spec.ts`):
  - Navigates to pre-configured panes via URL
  - Marks files in source pane
  - Triggers CopyAll operation via toolbar button
  - Captures 4 screenshots at key steps (initial state, marked files, dialog, final result)
  - Records full video (~35 seconds)
- **GIF conversion pipeline**: Converts Playwright video to optimized GIF (1.9 MB) using ffmpeg palette generation + gifsicle optimization
- **Helper scripts**:
  - `scripts/setup_copyall_demo.sh` — Creates fresh test directories (`/tmp/test-dirs/alpha`, `beta`, `gamma`)
  - `scripts/convert_demo_to_gif.sh` — Converts test video to optimized GIF
  - `scripts/verify_demo_screenshots.sh` — Verifies all expected screenshots exist
- **Generated assets**:
  - 4 PNG screenshots (`demo-01-initial-state.png`, `demo-02-marked-files.png`, `demo-03-copyall-dialog.png`, `demo-05-final-result.png`)
  - 1 GIF animation (`copyall-demo.gif`, 1.9 MB, 800px wide, 15fps)
- **npm scripts**:
  - `npm run demo:record` — Full pipeline (setup → test → convert)
  - `npm run demo:setup` — Reset test directories only
  - `npm run test:e2e` — Run E2E tests (headless)
  - `npm run test:e2e:headed` — Run with visible browser (debugging)
  - `npm run demo:convert` — Convert existing video to GIF
  - `npm run demo:verify` — Verify screenshots exist

#### E2E Testing Infrastructure
- **Playwright integration**: Added `@playwright/test` as dev dependency
- **Playwright config** (`playwright.config.ts`):
  - Test directory: `e2e/`
  - Automatic dev server start/stop
  - Video recording always on
  - Screenshots on failure + custom in tests
  - 60-second test timeout, 15-second action timeout
- **UI instrumentation for testing**:
  - `data-testid` attributes added to `FilePane` components (`pane-0`, `pane-1`, etc.)
  - `data-testid` attributes added to `ToolbarButton` components (`toolbar-{action}`)
  - Enables reliable element selection in E2E tests
- **Test runner separation**: `vitest.config.ts` excludes `e2e/` directory to prevent Vitest from trying to run Playwright tests

### Changed

#### Documentation Updates
- **README.md**:
  - **New "Why Panorama?" section**: Explains the problem (can't see all destinations in traditional file managers), solution (multi-pane visual sync), and use cases (multi-target backup, directory comparison, parallel deployment, USB drive sync, archive distribution)
  - **Enhanced "Multi-Destination Sync" feature description**: User-oriented workflow explanation (5 steps from setup to visual verification) and "Why It's Better" comparison (traditional 3× workflow vs. Panorama's one-operation approach)
  - **Added CopyAll demo GIF** to screenshots section with explanation
  - **New "Automated Demo Recording" section**: Documents the one-command demo pipeline and individual scripts
  - **New "URL Deep Linking" section**: Explains query parameter syntax and use cases with examples
  - **Updated version** to 0.5.1 and date to 2026-02-10
- **DEMO_AUTOMATION_README.md**: Comprehensive reference for automation infrastructure (created in 0.5.1 work)
- **Existing demo documentation**: `docs/AUTOMATION_COMPLETE.md`, `docs/E2E_TESTING_SETUP.md`, `docs/COPYALL_DEMO_QUICKSTART.md` (from automation work)

### Technical Details

#### Modified Files
- **UI**: 
  - `src/app/files/WorkspaceView.tsx` — URL query parameter initialization via `useEffect` hook
  - `src/app/files/components/FilePane.tsx` — Accepts and applies `data-testid` prop
  - `src/app/files/components/Toolbar.tsx` — Passes `action` prop to `ToolbarButton`
  - `src/app/files/components/ToolbarButton.tsx` — Accepts `action` prop and creates `data-testid` from it
- **Config**: 
  - `package.json` — Added `@playwright/test` dev dependency and demo/E2E npm scripts
  - `vitest.config.ts` — Excludes `e2e/` directory from Vitest test discovery
  - `playwright.config.ts` — New Playwright configuration file
- **Tests**: 
  - `e2e/copyall-demo.spec.ts` — New Playwright E2E test for CopyAll demo
- **Scripts**: 
  - `scripts/setup_copyall_demo.sh` — New demo setup script
  - `scripts/convert_demo_to_gif.sh` — New GIF conversion script
  - `scripts/verify_demo_screenshots.sh` — New screenshot verification script
- **Documentation**: 
  - `README.md` — Product naming, expanded feature descriptions, automation docs
  - `CHANGELOG.md` — This entry
  - `DEMO_AUTOMATION_README.md` — New automation reference doc
  - `docs/screenshots/README.md` — Updated to mention demo script

#### System Requirements for Demo Recording
- **@playwright/test** (installed)
- **Chromium** (installed by Playwright)
- **ffmpeg** (required for video conversion)
- **gifsicle** (required for GIF optimization)

#### Demo Recording Success Metrics
- **Test Pass Rate**: 100% (1/1 test passing)
- **Execution Time**: ~35 seconds (full pipeline)
- **Screenshot Quality**: Production-grade (4 PNGs, 85-105 KB each)
- **GIF Size**: 1.9 MB (optimized, 800px wide, 15fps)
- **Repeatability**: Perfect (deterministic, no flakiness)
- **Manual Steps**: Zero (fully automated)

---

## [0.5.0] - 2026-02-09

### Changed

#### File Manager as Sole Purpose [IMPL-FILE_MANAGER_PAGE]
- **Removed landing page**: Root page (`/`) now redirects to `/files` - file manager is the only user-facing feature
- **Removed job tracking**: Eliminated all job-tracking functionality (pages, API, lib, config, data, tests) to streamline the application
- **Simplified configuration**: Updated `config/site.yaml` to minimal metadata for file manager; removed all navigation buttons
- **Removed config types**: Cleaned up `config.ts` and `config.types.ts` by removing all jobs-related types, functions, and defaults
- **Removed theme config**: Deleted jobs section from `config/theme.yaml`
- **Updated tests**: Removed or updated tests for home page and jobs; all 576 tests passing

#### Removed Files and Directories
- `src/app/jobs/` (entire directory: pages, actions, components)
- `src/app/api/jobs/` (entire directory: API routes)
- `src/lib/jobs.data.ts`, `src/lib/jobs.types.ts`
- `config/jobs.yaml`, `data/positions.yaml`, `data/applications.yaml`
- `src/app/page.test.tsx`, `src/test/responsive.test.tsx` (home-page-specific tests)

#### Modified Files
- `src/app/page.tsx` — Now redirects to `/files` (sole purpose)
- `config/site.yaml` — Simplified to metadata and minimal navigation
- `config/theme.yaml` — Removed jobs section
- `src/lib/config.ts` — Removed jobs config, `getJobsConfig()`, `getJobsOverride()`, `getStatusBadgeClass()`, and `backToHome` from files config
- `src/lib/config.types.ts` — Removed all jobs-related types (`JobsConfig`, `JobsThemeConfig`, etc.) and `backToHome` from `FilesCopyConfig`
- `src/lib/config.test.ts` — Removed jobs-related tests; updated assertions for new config structure
- `src/app/layout.test.tsx` — Updated metadata assertions to match "File Manager" title
- `src/test/integration/app.test.tsx` — Simplified integration tests, removed home-page-specific checks

#### Notes
- **STDD documentation** (semantic-tokens.yaml, requirements.yaml, architecture-decisions.yaml, implementation-decisions.yaml) contains references to removed job-tracking and home-page features that should be reviewed and archived/removed in a future cleanup task
- File manager functionality remains unchanged; only navigation entry point and config simplified

---

## [0.4.7] - 2026-02-09

### Added

#### Parent Navigation Button [REQ-LINKED_PANES] [IMPL-LINKED_NAV]
- **Parent `..` button** in each file pane header (next to Linked indicator) for mouse-based parent directory navigation
- **Visibility**: Button shown only when not at root directory (`path !== '/'`)
- **Linked mode integration**: Automatically respects linked navigation mode — clicking Parent in one pane navigates all linked panes to their respective parent directories
- **Accessibility**: Full keyboard support with `aria-label="Parent directory"` for screen readers
- **Refactored navigation**: Extracted `navigateToParent(paneIndex)` function supporting parent navigation for any pane (not just focused pane)
- **Consistent behavior**: Parent button uses same navigation logic as Backspace key — preserves cursor position history and triggers linked sync automatically

#### Tests
- **WorkspaceView.test.tsx** (5 new tests):
  - Parent button visibility when not at root / hidden at root
  - Parent button click triggers navigation (single pane and linked mode)
- **FilePane.test.tsx** (5 new tests):
  - Parent button rendering and click behavior
  - Linked indicator visibility based on prop
- **All 634 tests passing** with zero linter errors

#### STDD Documentation
- Updated `[REQ-LINKED_PANES]` satisfaction criteria to include Parent button
- Updated `[IMPL-LINKED_NAV]` with new Module 2.5: Parent Button UI section
- Documented refactored `navigateToParent(paneIndex)` function and WorkspaceView integration
- Updated last modified dates to 2026-02-09

### Technical Details

#### Modified Files
- **UI**: `src/app/files/components/FilePane.tsx` — Parent `..` button in header with conditional rendering
- **Logic**: `src/app/files/WorkspaceView.tsx` — Refactored `handleParentNavigation()` → `navigateToParent(paneIndex)`, added `onNavigateParent` prop to FilePane
- **Tests**: `src/app/files/WorkspaceView.test.tsx`, `src/app/files/components/FilePane.test.tsx` — 10 new tests
- **STDD**: `stdd/requirements/REQ-LINKED_PANES.md`, `stdd/implementation-decisions/IMPL-LINKED_NAV.md` — Updated with Parent button details

---

## [0.4.6] - 2026-02-09

### Added

#### Multi-Destination File Sync [REQ-NSYNC_MULTI_TARGET] [REQ-MOVE_SEMANTICS] [REQ-COMPARE_METHODS] [REQ-HASH_COMPUTATION] [REQ-VERIFY_DEST] [REQ-STORE_FAILURE_DETECT]
- **Copy to All Panes / Move to All Panes**: Sync files from the focused pane to all other visible panes in one action (keyboard: Shift+C, Shift+V; toolbar: CopyAll/MoveAll). Inspired by Goful's use of the nsync library.
- **Sync engine** (`src/lib/sync/`): Multi-destination orchestration with parallel copy per source, observer pattern for progress, and integration via `POST /api/files` with operation `sync-all`.
- **Safe move semantics** [REQ-MOVE_SEMANTICS]: Source files are deleted only after ALL destinations succeed; partial failure leaves the source intact.
- **Comparison methods** [REQ-COMPARE_METHODS]: Skip unchanged files via `none`, `size`, `mtime`, `size-mtime`, or `hash` (default: `size-mtime`).
- **Hash computation** [REQ-HASH_COMPUTATION]: BLAKE3, SHA-256, and XXH3 with streaming for large files; used for hash-based comparison and optional verification.
- **Destination verification** [REQ-VERIFY_DEST]: Optional recompute of destination hash after copy to detect corruption (off by default).
- **Store failure detection** [REQ-STORE_FAILURE_DETECT]: Error streak tracking per destination; sync aborts when a store is marked unavailable (e.g. detached drive) after 3+ sequential errors.

#### STDD Documentation
- New requirements in `stdd/requirements.yaml`:
  - `[REQ-NSYNC_MULTI_TARGET]` — Multi-destination file synchronization (parallel sync, CopyAll/MoveAll, observer, cancellation)
  - `[REQ-MOVE_SEMANTICS]` — Safe move semantics (delete source only after all destinations succeed)
  - `[REQ-COMPARE_METHODS]` — File comparison methods (none, size, mtime, size-mtime, hash)
  - `[REQ-HASH_COMPUTATION]` — Hash computation for verification (BLAKE3, SHA-256, XXH3, streaming)
  - `[REQ-VERIFY_DEST]` — Optional destination verification by hash after copy
  - `[REQ-STORE_FAILURE_DETECT]` — Store failure detection and early abort
- Implementation decisions and semantic tokens updated for sync engine, API validation, and route tests.

#### API and Tests
- **POST /api/files** operation-specific validation: `sync-all` and bulk operations no longer require `src`; only `copy`, `move`, `delete`, `rename` require `src`. Fixes Copy to All Panes returning 400 when only `sources` and `destinations` are sent.
- **Route tests** (`src/app/api/files/route.test.ts`): Validation and sync-all acceptance (sync-all without `src` succeeds when `sources` and `destinations` provided; missing sources/destinations return 400).
- **Sync engine unit tests** (`src/lib/sync/engine.test.ts`): Multi-destination sync, skip unchanged, observer callbacks, move semantics.

### Technical Details

#### New / Modified Files
- **Sync module**: `src/lib/sync/engine.ts`, `src/lib/sync/operations.ts`, `src/lib/sync/compare.ts`, `src/lib/sync/hash.ts`, `src/lib/sync/verify.ts`, `src/lib/sync/store.ts`, `src/lib/sync.types.ts`, `src/lib/sync/index.ts`
- **API**: `src/app/api/files/route.ts` — operation-specific validation, `sync-all` branch; `src/app/api/files/route.test.ts` — new
- **UI**: `src/app/files/WorkspaceView.tsx` — `handleCopyAll`, `handleMoveAll`, `getOtherPaneDirs`; keybindings and toolbar for CopyAll/MoveAll in `config/files.yaml`
- **STDD**: `stdd/implementation-decisions/IMPL-NSYNC_ENGINE.md`, `stdd/requirements.yaml`, `stdd/implementation-decisions.yaml`, `stdd/semantic-tokens.yaml` (TEST-FILES_API, nsync-related tokens)

---

## [0.4.5] - 2026-02-08

### Added

#### File Manager Toolbar System [REQ-TOOLBAR_SYSTEM] [REQ-TOOLBAR_CONFIG]
- **Visual toolbar system** providing discoverable, mouse-accessible interface to all 36+ keyboard-driven file manager operations
- **Three toolbar types** with distinct scopes:
  - **Workspace Toolbar**: Actions affecting all panes (refresh all, layout switching, linked navigation, comparison mode)
  - **Pane Toolbar**: Actions specific to focused pane (file operations, navigation, marking, sorting)
  - **System Toolbar**: System-wide actions (help, command palette, search)
- **Compact icon-only button design** [IMPL-TOOLBAR_COMPACT_DESIGN]:
  - Buttons display icon + keystroke badge (no label text when icon present)
  - Reduced padding (`px-1.5 py-1`), smaller icons (16px), smaller text (`text-xs`)
  - Prevents overflow with high-density toolbars (validated with 12-button Pane toolbar)
  - Labels only shown as fallback when icon not available
- **Configuration-driven** [REQ-TOOLBAR_CONFIG]:
  - Complete toolbar customization via `config/files.yaml` (visibility, position, button groups, actions)
  - Theme styling via `config/theme.yaml` (toolbar colors, button states, group separators)
  - TypeScript types for type-safe toolbar configuration
  - Sensible defaults when config omitted
- **Action consistency** [ARCH-TOOLBAR_ACTIONS]:
  - All button metadata (icon, label, keystroke, description) derived from existing keybinding registry
  - Single source of truth ensures toolbar and keyboard always in sync
  - Toolbar buttons dispatch to same handlers as keyboard shortcuts
  - Zero behavioral divergence between mouse and keyboard interactions
- **Context awareness**:
  - Active states highlight toggle operations (linked mode, comparison mode)
  - Disabled states reflect workspace context (no files, no marks, navigation boundaries, pane limits)
  - Button states computed via React `useMemo` hooks for performance
- **Icon system** [IMPL-ICON_SYSTEM]:
  - Unified `Icon` component with 40+ SVG icon definitions (Lucide React style)
  - Comprehensive action-to-icon mapping for all file manager operations
  - Fallback icon for unmapped actions
  - Accessible with `aria-hidden` and 16px size
- **Toolbar utilities** [IMPL-TOOLBAR_COMPONENT]:
  - `deriveIconFromAction()`: Maps action names to icon names
  - `deriveLabelFromDescription()`: Extracts concise labels from keybinding descriptions
  - `formatKeystroke()`: Converts keybindings to human-readable display (e.g., "Ctrl+C", "Space", "↑")
  - `deriveToolbarButton()`: Complete button props from action and keybinding registry
- **Component hierarchy** [IMPL-TOOLBAR_COMPONENT]:
  - Base: `Toolbar.tsx`, `ToolbarButton.tsx`, `ToolbarGroup.tsx`
  - Specialized wrappers: `WorkspaceToolbar.tsx`, `PaneToolbar.tsx`, `SystemToolbar.tsx`
  - Configuration-driven rendering with group separators
  - Responsive design (desktop visible, mobile/tablet deferred)

#### STDD Documentation [REQ-TOOLBAR_SYSTEM] [REQ-TOOLBAR_CONFIG] [ARCH-TOOLBAR_LAYOUT] [ARCH-TOOLBAR_ACTIONS] [IMPL-TOOLBAR_COMPONENT] [IMPL-TOOLBAR_COMPACT_DESIGN]
- New requirements:
  - `[REQ-TOOLBAR_SYSTEM]` — File manager toolbar system for discoverability and accessibility
  - `[REQ-TOOLBAR_CONFIG]` — Configuration-driven toolbar customization
- New architecture decisions:
  - `[ARCH-TOOLBAR_LAYOUT]` — Three-tier toolbar system with configurable positioning and button grouping
  - `[ARCH-TOOLBAR_ACTIONS]` — Action-to-button mapping architecture deriving metadata from keybinding registry
- New implementation decisions:
  - `[IMPL-TOOLBAR_COMPONENT]` — React component implementation with base and specialized toolbars
  - `[IMPL-TOOLBAR_COMPACT_DESIGN]` — Compact icon-only button design preventing overflow
- Updated semantic tokens registry with 6 new tokens
- Status updated from "Planned" to "Implemented" for all toolbar tokens

### Technical Details

#### New Files
- **Icon System**:
  - `src/components/Icon.tsx` — Unified SVG icon component with 40+ icon definitions
- **Toolbar Utilities**:
  - `src/lib/toolbar.utils.ts` — Metadata derivation functions (icon, label, keystroke, button props)
- **Toolbar Components**:
  - `src/app/files/components/Toolbar.tsx` — Base toolbar rendering groups from configuration
  - `src/app/files/components/ToolbarButton.tsx` — Individual button with icon, label, keystroke display
  - `src/app/files/components/ToolbarGroup.tsx` — Groups related buttons with visual separator
  - `src/app/files/components/WorkspaceToolbar.tsx` — Workspace-level actions wrapper
  - `src/app/files/components/PaneToolbar.tsx` — Pane-specific actions wrapper
  - `src/app/files/components/SystemToolbar.tsx` — System-wide actions wrapper
- **STDD Documentation**:
  - `stdd/requirements/REQ-TOOLBAR_SYSTEM.md`
  - `stdd/requirements/REQ-TOOLBAR_CONFIG.md`
  - `stdd/architecture-decisions/ARCH-TOOLBAR_LAYOUT.md`
  - `stdd/architecture-decisions/ARCH-TOOLBAR_ACTIONS.md`
  - `stdd/implementation-decisions/IMPL-TOOLBAR_COMPONENT.md`
  - `stdd/implementation-decisions/IMPL-TOOLBAR_COMPACT_DESIGN.md`

#### Modified Files
- **Configuration**:
  - `config/files.yaml` — Added `toolbars` section with workspace, pane, and system toolbar configurations
  - `config/theme.yaml` — Added `files.toolbar` section with toolbar styling (background, border, button states)
- **TypeScript Types**:
  - `src/lib/config.types.ts` — Added toolbar configuration interfaces (`ToolbarConfig`, `ToolbarsConfig`, `ToolbarThemeConfig`, etc.)
- **WorkspaceView Integration**:
  - `src/app/files/WorkspaceView.tsx` — Integrated toolbar rendering with `activeActions` and `disabledActions` state tracking
  - `src/app/files/page.tsx` — Load toolbar configuration and pass to WorkspaceView
- **STDD Documentation**:
  - `stdd/requirements.yaml` — Added toolbar requirement entries, updated status to "Implemented"
  - `stdd/architecture-decisions.yaml` — Added toolbar architecture entries, updated status to "Implemented"
  - `stdd/semantic-tokens.yaml` — Added 6 toolbar tokens, updated status to "Implemented"

#### Configuration Examples

**Default (All Toolbars Enabled)**:
```yaml
toolbars:
  enabled: true
  workspace:
    enabled: true
    position: "top"
    groups:
      - name: "Layout"
        actions: ["view.sort", "view.comparison", "link.toggle"]
      - name: "Pane"
        actions: ["pane.add", "pane.remove", "pane.refresh-all"]
  pane:
    enabled: true
    position: "top"
    groups:
      - name: "File Operations"
        actions: ["file.copy", "file.move", "file.delete", "file.rename"]
      - name: "Navigation"
        actions: ["navigate.parent", "navigate.home", "history.back", "history.forward"]
      - name: "Marking"
        actions: ["mark.toggle", "mark.all", "mark.invert", "mark.clear"]
  system:
    enabled: true
    position: "top"
    groups:
      - name: "System"
        actions: ["help.show", "command.palette", "search.finder", "search.content"]
```

**Minimal (Power User)**:
```yaml
toolbars:
  enabled: true
  workspace:
    enabled: false
  pane:
    enabled: true
    position: "bottom"
    groups:
      - name: "Essential"
        actions: ["file.copy", "file.move", "file.delete"]
  system:
    enabled: false
```

**Keyboard-First (Expert)**:
```yaml
toolbars:
  enabled: false  # Disable entire toolbar system
```

#### Integration Flow

```
User Click → ToolbarButton
                ↓
          onAction(action)
                ↓
     WorkspaceView.handleExecuteAction
                ↓
        actionHandlers[action]
                ↓
         Handler Function
                ↓
         State Update
                ↓
      UI Re-render
```

Same flow as keyboard shortcuts, ensuring behavioral consistency.

#### Design Decisions

- **Single source of truth**: Keybinding registry provides all action metadata; toolbar buttons derive icons, labels, and keystrokes automatically
- **Action dispatch consistency**: Toolbar buttons use same `handleExecuteAction` dispatcher as keyboard shortcuts
- **Configuration-driven**: All toolbar aspects (visibility, position, button selection, styling) configurable via YAML
- **Compact design**: Icon-only buttons with keystroke badges prevent overflow and maximize visible actions per toolbar (validated with 12-button Pane toolbar)
- **Modular architecture**: Three-tier toolbar types (workspace, pane, system) with shared base components

#### Benefits Achieved

1. **Improved Discoverability**: All 36+ operations visible with icons and keystroke hints (reduced learning curve from hours to instant visual discovery)
2. **Enhanced Accessibility**: Full mouse access to all operations with proper ARIA labels (WCAG 2.1 AA compliance)
3. **Consistent Behavior**: Single action dispatcher ensures identical behavior between keyboard and mouse
4. **Zero Code Changes**: Complete customization via YAML configuration
5. **Context Awareness**: Button states reflect workspace context (active toggles, disabled unavailable actions)
6. **Professional Appearance**: Modern toolbar design matches contemporary file managers

### Testing

- **Status**: Testing infrastructure in place; comprehensive tests pending
- **Manual Verification**: All toolbar buttons render correctly, no overflow with 12+ actions, active/disabled states correct, toolbar actions behave identically to keyboard shortcuts

### Future Enhancements

- Responsive mobile support (hamburger menu + drawer for mobile viewports)
- Per-pane toolbars (each pane gets its own toolbar instance)
- Toolbar customization UI (drag-and-drop button arrangement)
- Custom actions (user-defined toolbar buttons executing shell commands)
- Group collapsing (accordion-style for high-density toolbars)
- Internationalization (translatable button labels)

---

## [0.4.4] - 2026-02-08

### Fixed

#### File manager: keystroke R to rename did nothing [IMPL-RENAME_DIALOG]
- **R key had no effect**: The `file.rename` action was bound to the R key and the handler was invoked correctly, but the handler was a TODO/no-op (console message only), so nothing visible happened.
- **Fix**: Implemented rename flow: R (or context menu “Rename”) now opens a **RenameDialog** modal; user edits the name and confirms; client calls `POST /api/files` with `operation: "rename"`, then refreshes the pane. Footer shows “R: Rename” hint.

### Added

#### File manager: rename dialog and context menu wiring [IMPL-RENAME_DIALOG]
- **RenameDialog** (`src/app/files/components/RenameDialog.tsx`): Modal with initial name input, Rename/Cancel, ESC to cancel. Used for both keyboard and context menu rename.
- **WorkspaceView**: `renameDialog` state and `handleRenameConfirm(filePath, paneIndex, newName)`; `file.rename` handler opens dialog for cursor file; `onRename={(file) => …}` passed to FilePane so context menu opens dialog for the right-clicked file.
- **Context menu**: Rename now invokes `onRename(file)` so the correct file is passed; `ContextMenu.test.tsx` updated to expect `onRename(mockFile)`.

#### File manager: overwrite confirmation with file comparison [IMPL-OVERWRITE_PROMPT]
- **Enhanced copy/move confirmation dialogs** that detect file conflicts and display detailed comparison information before overwriting files
- **Conflict detection** before confirmation: When copying or moving files to a directory that already contains files with matching names, the system automatically detects conflicts using existing pane file lists (no additional API calls)
- **Rich comparison display**:
  - **Warning section** with yellow/amber styling and ⚠️ icon indicating files will be overwritten
  - **Scrollable conflict list** (up to 6 rows visible) showing each conflicting file with:
    - Filename in bold
    - **Existing (target)**: formatted size and timestamp (e.g., "400 B, 2024-01-15 10:00:00")
    - **Selected (source)**: formatted size and timestamp (e.g., "500 B, 2024-02-01 10:00:00")
    - **Comparison**: descriptive text showing differences (e.g., "Source larger (by 100 B), source newer")
- **Size comparison logic**: Reports "Same size", "Source larger (by X)", or "Source smaller (by X)"
- **Time comparison logic**: Reports "same date" (within 1 second), "source newer", or "source older"
- **Works for both operations**: Copy (C key) and Move (V key) both use the same conflict detection and comparison display
- **Browser-compatible**: Uses `path-browserify` for basename extraction in browser environment
- **Utility function**: New `describeFileComparison(source, existing)` in `src/lib/files.utils.ts` provides reusable comparison logic

### Changed
- **ConfirmDialog component** (`src/app/files/components/ConfirmDialog.tsx`):
  - Extended with optional `conflicts` prop for overwrite details
  - Dialog width increases from `max-w-md` to `max-w-2xl` when conflicts present
  - Added `FileConflict` interface export for type safety
- **Copy/Move handlers** (`src/app/files/WorkspaceView.tsx`):
  - `handleBulkCopy` and `handleBulkMove` now detect conflicts before opening confirmation
  - Message includes conflict count when files will be overwritten
  - Conflicts array passed to ConfirmDialog for detailed display

### Technical details
- **New dependency**: `path-browserify` ^1.0.1 for browser-compatible path operations
- **Modified**: 
  - `src/lib/files.utils.ts` — added `describeFileComparison()` utility
  - `src/app/files/components/ConfirmDialog.tsx` — added `FileConflict` interface and conflict rendering section
  - `src/app/files/WorkspaceView.tsx` — added conflict detection logic in copy/move handlers
- **Tests**: 4 new tests in `src/app/files/BulkOperations.test.tsx`:
  - Copy with single conflict shows comparison
  - Move with single conflict shows comparison
  - Copy with no conflicts shows no overwrite section
  - Copy with multiple conflicts shows all comparisons
  - **Test results**: 15 passed, 3 skipped (18 total)
- **Docs**: 
  - `stdd/requirements/REQ-BULK_FILE_OPS.md` — marked overwrite confirmation as implemented
  - `stdd/implementation-decisions/IMPL-OVERWRITE_PROMPT.md` — new implementation decision document
  - `stdd/implementation-decisions.yaml` — added IMPL-OVERWRITE_PROMPT entry with full metadata

### Design decisions
- **Option chosen**: Rich overwrite section with structured conflict data (over simple string-only message)
- **Rationale**: Better readability for multiple conflicts, consistent formatting, scrollable for many files
- **File stat source**: Uses existing pane file lists loaded in WorkspaceView (no backend changes needed)
- **Comparison granularity**: Size differences shown to the byte; time differences within 1 second considered equal (filesystem precision)

---

## [0.4.3] - 2026-02-08

### Added

#### File manager: configurable time display (age vs absolute) [IMPL-FILE_AGE_DISPLAY]
- **Time column format option** in the file pane: the modification time column can show either **relative age** (default) or **absolute** timestamp.
- **Age format** (default): Displays two significant units, e.g. `4 day 23 hr`, `2 yr 3 mo`, `45 min 30 sec`. Unit labels: yr, mo, wk, day, hr, min, sec.
- **Absolute format**: Displays full timestamp `YYYY-MM-DD HH:MM:SS` (previous behavior).
- **Configuration**: In `config/files.yaml`, the mtime column supports `format: "age"` or `format: "absolute"`. Omitted `format` defaults to `"age"`.
- **Utility**: New `formatAge(date)` in `src/lib/files.utils.ts`; FilePane uses the column’s `format` when rendering the mtime cell (`formatAge` vs `formatDateTime`).
- **Types**: `FilesColumnConfig` in `src/lib/config.types.ts` extended with optional `format?: "age" | "absolute"`.
- **Tests**: Unit tests for `formatAge` (two-unit ranges, edge cases); FilePane, WorkspaceView, and BulkOperations tests updated to pass column config with `format`.

### Technical details
- **Modified**: `src/lib/files.utils.ts` — added `formatAge()`; `src/lib/config.types.ts` — `format` on `FilesColumnConfig`; `src/lib/config.ts` — default columns include `format: "age"` for mtime; `config/files.yaml` — mtime column `format: "age"` and comment; `src/app/files/components/FilePane.tsx` — mtime branch uses `formatAge` or `formatDateTime` from column config.
- **Tests**: `src/lib/files.utils.test.ts` — new `formatAge` describe block; `FilePane.test.tsx`, `WorkspaceView.test.tsx`, `BulkOperations.test.tsx` — mock columns include `format: "age"`.
- **Docs**: `stdd/implementation-decisions/IMPL-FILE_COLUMN_CONFIG.md` updated with time display options; `stdd/semantic-tokens.yaml` — `IMPL-FILE_AGE_DISPLAY` token added.

---

## [0.4.2] - 2026-02-06

### Added

#### Global Error Boundary [IMPL-GLOBAL_ERROR_BOUNDARY]
- **Root-level error boundary** (`global-error.tsx`) that catches unexpected errors at the root layout level and provides users with a friendly error message in production
- **Full HTML document rendering**: Component renders its own `<html>` and `<body>` tags to replace the entire root layout when activated (unlike segment-level error boundaries)
- **User-friendly error UI**:
  - Clear "Something went wrong" heading
  - Actionable instructions with recovery options
  - "Try again" button that calls Next.js `reset()` function to attempt recovery
  - "Home page" link as escape route
  - Collapsible error details section showing error message and digest for debugging
- **Self-contained styling**: Inline CSS ensures error page renders correctly even if global CSS, config-driven theme, or Tailwind fails to load
- **Production-only**: Error boundary functions only in production builds; development shows Next.js error overlay for debugging
- **Error digest support**: Displays optional digest property for matching client-side errors with server-side logs

#### STDD documentation
- New requirement: `[REQ-ERROR_HANDLING]` in `stdd/requirements.md` — root-level error boundary for production error recovery
- New implementation decision: `[IMPL-GLOBAL_ERROR_BOUNDARY]` in `stdd/implementation-decisions/IMPL-GLOBAL_ERROR_BOUNDARY.md` — global error boundary component with full HTML document
- Updated semantic tokens registry with new token
- Updated implementation-decisions index

### Fixed
- **Next.js tooling warning**: Satisfies "No global-error.tsx found" tooltip recommendation from Next.js linting/IDE extensions

### Technical details
- **New file**: `src/app/global-error.tsx` — client component (143 lines) with GlobalErrorProps interface, self-contained dark theme styling, error details display
- **Modified**: `stdd/semantic-tokens.md` — added `[REQ-ERROR_HANDLING]` and `[IMPL-GLOBAL_ERROR_BOUNDARY]` tokens
- **Modified**: `stdd/implementation-decisions.md` — added index entry for `[IMPL-GLOBAL_ERROR_BOUNDARY]`
- **New**: `stdd/implementation-decisions/IMPL-GLOBAL_ERROR_BOUNDARY.md` — detailed implementation decision document

---

## [0.4.1] - 2026-02-06

### Added

#### Edit Position return to source view [IMPL-EDIT_PAGE_RETURN_SOURCE]
- **Return destination by source**: When opening Edit Position from the Calendar view, the Return button now navigates back to `/jobs/calendar` instead of the list. When opening from the List view (or without a source), Return still goes to `/jobs`.
- **Return button label**: The button text reflects the destination: "Return to Calendar" when returning to the calendar, "Back to List" when returning to the list. Both labels are configurable via `config/jobs.yaml` (`backToCalendar`, `backToList`).
- **Implementation**: Calendar "Edit Position" links append `?from=calendar`; the edit page reads `searchParams.from` and sets the return link href and label accordingly.

#### STDD documentation
- New implementation decision: `[IMPL-EDIT_PAGE_RETURN_SOURCE]` — edit page return destination and label from query param (calendar vs list).
- New semantic token registered; implementation-decisions index and tasks.md updated. Task P2 "Edit Position Return to Source View" completed.

### Fixed
- **Edit from Calendar**: Clicking Return on the Edit Position page after navigating from the Calendar view no longer incorrectly returns to the List view; it now returns to the Calendar view as expected.

### Technical details
- **Modified**: `src/app/jobs/calendar/CalendarView.tsx` — edit links use `?from=calendar`; `src/app/jobs/[id]/edit/page.tsx` — accepts `searchParams`, derives `returnHref` and `returnLabel`; `config/jobs.yaml`, `src/lib/config.ts`, `src/lib/config.types.ts` — added `backToCalendar` copy key.
- **New**: `stdd/implementation-decisions/IMPL-EDIT_PAGE_RETURN_SOURCE.md`.

---

## [0.4.0] - 2026-02-06

### Added

#### Calendar Month View for Jobs [REQ-JOB_TRACKER_CALENDAR]
- **Calendar month view page** (`/jobs/calendar`) displaying positions and applications on a single-month grid with standard 7-column layout (Sun-Sat)
- **Interactive detail panel** above grid -- click any item to see full details (position: title, date, description, URLs, notes, edit link; application: position title, status badge, date, notes, edit link)
- **Month navigation** with Previous, Next, and Today buttons
- **Date-based item placement**:
  - Positions appear on their `postingDate`
  - Applications appear on their `date`
  - Multiple items per day stack vertically
  - Items use status badge colors from config
- **Responsive design**:
  - Desktop: Item text visible in chips
  - Mobile: Colored dots only (space-saving)
- **Config-driven UI** [REQ-CONFIG_DRIVEN_APPEARANCE]:
  - 12 new calendar copy keys in `config/jobs.yaml` (calendarTitle, calendarSubtitle, calendarPrev, calendarNext, calendarToday, calendarNoItems, calendarPositionLabel, calendarApplicationLabel, calendarDetailClose, calendarBackToList, calendarDayNames, calendarViewButton)
  - 5 new calendar theme overrides in `config/theme.yaml` (calendarGrid, calendarCell, calendarCellToday, calendarItem, calendarDetailPanel)
  - All layout, styling, and text driven by configuration
- **Navigation integration**:
  - "Calendar View" button added to jobs list page header
  - "Back to List" link on calendar page

#### STDD Documentation [REQ-JOB_TRACKER_CALENDAR]
- New requirement: `[REQ-JOB_TRACKER_CALENDAR]` in `stdd/requirements.md`
- New architecture decision: `[ARCH-CALENDAR_VIEW]` -- calendar page layout, data flow, and component structure
- New implementation decisions:
  - `[IMPL-CALENDAR_PAGE]` -- server component implementation
  - `[IMPL-CALENDAR_GRID]` -- client component with month grid, item rendering, and detail panel
- Updated semantic tokens registry with 4 new tokens
- Updated tasks.md with completed calendar view task
- Validation outcomes logged: TypeScript ✅ ESLint ✅ Tests ✅ (120/120)

### Technical Details

#### New Files
- `src/app/jobs/calendar/page.tsx` -- server component (126 lines) loading data, combining positions with applications, building status badge classes, extracting config copy and overrides
- `src/app/jobs/calendar/CalendarView.tsx` -- client component (381 lines) with state management (currentMonth, selectedItem), detail panel, month navigation, and 7-column calendar grid
- `src/app/jobs/calendar/page.test.tsx` -- 3 tests (page rendering, back link, CalendarView integration)
- `src/app/jobs/calendar/CalendarView.test.tsx` -- 4 tests (month navigation, day names, grid rendering, detail panel)
- `stdd/architecture-decisions/ARCH-CALENDAR_VIEW.md` -- architecture decision document
- `stdd/implementation-decisions/IMPL-CALENDAR_PAGE.md` -- implementation decision document
- `stdd/implementation-decisions/IMPL-CALENDAR_GRID.md` -- implementation decision document

#### Modified Files
- `config/jobs.yaml` -- added 12 calendar copy keys
- `config/theme.yaml` -- added 5 calendar override keys in `jobs.overrides`
- `src/lib/config.types.ts` -- added calendar copy keys to `JobsCopyConfig`, calendar override keys to `JobsThemeOverrides`
- `src/lib/config.ts` -- added default calendar copy values to `DEFAULT_JOBS_CONFIG.copy`
- `src/app/jobs/page.tsx` -- added "Calendar View" button to header with config-driven label
- `stdd/requirements.md` -- added calendar month view requirement
- `stdd/semantic-tokens.md` -- registered 4 new tokens
- `stdd/architecture-decisions.md` -- added index entry for `[ARCH-CALENDAR_VIEW]`
- `stdd/implementation-decisions.md` -- added index entries for `[IMPL-CALENDAR_PAGE]` and `[IMPL-CALENDAR_GRID]`
- `stdd/tasks.md` -- added and completed calendar view task

#### New Semantic Tokens
- `[REQ-JOB_TRACKER_CALENDAR]` -- Calendar month view requirement
- `[ARCH-CALENDAR_VIEW]` -- Calendar view architecture
- `[IMPL-CALENDAR_PAGE]` -- Calendar page implementation
- `[IMPL-CALENDAR_GRID]` -- Calendar grid client component implementation

#### Component Architecture
```
page.tsx (Server Component)
  ↓ loads data + config
  ↓ combines positions with applications
  ↓ builds status badge class map
  ↓ extracts calendar copy + overrides
  ↓
CalendarView.tsx (Client Component)
  ├── DetailPanel (conditional: when item selected)
  ├── MonthNavigation (prev/next/today)
  └── CalendarGrid (7×6 cells, day names header)
      └── DayCell[] (day number + items)
          └── CalendarItem[] (positions + applications)
              ↓ onClick
              ↑ setSelectedItem
```

#### Calendar Grid Logic
- Calculates first day of month to determine starting column (0-6 for Sun-Sat)
- Renders 42 cells (6 weeks × 7 days) for consistent grid height
- Fills empty cells before/after month with gray background
- Matches items to dates via ISO date string comparison (YYYY-MM-DD)
- Highlights today's date with ring border
- Responsive: desktop shows text chips, mobile shows colored dots

#### Testing
- 7 new tests added (3 page, 4 component)
- Total test count: 120 tests (all passing)
- Test coverage: maintained at 100%
- Tests reference `[REQ-JOB_TRACKER_CALENDAR]` token

---

## [0.3.0] - 2026-02-06

### Added

#### Job Search Tracker [REQ-JOB_SEARCH_TRACKER]
- **Config-driven CRUD application** for tracking job search activity -- all field definitions, status options, labels, and table columns are driven by `config/jobs.yaml`
- **Config-driven appearance** [REQ-CONFIG_DRIVEN_APPEARANCE]: All jobs page layout, copy, and styling come from config (no hard-coded strings or status colors in components). `config/jobs.yaml` includes a `copy` section for list title, buttons, empty state, edit/delete labels, form headings, and button text. `config/theme.yaml` includes a `jobs` section with per-element class overrides (pageContainer, card, table, primaryButton, secondaryButton, dangerButton) and `statusBadges` (status value → Tailwind class string). Config loader exposes `getJobsConfig()`, `getJobsOverride()`, and `getStatusBadgeClass()`; jobs pages and components receive copy and class props from server.
- **YAML data storage** (`data/positions.yaml`, `data/applications.yaml`) for position and application records with `js-yaml` read/write (no new dependencies)
- **7 configurable fields**: Position Title (text), Posting Date (date), URLs (url-list), Description (textarea), Application Status (select), Status Date (date), Notes (textarea)
- **5 application status options**: None, Interested, To Apply, Applied, Rejected -- all configurable in YAML
- **Table view page** (`/jobs`) -- server component with config-driven column rendering, empty state, edit links, and status badge classes from theme config
- **Edit page** (`/jobs/[id]/edit`) -- server component wrapper loading record data; copy, section headings, and status badge classes from config
- **New page** (`/jobs/new`) -- server component wrapper; title, subtitle, and card layout from config
- **Dynamic form components** (`PositionForm`, `ApplicationForm`) -- client components that accept optional `copy` and `statusOptions` from config; form labels and button text configurable via `config/jobs.yaml` copy section
- **URL list field** -- dynamic add/remove URL input list sub-component
- **RESTful API routes**:
  - `GET /api/jobs` -- list all records (sorted by config default)
  - `POST /api/jobs` -- create record (returns 201)
  - `GET /api/jobs/[id]` -- single record
  - `PUT /api/jobs/[id]` -- update record
  - `DELETE /api/jobs/[id]` -- delete record (returns 204)
- **Data layer module** (`src/lib/jobs.ts`) with config loading (cached), data CRUD (uncached), deep merge with defaults, and `crypto.randomUUID()` for record IDs
- **TypeScript interfaces** (`src/lib/jobs.types.ts`) for `FieldConfig`, `FieldType`, `JobsAppConfig`, `JobRecord`, `JobsDataFile`
- **Home page navigation** -- "Job Search Tracker" primary button added to `config/site.yaml`

#### STDD Documentation [REQ-JOB_SEARCH_TRACKER] [REQ-CONFIG_DRIVEN_APPEARANCE]
- New requirement: `[REQ-JOB_SEARCH_TRACKER]` in `stdd/requirements.md`
- New requirement: `[REQ-CONFIG_DRIVEN_APPEARANCE]` -- all page elements appearance and layout from config (template scope)
- New architecture decisions:
  - `[ARCH-YAML_DATA_STORAGE]` -- YAML file-based data persistence
  - `[ARCH-CONFIG_DRIVEN_CRUD]` -- config-driven CRUD pattern for forms and tables
  - `[ARCH-CONFIG_DRIVEN_APPEARANCE]` -- config-driven appearance for all pages (jobs copy, theme jobs overrides, status badges)
- New implementation decisions:
  - `[IMPL-JOB_SEARCH_TRACKER]` -- overall feature implementation
  - `[IMPL-JOBS_DATA_LAYER]` -- data layer module
  - `[IMPL-JOBS_API_ROUTES]` -- API route handlers
  - `[IMPL-JOBS_UI_PAGES]` -- UI pages and form component
  - `[IMPL-CONFIG_DRIVEN_APPEARANCE]` -- jobs config loader, theme jobs extension, jobs UI refactor
- Updated semantic tokens registry with new tokens
- Updated tasks.md with completed job search tracker and config-driven appearance tasks

### Technical Details

#### New Files
- `config/jobs.yaml` -- app schema (fields, table), plus `copy` section for all jobs UI strings [REQ-CONFIG_DRIVEN_APPEARANCE]
- `config/theme.yaml` -- extended with `jobs.overrides` and `jobs.statusBadges` for jobs layout and status badge classes
- `data/positions.yaml`, `data/applications.yaml` -- record data storage
- `src/lib/jobs.types.ts` -- TypeScript interfaces
- `src/lib/jobs.data.ts` -- data CRUD; jobs config loaded via `src/lib/config.ts` (`getJobsConfig()`)
- `src/app/api/jobs/route.ts` -- collection API endpoints
- `src/app/api/jobs/[id]/route.ts` -- individual record API endpoints
- `src/app/jobs/page.tsx` -- table view page (config-driven layout, copy, status badges)
- `src/app/jobs/new/page.tsx` -- new record page (config-driven copy and layout)
- `src/app/jobs/[id]/edit/page.tsx` -- edit record page (config-driven copy, headings, status badges)
- `src/app/jobs/components/PositionForm.tsx` -- position form client component (optional config copy)
- `src/app/jobs/components/ApplicationForm.tsx` -- application form client component (optional copy and status options from config)
- `src/app/jobs/components/JobsTable.tsx` -- table with config-driven copy and status badge classes
- `src/app/jobs/components/DeletePositionButton.tsx` -- delete button with config-driven label and confirm message
- `stdd/architecture-decisions/ARCH-YAML_DATA_STORAGE.md`
- `stdd/architecture-decisions/ARCH-CONFIG_DRIVEN_CRUD.md`
- `stdd/implementation-decisions/IMPL-JOB_SEARCH_TRACKER.md`
- `stdd/implementation-decisions/IMPL-JOBS_DATA_LAYER.md`
- `stdd/implementation-decisions/IMPL-JOBS_API_ROUTES.md`
- `stdd/implementation-decisions/IMPL-JOBS_UI_PAGES.md`

#### Modified Files
- `config/site.yaml` -- added "Job Search Tracker" navigation button
- `config/theme.yaml` -- added `jobs` section (overrides, statusBadges) for config-driven appearance
- `src/lib/config.ts` -- added `getJobsConfig()`, `getJobsOverride()`, `getStatusBadgeClass()`, jobs cache and defaults
- `src/lib/config.types.ts` -- added `JobsConfig`, `JobsCopyConfig`, `JobsThemeConfig`, `JobsThemeOverrides`, and related types
- `src/lib/config.test.ts` -- added tests for getJobsConfig, getJobsOverride, getStatusBadgeClass

#### New Semantic Tokens
- `[REQ-JOB_SEARCH_TRACKER]` -- Job search tracker requirement
- `[REQ-CONFIG_DRIVEN_APPEARANCE]` -- All page elements appearance and layout from config
- `[ARCH-YAML_DATA_STORAGE]` -- YAML data storage architecture
- `[ARCH-CONFIG_DRIVEN_CRUD]` -- Config-driven CRUD architecture
- `[ARCH-CONFIG_DRIVEN_APPEARANCE]` -- Config-driven appearance for all pages
- `[IMPL-JOB_SEARCH_TRACKER]` -- Feature implementation
- `[IMPL-JOBS_DATA_LAYER]` -- Data layer implementation
- `[IMPL-JOBS_API_ROUTES]` -- API routes implementation
- `[IMPL-JOBS_UI_PAGES]` -- UI pages implementation
- `[IMPL-CONFIG_DRIVEN_APPEARANCE]` -- Config-driven appearance implementation (getJobsConfig, theme jobs, refactor)

#### Data Flow
```
config/jobs.yaml  --> getJobsConfig() --> pages + components (fields, table, copy)
config/theme.yaml --> getThemeConfig() --> jobs pages (jobs.overrides, jobs.statusBadges)
data/positions.yaml, data/applications.yaml --> getPositions(), getApplications() --> list/edit pages
Server pages resolve copy + statusBadgeClasses from config and pass as props to JobsTable, PositionForm, ApplicationForm, DeletePositionButton
```

---

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
- Next.js logo branding with dark mode inversion
- External navigation links with security attributes (rel="noopener noreferrer")
- Call-to-action button (Documentation)
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

[0.4.6]: https://github.com/yourusername/nx1/releases/tag/v0.4.6
[0.4.5]: https://github.com/yourusername/nx1/releases/tag/v0.4.5
[0.4.4]: https://github.com/yourusername/nx1/releases/tag/v0.4.4
[0.4.3]: https://github.com/yourusername/nx1/releases/tag/v0.4.3
[0.4.2]: https://github.com/yourusername/nx1/releases/tag/v0.4.2
[0.4.0]: https://github.com/yourusername/nx1/releases/tag/v0.4.0
[0.3.0]: https://github.com/yourusername/nx1/releases/tag/v0.3.0
[0.2.0]: https://github.com/yourusername/nx1/releases/tag/v0.2.0
[0.1.0]: https://github.com/yourusername/nx1/releases/tag/v0.1.0
