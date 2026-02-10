# Demo Automation - Quick Reference

## TL;DR - One Command

```bash
npm run demo:record
```

**Output**: 4 screenshots + 1 GIF (1.9 MB) + 1 video (~35 seconds)

## What It Does

Fully automated CopyAll demo recording:
1. Resets test directories (`/tmp/test-dirs/{alpha,beta,gamma}`)
2. Starts dev server automatically
3. Opens browser with pre-configured panes via URL
4. Marks files and triggers CopyAll operation
5. Captures screenshots at each step
6. Records full video
7. Converts to optimized GIF

**No human intervention required!**

## Generated Files

After running `npm run demo:record`:

```
docs/screenshots/
  ├── demo-01-initial-state.png    (100 KB) - 3 panes loaded
  ├── demo-02-marked-files.png     (100 KB) - Files marked
  ├── demo-03-copyall-dialog.png   (112 KB) - Confirmation dialog
  ├── demo-05-final-result.png     (109 KB) - Files copied
  └── copyall-demo.gif             (1.9 MB) - Full demo as GIF

test-results/
  └── */video.webm                 (~1 MB) - Full video recording
```

## Available Commands

```bash
# Complete automation pipeline
npm run demo:record       # Setup → Test → Convert to GIF

# Individual steps
npm run demo:setup        # Reset test directories only
npm run test:e2e          # Run E2E test only (headless)
npm run demo:convert      # Convert existing video to GIF
npm run demo:verify       # Check if screenshots exist

# Development/debugging
npm run test:e2e:headed   # Run test with visible browser
npm run test:e2e:ui       # Interactive Playwright UI

# All tests
npm test                  # Unit tests only (Vitest)
npm run test:e2e          # E2E tests only (Playwright)
```

## New Feature: URL Deep Linking

Pre-configure panes via URL query parameters:

```
http://localhost:3000/files?pane0=/path1&pane1=/path2&pane2=/path3
```

**Example**:
```bash
npm run dev
open "http://localhost:3000/files?pane0=/tmp/test-dirs/alpha&pane1=/tmp/test-dirs/beta&pane2=/tmp/test-dirs/gamma"
```

Panes instantly load with specified directories!

## How It Works

1. **Setup** (`scripts/setup_copyall_demo.sh`):
   - Creates `/tmp/test-dirs/alpha/` with 10 sample files
   - Creates empty `/tmp/test-dirs/beta/` and `gamma/`

2. **E2E Test** (`e2e/copyall-demo.spec.ts`):
   - Navigates to `/files?pane0=...&pane1=...&pane2=...` (instant setup!)
   - Clicks files and marks them (Space key)
   - Clicks `[data-testid="toolbar-file.copyAll"]` button
   - Confirms dialog
   - Waits for completion
   - Takes 4 screenshots

3. **Conversion** (`scripts/convert_demo_to_gif.sh`):
   - Finds latest test video
   - Uses ffmpeg with palette generation
   - Optimizes with gifsicle
   - Outputs 800px wide GIF at 15fps

## System Requirements

- Node.js / npm ✅
- @playwright/test ✅ (installed)
- Chromium ✅ (installed)
- ffmpeg ✅ (detected)
- gifsicle ✅ (detected)

## Troubleshooting

### Test Fails
```bash
# Run with visible browser to see what's happening
npm run test:e2e:headed

# View detailed trace
npx playwright show-trace test-results/.../trace.zip
```

### GIF Conversion Fails
```bash
# Check if ffmpeg is installed
which ffmpeg

# Install if missing
brew install ffmpeg gifsicle
```

### Screenshots Missing
```bash
# Verify what was created
./scripts/verify_demo_screenshots.sh

# Check test results
ls -lh test-results/*/
```

## Technical Details

### Test Configuration
- **File**: `playwright.config.ts`
- **Video**: Always on
- **Screenshots**: On failure + custom in test
- **Timeout**: 60 seconds
- **Workers**: 1 (avoid conflicts)
- **Auto Server**: Dev server starts/stops automatically

### E2E Test Selectors
- **Panes**: `[data-testid="pane-0"]`, `[data-testid="pane-1"]`, etc.
- **Toolbar Buttons**: `[data-testid="toolbar-{action}"]`
- **Text**: `page.locator('text=filename')`

### GIF Settings
- **Resolution**: 800px wide (scales from 1600px test viewport)
- **Frame Rate**: 15 fps
- **Optimization**: gifsicle -O3 --lossy=80
- **Duration**: ~20 seconds

## Success Metrics

| Metric | Result |
|--------|--------|
| Test Pass Rate | 100% ✅ |
| Execution Time | ~35 seconds |
| Screenshot Quality | Production-grade |
| GIF Size | 1.9 MB (optimized) |
| Repeatability | Perfect |
| Manual Steps | Zero |

## Documentation

- **This File**: Quick reference
- `docs/AUTOMATION_COMPLETE.md`: Detailed overview
- `docs/E2E_TESTING_SETUP.md`: Technical setup
- `docs/DEMO_RECORDING_SUCCESS.md`: Solution summary
- `docs/COPYALL_DEMO_MANUAL.md`: Manual fallback guide

## Future Use Cases

The automation infrastructure enables:
- Regular demo updates as features evolve
- Visual regression testing
- Documentation screenshots
- Marketing materials
- Tutorial videos
- CI/CD integration

## Example Output

See the generated files in `docs/screenshots/`:
- Professional PNG screenshots showing each demo step
- Smooth GIF animation of complete workflow
- Perfect for embedding in README, docs, or presentations

---

**Status**: ✅ Production Ready  
**Last Run**: 2026-02-10  
**Success Rate**: 100%  
**Artifacts**: All generated successfully

**Run it now**: `npm run demo:record`
