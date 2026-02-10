#!/bin/bash
# Setup test directories for CopyAll demo recording
#
# This script creates the directory structure needed for the CopyAll demo:
# - /tmp/test-dirs/alpha (with sample files)
# - /tmp/test-dirs/beta (empty)
# - /tmp/test-dirs/gamma (empty)
#
# Usage:
#   ./setup_copyall_demo.sh [--clean]
#
# Options:
#   --clean    Remove existing directories before creating new ones

set -e

BASE_DIR="/tmp/test-dirs"
CLEAN=0

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --clean)
            CLEAN=1
            shift
            ;;
        --help|-h)
            cat <<EOF
Setup test directories for CopyAll demo recording

Usage: $0 [--clean]

Options:
  --clean    Remove existing directories before creating new ones
  --help     Show this help message

Creates:
  /tmp/test-dirs/alpha/   - Source directory with sample files
  /tmp/test-dirs/beta/    - Empty target directory
  /tmp/test-dirs/gamma/   - Empty target directory

Sample files in alpha:
  - file1.txt through file5.txt
  - document.txt
  - report.txt
  - readme.md
  - data.json
  - config.yaml
EOF
            exit 0
            ;;
        *)
            echo "Unknown option: $1" >&2
            exit 1
            ;;
    esac
done

# Clean existing directories if requested
if [[ $CLEAN -eq 1 ]] && [[ -d "$BASE_DIR" ]]; then
    echo "🧹 Cleaning existing directories..."
    rm -rf "$BASE_DIR"
fi

# Create directory structure
echo "📁 Creating directory structure..."
mkdir -p "$BASE_DIR/alpha"
mkdir -p "$BASE_DIR/beta"
mkdir -p "$BASE_DIR/gamma"

# Create sample files in alpha
echo "📝 Creating sample files in alpha..."

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

# Set different timestamps for files (for visual variety in file manager)
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

# Summary
echo ""
echo "✅ Setup complete!"
echo ""
echo "Directory structure:"
echo "  📂 $BASE_DIR/alpha/   - $(ls -1 "$BASE_DIR/alpha" | wc -l | tr -d ' ') files"
echo "  📂 $BASE_DIR/beta/    - empty"
echo "  📂 $BASE_DIR/gamma/   - empty"
echo ""
echo "Files in alpha:"
ls -lh "$BASE_DIR/alpha/" | tail -n +2 | awk '{print "    " $9 " (" $5 ")"}'
echo ""
echo "Ready for CopyAll demo!"
echo ""
echo "Next steps:"
echo "  1. Start the app: npm run dev"
echo "  2. Navigate to http://localhost:3000/files"
echo "  3. Set panes to:"
echo "     - Pane 1: $BASE_DIR/alpha"
echo "     - Pane 2: $BASE_DIR/beta"
echo "     - Pane 3: $BASE_DIR/gamma"
echo "  4. Follow the manual in docs/COPYALL_DEMO_MANUAL.md"
echo ""
