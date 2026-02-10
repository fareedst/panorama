#!/bin/bash
# Verify CopyAll Demo Screenshots
# This script checks that all required demo screenshots exist

SCREENSHOT_DIR="/Users/fareed/Documents/dev/node/nx1/docs/screenshots"

echo "Verifying CopyAll demo screenshots..."
echo "Screenshot directory: $SCREENSHOT_DIR"
echo ""

# Required screenshots
REQUIRED_SCREENSHOTS=(
    "demo-01-initial-state.png"
    "demo-02-marked-files.png"
    "demo-03-copyall-dialog.png"
    "demo-05-final-result.png"
)

# Optional screenshots
OPTIONAL_SCREENSHOTS=(
    "demo-04-progress.png"
)

# Check required screenshots
MISSING_COUNT=0
for screenshot in "${REQUIRED_SCREENSHOTS[@]}"; do
    if [ -f "$SCREENSHOT_DIR/$screenshot" ]; then
        echo "✅ Found: $screenshot"
        # Get file size
        SIZE=$(ls -lh "$SCREENSHOT_DIR/$screenshot" | awk '{print $5}')
        echo "   Size: $SIZE"
    else
        echo "❌ Missing: $screenshot"
        ((MISSING_COUNT++))
    fi
done

echo ""
echo "Optional screenshots:"
for screenshot in "${OPTIONAL_SCREENSHOTS[@]}"; do
    if [ -f "$SCREENSHOT_DIR/$screenshot" ]; then
        echo "✅ Found: $screenshot"
        SIZE=$(ls -lh "$SCREENSHOT_DIR/$screenshot" | awk '{print $5}')
        echo "   Size: $SIZE"
    else
        echo "⚠️  Not found: $screenshot (optional)"
    fi
done

echo ""
if [ $MISSING_COUNT -eq 0 ]; then
    echo "✅ All required screenshots present!"
    exit 0
else
    echo "❌ Missing $MISSING_COUNT required screenshot(s)"
    exit 1
fi
