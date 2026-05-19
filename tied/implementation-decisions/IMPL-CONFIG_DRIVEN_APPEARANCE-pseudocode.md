# IMPL-CONFIG_DRIVEN_APPEARANCE essence pseudocode

// [IMPL-CONFIG_DRIVEN_APPEARANCE] [ARCH-CONFIG_DRIVEN_APPEARANCE] [REQ-CONFIG_DRIVEN_APPEARANCE]: Top-level Config-Driven Appearance Implementation: Add jobs config loader, extend theme with jobs overrides, refactor jobs UI to use config

## Summary contract

// [IMPL-CONFIG_DRIVEN_APPEARANCE] [ARCH-CONFIG_DRIVEN_APPEARANCE] [REQ-CONFIG_DRIVEN_APPEARANCE]: bound module inputs, outputs, and shared data for all runtime blocks below

CONTRACT Summary
  INPUT: caller context, pane state, configuration
  OUTPUT: behavior required by IMPL-CONFIG_DRIVEN_APPEARANCE
  DATA: state and configuration per implementation_approach

## AddGetJobsConfigFunction

// [IMPL-CONFIG_DRIVEN_APPEARANCE] [ARCH-CONFIG_DRIVEN_APPEARANCE] [REQ-CONFIG_DRIVEN_APPEARANCE]: Add getJobsConfig() function

CONTRACT AddGetJobsConfigFunction
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-CONFIG_DRIVEN_APPEARANCE_AddGetJobsConfigFunction(context)
  // Add getJobsConfig() function
  CALL Add getJobsConfig() function
  ON invalid input OR missing data THEN RETURN without mutation

## DefineJobsCopyConfigAndJobsThemeOverrides

// [IMPL-CONFIG_DRIVEN_APPEARANCE] [ARCH-CONFIG_DRIVEN_APPEARANCE] [REQ-CONFIG_DRIVEN_APPEARANCE]: Define JobsCopyConfig and JobsThemeOverrides types

CONTRACT DefineJobsCopyConfigAndJobsThemeOverrides
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-CONFIG_DRIVEN_APPEARANCE_DefineJobsCopyConfigAndJobsThemeOverrides(context)
  // Define JobsCopyConfig
  CALL Define JobsCopyConfig
  // JobsThemeOverrides types
  CALL JobsThemeOverrides types

## ExtendThemeYamlWith

// [IMPL-CONFIG_DRIVEN_APPEARANCE] [ARCH-CONFIG_DRIVEN_APPEARANCE] [REQ-CONFIG_DRIVEN_APPEARANCE]: Extend theme.yaml with jobs section

CONTRACT ExtendThemeYamlWith
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-CONFIG_DRIVEN_APPEARANCE_ExtendThemeYamlWith(context)
  // Extend theme.yaml with jobs section
  CALL Extend theme.yaml with jobs section
  ON invalid input OR missing data THEN RETURN without mutation

## RefactorFormsToUse

// [IMPL-CONFIG_DRIVEN_APPEARANCE] [ARCH-CONFIG_DRIVEN_APPEARANCE] [REQ-CONFIG_DRIVEN_APPEARANCE]: Refactor forms to use config

CONTRACT RefactorFormsToUse
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-CONFIG_DRIVEN_APPEARANCE_RefactorFormsToUse(context)
  // Refactor forms to use config
  CALL Refactor forms to use config
  ON invalid input OR missing data THEN RETURN without mutation

## RefactorJobsPagesTo

// [IMPL-CONFIG_DRIVEN_APPEARANCE] [ARCH-CONFIG_DRIVEN_APPEARANCE] [REQ-CONFIG_DRIVEN_APPEARANCE]: Refactor jobs pages to use config

CONTRACT RefactorJobsPagesTo
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-CONFIG_DRIVEN_APPEARANCE_RefactorJobsPagesTo(context)
  // Refactor jobs pages to use config
  CALL Refactor jobs pages to use config
  ON invalid input OR missing data THEN RETURN without mutation

## RefactorJobsTableToReceive

// [IMPL-CONFIG_DRIVEN_APPEARANCE] [ARCH-CONFIG_DRIVEN_APPEARANCE] [REQ-CONFIG_DRIVEN_APPEARANCE]: Refactor JobsTable to receive copy and class props

CONTRACT RefactorJobsTableToReceive
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-CONFIG_DRIVEN_APPEARANCE_RefactorJobsTableToReceive(context)
  // Refactor JobsTable to receive copy
  CALL Refactor JobsTable to receive copy
  // class props
  CALL class props

## CodeLocations

// [IMPL-CONFIG_DRIVEN_APPEARANCE] [ARCH-CONFIG_DRIVEN_APPEARANCE] [REQ-CONFIG_DRIVEN_APPEARANCE]: map implementing and verifying source files for this IMPL

// FILE: src/lib/jobs.ts — Jobs config loader
// FILE: src/app/jobs/page.tsx — Jobs list page using config
// FILE: src/app/jobs/[id]/edit/page.tsx — Jobs edit page using config
// FILE: config/jobs.yaml — Jobs configuration
// FUNCTION: getJobsConfig in src/lib/jobs.ts

## ErrorHandling

// [IMPL-CONFIG_DRIVEN_APPEARANCE] [ARCH-CONFIG_DRIVEN_APPEARANCE] [REQ-CONFIG_DRIVEN_APPEARANCE]: surface recoverable failures without breaking pane invariants

PROCEDURE IMPL-CONFIG_DRIVEN_APPEARANCE_on_error(context, error)
  LOG diagnostic with IMPL, ARCH, REQ token refs
  IF recoverable THEN retry or degrade gracefully
  ELSE propagate error to caller
