// [IMPL-DEMO_SCREENSHOT_PIPELINE] [ARCH-DEMO_ASSET_PIPELINE] [REQ-README_DEMO_AUTOMATION]: how: shared Playwright helpers for README demo asset capture

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { expect, type Locator, type Page } from "@playwright/test";

export const SCREENSHOT_DIR = path.join(__dirname, "../../docs/screenshots");
export const MIN_SCREENSHOT_BYTES = 10_000;
export const MIN_DIALOG_SCREENSHOT_BYTES = 2_500;
export const DEFAULT_VIEWPORT = { width: 1600, height: 900 };
export const COMPARISON_FIXTURE_PATHS = [
  "/tmp/test-dirs/alpha",
  "/tmp/test-dirs/beta",
  "/tmp/test-dirs/gamma",
];

const REPO_ROOT = path.join(__dirname, "../..");
const SETUP_README_SCRIPT = path.join(REPO_ROOT, "scripts/setup_readme_screenshots.sh");
const SETUP_COPYALL_SCRIPT = path.join(REPO_ROOT, "scripts/setup_copyall_demo.sh");

export function ensureScreenshotDir() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
}

export function ensureComparisonFixture() {
  execSync(`bash "${SETUP_README_SCRIPT}"`, { cwd: REPO_ROOT, stdio: "pipe" });
}

export function ensureCopyAllFixture() {
  execSync(`bash "${SETUP_COPYALL_SCRIPT}" --clean`, { cwd: REPO_ROOT, stdio: "pipe" });
}

export function screenshotPath(filename: string) {
  return path.join(SCREENSHOT_DIR, filename);
}

export function assertScreenshotWritten(filePath: string, minBytes = MIN_SCREENSHOT_BYTES) {
  expect(fs.existsSync(filePath)).toBe(true);
  expect(fs.statSync(filePath).size).toBeGreaterThan(minBytes);
}

export async function assertScreenshot(
  target: Page | Locator,
  filePath: string,
  options?: { fullPage?: boolean; minBytes?: number },
) {
  ensureScreenshotDir();
  if ("screenshot" in target && typeof target.screenshot === "function") {
    await target.screenshot({ path: filePath, fullPage: options?.fullPage });
  } else {
    await (target as Locator).screenshot({ path: filePath });
  }
  assertScreenshotWritten(filePath, options?.minBytes);
}

export function buildPaneDeepLink(paths: string[]) {
  const params = paths.map((p, i) => `pane${i}=${encodeURIComponent(p)}`).join("&");
  return `/files?${params}`;
}

export async function openWorkspaceDeepLink(page: Page, paths = COMPARISON_FIXTURE_PATHS) {
  await page.setViewportSize(DEFAULT_VIEWPORT);
  await page.goto(buildPaneDeepLink(paths));
  await page.waitForLoadState("networkidle");
  await page.keyboard.press("Escape");
  await page.waitForSelector('[data-testid="pane-0"]', { timeout: 15000 });
  await page.waitForSelector('[data-testid="file-row-grid"]', { timeout: 15000 });
}

export async function cycleToolbarDisplayMode(page: Page, times: number) {
  const toggle = page.getByTestId("toolbar-compact-toggle");
  for (let i = 0; i < times; i += 1) {
    await toggle.click();
    await page.waitForTimeout(300);
  }
}

export async function openContextMenuOnFile(
  page: Page,
  paneIndex: number,
  filename: string,
) {
  const row = page
    .getByTestId(`pane-${paneIndex}`)
    .getByTestId("file-row-grid")
    .filter({ hasText: filename })
    .first();
  await row.scrollIntoViewIfNeeded();
  await row.click({ button: "right", force: true });
  await page.waitForTimeout(300);
}

export async function openContextMenuOnDirectory(
  page: Page,
  paneIndex: number,
  dirname: string,
) {
  await openContextMenuOnFile(page, paneIndex, dirname);
}

export async function dismissOverlays(page: Page) {
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
}

export async function enableComparisonMode(page: Page) {
  const comparisonButton = page.getByTestId("toolbar-view.comparison");
  await comparisonButton.click();
  await page.waitForTimeout(300);
  await comparisonButton.click();
  await page.waitForTimeout(500);
  await expect(comparisonButton).toHaveClass(/bg-blue/);
}

/** [REQ-PANE_DISPLAY_FILTER] [REQ-CROSS_PANE_VISIBILITY] Stable ids for README pane-filter demo catalogs */
export const README_DEMO_DISPLAY_SPEC_IDS = {
  hideTmp: "readme-demo-hide-tmp",
  hideFolder: "readme-demo-hide-folder",
  textOnly: "readme-demo-text-only",
} as const;

export const README_DEMO_CROSS_PANE_PRESET_IDS = {
  sharedAll: "readme-demo-shared-all",
  missingSome: "readme-demo-missing-some",
  sizeLargest: "readme-demo-size-largest",
} as const;

const README_DEMO_TIMESTAMP = "2026-06-01T00:00:00.000Z";

function buildReadmeDisplaySpecCatalog() {
  return {
    specs: [
      {
        id: README_DEMO_DISPLAY_SPEC_IDS.hideTmp,
        name: "Hide temp files",
        description: "README demo — exclude temporary files",
        version: 1,
        createdAt: README_DEMO_TIMESTAMP,
        updatedAt: README_DEMO_TIMESTAMP,
        rules: [
          {
            id: "readme-rule-hide-tmp",
            action: "exclude",
            target: "file",
            pattern: "*.tmp",
            order: 0,
            enabled: true,
          },
        ],
      },
      {
        id: README_DEMO_DISPLAY_SPEC_IDS.hideFolder,
        name: "Hide demo folder",
        description: "README demo — exclude demo-folder directory",
        version: 1,
        createdAt: README_DEMO_TIMESTAMP,
        updatedAt: README_DEMO_TIMESTAMP,
        rules: [
          {
            id: "readme-rule-hide-folder",
            action: "exclude",
            target: "directory",
            pattern: "demo-folder",
            order: 0,
            enabled: true,
          },
        ],
      },
      {
        id: README_DEMO_DISPLAY_SPEC_IDS.textOnly,
        name: "Text files only",
        description: "README demo — include text files",
        version: 1,
        createdAt: README_DEMO_TIMESTAMP,
        updatedAt: README_DEMO_TIMESTAMP,
        rules: [
          {
            id: "readme-rule-text-only",
            action: "include",
            target: "file",
            pattern: "*.txt",
            order: 0,
            enabled: true,
          },
        ],
      },
    ],
  };
}

function buildReadmeCrossPaneVisibilityCatalog() {
  return {
    presets: [
      {
        id: README_DEMO_CROSS_PANE_PRESET_IDS.sharedAll,
        name: "Shared in all panes",
        description: "README demo — sharedAll include",
        version: 1,
        createdAt: README_DEMO_TIMESTAMP,
        updatedAt: README_DEMO_TIMESTAMP,
        state: {
          toggles: { sharedAll: "include" },
          sizeThreshold: null,
          timeThreshold: null,
        },
      },
      {
        id: README_DEMO_CROSS_PANE_PRESET_IDS.missingSome,
        name: "Missing from some",
        description: "README demo — missingSome include",
        version: 1,
        createdAt: README_DEMO_TIMESTAMP,
        updatedAt: README_DEMO_TIMESTAMP,
        state: {
          toggles: { missingSome: "include" },
          sizeThreshold: null,
          timeThreshold: null,
        },
      },
      {
        id: README_DEMO_CROSS_PANE_PRESET_IDS.sizeLargest,
        name: "Largest size",
        description: "README demo — sizeLargestAll include",
        version: 1,
        createdAt: README_DEMO_TIMESTAMP,
        updatedAt: README_DEMO_TIMESTAMP,
        state: {
          toggles: { sizeLargestAll: "include" },
          sizeThreshold: null,
          timeThreshold: null,
        },
      },
    ],
  };
}

/** [REQ-PANE_DISPLAY_FILTER] [REQ-CROSS_PANE_VISIBILITY] Seed localStorage catalogs before workspace navigation */
export async function seedReadmePaneFilterCatalogs(page: Page) {
  const displayCatalog = buildReadmeDisplaySpecCatalog();
  const visibilityCatalog = buildReadmeCrossPaneVisibilityCatalog();
  await page.addInitScript(
    ({ displayKey, displayCatalog, visibilityKey, visibilityCatalog }) => {
      localStorage.setItem(displayKey, JSON.stringify(displayCatalog));
      localStorage.setItem(visibilityKey, JSON.stringify(visibilityCatalog));
    },
    {
      displayKey: "panorama.displaySpecs.v1",
      displayCatalog,
      visibilityKey: "panorama.crossPaneVisibility.v1",
      visibilityCatalog,
    },
  );
}

const README_PANE_FILTER_SELECTIONS = [
  {
    displaySpecId: README_DEMO_DISPLAY_SPEC_IDS.hideTmp,
    presetId: README_DEMO_CROSS_PANE_PRESET_IDS.sharedAll,
  },
  {
    displaySpecId: README_DEMO_DISPLAY_SPEC_IDS.hideFolder,
    presetId: README_DEMO_CROSS_PANE_PRESET_IDS.missingSome,
  },
  {
    displaySpecId: README_DEMO_DISPLAY_SPEC_IDS.textOnly,
    presetId: README_DEMO_CROSS_PANE_PRESET_IDS.sizeLargest,
  },
] as const;

/** [REQ-PANE_DISPLAY_FILTER] [REQ-CROSS_PANE_VISIBILITY] Apply distinct active spec and preset per pane */
export async function applyReadmePaneFilterSelections(page: Page) {
  for (let paneIndex = 0; paneIndex < README_PANE_FILTER_SELECTIONS.length; paneIndex += 1) {
    const { displaySpecId, presetId } = README_PANE_FILTER_SELECTIONS[paneIndex];
    const pane = page.getByTestId(`pane-${paneIndex}`);
    await pane.getByTestId("pane-display-spec-selector").selectOption(displaySpecId);
    await page.waitForTimeout(500);
    await pane.getByTestId("pane-cross-pane-visibility-selector").selectOption(presetId);
    await page.waitForTimeout(500);
  }
  await page.waitForLoadState("networkidle");
}

/** [REQ-PANE_DISPLAY_FILTER] [REQ-CROSS_PANE_VISIBILITY] Open workspace with seeded catalogs and per-pane filter selections */
export async function openWorkspaceWithPaneFilters(page: Page, paths = COMPARISON_FIXTURE_PATHS) {
  await seedReadmePaneFilterCatalogs(page);
  await page.setViewportSize(DEFAULT_VIEWPORT);
  await page.goto(buildPaneDeepLink(paths));
  await page.waitForLoadState("networkidle");
  await page.keyboard.press("Escape");
  await page.waitForSelector('[data-testid="pane-0"]', { timeout: 15000 });
  await page.waitForSelector('[data-testid="file-row-grid"]', { timeout: 15000 });
  await enableComparisonMode(page);
  await applyReadmePaneFilterSelections(page);
  await page.waitForTimeout(800);
}

export async function createMeshWithDepots(
  page: Page,
  meshName: string,
  depots: { name: string; root: string }[],
) {
  await page.goto("/mesh");
  await page.getByTestId("new-mesh-name").fill(meshName);
  await page.getByTestId("create-mesh-btn").click();
  await expect(page.getByRole("link", { name: meshName })).toBeVisible({ timeout: 10000 });
  await page.getByRole("link", { name: meshName }).click();
  await expect(page.getByTestId("mesh-detail")).toBeVisible();
  for (const depot of depots) {
    await page.getByTestId("add-depot-name").fill(depot.name);
    await page.getByTestId("add-depot-root").fill(depot.root);
    await page.getByTestId("add-depot-btn").click();
    await expect(page.getByTestId("depot-summary")).toContainText(depot.name, { timeout: 5000 });
  }
}

export async function addMeshLink(page: Page, source: string, target: string) {
  await page.getByTestId("add-link-source").selectOption({ label: source });
  await page.getByTestId("add-link-target").selectOption({ label: target });
  await page.getByTestId("add-link-btn").click();
}

export async function generateAndApprovePlan(page: Page) {
  await page.getByTestId("mesh-detail-nav").getByRole("link", { name: "Plan" }).click();
  await expect(page.getByTestId("plan-view")).toBeVisible();
  await page.getByTestId("generate-plan-btn").click();
  await expect(page.getByTestId("change-set-table")).toBeVisible({ timeout: 10000 });
  await page.getByTestId("approve-plan-btn").click();
  await expect(page.getByTestId("plan-approved")).toBeVisible({ timeout: 10000 });
}
