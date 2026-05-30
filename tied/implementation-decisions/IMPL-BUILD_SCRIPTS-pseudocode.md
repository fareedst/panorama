# IMPL-BUILD_SCRIPTS essence pseudocode

// [IMPL-BUILD_SCRIPTS] [ARCH-NEXTJS_FRAMEWORK] [REQ-BUILD_SYSTEM]: how: package.json scripts standardize dev, build, lint, test, and cleanup commands for CI and local workflows

## NPM_SCRIPTS

// [IMPL-BUILD_SCRIPTS] [ARCH-NEXTJS_FRAMEWORK] [REQ-BUILD_SYSTEM]: how: scripts block in package.json maps npm run targets to Next.js, ESLint, Vitest, Playwright, and shell cleanup

```
CONTRACT NPM_SCRIPTS
  INPUT: npm run <scriptName> from developer or CI
  OUTPUT: delegated shell command exit status
  DATA: package.json scripts object
  CONTROL: script name selects command template

PROCEDURE IMPL-BUILD_SCRIPTS_NpmScripts(scriptName)
  LOOKUP scriptName IN package.json.scripts
  IF script missing THEN npm reports unknown script and EXIT non-zero
  ELSE EXECUTE mapped command with project cwd
```

## DEV

// [IMPL-BUILD_SCRIPTS] [ARCH-NEXTJS_FRAMEWORK] [REQ-BUILD_SYSTEM]: how: dev script runs Next.js development server

```
CONTRACT DEV
  INPUT: npm run dev
  OUTPUT: hot-reload dev server on default Next port
  DATA: script dev -> next dev

PROCEDURE IMPL-BUILD_SCRIPTS_Dev()
  EXECUTE next dev
```

## BUILD

// [IMPL-BUILD_SCRIPTS] [ARCH-NEXTJS_FRAMEWORK] [REQ-BUILD_SYSTEM]: how: build script produces production Next.js output

```
CONTRACT BUILD
  INPUT: npm run build
  OUTPUT: optimized .next production bundle
  DATA: script build -> next build

PROCEDURE IMPL-BUILD_SCRIPTS_Build()
  EXECUTE next build
```

## START

// [IMPL-BUILD_SCRIPTS] [ARCH-NEXTJS_FRAMEWORK] [REQ-BUILD_SYSTEM]: how: start script serves built production app

```
CONTRACT START
  INPUT: npm run start
  OUTPUT: production Next server
  DATA: script start -> next start

PROCEDURE IMPL-BUILD_SCRIPTS_Start()
  EXECUTE next start
```

## LINT

// [IMPL-BUILD_SCRIPTS] [ARCH-NEXTJS_FRAMEWORK] [REQ-BUILD_SYSTEM]: how: lint script runs ESLint (eslint-config-next), not next lint

```
CONTRACT LINT
  INPUT: npm run lint
  OUTPUT: ESLint diagnostics exit code
  DATA: script lint -> eslint

PROCEDURE IMPL-BUILD_SCRIPTS_Lint()
  EXECUTE eslint
```

## TEST

// [IMPL-BUILD_SCRIPTS] [ARCH-NEXTJS_FRAMEWORK] [REQ-BUILD_SYSTEM]: how: test script runs Vitest once in run mode

```
CONTRACT TEST
  INPUT: npm run test
  OUTPUT: Vitest run summary and exit code
  DATA: script test -> vitest run

PROCEDURE IMPL-BUILD_SCRIPTS_Test()
  EXECUTE vitest run
```

## TEST_COVERAGE

// [IMPL-BUILD_SCRIPTS] [ARCH-NEXTJS_FRAMEWORK] [REQ-BUILD_SYSTEM]: how: test:coverage runs Vitest with v8 coverage reporter

```
CONTRACT TEST_COVERAGE
  INPUT: npm run test:coverage
  OUTPUT: coverage report under coverage/
  DATA: script test:coverage -> vitest run --coverage

PROCEDURE IMPL-BUILD_SCRIPTS_TestCoverage()
  EXECUTE vitest run --coverage
```

## TEST_WATCH

// [IMPL-BUILD_SCRIPTS] [ARCH-NEXTJS_FRAMEWORK] [REQ-BUILD_SYSTEM]: how: test:watch runs Vitest in watch mode

```
CONTRACT TEST_WATCH
  INPUT: npm run test:watch
  OUTPUT: interactive Vitest watcher
  DATA: script test:watch -> vitest

PROCEDURE IMPL-BUILD_SCRIPTS_TestWatch()
  EXECUTE vitest
```

## CLEAN

// [IMPL-BUILD_SCRIPTS] [ARCH-NEXTJS_FRAMEWORK] [REQ-BUILD_SYSTEM]: how: clean script removes build artifacts, coverage, and tsbuildinfo files

```
CONTRACT CLEAN
  INPUT: npm run clean
  OUTPUT: workspace free of .next, out, coverage, playwright caches
  DATA: script clean -> rm -rf artifact dirs AND find-delete *.tsbuildinfo

PROCEDURE IMPL-BUILD_SCRIPTS_Clean()
  REMOVE .next out build dist coverage test-results playwright-report playwright/.cache .vitest vitest-results .cache .temp .tmp dist-ssr
  DELETE all *.tsbuildinfo outside node_modules
```

## CodeLocations

// [IMPL-BUILD_SCRIPTS] [ARCH-NEXTJS_FRAMEWORK] [REQ-BUILD_SYSTEM]: how: map implementing and verifying source files for this IMPL

// FILE: package.json — NPM scripts (production locus; JSON has no comment syntax)
// FILE: src/test/integration/app.test.tsx — Build System Integration [REQ-BUILD_SYSTEM] script contract tests
