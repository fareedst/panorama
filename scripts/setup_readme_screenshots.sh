#!/bin/bash
# [IMPL-DEMO_SCREENSHOT_PIPELINE] [ARCH-DEMO_ASSET_PIPELINE] [REQ-README_DEMO_AUTOMATION] [REQ-CROSS_PANE_COMPARISON]: how: SETUP_COMPARISON_FIXTURE — seed /tmp/test-dirs for comparison mode README screenshots
# Setup test directories for README workspace/comparison screenshots
#
# Creates /tmp/test-dirs/{alpha,beta,gamma} with shared filenames and
# deliberate size/mtime differences so comparison mode shows color-coded rows.
#
# Usage: ./setup_readme_screenshots.sh

set -e

BASE_DIR="/tmp/test-dirs"

echo "🧹 Preparing README screenshot directories..."
rm -rf "$BASE_DIR"
mkdir -p "$BASE_DIR/alpha" "$BASE_DIR/beta" "$BASE_DIR/gamma"

# --- alpha: full sample file set ---
cat > "$BASE_DIR/alpha/file1.txt" <<EOF
This is file1.txt
Sample content for demonstration purposes.
EOF

cat > "$BASE_DIR/alpha/file2.txt" <<EOF
This is file2.txt
This file will be marked and copied to all panes.
EOF

cat > "$BASE_DIR/alpha/file3.txt" <<EOF
This is file3.txt
This file will also be marked and copied to all panes.
EOF

cat > "$BASE_DIR/alpha/file4.txt" <<EOF
This is file4.txt
Another sample file for testing.
EOF

cat > "$BASE_DIR/alpha/file5.txt" <<EOF
This is file5.txt
Yet another sample file.
EOF

cat > "$BASE_DIR/alpha/document.txt" <<EOF
Sample Document
===============

This is a sample document file.
It contains multiple lines of text.
EOF

cat > "$BASE_DIR/alpha/report.txt" <<EOF
Monthly Report
==============

Date: 2026-02-10
Status: Complete
Items: 42
EOF

cat > "$BASE_DIR/alpha/readme.md" <<EOF
# README

This is a sample README file in markdown format.

## Features

- Feature 1
- Feature 2
- Feature 3
EOF

cat > "$BASE_DIR/alpha/data.json" <<EOF
{
  "name": "Sample Data",
  "version": "1.0.0",
  "items": [
    {"id": 1, "value": "alpha"},
    {"id": 2, "value": "beta"},
    {"id": 3, "value": "gamma"}
  ]
}
EOF

cat > "$BASE_DIR/alpha/config.yaml" <<EOF
# Sample Configuration
name: demo-config
version: 1.0.0
settings:
  enabled: true
  timeout: 30
  retries: 3
EOF

touch -t 202602100900 "$BASE_DIR/alpha/file1.txt"
touch -t 202602100930 "$BASE_DIR/alpha/file2.txt"
touch -t 202602101000 "$BASE_DIR/alpha/file3.txt"
touch -t 202602101030 "$BASE_DIR/alpha/file4.txt"
touch -t 202602101100 "$BASE_DIR/alpha/file5.txt"
touch -t 202602101130 "$BASE_DIR/alpha/document.txt"
touch -t 202602101200 "$BASE_DIR/alpha/report.txt"
touch -t 202602101230 "$BASE_DIR/alpha/readme.md"
touch -t 202602101300 "$BASE_DIR/alpha/data.json"
touch -t 202602101330 "$BASE_DIR/alpha/config.yaml"

mkdir -p "$BASE_DIR/alpha/demo-folder" "$BASE_DIR/alpha/projects"
echo "demo folder marker" > "$BASE_DIR/alpha/demo-folder/readme.txt"
echo "project alpha" > "$BASE_DIR/alpha/projects/readme.txt"

# --- beta: shared files with different sizes/mtimes + unique file ---
cat > "$BASE_DIR/beta/file2.txt" <<EOF
This is file2.txt (beta variant)
Different content for size comparison.
Extra line to make this file larger than alpha.
EOF

cat > "$BASE_DIR/beta/file3.txt" <<EOF
This is file3.txt
This file will also be marked and copied to all panes.
EOF

cat > "$BASE_DIR/beta/config.yaml" <<EOF
# Sample Configuration (beta)
name: demo-config-beta
version: 1.0.0
settings:
  enabled: false
  timeout: 60
  retries: 5
EOF

echo "Only in beta pane" > "$BASE_DIR/beta/only-beta.txt"

touch -t 202602100930 "$BASE_DIR/beta/file2.txt"
touch -t 202602101000 "$BASE_DIR/beta/file3.txt"
touch -t 202602101330 "$BASE_DIR/beta/config.yaml"
touch -t 202602101400 "$BASE_DIR/beta/only-beta.txt"

mkdir -p "$BASE_DIR/beta/demo-folder" "$BASE_DIR/beta/projects"
echo "demo folder marker" > "$BASE_DIR/beta/demo-folder/readme.txt"
echo "project beta" > "$BASE_DIR/beta/projects/readme.txt"

# --- gamma: shared files with different sizes/mtimes + unique file ---
cat > "$BASE_DIR/gamma/file2.txt" <<EOF
This is file2.txt
This file will be marked and copied to all panes.
EOF

cat > "$BASE_DIR/gamma/file3.txt" <<EOF
This is file3.txt (gamma variant)
Shorter gamma content.
EOF

cat > "$BASE_DIR/gamma/config.yaml" <<EOF
# Sample Configuration
name: demo-config
version: 1.0.0
settings:
  enabled: true
  timeout: 30
  retries: 3
EOF

echo "Only in gamma pane" > "$BASE_DIR/gamma/only-gamma.txt"

touch -t 202602100930 "$BASE_DIR/gamma/file2.txt"
touch -t 202602101500 "$BASE_DIR/gamma/file3.txt"
touch -t 202602101330 "$BASE_DIR/gamma/config.yaml"
touch -t 202602101600 "$BASE_DIR/gamma/only-gamma.txt"

mkdir -p "$BASE_DIR/gamma/demo-folder" "$BASE_DIR/gamma/projects"
echo "demo folder marker" > "$BASE_DIR/gamma/demo-folder/readme.txt"
echo "project gamma" > "$BASE_DIR/gamma/projects/readme.txt"

echo ""
echo "✅ README screenshot directories ready at $BASE_DIR"
echo "  alpha: $(ls -1 "$BASE_DIR/alpha" | wc -l | tr -d ' ') files"
echo "  beta:  $(ls -1 "$BASE_DIR/beta" | wc -l | tr -d ' ') files"
echo "  gamma: $(ls -1 "$BASE_DIR/gamma" | wc -l | tr -d ' ') files"
