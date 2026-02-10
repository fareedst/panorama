#!/bin/bash
# Demo session script for multi-panel copy/move (nsync) operations
#
# This script performs filesystem operations that mirror nx1's multi-panel
# copy and move capabilities: copy/move to next panel (single destination)
# and copy/move to all other panels (nsync multi-destination sync).
#
# Compatible with directory layouts created by goful's setup_test_dirs.sh
# (https://github.com/nickshanks/goful/blob/main/scripts/setup_test_dirs.sh)
#
# Usage:
#   ./demo_nsync_session.sh [options]
#
# Options:
#   --init              Create BASE_DIR and panel subdirs with sample files
#   --base-dir DIR      Root directory for test hierarchies (default: /tmp/test-dirs)
#   --panel-dirs LIST   Space-separated panel dir names (default: "alpha beta gamma")
#   --dry-run           Print operations without executing
#   --pause N           Sleep N seconds between steps (for recording)
#   --steps             Print step descriptions with timestamps
#   --scenario NAME     Session scenario: full, copy-only, move-only (default: full)
#   --help              Display this help message
#
# Examples:
#   # Initialize and run full demo session with pauses for recording
#   ./demo_nsync_session.sh --init --pause 2 --steps
#
#   # Use existing directory layout from goful setup
#   BASE_DIR=/tmp/test-5dirs ./demo_nsync_session.sh --panel-dirs "alpha beta gamma delta epsilon"
#
#   # Dry run to see what would be executed
#   ./demo_nsync_session.sh --init --dry-run --steps
#
# Related:
#   - nx1 CopyAll/MoveAll: src/app/files/WorkspaceView.tsx (handleCopyAll, handleMoveAll)
#   - Requirements: [REQ-NSYNC_MULTI_TARGET], [IMPL-NSYNC_ENGINE]

set -e  # Exit on error

# ============================================================================
# Configuration defaults
# ============================================================================
BASE_DIR="${BASE_DIR:-/tmp/test-dirs}"
PANEL_DIRS="${PANEL_DIRS:-alpha beta gamma}"
SCENARIO="${SCENARIO:-full}"
DRY_RUN=0
PAUSE_SECONDS=0
SHOW_STEPS=0
INIT_DIRS=0

# ============================================================================
# Color output
# ============================================================================
if [[ -t 1 ]]; then
    BOLD='\033[1m'
    GREEN='\033[0;32m'
    YELLOW='\033[0;33m'
    BLUE='\033[0;34m'
    CYAN='\033[0;36m'
    RESET='\033[0m'
else
    BOLD=''
    GREEN=''
    YELLOW=''
    BLUE=''
    CYAN=''
    RESET=''
fi

# ============================================================================
# Helper functions
# ============================================================================

show_usage() {
    cat <<EOF
${BOLD}Usage:${RESET} $0 [options]

${BOLD}Options:${RESET}
  --init              Create BASE_DIR and panel subdirs with sample files
  --base-dir DIR      Root directory for test hierarchies (default: /tmp/test-dirs)
  --panel-dirs LIST   Space-separated panel dir names (default: "alpha beta gamma")
  --dry-run           Print operations without executing
  --pause N           Sleep N seconds between steps (for recording)
  --steps             Print step descriptions with timestamps
  --scenario NAME     Session scenario: full, copy-only, move-only (default: full)
  --help              Display this help message

${BOLD}Scenarios:${RESET}
  full       - Copy to next, copy to all, move to next, move to all
  copy-only  - Only copy operations (to next and to all)
  move-only  - Only move operations (to next and to all)

${BOLD}Examples:${RESET}
  # Initialize and run full demo session with pauses for recording
  $0 --init --pause 2 --steps

  # Use existing directory layout from goful setup
  BASE_DIR=/tmp/test-5dirs $0 --panel-dirs "alpha beta gamma delta epsilon"

  # Dry run to see what would be executed
  $0 --init --dry-run --steps

${BOLD}Directory Layout:${RESET}
  Compatible with goful's setup_test_dirs.sh. Expected structure:
    BASE_DIR/
      alpha/
        file1, file2, file3, ...
      beta/
      gamma/
      ...

EOF
}

log() {
    echo -e "${GREEN}==>${RESET} $*"
}

log_step() {
    local step_num=$1
    shift
    local timestamp=""
    if [[ $SHOW_STEPS -eq 1 ]]; then
        timestamp=" ${CYAN}[$(date '+%H:%M:%S')]${RESET}"
    fi
    echo -e "${BOLD}Step $step_num:${RESET}$timestamp $*"
}

log_op() {
    echo -e "${BLUE}  →${RESET} $*"
}

# Execute command (or print if dry-run)
execute() {
    if [[ $DRY_RUN -eq 1 ]]; then
        echo -e "${YELLOW}[DRY-RUN]${RESET} $*"
    else
        log_op "$*"
        eval "$*"
    fi
}

# Pause between steps if requested
pause_if_needed() {
    if [[ $PAUSE_SECONDS -gt 0 ]]; then
        sleep "$PAUSE_SECONDS"
    fi
}

# Initialize directory structure with sample files
init_directories() {
    log "Initializing directory structure at ${BOLD}$BASE_DIR${RESET}"
    
    # Clean up existing directory (skip if dry-run)
    if [[ -d "$BASE_DIR" ]] && [[ $DRY_RUN -eq 0 ]]; then
        log_op "Removing existing directory: $BASE_DIR"
        rm -rf "$BASE_DIR"
    elif [[ -d "$BASE_DIR" ]] && [[ $DRY_RUN -eq 1 ]]; then
        log_op "Would remove existing directory: $BASE_DIR"
    fi
    
    # Create panel directories
    for dir in $PANEL_DIRS; do
        local dirpath="$BASE_DIR/$dir"
        execute "mkdir -p \"$dirpath\""
        
        # Create sample files in first directory (alpha or first in list)
        if [[ "$dir" == "${PANEL_DIRS%% *}" ]]; then
            for i in {1..5}; do
                execute "echo 'Sample content for file$i' > \"$dirpath/file$i.txt\""
            done
            execute "echo 'Document content' > \"$dirpath/document.txt\""
            execute "echo 'Report data' > \"$dirpath/report.txt\""
        fi
    done
    
    log "Directory structure created"
    echo ""
}

# Copy file(s) to next panel (single destination)
copy_next() {
    local src_dir=$1
    local next_dir=$2
    shift 2
    local files=("$@")
    
    local src_path="$BASE_DIR/$src_dir"
    local dest_path="$BASE_DIR/$next_dir"
    
    for file in "${files[@]}"; do
        if [[ -f "$src_path/$file" ]]; then
            execute "cp \"$src_path/$file\" \"$dest_path/$file\""
        else
            echo -e "${YELLOW}Warning: $src_path/$file not found, skipping${RESET}"
        fi
    done
}

# Copy file(s) to all other panels (nsync multi-destination)
copy_all() {
    local src_dir=$1
    shift
    local files=()
    local dest_dirs=()
    
    # Separate files from destination directories
    # Destinations are all panel dirs except source
    for dir in $PANEL_DIRS; do
        if [[ "$dir" != "$src_dir" ]]; then
            dest_dirs+=("$dir")
        fi
    done
    
    # Remaining args are files
    files=("$@")
    
    local src_path="$BASE_DIR/$src_dir"
    
    for file in "${files[@]}"; do
        if [[ -f "$src_path/$file" ]]; then
            for dest_dir in "${dest_dirs[@]}"; do
                local dest_path="$BASE_DIR/$dest_dir"
                execute "cp \"$src_path/$file\" \"$dest_path/$file\""
            done
        else
            echo -e "${YELLOW}Warning: $src_path/$file not found, skipping${RESET}"
        fi
    done
}

# Move file(s) to next panel (single destination)
move_next() {
    local src_dir=$1
    local next_dir=$2
    shift 2
    local files=("$@")
    
    local src_path="$BASE_DIR/$src_dir"
    local dest_path="$BASE_DIR/$next_dir"
    
    for file in "${files[@]}"; do
        if [[ -f "$src_path/$file" ]]; then
            execute "mv \"$src_path/$file\" \"$dest_path/$file\""
        else
            echo -e "${YELLOW}Warning: $src_path/$file not found, skipping${RESET}"
        fi
    done
}

# Move file(s) to all other panels (nsync multi-destination)
# Mirrors MoveAll semantics: copy to all destinations, then remove source
move_all() {
    local src_dir=$1
    shift
    local files=()
    local dest_dirs=()
    
    # Destinations are all panel dirs except source
    for dir in $PANEL_DIRS; do
        if [[ "$dir" != "$src_dir" ]]; then
            dest_dirs+=("$dir")
        fi
    done
    
    files=("$@")
    
    local src_path="$BASE_DIR/$src_dir"
    
    for file in "${files[@]}"; do
        if [[ -f "$src_path/$file" ]]; then
            # Copy to all destinations first
            for dest_dir in "${dest_dirs[@]}"; do
                local dest_path="$BASE_DIR/$dest_dir"
                execute "cp \"$src_path/$file\" \"$dest_path/$file\""
            done
            # Remove source after successful copy to all
            execute "rm \"$src_path/$file\""
        else
            echo -e "${YELLOW}Warning: $src_path/$file not found, skipping${RESET}"
        fi
    done
}

# Run demo session based on scenario
run_session() {
    local panel_array=($PANEL_DIRS)
    local panel_count=${#panel_array[@]}
    
    if [[ $panel_count -lt 2 ]]; then
        echo -e "${YELLOW}Error: Need at least 2 panel directories for demo${RESET}" >&2
        exit 1
    fi
    
    local p0="${panel_array[0]}"
    local p1="${panel_array[1]}"
    local p2="${panel_array[2]:-}"
    
    log "Starting demo session: ${BOLD}$SCENARIO${RESET}"
    log "Base directory: ${BOLD}$BASE_DIR${RESET}"
    log "Panel directories: ${BOLD}$PANEL_DIRS${RESET}"
    echo ""
    
    local step_num=1
    
    # Run copy operations for full and copy-only scenarios
    if [[ $SCENARIO == "full" ]] || [[ $SCENARIO == "copy-only" ]]; then
        # Step 1: Copy to next panel
        log_step $step_num "Copy file to next panel (${p0} → ${p1})"
        copy_next "$p0" "$p1" "file1.txt"
        pause_if_needed
        ((step_num++))
        echo ""
        
        # Step 2: Copy to all other panels (nsync)
        if [[ $panel_count -ge 3 ]]; then
            log_step $step_num "Copy file to all other panels (${p0} → all others) [nsync]"
            copy_all "$p0" "file2.txt"
            pause_if_needed
            ((step_num++))
            echo ""
        fi
        
        # Step 3: Copy multiple files to all panels
        if [[ $panel_count -ge 3 ]]; then
            log_step $step_num "Copy multiple files to all other panels (${p0} → all others) [nsync]"
            copy_all "$p0" "file3.txt" "document.txt"
            pause_if_needed
            ((step_num++))
            echo ""
        fi
    fi
    
    # Run move operations for full and move-only scenarios
    if [[ $SCENARIO == "full" ]] || [[ $SCENARIO == "move-only" ]]; then
        # Step 4/1: Move to next panel
        log_step $step_num "Move file to next panel (${p1} → ${p2:-$p0})"
        move_next "$p1" "${p2:-$p0}" "file1.txt"
        pause_if_needed
        ((step_num++))
        echo ""
        
        # Step 5/2: Move to all other panels (nsync)
        if [[ $panel_count -ge 3 ]]; then
            log_step $step_num "Move file to all other panels (${p0} → all others) [nsync]"
            move_all "$p0" "file4.txt"
            pause_if_needed
            ((step_num++))
            echo ""
        fi
    fi
    
    log "${GREEN}Demo session complete!${RESET}"
    echo ""
}

# Show summary of directory contents
show_summary() {
    log "${BOLD}Final State${RESET}"
    echo ""
    
    for dir in $PANEL_DIRS; do
        local dirpath="$BASE_DIR/$dir"
        if [[ -d "$dirpath" ]]; then
            local file_count=$(find "$dirpath" -maxdepth 1 -type f 2>/dev/null | wc -l | tr -d ' ')
            echo -e "  ${YELLOW}$dir/${RESET} - $file_count files"
            if [[ $file_count -gt 0 ]]; then
                find "$dirpath" -maxdepth 1 -type f -exec basename {} \; 2>/dev/null | sort | sed 's/^/    /'
            fi
        fi
    done
    
    echo ""
}

# ============================================================================
# Parse command line arguments
# ============================================================================

while [[ $# -gt 0 ]]; do
    case $1 in
        --init)
            INIT_DIRS=1
            shift
            ;;
        --base-dir)
            BASE_DIR="$2"
            shift 2
            ;;
        --panel-dirs)
            PANEL_DIRS="$2"
            shift 2
            ;;
        --scenario)
            SCENARIO="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=1
            shift
            ;;
        --pause)
            PAUSE_SECONDS="$2"
            shift 2
            ;;
        --steps)
            SHOW_STEPS=1
            shift
            ;;
        --help|-h)
            show_usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1" >&2
            show_usage
            exit 1
            ;;
    esac
done

# ============================================================================
# Validate inputs
# ============================================================================

case $SCENARIO in
    full|copy-only|move-only)
        ;;
    *)
        echo "Error: --scenario must be one of: full, copy-only, move-only" >&2
        exit 1
        ;;
esac

if [[ ! "$PAUSE_SECONDS" =~ ^[0-9]+$ ]]; then
    echo "Error: --pause must be a non-negative integer" >&2
    exit 1
fi

# ============================================================================
# Main execution
# ============================================================================

echo -e "${BOLD}nx1 Multi-Panel Demo Session${RESET}"
echo ""

# Initialize directories if requested
if [[ $INIT_DIRS -eq 1 ]]; then
    init_directories
fi

# Verify base directory exists (skip check in dry-run mode)
if [[ $DRY_RUN -eq 0 ]] && [[ ! -d "$BASE_DIR" ]]; then
    echo -e "${YELLOW}Error: Base directory $BASE_DIR does not exist${RESET}" >&2
    echo "Use --init to create it, or run goful's setup_test_dirs.sh first" >&2
    exit 1
fi

# Run the demo session
run_session

# Show summary
if [[ $DRY_RUN -eq 0 ]]; then
    show_summary
fi

log "Use these directories in nx1 file manager to see the results:"
for dir in $PANEL_DIRS; do
    echo "  $BASE_DIR/$dir"
done
echo ""

exit 0
