# Screenshots for README

Place visual demos here for the main [README.md](../../README.md).

**Current assets:**

- **3-pane-workspace.png** – Default 3-pane file manager layout (embedded in README).
- **3-pane-comparison.png** – Comparison mode with color-coded indicators (embedded in README).

**CopyAll Demo Screenshots:**

- **demo-01-initial-state.png** – Initial 3-pane layout with alpha (source), beta, and gamma (targets)
- **demo-02-marked-files.png** – Files marked in alpha pane using Space key
- **demo-03-copyall-dialog.png** – CopyAll confirmation dialog (Shift+C)
- **demo-04-progress.png** – Progress dialog during copy operation (optional)
- **demo-05-final-result.png** – Final state showing files copied to all target panes

See `docs/COPYALL_DEMO_MANUAL.md` for detailed recording instructions.

**Optional to add:**

- **GIF** – Short screen recording (e.g. keyboard navigation or copy-to-all-panes), exported as GIF (~800px wide, 5–15 s).

**Demo directory for consistent content:** `/tmp/test-5dirs/` has subdirs `alpha`, `beta`, `delta`, `epsilon`, `gamma` with deliberate differences. Create it with `scripts/setup_test_dirs.sh` from the [Goful](https://github.com/nickshanks/goful) repo, then point panes at those subdirs for comparison/sync demos.

**Demo session script:** Run `../../scripts/demo_nsync_session.sh` for a reproducible session that copies/moves files to next panel or to all other panels (nsync). Use `--init` to create demo directories, `--pause N` and `--steps` for visual recording with step-by-step output, or `--dry-run` to preview operations.

Reference in README with relative paths, e.g. `![3-pane file manager](docs/screenshots/3-pane-workspace.png)`.
