# IMPL-BUILD_SCRIPTS essence pseudocode

// [IMPL-BUILD_SCRIPTS] [ARCH-NEXTJS_FRAMEWORK] [REQ-BUILD_SYSTEM]: how: package.json scripts standardize dev, build, lint, test, and cleanup commands for CI and local workflows

## Summary contract

// [IMPL-BUILD_SCRIPTS] [ARCH-NEXTJS_FRAMEWORK] [REQ-BUILD_SYSTEM]: how: npm scripts delegate to Next.js, ESLint, Vitest, Playwright, and shell cleanup

```
IMPL-BUILD_SCRIPTS_Summary():
  INPUT: npm run <scriptName> from developer or CI
  OUTPUT: delegated shell command exit status
  DATA: package.json scripts object
  PRE: package.json scripts block defined
  POST: mapped command executed with project cwd
  EFFECTS: subprocess IO
  CONTROL: script name selects command template
  TERMINATION: total
```

## NPM_SCRIPTS

// [IMPL-BUILD_SCRIPTS] [ARCH-NEXTJS_FRAMEWORK] [REQ-BUILD_SYSTEM]: how: scripts block in package.json maps npm run targets to Next.js, ESLint, Vitest, Playwright, and shell cleanup

```
IMPL-BUILD_SCRIPTS_NpmScripts(scriptName):
  INPUT: npm run <scriptName> from developer or CI
  OUTPUT: delegated shell command exit status
  DATA: package.json scripts object
  PRE: npm invoked with script name
  POST: command exit code returned to caller
  EFFECTS: subprocess
  FAILURE_MODES: unknown script → npm error non-zero exit
  TERMINATION: total
  LOOKUP scriptName IN package.json.scripts
  IF script missing THEN npm reports unknown script and EXIT non-zero
  ELSE EXECUTE mapped command with project cwd
```

## DEV

// [IMPL-BUILD_SCRIPTS] [ARCH-NEXTJS_FRAMEWORK] [REQ-BUILD_SYSTEM]: how: dev script runs Next.js development server

```
IMPL-BUILD_SCRIPTS_Dev():
  INPUT: npm run dev
  OUTPUT: hot-reload dev server on default Next port
  DATA: script dev -> next dev
  PRE: Next.js installed
  POST: dev server running until interrupted
  EFFECTS: long-running process
  TERMINATION: external interrupt
  EXECUTE next dev
```

## BUILD

// [IMPL-BUILD_SCRIPTS] [ARCH-NEXTJS_FRAMEWORK] [REQ-BUILD_SYSTEM]: how: build script produces production Next.js output

```
IMPL-BUILD_SCRIPTS_Build():
  INPUT: npm run build
  OUTPUT: optimized .next production bundle
  DATA: script build -> next build
  PRE: source tree compiles
  POST: .next output produced or build fails
  EFFECTS: IO, subprocess
  TERMINATION: total
  EXECUTE next build
```

## START

// [IMPL-BUILD_SCRIPTS] [ARCH-NEXTJS_FRAMEWORK] [REQ-BUILD_SYSTEM]: how: start script serves built production app

```
IMPL-BUILD_SCRIPTS_Start():
  INPUT: npm run start
  OUTPUT: production Next server
  DATA: script start -> next start
  PRE: production build exists
  POST: server listening
  EFFECTS: long-running process
  TERMINATION: external interrupt
  EXECUTE next start
```

## LINT

// [IMPL-BUILD_SCRIPTS] [ARCH-NEXTJS_FRAMEWORK] [REQ-BUILD_SYSTEM]: how: lint script runs ESLint (eslint-config-next), not next lint

```
IMPL-BUILD_SCRIPTS_Lint():
  INPUT: npm run lint
  OUTPUT: ESLint diagnostics exit code
  DATA: script lint -> eslint
  PRE: eslint config present
  POST: lint completes with pass or fail exit
  EFFECTS: subprocess
  TERMINATION: total
  EXECUTE eslint
```

## TEST

// [IMPL-BUILD_SCRIPTS] [ARCH-NEXTJS_FRAMEWORK] [REQ-BUILD_SYSTEM]: how: test script runs Vitest once in run mode

```
IMPL-BUILD_SCRIPTS_Test():
  INPUT: npm run test
  OUTPUT: Vitest run summary and exit code
  DATA: script test -> vitest run
  PRE: vitest.config.ts valid
  POST: test run summary emitted
  EFFECTS: subprocess
  TERMINATION: total
  EXECUTE vitest run
```

## TEST_COVERAGE

// [IMPL-BUILD_SCRIPTS] [ARCH-NEXTJS_FRAMEWORK] [REQ-BUILD_SYSTEM]: how: test:coverage runs Vitest with v8 coverage reporter

```
IMPL-BUILD_SCRIPTS_TestCoverage():
  INPUT: npm run test:coverage
  OUTPUT: coverage report under coverage/
  DATA: script test:coverage -> vitest run --coverage
  PRE: coverage provider configured
  POST: coverage artifacts written
  EFFECTS: subprocess, IO
  TERMINATION: total
  EXECUTE vitest run --coverage
```

## TEST_WATCH

// [IMPL-BUILD_SCRIPTS] [ARCH-NEXTJS_FRAMEWORK] [REQ-BUILD_SYSTEM]: how: test:watch runs Vitest in watch mode

```
IMPL-BUILD_SCRIPTS_TestWatch():
  INPUT: npm run test:watch
  OUTPUT: interactive Vitest watcher
  DATA: script test:watch -> vitest
  PRE: vitest available
  POST: watcher running until interrupted
  EFFECTS: long-running subprocess
  TERMINATION: external interrupt
  EXECUTE vitest
```

## CLEAN

// [IMPL-BUILD_SCRIPTS] [ARCH-NEXTJS_FRAMEWORK] [REQ-BUILD_SYSTEM]: how: clean script removes build artifacts, coverage, and tsbuildinfo files

```
IMPL-BUILD_SCRIPTS_Clean():
  INPUT: npm run clean
  OUTPUT: workspace free of .next, out, coverage, playwright caches
  DATA: script clean -> rm -rf artifact dirs AND find-delete *.tsbuildinfo
  PRE: shell rm/find available
  POST: artifact directories removed
  EFFECTS: filesystem delete
  TERMINATION: total
  REMOVE .next out build dist coverage test-results playwright-report playwright/.cache .vitest vitest-results .cache .temp .tmp dist-ssr
  DELETE all *.tsbuildinfo outside node_modules
```

## CodeLocations

// [IMPL-BUILD_SCRIPTS] [ARCH-NEXTJS_FRAMEWORK] [REQ-BUILD_SYSTEM]: how: map implementing and verifying source files for this IMPL

// FILE: package.json — NPM scripts (production locus; JSON has no comment syntax)
// FILE: src/test/integration/app.test.tsx — Build System Integration [REQ-BUILD_SYSTEM] script contract tests
