#!/usr/bin/env mde
# Panorama — build, test, and run (interactive)

This file is an **interactive guide** for the `mde` runner indicated by the shebang: pick values in ```ux``` blocks, run ```bash``` snippets.

- **`ux`** — named filters; choosing a row sets a variable (e.g. `VITEST_FILTER`) from the **Name** column via `transform`.
- **`vars`** — document-level variables injected into following ```bash``` blocks.
- **`bash :[demo]`** — labeled demo blocks some runners treat specially.

Run all commands from the **repository root** (`panorama/`). This project is a **Next.js 16** app with **Vitest** (unit/integration under `src/`, ~68 test files under `src/`) and **Playwright** (E2E under `e2e/`, 2 specs). Package manager: **`npm`** (`package-lock.json`); `bun` / `pnpm` work if dependencies are installed.

See also: [TESTING.md](../TESTING.md) (STDD, coverage philosophy) · [README.md § Available Scripts](../README.md#available-scripts) (script inventory).

## Contents

- [Full build](#full-build)
- [Full test](#full-test)
- [Combined verification](#combined-verification)
- [Build options](#build-options)
- [Vitest](#vitest)
- [Mesh tests (all slices)](#mesh-tests-all-slices)
- [Mesh manual smoke](#mesh-manual-smoke-routes-persistence-api)
- [Playwright E2E](#playwright-e2e)
- [Demo pipeline](#demo-pipeline)

---

## Full build

Static checks (ESLint + TypeScript) then production Next.js compile.

```bash @on-load
# export PATH="$PATH:/Users/fareed/.local/bin"
set +e
source ~/.bash_profile
set -e

# macOS/BSD
kill_tcp_server () {
  lsof -tiTCP:$1 | tee /dev/tty | xargs kill -1
}

# cd /Users/fareed/Documents/dev/node/panorama
cd "$MARKSCOPE_DOCS_DIR/.."
export MESH_DATA_DIR
```

- MARKSCOPE_CLIENT_DIR: ${MARKSCOPE_CLIENT_DIR}
- MARKSCOPE_DOCS_DIR: ${MARKSCOPE_DOCS_DIR}
- MARKSCOPE_SCRIPTS_DIR: ${MARKSCOPE_SCRIPTS_DIR}
```bash @g:trace @hide
source "${MARKSCOPE_SCRIPTS_DIR:?}/trace-debug.sh"
```

```bash @eval @r:trace
whoami
pwd
```

```bash @eval @r:trace
pwd
whoami
echo "PATH: $PATH"
env
```

<!-- does not work an @eval, Exit 15 timed out -->
```bash @r:trace
# ESLint, typecheck (noEmit), then next build.
npm run lint && npx tsc --noEmit && npm run build
```

```bash @r:trace
# Install dependencies (after clone or package.json change).
npm install
```

```bash @r:trace
# Remove build/test artifacts (.next, coverage, playwright-report, etc.).
npm run clean
```

---

## Full test

All **Vitest** tests, then all **Playwright** E2E tests. **`npm run test:e2e`** runs [`scripts/playwright-preflight.mjs`](../scripts/playwright-preflight.mjs) (fast-fail if the dedicated E2E port has a zombie listener) then [`scripts/playwright-run.mjs`](../scripts/playwright-run.mjs); the latter starts the dev server when needed ([`playwright.config.ts`](../playwright.config.ts)).

```bash @r:trace
# One-time: install Chromium for Playwright (skip if already installed).
npx playwright install chromium
```

```bash @r:trace
# Vitest (CI mode), then Playwright E2E.
npm test && npm run test:e2e
```

```bash @r:trace
# Vitest only (fast; no browser, no dev server).
npm test
```

```bash @r:trace
# Playwright E2E only: preflight + run (auto-starts npm run dev on PLAYWRIGHT_PORT, default 3001; dev on 3000 is separate).
npm run test:e2e
```

---

## Combined verification

Local parity with a full pre-release check: lint, typecheck, production build, Vitest, E2E.

```bash @r:trace
npm run lint && npx tsc --noEmit && npm run build && npm test && npm run test:e2e
```

---

## Build options

```ux
name: BUILD_MODE
allow:
- dev | Development server with hot reload (next dev)
- build | Production compile only (next build)
- start | Serve production build (next start; run build first)
- clean-build | Clean artifacts then production build
validate: '^\s*(?<name>[^|]*\S)\s*\|\s*(?<desc>\S.*)$'
transform: '%{name}'
```

```bash @r:trace
# Run selected build mode (BUILD_MODE from ux table above).
case "$BUILD_MODE" in
  dev)         npm run dev ;;
  build)       npm run build ;;
  start)       npm start ;;
  clean-build) npm run clean && npm run build ;;
  *)           echo "Pick BUILD_MODE in ux table" >&2; exit 1 ;;
esac
```

### Individual build commands

```bash @r:trace
# Development server — http://localhost:3000 (redirects to /files).
npm run dev
```

```bash @r:trace
# Production build (.next output).
npm run build
```

```bash @r:trace
# Serve production build (requires npm run build first).
npm start
```

```bash @r:trace
# Clean then rebuild.
npm run clean && npm run build
```

```bash @r:trace
# ESLint.
npm run lint
```

```bash @r:trace
# ESLint with auto-fix where supported.
npm run lint -- --fix
```

```bash @r:trace
# TypeScript check (strict; no emit — matches tsconfig.json).
npx tsc --noEmit
```

### Logging env (optional)

From [LOGGING.md](LOGGING.md):

```ux
allow:
- FATAL
- ERROR
- WARN
- INFO
- DEBUG
- TRACE
init: DEBUG
name: LOG_LEVEL
```

```bash @r:trace
# Dev server with debug logging.
LOG_LEVEL="$LOG_LEVEL" npm run dev
```

```bash @r:trace
# Production build with file logging disabled.
ENABLE_LOGGING=false npm run build
```

---

## Vitest

Configuration: [`vitest.config.ts`](../vitest.config.ts) — jsdom, `src/test/setup.ts`, excludes `e2e/` (Playwright).

```bash @r:trace
# All unit/integration tests once (same as npm test).
npm test
```

```bash @r:trace
# Watch mode (development).
npm run test:watch
```

```bash @r:trace
# Coverage report (80% thresholds on src/app and src/lib).
npm run test:coverage
```

### Focused test slices

Pick a directory or area; **Name** becomes `VITEST_FILTER` (path passed to Vitest).

```ux
name: VITEST_FILTER
allow:
- src/lib/mesh | Mesh domain, services, connectors, repositories
- src/lib/mesh/connector | Remote/virtual connector stubs
- src/lib/mesh/services/services.integration.test.ts | runApprovedSession / multi-link integration
- src/app/api/mesh/credentials.route.test.ts | Credential POST API composition
- src/app/mesh | Mesh UI components
- src/app/api/mesh | Mesh HTTP API routes
- src/app/files | File manager UI (panes, dialogs, workspace)
- src/lib/files | Files library (data, search, keybinds, layout, …)
- src/app/api | All API routes (files + mesh)
- src/lib/sync | Multi-target sync engine
- src/test/integration | App integration tests
validate: '^\s*(?<name>[^|]*\S)\s*\|\s*(?<desc>\S.*)$'
transform: '%{name}'
```

```bash @r:trace
# Run tests under VITEST_FILTER (path from ux table).
npx vitest run "$VITEST_FILTER"
```

### Advanced Vitest

```bash @r:trace
# Single test file.
npx vitest run src/app/files/WorkspaceView.test.tsx
```

```bash @r:trace
# Tests matching name pattern.
npx vitest run --testNamePattern="dark mode"
```

```bash @r:trace
# Interactive Vitest UI.
npx vitest --ui
```

```bash @r:trace
# Update snapshots.
npx vitest run -u
```

---

## Mesh tests (all slices)

Mesh code spans three trees; run all mesh-related Vitest tests in one session:

```bash @r:trace
npx vitest run src/lib/mesh src/app/mesh src/app/api/mesh
```

---

## Mesh manual smoke (routes, persistence, API)

Routes match [`src/app/mesh/layout.tsx`](../src/app/mesh/layout.tsx).

**Hub (global nav):** `/mesh` · `/mesh/depots` · `/mesh/sync` · `/mesh/policies` · `/mesh/monitoring` · `/mesh/settings` · `/files` (File Manager).

**Per mesh (`/mesh/{meshId}/…`):** Overview · Topology · Depots · Rules · Plan · Sync Now · Conflicts · History · Logs · Export · Schedule · Settings.

**Plan vs Sync Now:** generate and approve the plan on **Plan** only; start the session from **Sync Now** (approved handoff uses browser `sessionStorage`).

### Persistence (`MESH_DATA_DIR`)

When **`MESH_DATA_DIR`** is set, mesh JSON lives in that directory: **`meshes.json`**, plus **`sync-sessions.json`** (sessions, including approved plans) and **`sync-events.json`** (audit events). Use the same directory across dev server restarts to verify persistence.

```ux
init: /Users/fareed/Documents/dev/node/panorama/data
name: MESH_DATA_DIR
```

```ux
init: 3010
name: PLAYWRIGHT_PORT
on_valid_groups:
- PLAYWRIGHT_PORT
```
```ux @g:PLAYWRIGHT_PORT
act: :exec
exec: >-
  lsof -tiTCP:$PLAYWRIGHT_PORT || echo None
format: Refresh jobs
init: false
name: PLAYWRIGHT_PORT_JOBS
on_valid_groups:
- PLAYWRIGHT_PORT_JOBS
transform: :chomp
```
```ux @g:PLAYWRIGHT_PORT_JOBS @hide
act: :exec
exec: date
init: false
name: JOBS_TIME
require:
- PLAYWRIGHT_PORT_JOBS
transform: :chomp
```

| Port| Jobs| Report time
| -| -| -
| ${PLAYWRIGHT_PORT}| ${PLAYWRIGHT_PORT_JOBS}| ${JOBS_TIME}

```bash
kill_tcp_server "$PLAYWRIGHT_PORT"
```

```bash @r:trace
# Example: isolated mesh data dir for local manual runs (adjust path).
MESH_DATA_DIR="$PWD/.mesh-data-local"
mkdir -p "$MESH_DATA_DIR"
kill_tcp_server "$PLAYWRIGHT_PORT"
npm run dev -- -p "$PLAYWRIGHT_PORT"
```

### Credentials API (`POST /api/mesh/credentials`)

Creates a credential **reference** (masked handle). Caller needs **`manage_credentials`** permission (manual smoke: header **`x-mesh-role: admin`**). Body may include **`label`**; **`id`** is allocated when omitted ([route](../src/app/api/mesh/credentials/route.ts), [tests](../src/app/api/mesh/credentials.route.test.ts)).

```bash @r:trace
# With dev server on port PLAYWRIGHT_PORT
curl -sS -X POST "http://127.0.0.1:$PLAYWRIGHT_PORT/api/mesh/credentials" \
  -H "Content-Type: application/json" \
  -H "x-mesh-role: admin" \
  -d '{"label":"smoke-cred"}'
```

---

## Playwright E2E

| Setting | Value |
| - | - |
| `testDir` | `e2e/` |
| Browser | Chromium |
| `baseURL` | `http://127.0.0.1:${PLAYWRIGHT_PORT}` (via `PLAYWRIGHT_PORT`) |
| `fullyParallel` | `false` |
| `workers` | `1` |
| `webServer` | `npm run dev -- -p ${PLAYWRIGHT_PORT}` (reuse only if `PLAYWRIGHT_REUSE_SERVER=1` and URL responds; preflight fails fast on zombie port) |
| `MESH_DATA_DIR` | Temp dir under OS tmp (or env override) |
| `MESH_ASYNC_SYNC` | `1` |
| Timeout | 60s per test |

Specs: **`e2e/mesh-sync.spec.ts`** ([REQ-MESH_E2E_RELEASE]), **`e2e/copyall-demo.spec.ts`** (demo / copy-all GIF pipeline — requires `npm run demo:setup` first or it will fail looking for `/tmp/test-dirs/{alpha,beta,gamma}`).

**`e2e/mesh-sync.spec.ts`** scenarios (mirror manual/E2E coverage): `create_mesh_with_two_local_depots_and_sync_file` · `create_mesh_with_three_depots_and_fan_out_sync` · `detect_and_resolve_modify_modify_conflict` · `block_large_delete_without_confirmation` · `pause_resume_and_cancel_session` · `permission_restricted_operator_cannot_manage_credentials` · `export_and_import_mesh_configuration` · `menu_contains_meshes_entry` · `mesh_detail_menu_contains_topology_entry` · `monitoring_dashboard_loads` · `settings_import_export_page` · `permission_restricted_viewer_cannot_create_mesh` · `archived_mesh_is_hidden_but_history_remains`.

```bash @r:trace
# All E2E specs (starts dev server if needed).
npm run test:e2e
```

E2E scripts unset `NO_COLOR` before launching Playwright so Node does not warn when Playwright sets `FORCE_COLOR` on workers (common when the IDE sets `NO_COLOR=1`).

```bash @r:trace
# Visible browser (debugging).
npm run test:e2e:headed
```

```bash @r:trace
# Playwright UI mode.
npm run test:e2e:ui
```

### Focused E2E spec

```ux
name: E2E_SPEC
allow:
- e2e/mesh-sync.spec.ts | Mesh platform sync flows
- e2e/copyall-demo.spec.ts | Copy-all demo recording
validate: '^\s*(?<name>[^|]*\S)\s*\|\s*(?<desc>\S.*)$'
transform: '%{name}'
```

```bash @r:trace
# Run one E2E file (E2E_SPEC from ux table).
npx playwright test "$E2E_SPEC"
```

### E2E debugging

```bash @r:trace
# Open last HTML report.
npx playwright show-report
```

```bash @r:trace
# Show trace from a failed run (adjust path to your test-results folder).
npx playwright show-trace test-results/*/trace.zip
```

---

## Demo pipeline

Not part of **full test**; records demo assets (setup → E2E → GIF conversion).

```bash @r:trace
# Full demo pipeline: setup fixtures, E2E, convert video to GIF.
npm run demo:record
```

```bash @r:trace
# Reset demo directories only.
npm run demo:setup
```

```bash @r:trace
# Convert recorded video to GIF (after E2E).
npm run demo:convert
```

```bash @r:trace
# Verify demo screenshots exist.
npm run demo:verify
```

---
```bash
export PLAYWRIGHT_PORT
npm run test:e2e
```
---

## See also

- [panorama-domain-references.md](panorama-domain-references.md) — canonical domain vocabulary index
- [vocabulary-index-analysis-and-standards.md](vocabulary-index-analysis-and-standards.md) — mandatory glossary sections, PR checklist
- Run `bun run validate:vocabulary` (or `bash scripts/validate-vocabulary.sh`) after editing `docs/*-vocabulary.md`
- [mesh-platform-vocabulary.md](mesh-platform-vocabulary.md) — mesh platform terms
- [sync-mesh-phase-status.md](sync-mesh-phase-status.md) — mesh sync phase tracker
- [nsync-multi-target-vocabulary.md](nsync-multi-target-vocabulary.md) — file-manager NSYNC vs `/mesh` boundary (**NSYNC**)
