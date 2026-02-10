# CopyAll Demo Recording Manual

## Purpose
This document provides step-by-step instructions for manually recording a CopyAll operation demo for documentation purposes.

## Prerequisites
- Application running at http://localhost:3000/files
- Test directories set up:
  - `/tmp/test-dirs/alpha` (with files)
  - `/tmp/test-dirs/beta` (mostly empty)
  - `/tmp/test-dirs/gamma` (mostly empty)

## Demo Workflow

### Step 1: Initial Setup
1. Navigate to http://localhost:3000/files
2. Wait for the page to fully load
3. **Verify**: 3 panes are visible in the workspace

### Step 2: Navigate Panes to Test Directories
1. **Pane 1** (left): Navigate to `/tmp/test-dirs/alpha`
2. **Pane 2** (middle): Navigate to `/tmp/test-dirs/beta`
3. **Pane 3** (right): Navigate to `/tmp/test-dirs/gamma`

**Screenshot 1**: `demo-01-initial-state.png`
- Capture: All 3 panes showing their respective directories
- Expected: Alpha has files, beta/gamma mostly empty

### Step 3: Mark Files in Alpha Pane
1. Focus pane 1 (alpha) by clicking on it
2. Click on `file2.txt` to select it
3. Press `Space` to mark it (should show visual marking indicator)
4. Click on `file3.txt` to select it
5. Press `Space` to mark it (should show visual marking indicator)

**Screenshot 2**: `demo-02-marked-files.png`
- Capture: Pane 1 with 2 files marked
- Expected: Visual indicators showing file2.txt and file3.txt are marked

### Step 4: Open CopyAll Dialog
1. Press `Shift+C` to trigger the CopyAll keyboard shortcut
2. Wait for the confirmation dialog to appear

**Screenshot 3**: `demo-03-copyall-dialog.png`
- Capture: The CopyAll confirmation dialog
- Expected: Dialog showing:
  - Number of marked files (2)
  - Source directory (alpha)
  - Target directories (beta, gamma)
  - Confirm/Cancel buttons

### Step 5: Confirm CopyAll Operation
1. Click the "Confirm" button in the dialog
2. Wait for the progress dialog to appear
3. Wait for the operation to complete

**Screenshot 4**: `demo-04-progress.png` (optional, if you can catch it)
- Capture: Progress dialog showing operation in progress
- Expected: Progress indicator, file count, status

### Step 6: Final Result
1. Wait for the operation to complete
2. Verify that beta and gamma panes now show the copied files

**Screenshot 5**: `demo-05-final-result.png`
- Capture: All 3 panes showing the final state
- Expected: 
  - Alpha still has original files (with marks cleared)
  - Beta now has file2.txt and file3.txt
  - Gamma now has file2.txt and file3.txt

## Screenshot Storage
Save all screenshots to:
```
/Users/fareed/Documents/dev/node/nx1/docs/screenshots/
```

## Screenshot Naming Convention
- `demo-01-initial-state.png` - Initial 3-pane layout with directories
- `demo-02-marked-files.png` - Files marked in alpha pane
- `demo-03-copyall-dialog.png` - CopyAll confirmation dialog
- `demo-04-progress.png` - Progress dialog (optional)
- `demo-05-final-result.png` - Final state with files copied to all panes

## Observations to Record

### Expected Behaviors
- [ ] Files can be marked with Space key
- [ ] Shift+C opens CopyAll dialog
- [ ] Dialog shows correct file count and directories
- [ ] Progress dialog appears during operation
- [ ] Files are copied to all other panes
- [ ] Marks are cleared after operation

### Potential Issues to Note
- [ ] Dialog doesn't appear (keyboard shortcut not working)
- [ ] Wrong file count in dialog
- [ ] Operation fails or hangs
- [ ] Files not copied to all target panes
- [ ] Marks not cleared after operation
- [ ] UI doesn't update after operation

## Testing Notes
- Browser: (record which browser you use)
- Date: (record date of test)
- App version/commit: (record git commit hash)
- Any issues encountered: (describe any problems)
