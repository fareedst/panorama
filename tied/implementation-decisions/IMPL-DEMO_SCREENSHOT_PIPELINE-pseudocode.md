# IMPL-DEMO_SCREENSHOT_PIPELINE essence pseudocode

// [IMPL-DEMO_SCREENSHOT_PIPELINE] [ARCH-DEMO_ASSET_PIPELINE] [REQ-README_DEMO_AUTOMATION]: how: one-command npm demo:screenshots produces all committed docs/screenshots assets via fixture scripts, modular Playwright specs, GIF conversion, and verify

## SETUP_COMPARISON_FIXTURE

// [IMPL-DEMO_SCREENSHOT_PIPELINE] [ARCH-DEMO_ASSET_PIPELINE] [REQ-README_DEMO_AUTOMATION] [REQ-CROSS_PANE_COMPARISON]: how: bash setup_readme_screenshots.sh wipes /tmp/test-dirs and seeds alpha/beta/gamma with shared filenames, demo-folder, projects subdirs, and deliberate size/mtime deltas

CONTRACT SETUP_COMPARISON_FIXTURE
  INPUT: none
  OUTPUT: /tmp/test-dirs/{alpha,beta,gamma} with comparison demo fixture
  DATA: demo-folder, projects, only-beta.txt, only-gamma.txt, shared file2.txt/file3.txt/config.yaml variants

PROCEDURE IMPL-DEMO_SCREENSHOT_PIPELINE_SETUP_COMPARISON_FIXTURE()
  RM -rf /tmp/test-dirs
  MKDIR alpha beta gamma under /tmp/test-dirs
  WRITE alpha full sample file set with touch -t mtimes plus demo-folder and projects
  WRITE beta/gamma partial shared files with different sizes and mtimes
  WRITE pane-unique only-beta.txt and only-gamma.txt

## SETUP_COPYALL_FIXTURE

// [IMPL-DEMO_SCREENSHOT_PIPELINE] [ARCH-DEMO_ASSET_PIPELINE] [REQ-README_DEMO_AUTOMATION] [REQ-NSYNC_MULTI_TARGET]: how: bash setup_copyall_demo.sh --clean rebuilds /tmp/test-dirs with alpha populated and beta/gamma empty targets for CopyAll demo

CONTRACT SETUP_COPYALL_FIXTURE
  INPUT: optional --clean flag
  OUTPUT: /tmp/test-dirs layout for CopyAll E2E
  DATA: alpha file1..file5 and metadata files; beta/gamma empty directories

PROCEDURE IMPL-DEMO_SCREENSHOT_PIPELINE_SETUP_COPYALL_FIXTURE()
  IF --clean THEN RM -rf /tmp/test-dirs
  MKDIR alpha beta gamma
  POPULATE alpha with sample files for marking and copy
  LEAVE beta and gamma empty as destinations

## CAPTURE_WORKSPACE_SURFACES

// [IMPL-DEMO_SCREENSHOT_PIPELINE] [ARCH-DEMO_ASSET_PIPELINE] [REQ-README_DEMO_AUTOMATION] [REQ-MULTI_PANE_LAYOUT] [REQ-TOOLBAR_SYSTEM]: how: readme-workspace-surfaces.spec.ts captures workspace-shell, cross-surface nav, pane listing, toolbar compact/expanded/named, and legacy 3-pane-workspace/comparison PNGs

CONTRACT CAPTURE_WORKSPACE_SURFACES
  INPUT: comparison fixture, dev server at /files
  OUTPUT: workspace-*.png and 3-pane-*.png under docs/screenshots
  DATA: pane URL deep link; toolbar-compact-toggle cycles display modes

PROCEDURE IMPL-DEMO_SCREENSHOT_PIPELINE_CAPTURE_WORKSPACE_SURFACES()
  IN beforeAll INVOKE SETUP_COMPARISON_FIXTURE
  GOTO pane URL deep link; WAIT pane-0
  SCREENSHOT fullPage workspace-shell and 3-pane-workspace
  SCREENSHOT workspace-cross-surface-nav and workspace-pane-listing elements
  CAPTURE toolbar compact default, expanded after one toggle, named after two toggles
  ENABLE comparison mode; WRITE 3-pane-comparison.png

## CAPTURE_WORKSPACE_PANE_FILTERS

// [IMPL-DEMO_SCREENSHOT_PIPELINE] [ARCH-DEMO_ASSET_PIPELINE] [REQ-README_DEMO_AUTOMATION] [REQ-PANE_DISPLAY_FILTER] [REQ-CROSS_PANE_VISIBILITY]: how: readme-workspace-pane-filters.spec.ts seeds display spec and cross-pane visibility catalogs, applies distinct active spec/preset per pane, captures workspace-pane-filter-controls.png and workspace-pane-filter-header.png

CONTRACT CAPTURE_WORKSPACE_PANE_FILTERS
  INPUT: comparison fixture, seeded localStorage catalogs via seedReadmePaneFilterDemo
  OUTPUT: workspace-pane-filter-controls.png, workspace-pane-filter-header.png
  DATA: pane-display-spec-selector; pane-cross-pane-visibility-selector; pane-filter-header test id; per-pane activeDisplaySpecId and activeCrossPaneVisibilityId

PROCEDURE IMPL-DEMO_SCREENSHOT_PIPELINE_CAPTURE_WORKSPACE_PANE_FILTERS()
  IN beforeAll INVOKE SETUP_COMPARISON_FIXTURE
  SEED panorama.displaySpecs.v1 and panorama.crossPaneVisibility.v1 with deterministic demo specs/presets
  GOTO pane URL deep link; ENABLE comparison mode
  FOR each pane index SELECT distinct display spec and cross-pane visibility preset via header selectors
  CAPTURE fullPage workspace-pane-filter-controls showing per-pane independence
  CAPTURE pane-filter-header crop on focused pane with both selectors and Filter/Compare indicator line

## CAPTURE_WORKSPACE_DIALOGS

// [IMPL-DEMO_SCREENSHOT_PIPELINE] [ARCH-DEMO_ASSET_PIPELINE] [REQ-README_DEMO_AUTOMATION] [REQ-MOUSE_INTERACTION] [REQ-PANE_DISPLAY_FILTER] [REQ-CROSS_PANE_VISIBILITY]: how: readme-workspace-dialogs.spec.ts opens context menu and toolbar/header dialogs; element screenshots for dialog-*.png, popover-layout-picker.png, menu-file-context.png

CONTRACT CAPTURE_WORKSPACE_DIALOGS
  INPUT: comparison fixture with demo-folder directory row
  OUTPUT: seventeen static workspace overlay PNGs including filter construction dialogs
  DATA: context menu test ids; display-spec-catalog-{id}; cross-pane-visibility-catalog-{id}; cross-pane-visibility-new-from-draft; display-spec-rule-editor

PROCEDURE IMPL-DEMO_SCREENSHOT_PIPELINE_CAPTURE_WORKSPACE_DIALOGS()
  SEED filter catalogs via seedReadmePaneFilterCatalogs before workspace load
  OPEN context menu on file2.txt; CAPTURE menu-file-context
  OPEN Touch, Execute, Make directory, Rename Regex dialogs from context menu
  OPEN Set base directory on demo-folder row
  OPEN pane order, column order, layout picker dialogs from toolbar
  SET compare-filter draft sizeGtThreshold include; OPEN compare filter threshold dialog from toolbar
  OPEN display spec manager overview from pane selector __manage__; CAPTURE dialog-display-spec-manager.png
  SELECT seeded catalog entry; CAPTURE dialog-display-spec-construct.png with display-spec-rule-editor visible
  OPEN cross-pane visibility manager overview; CAPTURE dialog-cross-pane-visibility-manager.png
  SET toolbar tri-state draft on focused pane; OPEN manager and New from focused draft; CAPTURE dialog-cross-pane-visibility-construct.png
  OPEN save-workspace-mesh create via Control+Shift+M

## CAPTURE_WORKSPACE_MOTION_GIFS

// [IMPL-DEMO_SCREENSHOT_PIPELINE] [ARCH-DEMO_ASSET_PIPELINE] [REQ-README_DEMO_AUTOMATION] [REQ-LINKED_PANES] [REQ-CROSS_PANE_COMPARISON] [REQ-CROSS_PANE_VISIBILITY]: how: readme-workspace-motion.spec.ts records linked-mode-demo, comparison-cycle-demo, cross-pane-visibility-demo, pane-management-demo webms for GIF conversion

CONTRACT CAPTURE_WORKSPACE_MOTION_GIFS
  INPUT: comparison fixture, Playwright video on
  OUTPUT: four webm files under test-results matched by describe name
  DATA: L key linked mode; toolbar-view.comparison cycle; tri-state compareFilter buttons; pane.add swap layout picker

PROCEDURE IMPL-DEMO_SCREENSHOT_PIPELINE_CAPTURE_WORKSPACE_MOTION_GIFS()
  RECORD linked navigation entering projects directory across panes
  RECORD comparison mode cycling four clicks
  RECORD tri-state compare filter toolbar clicks after comparison enabled
  RECORD layout OneRow, pane add, swap, pane order dialog

## CAPTURE_MESH_SURFACES

// [IMPL-DEMO_SCREENSHOT_PIPELINE] [ARCH-DEMO_ASSET_PIPELINE] [REQ-README_DEMO_AUTOMATION] [REQ-MESH_GUI]: how: readme-mesh-surfaces.spec.ts creates meshes with mkdtemp depots; captures mesh-list and per-route mesh-*.png including workspace-snapshot-summary on detail

CONTRACT CAPTURE_MESH_SURFACES
  INPUT: ephemeral MESH_DATA_DIR from Playwright webServer env
  OUTPUT: mesh-list.png and mesh-{route}.png assets
  DATA: save workspace from /files then add depots and links on mesh detail

PROCEDURE IMPL-DEMO_SCREENSHOT_PIPELINE_CAPTURE_MESH_SURFACES()
  CREATE two meshes on /mesh for sortable list screenshot
  SAVE workspace as mesh from three-pane deep link; ADD depots and links
  CAPTURE detail overview with workspace-snapshot-summary, topology, plan approval, sync session, depots, export, schedule, archive settings, open-workspace link

## CAPTURE_MESH_BRIDGE

// [IMPL-DEMO_SCREENSHOT_PIPELINE] [ARCH-DEMO_ASSET_PIPELINE] [REQ-README_DEMO_AUTOMATION] [REQ-WORKSPACE_MESH_BRIDGE]: how: readme-mesh-bridge.spec.ts restores workspace from mesh, captures workspace-header-status, workspace diff dialog, save update mode dialog

CONTRACT CAPTURE_MESH_BRIDGE
  INPUT: mkdtemp pane directories
  OUTPUT: workspace-header-status.png, dialog-workspace-diff.png, dialog-save-workspace-mesh-update.png
  DATA: layout drift Tile vs OneRow; workspace-diff-header-button; save-workspace-mesh-mode-update

PROCEDURE IMPL-DEMO_SCREENSHOT_PIPELINE_CAPTURE_MESH_BRIDGE()
  SAVE workspace after OneRow layout change
  RESTORE via open-workspace-from-mesh in new tab
  CHANGE layout to Tile; OPEN workspace diff dialog
  OPEN save dialog in update mode

## CAPTURE_COPYALL_WORKFLOW

// [IMPL-DEMO_SCREENSHOT_PIPELINE] [ARCH-DEMO_ASSET_PIPELINE] [REQ-README_DEMO_AUTOMATION] [REQ-NSYNC_MULTI_TARGET] [REQ-FILE_MARKING_WEB]: how: Playwright copyall-demo.spec.ts marks files, triggers toolbar-file.copyAll, captures step PNGs and webm video

CONTRACT CAPTURE_COPYALL_WORKFLOW
  INPUT: CopyAll fixture, dev server
  OUTPUT: demo-01..demo-05 PNGs (demo-04 optional), Playwright webm under test-results
  DATA: toolbar-file.copyAll, Space marking, Confirm button

PROCEDURE IMPL-DEMO_SCREENSHOT_PIPELINE_CAPTURE_COPYALL_WORKFLOW()
  IN beforeAll INVOKE SETUP_COPYALL_FIXTURE via execSync setup_copyall_demo.sh --clean
  GOTO pane URL deep link with /tmp/test-dirs paths
  CAPTURE demo-01-initial-state through demo-05-final-result screenshots
  MARK file2.txt and file3.txt in pane-0; CLICK toolbar-file.copyAll
  CONFIRM dialog; OPTIONAL capture demo-04-progress if visible
  ASSERT file2.txt and file3.txt each appear three times after sync

## CONVERT_README_GIFS

// [IMPL-DEMO_SCREENSHOT_PIPELINE] [ARCH-DEMO_ASSET_PIPELINE] [REQ-README_DEMO_AUTOMATION]: how: convert_readme_gif.sh converts one webm to GIF; convert_all_readme_gifs.sh batch-writes five motion GIFs

CONTRACT CONVERT_README_GIFS
  INPUT: test-results/*.webm matched by describe slug
  OUTPUT: copyall-demo.gif, linked-mode-demo.gif, comparison-cycle-demo.gif, cross-pane-visibility-demo.gif, pane-management-demo.gif
  DATA: ffmpeg palette + gifsicle optimization

PROCEDURE IMPL-DEMO_SCREENSHOT_PIPELINE_CONVERT_README_GIFS()
  FOR each motion slug IN copyall-demo linked-mode-demo comparison-cycle-demo cross-pane-visibility-demo pane-management-demo
    FIND webm path matching slug
    CONVERT to docs/screenshots/{slug}.gif

## VERIFY_DEMO_ASSETS

// [IMPL-DEMO_SCREENSHOT_PIPELINE] [ARCH-DEMO_ASSET_PIPELINE] [REQ-README_DEMO_AUTOMATION]: how: verify_demo_screenshots.sh resolves SCREENSHOT_DIR relative to script repo root and checks full PNG and GIF manifest

CONTRACT VERIFY_DEMO_ASSETS
  INPUT: docs/screenshots directory
  OUTPUT: exit 0 when all required assets exist
  DATA: workspace, dialog, mesh, legacy CopyAll PNGs; five GIFs

PROCEDURE IMPL-DEMO_SCREENSHOT_PIPELINE_VERIFY_DEMO_ASSETS()
  SET SCREENSHOT_DIR := repo_root/docs/screenshots via SCRIPT_DIR/../docs/screenshots
  FOR each required asset IN REQUIRED_SCREENSHOTS and REQUIRED_GIFS
    IF missing THEN increment MISSING_COUNT and report
  EXIT non-zero IF any missing

## NPM_DEMO_SCREENSHOTS

// [IMPL-DEMO_SCREENSHOT_PIPELINE] [ARCH-DEMO_ASSET_PIPELINE] [REQ-README_DEMO_AUTOMATION]: how: package.json demo:screenshots chains setup-readme, setup, playwright preflight, six E2E specs, convert_all_readme_gifs, and demo:verify

CONTRACT NPM_DEMO_SCREENSHOTS
  INPUT: npm run demo:screenshots
  OUTPUT: refreshed docs/screenshots product tour assets
  DATA: each E2E describe beforeAll re-runs its fixture because demo:setup wipes /tmp/test-dirs between prelude steps

PROCEDURE IMPL-DEMO_SCREENSHOT_PIPELINE_NPM_DEMO_SCREENSHOTS()
  RUN demo:setup-readme
  RUN demo:setup with --clean
  RUN playwright-preflight
  RUN readme-workspace-surfaces, readme-workspace-pane-filters, readme-workspace-dialogs, readme-workspace-motion, readme-mesh-surfaces, readme-mesh-bridge, copyall-demo specs
  RUN convert_all_readme_gifs
  RUN demo:verify

## CodeLocations

// [IMPL-DEMO_SCREENSHOT_PIPELINE] [ARCH-DEMO_ASSET_PIPELINE] [REQ-README_DEMO_AUTOMATION]: map implementing artifacts

// FILE: e2e/helpers/readme-demo.ts — shared fixture and screenshot helpers
// FILE: e2e/readme-workspace-surfaces.spec.ts — CAPTURE_WORKSPACE_SURFACES
// FILE: e2e/readme-workspace-pane-filters.spec.ts — CAPTURE_WORKSPACE_PANE_FILTERS
// FILE: e2e/readme-workspace-dialogs.spec.ts — CAPTURE_WORKSPACE_DIALOGS
// FILE: e2e/readme-workspace-motion.spec.ts — CAPTURE_WORKSPACE_MOTION_GIFS
// FILE: e2e/readme-mesh-surfaces.spec.ts — CAPTURE_MESH_SURFACES
// FILE: e2e/readme-mesh-bridge.spec.ts — CAPTURE_MESH_BRIDGE
// FILE: e2e/z-copyall-demo.spec.ts — CAPTURE_COPYALL_WORKFLOW
// FILE: scripts/setup_readme_screenshots.sh — SETUP_COMPARISON_FIXTURE
// FILE: scripts/setup_copyall_demo.sh — SETUP_COPYALL_FIXTURE
// FILE: scripts/convert_readme_gif.sh — CONVERT_README_GIFS single
// FILE: scripts/convert_all_readme_gifs.sh — CONVERT_README_GIFS batch
// FILE: scripts/verify_demo_screenshots.sh — VERIFY_DEMO_ASSETS
// FILE: package.json — NPM_DEMO_SCREENSHOTS scripts

// e2e_only_reason: bash fixtures and Playwright screenshot/video writes require browser and filesystem; not unit-testable. Release maintainers run npm run demo:screenshots before committing README visuals.
