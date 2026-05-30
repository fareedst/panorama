# IMPL-TEST_CONFIG essence pseudocode

// [IMPL-TEST_CONFIG] [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM]: Vitest configuration — jsdom environment, global APIs, setup file, coverage thresholds, path aliases

## VitestEnvironmentAndGlobals

// [IMPL-TEST_CONFIG] [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM]: configure jsdom test environment and Vitest globals for describe/it/expect without per-file imports

CONTRACT VitestEnvironmentAndGlobals
  INPUT: vitest defineConfig test block
  OUTPUT: DOM-capable unit test runtime
  DATA: environment jsdom, globals true

PROCEDURE IMPL-TEST_CONFIG_VitestEnvironmentAndGlobals()
  SET test.environment := "jsdom"
  SET test.globals := true

## SetupFileAndLoggerEnv

// [IMPL-TEST_CONFIG] [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM] [IMPL-LOGGER_CONFIG]: load src/test/setup.ts before tests; set CONSOLE_ERRORS false to suppress logger console mirroring unless test resets modules

CONTRACT SetupFileAndLoggerEnv
  INPUT: vitest test block
  OUTPUT: matchers and mocks installed; logger tests control console explicitly
  DATA: setupFiles ['./src/test/setup.ts'], env.CONSOLE_ERRORS 'false'

PROCEDURE IMPL-TEST_CONFIG_SetupFileAndLoggerEnv()
  SET test.setupFiles := ['./src/test/setup.ts']
  SET test.env.CONSOLE_ERRORS := 'false'

## CssAndExcludePolicy

// [IMPL-TEST_CONFIG] [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM]: disable CSS injection in jsdom; exclude node_modules dist e2e Playwright paths from Vitest discovery

CONTRACT CssAndExcludePolicy
  INPUT: vitest test block
  OUTPUT: unit tests assert DOM/behavior without parsing Tailwind v4 output; Playwright specs not collected
  DATA: css false, exclude **/e2e/**

PROCEDURE IMPL-TEST_CONFIG_CssAndExcludePolicy()
  SET test.css := false
  SET test.exclude := node_modules, dist, e2e, cache/temp patterns

## CoverageThresholds

// [IMPL-TEST_CONFIG] [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM]: v8 coverage on src/app and src/lib with 80% lines/functions/branches/statements thresholds

CONTRACT CoverageThresholds
  INPUT: vitest coverage block
  OUTPUT: coverage reports text/json/html/lcov; fail CI below 80% on included sources
  DATA: provider v8, all true, include src/app and src/lib, exclude tests configs setup

PROCEDURE IMPL-TEST_CONFIG_CoverageThresholds()
  SET coverage.provider := v8
  SET coverage.reporter := text, json, html, lcov
  SET coverage.include := src/app/**, src/lib/**
  SET coverage.exclude := *.config.*, **/*.test.*, src/test/**, .next, node_modules, **/*.d.ts
  SET coverage.all := true
  SET coverage.thresholds lines/functions/branches/statements := 80 each

## PathAliasResolve

// [IMPL-TEST_CONFIG] [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM]: resolve @ alias to ./src matching tsconfig for consistent imports in tests

CONTRACT PathAliasResolve
  INPUT: vitest resolve.alias
  OUTPUT: @/ imports resolve to project src root
  DATA: @ → path.resolve(__dirname, './src')

PROCEDURE IMPL-TEST_CONFIG_PathAliasResolve()
  SET resolve.alias['@'] := absolute path to ./src

## CodeLocations

// [IMPL-TEST_CONFIG] [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM]: map implementing source for this IMPL

// FILE: vitest.config.ts — full Vitest and coverage configuration
