#!/bin/bash
# Convert Playwright test video to optimized GIF

set -e

# Find the most recent test video (macOS compatible)
VIDEO=$(find test-results -name "*.webm" -type f -print0 2>/dev/null | xargs -0 ls -t 2>/dev/null | head -1)

if [ -z "$VIDEO" ]; then
  echo "Error: No video found in test-results/"
  exit 1
fi

echo "Converting video: $VIDEO"

OUTPUT_DIR="docs/screenshots"
OUTPUT_FILE="$OUTPUT_DIR/copyall-demo.gif"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
  echo "Error: ffmpeg is not installed"
  echo "Install with: brew install ffmpeg"
  exit 1
fi

# Convert with high quality using two-pass palette
echo "Step 1: Generating palette..."
ffmpeg -i "$VIDEO" -vf "fps=15,scale=800:-1:flags=lanczos,palettegen" \
  -y /tmp/palette.png 2>&1 | grep -v "frame=" || true

echo "Step 2: Creating GIF..."
ffmpeg -i "$VIDEO" -i /tmp/palette.png \
  -lavfi "fps=15,scale=800:-1:flags=lanczos[x];[x][1:v]paletteuse" \
  -y "$OUTPUT_FILE" 2>&1 | grep -v "frame=" || true

# Optimize with gifsicle if available
if command -v gifsicle &> /dev/null; then
  echo "Step 3: Optimizing GIF..."
  gifsicle -O3 --lossy=80 -o "${OUTPUT_FILE}.tmp" "$OUTPUT_FILE"
  mv "${OUTPUT_FILE}.tmp" "$OUTPUT_FILE"
else
  echo "Note: gifsicle not found, skipping optimization (install with: brew install gifsicle)"
fi

echo "GIF created: $OUTPUT_FILE"
ls -lh "$OUTPUT_FILE"
