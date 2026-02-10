# E2E Testing Setup for nx1

## Overview

Playwright has been successfully installed and configured for automated testing and demo recording of the nx1 file manager.

## What's Been Implemented

### 1. Playwright Installation ✅
- `@playwright/test` v1.58.2 installed
- Chromium browser binaries installed
- Configuration file created: `playwright.config.ts`

### 2. Configuration ✅
- Test directory: `e2e/`
- Automatic dev server startup
- Video recording enabled for all tests
- Screenshot capture on failure
- Single worker to avoid conflicts

### 3. NPM Scripts Added ✅
```bash
npm run test:e2e          # Run E2E tests headless
npm run test:e2e:ui       # Run with Playwright UI
npm run test:e2e:headed   # Run with visible browser
npm run demo:record       # Full automation: setup → test → GIF
npm run demo:setup        # Reset test directories
npm run demo:convert      # Convert video to GIF
npm run demo:verify       # Verify screenshots exist
```

### 4. Component Updates ✅
- Added `data-testid` attributes to FilePane components
- Updated WorkspaceView to pass test IDs to panes
- Enables reliable element selection in tests

### 5. Video Conversion Script ✅
- `scripts/convert_demo_to_gif.sh` created
- Converts Playwright videos to optimized GIFs
- Uses ffmpeg with palette generation for quality
- Optional gifsicle optimization

## Current Status

### Working
- Playwright installation and configuration
- Video recording capability
- Screenshot capture
- Test infrastructure
- Data test IDs in components

### In Progress
- E2E test script navigation logic
- Modal dialog handling on app startup
- File selection and interaction automation

## Known Issues

1. **Modal Dialog Interference**: The app shows a settings/configuration modal on first load that blocks interactions
   - **Solution**: Press Escape key multiple times at test start
   - **Alternative**: Add a query parameter to skip the modal in test mode

2. **Path Navigation**: The test currently struggles to navigate panes to specific directories
   - **Current approach**: Trying to find and fill path input fields
   - **Alternative approaches**:
     - Use URL query parameters to set initial pane paths
     - Start test with panes already in correct directories
     - Use keyboard shortcuts for navigation (if they exist)
     - Manually click through directory tree

## Files Created/Modified

### New Files
- `playwright.config.ts` - Playwright configuration
- `e2e/copyall-demo.spec.ts` - Demo recording test script
- `scripts/convert_demo_to_gif.sh` - Video to GIF conversion
- `docs/E2E_TESTING_SETUP.md` - This document

### Modified Files
- `package.json` - Added E2E test scripts
- `src/app/files/WorkspaceView.tsx` - Added data-testid props
- `src/app/files/components/FilePane.tsx` - Added data-testid support
- `.gitignore` - Already had Playwright directories

## Next Steps to Complete Automation

### Option 1: Fix Navigation in Current Test
1. Identify the correct way to navigate panes (keyboard shortcut? UI element?)
2. Update test to close/bypass the startup modal reliably
3. Wait for file listings to load before interacting

### Option 2: Simpler Test Approach
1. **Skip navigation**: Place test files in user's home directory
2. **Use default panes**: Work with whatever directories are shown by default
3. **Manual setup**: Document steps to manually set panes before running test

### Option 3: URL-Based Init
1. Add query parameter support to WorkspaceView (e.g. `?pane1=/tmp/test-dirs/alpha`)
2. Update test to use URL with pre-configured pane paths
3. Simplifies test logic significantly

## Manual Testing (Current Workaround)

Until automated test is fully working, use this workflow:

```bash
# 1. Setup test data
./scripts/setup_copyall_demo.sh --clean

# 2. Start app
npm run dev

# 3. Manually in browser:
#    - Open http://localhost:3000/files
#    - Close any modal dialogs (press Escape)
#    - Navigate panes to /tmp/test-dirs/alpha, beta, gamma
#    - Mark file2.txt and file3.txt in alpha pane
#    - Press Shift+C for CopyAll
#    - Confirm dialog
#    - Take screenshots at each step

# 4. Verify
./scripts/verify_demo_screenshots.sh
```

## System Requirements

### NPM Packages
- `@playwright/test` ✅ Installed

### System Tools (for GIF conversion)
- `ffmpeg` - Install with: `brew install ffmpeg`
- `gifsicle` (optional) - Install with: `brew install gifsicle`

## Artifacts Produced

When E2E test runs successfully, it produces:

1. **Screenshots** (in `docs/screenshots/`):
   - demo-01-initial-state.png
   - demo-02-marked-files.png
   - demo-03-copyall-dialog.png
   - demo-04-progress.png (if captured)
   - demo-05-final-result.png

2. **Video** (in `test-results/`):
   - `*/video.webm` - Full recording of test run

3. **GIF** (after conversion):
   - `docs/screenshots/copyall-demo.gif` - Optimized for documentation

4. **Test Report**:
   - `playwright-report/index.html` - Interactive test results

## Useful Commands

```bash
# Run test in headed mode to see what's happening
npm run test:e2e:headed

# Run test with UI for debugging
npm run test:e2e:ui

# View test trace for failed test
npx playwright show-trace test-results/.../trace.zip

# Check what files were created
ls -la /tmp/test-dirs/*/

# Verify screenshots
./scripts/verify_demo_screenshots.sh
```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Next.js E2E Testing](https://nextjs.org/docs/testing#playwright)
- Test results: `test-results/` directory
- Test videos: Look for `video.webm` in test result folders

## Status Summary

**Infrastructure**: ✅ Complete  
**Test Script**: ⚠️ In Progress (navigation issues)  
**Video Recording**: ✅ Working  
**GIF Conversion**: ✅ Ready  
**Documentation**: ✅ Complete

**Recommended Next Action**: Implement Option 3 (URL-based initialization) or use manual testing workflow until navigation is resolved.
