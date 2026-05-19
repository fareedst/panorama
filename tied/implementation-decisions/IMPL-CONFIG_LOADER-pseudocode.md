# IMPL-CONFIG_LOADER essence pseudocode

// [IMPL-CONFIG_LOADER] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_UI]: Top-level Configuration Loader Module: Create config loader module with deep merge and caching

## Summary contract

// [IMPL-CONFIG_LOADER] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_UI]: bound module inputs, outputs, and shared data for all runtime blocks below

CONTRACT Summary
  INPUT: caller context, pane state, configuration
  OUTPUT: behavior required by IMPL-CONFIG_LOADER
  DATA: state and configuration per implementation_approach

## LoadYamlConfig

// [IMPL-CONFIG_LOADER] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_UI]: read yaml merge with defaults cache result

CONTRACT LoadYamlConfig
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-CONFIG_LOADER_LoadYamlConfig(context)
  // READ yaml file from config path
  CALL READ yaml file from config path
  CALL deepMerge with default config object
  // STORE in module cache for subsequent getters
  CALL STORE in module cache for subsequent getters

## GetSiteConfig

// [IMPL-CONFIG_LOADER] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_UI]: return merged site section for layout metadata

CONTRACT GetSiteConfig
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-CONFIG_LOADER_GetSiteConfig(context)
  CALL LoadYamlConfig if not cached
  RETURN site subtree typed

## CodeLocations

// [IMPL-CONFIG_LOADER] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_UI]: map implementing and verifying source files for this IMPL

// FILE: src/lib/config.ts — Config loader implementation
// FILE: src/lib/config.types.ts — Config TypeScript types
// FUNCTION: getSiteConfig in src/lib/config.ts
// FUNCTION: getThemeConfig in src/lib/config.ts

## ErrorHandling

// [IMPL-CONFIG_LOADER] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_UI]: surface recoverable failures without breaking pane invariants

PROCEDURE IMPL-CONFIG_LOADER_on_error(context, error)
  LOG diagnostic with IMPL, ARCH, REQ token refs
  IF recoverable THEN retry or degrade gracefully
  ELSE propagate error to caller
