#!/bin/bash
# [IMPL-DEMO_SCREENSHOT_PIPELINE] [ARCH-DEMO_ASSET_PIPELINE] [REQ-README_DEMO_AUTOMATION]: how: VERIFY_DEMO_ASSETS — repo-relative check for required docs/screenshots files

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SCREENSHOT_DIR="$SCRIPT_DIR/../docs/screenshots"

echo "Verifying README demo assets..."
echo "Screenshot directory: $SCREENSHOT_DIR"
echo ""

REQUIRED_SCREENSHOTS=(
  "3-pane-workspace.png"
  "3-pane-comparison.png"
  "workspace-shell.png"
  "workspace-cross-surface-nav.png"
  "workspace-pane-listing.png"
  "workspace-pane-filter-controls.png"
  "workspace-pane-filter-header.png"
  "workspace-toolbar-compact.png"
  "workspace-toolbar-expanded.png"
  "workspace-toolbar-named.png"
  "workspace-header-status.png"
  "menu-file-context.png"
  "dialog-set-base-directory.png"
  "dialog-touch-file.png"
  "dialog-execute-file.png"
  "dialog-make-directory.png"
  "dialog-rename-regex.png"
  "dialog-pane-order.png"
  "dialog-column-order.png"
  "dialog-save-workspace-mesh-create.png"
  "dialog-save-workspace-mesh-update.png"
  "dialog-workspace-diff.png"
  "dialog-display-spec-manager.png"
  "dialog-display-spec-construct.png"
  "dialog-cross-pane-visibility-manager.png"
  "dialog-cross-pane-visibility-construct.png"
  "dialog-compare-filter-threshold.png"
  "popover-layout-picker.png"
  "mesh-list.png"
  "mesh-detail-overview.png"
  "mesh-topology.png"
  "mesh-plan-approval.png"
  "mesh-sync-session.png"
  "mesh-depots.png"
  "mesh-export.png"
  "mesh-schedule.png"
  "mesh-archive-settings.png"
  "mesh-open-workspace.png"
  "demo-01-initial-state.png"
  "demo-02-marked-files.png"
  "demo-03-copyall-dialog.png"
  "demo-05-final-result.png"
)

REQUIRED_GIFS=(
  "copyall-demo.gif"
  "linked-mode-demo.gif"
  "comparison-cycle-demo.gif"
  "cross-pane-visibility-demo.gif"
  "pane-management-demo.gif"
)

OPTIONAL_SCREENSHOTS=(
  "demo-04-progress.png"
)

MISSING_COUNT=0

for screenshot in "${REQUIRED_SCREENSHOTS[@]}"; do
  if [ -f "$SCREENSHOT_DIR/$screenshot" ]; then
    echo "✅ Found: $screenshot"
  else
    echo "❌ Missing: $screenshot"
    ((MISSING_COUNT++))
  fi
done

for gif in "${REQUIRED_GIFS[@]}"; do
  if [ -f "$SCREENSHOT_DIR/$gif" ]; then
    echo "✅ Found: $gif"
  else
    echo "❌ Missing: $gif"
    ((MISSING_COUNT++))
  fi
done

echo ""
echo "Optional screenshots:"
for screenshot in "${OPTIONAL_SCREENSHOTS[@]}"; do
  if [ -f "$SCREENSHOT_DIR/$screenshot" ]; then
    echo "✅ Found: $screenshot"
  else
    echo "⚠️  Not found: $screenshot (optional)"
  fi
done

echo ""
if [ $MISSING_COUNT -eq 0 ]; then
  echo "✅ All required README demo assets present!"
  exit 0
else
  echo "❌ Missing $MISSING_COUNT required asset(s)"
  exit 1
fi
