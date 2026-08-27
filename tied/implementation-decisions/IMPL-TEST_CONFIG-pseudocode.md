# IMPL-TEST_CONFIG essence pseudocode

// [IMPL-TEST_CONFIG] [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM]: Vitest configuration — jsdom environment, global APIs, setup file, coverage thresholds, path aliases

## VitestEnvironmentAndGlobals

// [IMPL-TEST_CONFIG] [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM]: configure jsdom test environment and Vitest globals for describe/it/expect without per-file imports

```
IMPL-TEST_CONFIG_VitestEnvironmentAndGlobals():
  INPUT: vitest defineConfig test block
  OUTPUT: DOM-capable unit test runtime
  DATA: environment jsdom, globals true
  PRE: vitest.config.ts loaded by Vitest CLI or IDE test runner
  POST: test.environment is jsdom and test.globals is true
  EFFECTS: pure
  TERMINATION: total
  SET test.environment := "jsdom"
  SET test.globals := true
```

## SetupFileAndLoggerEnv

// [IMPL-TEST_CONFIG] [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM] [IMPL-LOGGER_CONFIG]: load src/test/setup.ts before tests; set CONSOLE_ERRORS false to suppress logger console mirroring unless test resets modules

```
IMPL-TEST_CONFIG_SetupFileAndLoggerEnv():
  INPUT: vitest test block
  OUTPUT: matchers and mocks installed; logger tests control console explicitly
  DATA: setupFiles ['./src/test/setup.ts'], env.CONSOLE_ERRORS 'false'
  PRE: src/test/setup.ts exists on disk
  POST: setup file runs before each test file; CONSOLE_ERRORS defaults false in test env
  EFFECTS: State
  TERMINATION: total
  SET test.setupFiles := ['./src/test/setup.ts']
  SET test.env.CONSOLE_ERRORS := 'false'
```

## CssAndExcludePolicy

// [IMPL-TEST_CONFIG] [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM]: disable CSS injection in jsdom; exclude node_modules dist e2e Playwright paths from Vitest discovery

```
IMPL-TEST_CONFIG_CssAndExcludePolicy():
  INPUT: vitest test block
  OUTPUT: unit tests assert DOM/behavior without parsing Tailwind v4 output; Playwright specs not collected
  DATA: css false, exclude **/e2e/**
  PRE: Vitest discovery scoped to unit/integration tests under src/
  POST: CSS injection disabled; e2e and build artifacts excluded from collection
  EFFECTS: pure
  TERMINATION: total
  SET test.css := false
  SET test.exclude := node_modules, dist, e2e, cache/temp patterns
```

## CoverageThresholds

// [IMPL-TEST_CONFIG] [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM]: v8 coverage on src/app and src/lib with 80% lines/functions/branches/statements thresholds

```
IMPL-TEST_CONFIG_CoverageThresholds():
  INPUT: vitest coverage block
  OUTPUT: coverage reports text/json/html/lcov; fail CI below 80% on included sources
  DATA: provider v8, all true, include src/app and src/lib, exclude tests configs setup
  PRE: coverage enabled via --coverage flag or CI script
  POST: thresholds enforce 80% minimum on lines/functions/branches/statements for included sources
  EFFECTS: pure
  TERMINATION: total
  SET coverage.provider := v8
  SET coverage.reporter := text, json, html, lcov
  SET coverage.include := src/app/**, src/lib/**
  SET coverage.exclude := *.config.*, **/*.test.*, src/test/**, .next, node_modules, **/*.d.ts
  SET coverage.all := true
  SET coverage.thresholds lines/functions/branches/statements := 80 each
```

## PathAliasResolve

// [IMPL-TEST_CONFIG] [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM]: resolve @ alias to ./src matching tsconfig for consistent imports in tests

```
IMPL-TEST_CONFIG_PathAliasResolve():
  INPUT: vitest resolve.alias
  OUTPUT: @/ imports resolve to project src root
  DATA: @ → path.resolve(__dirname, './src')
  PRE: tsconfig paths align @ with ./src
  POST: resolve.alias['@'] points to absolute ./src path
  EFFECTS: pure
  TERMINATION: total
  SET resolve.alias['@'] := absolute path to ./src
```

## CodeLocations

// [IMPL-TEST_CONFIG] [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM]: map implementing source for this IMPL

// FILE: vitest.config.ts — full Vitest and coverage configuration
