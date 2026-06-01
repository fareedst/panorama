#!/bin/bash
# [IMPL-DEMO_SCREENSHOT_PIPELINE] [ARCH-DEMO_ASSET_PIPELINE] [REQ-README_DEMO_AUTOMATION]: how: CONVERT_README_GIF — convert a Playwright webm to an optimized docs/screenshots GIF
# Usage: ./scripts/convert_readme_gif.sh <webm-glob-or-path> <output.gif>

set -e

if [ $# -lt 2 ]; then
  echo "Usage: $0 <webm-glob-or-path> <output.gif>"
  exit 1
fi

INPUT_PATTERN="$1"
OUTPUT_FILE="$2"
OUTPUT_DIR="$(dirname "$OUTPUT_FILE")"

mkdir -p "$OUTPUT_DIR"

VIDEO=""
if [ -f "$INPUT_PATTERN" ]; then
  VIDEO="$INPUT_PATTERN"
else
  VIDEO=$(find test-results -path "*${INPUT_PATTERN}*" -name '*.webm' -type f -print0 2>/dev/null \
    | xargs -0 ls -t 2>/dev/null | head -1)
fi

if [ -z "$VIDEO" ]; then
  echo "Error: No video found for pattern: $INPUT_PATTERN"
  exit 1
fi

echo "Converting video: $VIDEO -> $OUTPUT_FILE"

if ! command -v ffmpeg &> /dev/null; then
  echo "Error: ffmpeg is not installed"
  exit 1
fi

ffmpeg -i "$VIDEO" -vf "fps=15,scale=800:-1:flags=lanczos,palettegen" \
  -y /tmp/palette.png 2>&1 | grep -v "frame=" || true

ffmpeg -i "$VIDEO" -i /tmp/palette.png \
  -lavfi "fps=15,scale=800:-1:flags=lanczos[x];[x][1:v]paletteuse" \
  -y "$OUTPUT_FILE" 2>&1 | grep -v "frame=" || true

if command -v gifsicle &> /dev/null; then
  gifsicle -O3 --lossy=80 -o "${OUTPUT_FILE}.tmp" "$OUTPUT_FILE"
  mv "${OUTPUT_FILE}.tmp" "$OUTPUT_FILE"
fi

echo "GIF created: $OUTPUT_FILE"
ls -lh "$OUTPUT_FILE"
