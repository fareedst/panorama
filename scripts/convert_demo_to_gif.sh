#!/bin/bash
# [IMPL-DEMO_SCREENSHOT_PIPELINE] [ARCH-DEMO_ASSET_PIPELINE] [REQ-README_DEMO_AUTOMATION]: how: CONVERT_COPYALL_GIF — wrapper around convert_readme_gif.sh for copyall-demo.gif

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
bash "$SCRIPT_DIR/convert_readme_gif.sh" "copyall-demo" "$SCRIPT_DIR/../docs/screenshots/copyall-demo.gif"
