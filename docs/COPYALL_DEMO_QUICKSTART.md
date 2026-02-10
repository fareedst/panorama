# CopyAll Demo - Quick Start Guide

**Ready to record? Follow these 3 simple steps:**

## 1. Start the App (if not already running)

```bash
cd /Users/fareed/Documents/dev/node/nx1
npm run dev
```

Wait for: `Ready on http://localhost:3000`

## 2. Open Browser and Navigate

Open: http://localhost:3000/files

## 3. Follow the Demo Steps

Open the detailed manual: [COPYALL_DEMO_MANUAL.md](COPYALL_DEMO_MANUAL.md)

### Quick Summary of Demo Steps:

1. **Navigate panes** to test directories:
   - Pane 1: `/tmp/test-dirs/alpha`
   - Pane 2: `/tmp/test-dirs/beta`
   - Pane 3: `/tmp/test-dirs/gamma`

2. **Mark files** in alpha pane:
   - Click `file2.txt` → Press `Space`
   - Click `file3.txt` → Press `Space`

3. **Trigger CopyAll**:
   - Press `Shift+C`

4. **Confirm operation**:
   - Click "Confirm" in dialog

5. **Take screenshots** at each step:
   - Save to: `/Users/fareed/Documents/dev/node/nx1/docs/screenshots/`
   - Names: `demo-01-initial-state.png`, `demo-02-marked-files.png`, etc.

## Verify Your Screenshots

After recording:

```bash
./scripts/verify_demo_screenshots.sh
```

## Need to Reset Test Data?

```bash
./scripts/setup_copyall_demo.sh --clean
```

## Full Documentation

- **Detailed Manual**: [COPYALL_DEMO_MANUAL.md](COPYALL_DEMO_MANUAL.md)
- **Status & Background**: [COPYALL_DEMO_STATUS.md](COPYALL_DEMO_STATUS.md)
- **Screenshot README**: [screenshots/README.md](screenshots/README.md)

---

**That's it! You're ready to record the demo.** 🎬
