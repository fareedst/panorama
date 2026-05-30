# IMPL-DEMO_SCREENSHOT_PIPELINE essence pseudocode

// [IMPL-DEMO_SCREENSHOT_PIPELINE] [ARCH-DEMO_ASSET_PIPELINE] [REQ-README_DEMO_AUTOMATION]: how: one-command npm demo:screenshots produces all committed docs/screenshots assets via fixture scripts, Playwright capture, GIF conversion, and optional verify

## SETUP_COMPARISON_FIXTURE

// [IMPL-DEMO_SCREENSHOT_PIPELINE] [ARCH-DEMO_ASSET_PIPELINE] [REQ-README_DEMO_AUTOMATION] [REQ-CROSS_PANE_COMPARISON]: how: bash setup_readme_screenshots.sh wipes /tmp/test-dirs and seeds alpha/beta/gamma with shared filenames and deliberate size/mtime deltas for comparison mode coloring

CONTRACT SETUP_COMPARISON_FIXTURE
  INPUT: none
  OUTPUT: /tmp/test-dirs/{alpha,beta,gamma} with comparison demo fixture
  DATA: only-beta.txt, only-gamma.txt, shared file2.txt/file3.txt/config.yaml variants

PROCEDURE IMPL-DEMO_SCREENSHOT_PIPELINE_SETUP_COMPARISON_FIXTURE()
  RM -rf /tmp/test-dirs
  MKDIR alpha beta gamma under /tmp/test-dirs
  WRITE alpha full sample file set with touch -t mtimes
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

## CAPTURE_WORKSPACE_AND_COMPARISON

// [IMPL-DEMO_SCREENSHOT_PIPELINE] [ARCH-DEMO_ASSET_PIPELINE] [REQ-README_DEMO_AUTOMATION] [REQ-MULTI_PANE_LAYOUT] [REQ-CROSS_PANE_COMPARISON] [REQ-TOOLBAR_SYSTEM]: how: Playwright readme-screenshots.spec.ts uses pane URL deep link, toggles toolbar-view.comparison twice, asserts active class, writes 3-pane-workspace.png and 3-pane-comparison.png

CONTRACT CAPTURE_WORKSPACE_AND_COMPARISON
  INPUT: dev server at /files, comparison fixture on disk
  OUTPUT: docs/screenshots/3-pane-workspace.png, 3-pane-comparison.png
  DATA: viewport 1600x900; data-testid pane-0, toolbar-view.comparison

PROCEDURE IMPL-DEMO_SCREENSHOT_PIPELINE_CAPTURE_WORKSPACE_AND_COMPARISON()
  IN beforeAll INVOKE SETUP_COMPARISON_FIXTURE via execSync setup_readme_screenshots.sh
  SET viewport 1600 x 900
  GOTO /files?pane0=/tmp/test-dirs/alpha&pane1=/tmp/test-dirs/beta&pane2=/tmp/test-dirs/gamma
  WAIT networkidle; PRESS Escape; WAIT pane-0 and file2.txt
  SCREENSHOT fullPage to 3-pane-workspace.png
  ASSERT file2.txt visible in at least two panes
  CLICK toolbar-view.comparison twice; ASSERT comparison button has active class bg-blue
  SCREENSHOT fullPage to 3-pane-comparison.png
  ASSERT each PNG file size greater than minimum threshold

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

## CONVERT_COPYALL_GIF

// [IMPL-DEMO_SCREENSHOT_PIPELINE] [ARCH-DEMO_ASSET_PIPELINE] [REQ-README_DEMO_AUTOMATION]: how: convert_demo_to_gif.sh prefers copyall-demo webm then falls back to newest test-results video; writes docs/screenshots/copyall-demo.gif

CONTRACT CONVERT_COPYALL_GIF
  INPUT: test-results/*.webm
  OUTPUT: docs/screenshots/copyall-demo.gif
  DATA: ffmpeg palette + gifsicle optimization

PROCEDURE IMPL-DEMO_SCREENSHOT_PIPELINE_CONVERT_COPYALL_GIF()
  FIND webm path matching copyall-demo first
  IF none THEN FIND newest webm in test-results
  IF none THEN ERROR no video
  CONVERT to copyall-demo.gif at docs/screenshots

## VERIFY_DEMO_ASSETS

// [IMPL-DEMO_SCREENSHOT_PIPELINE] [ARCH-DEMO_ASSET_PIPELINE] [REQ-README_DEMO_AUTOMATION]: how: verify_demo_screenshots.sh resolves SCREENSHOT_DIR relative to script repo root and checks required PNG/GIF list

CONTRACT VERIFY_DEMO_ASSETS
  INPUT: docs/screenshots directory
  OUTPUT: exit 0 when all required assets exist with size report
  DATA: 3-pane-workspace, 3-pane-comparison, demo-01..03, demo-05, copyall-demo.gif

PROCEDURE IMPL-DEMO_SCREENSHOT_PIPELINE_VERIFY_DEMO_ASSETS()
  SET SCREENSHOT_DIR := repo_root/docs/screenshots via SCRIPT_DIR/../docs/screenshots
  FOR each required asset IN REQUIRED_SCREENSHOTS
    IF missing THEN increment MISSING_COUNT and report
  EXIT non-zero IF any missing

## NPM_DEMO_SCREENSHOTS

// [IMPL-DEMO_SCREENSHOT_PIPELINE] [ARCH-DEMO_ASSET_PIPELINE] [REQ-README_DEMO_AUTOMATION]: how: package.json demo:screenshots chains setup-readme, setup, playwright preflight, both E2E specs, convert, and demo:verify; demo:record aliases demo:screenshots

CONTRACT NPM_DEMO_SCREENSHOTS
  INPUT: npm run demo:screenshots
  OUTPUT: refreshed docs/screenshots assets
  DATA: each E2E spec beforeAll re-runs its fixture because demo:setup wipes /tmp/test-dirs between prelude steps

PROCEDURE IMPL-DEMO_SCREENSHOT_PIPELINE_NPM_DEMO_SCREENSHOTS()
  RUN demo:setup-readme
  RUN demo:setup with --clean
  RUN playwright-preflight
  RUN playwright e2e/readme-screenshots.spec.ts e2e/copyall-demo.spec.ts
  RUN demo:convert
  RUN demo:verify

## CodeLocations

// [IMPL-DEMO_SCREENSHOT_PIPELINE] [ARCH-DEMO_ASSET_PIPELINE] [REQ-README_DEMO_AUTOMATION]: map implementing artifacts

// FILE: e2e/readme-screenshots.spec.ts — CAPTURE_WORKSPACE_AND_COMPARISON
// FILE: e2e/copyall-demo.spec.ts — CAPTURE_COPYALL_WORKFLOW
// FILE: scripts/setup_readme_screenshots.sh — SETUP_COMPARISON_FIXTURE
// FILE: scripts/setup_copyall_demo.sh — SETUP_COPYALL_FIXTURE
// FILE: scripts/convert_demo_to_gif.sh — CONVERT_COPYALL_GIF
// FILE: scripts/verify_demo_screenshots.sh — VERIFY_DEMO_ASSETS
// FILE: package.json — NPM_DEMO_SCREENSHOTS scripts

// e2e_only_reason: bash fixtures and Playwright screenshot/video writes require browser and filesystem; not unit-testable. Release maintainers run npm run demo:screenshots before committing README visuals.
