#!/bin/bash
# [IMPL-DEMO_SCREENSHOT_PIPELINE] [ARCH-DEMO_ASSET_PIPELINE] [REQ-README_DEMO_AUTOMATION]: how: CONVERT_ALL_README_GIFS — batch convert motion demo webms to committed GIF assets

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONVERT="$SCRIPT_DIR/convert_readme_gif.sh"
OUT_DIR="$SCRIPT_DIR/../docs/screenshots"

declare -a GIFS=(
  "z-copyall-demo:copyall-demo.gif"
  "readme-workspace-motion-li:linked-mode-demo.gif"
  "readme-workspace-motion-co:comparison-cycle-demo.gif"
  "readme-workspace-motion-cr:cross-pane-visibility-demo.gif"
  "readme-workspace-motion-pa:pane-management-demo.gif"
)

for entry in "${GIFS[@]}"; do
  pattern="${entry%%:*}"
  output="${entry##*:}"
  bash "$CONVERT" "$pattern" "$OUT_DIR/$output"
done

echo "All README motion GIFs converted."
