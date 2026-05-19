# IMPL-EXTERNAL_LINKS essence pseudocode

// [IMPL-EXTERNAL_LINKS] [ARCH-APP_ROUTER] [REQ-NAVIGATION_LINKS]: Top-level External Links Implementation: Add target='_blank' and rel='noopener noreferrer' to external links

## Summary contract

// [IMPL-EXTERNAL_LINKS] [ARCH-APP_ROUTER] [REQ-NAVIGATION_LINKS]: bound module inputs, outputs, and shared data for all runtime blocks below

CONTRACT Summary
  INPUT: caller context, pane state, configuration
  OUTPUT: behavior required by IMPL-EXTERNAL_LINKS
  DATA: state and configuration per implementation_approach

## AddRelNoopenerNoreferrer

// [IMPL-EXTERNAL_LINKS] [ARCH-APP_ROUTER] [REQ-NAVIGATION_LINKS]: Add rel='noopener noreferrer

CONTRACT AddRelNoopenerNoreferrer
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-EXTERNAL_LINKS_AddRelNoopenerNoreferrer(context)
  // Add rel='noopener noreferrer
  CALL Add rel='noopener noreferrer
  ON invalid input OR missing data THEN RETURN without mutation

## AddTargetBlank

// [IMPL-EXTERNAL_LINKS] [ARCH-APP_ROUTER] [REQ-NAVIGATION_LINKS]: Add target='_blank

CONTRACT AddTargetBlank
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-EXTERNAL_LINKS_AddTargetBlank(context)
  // Add target='_blank
  CALL Add target='_blank
  ON invalid input OR missing data THEN RETURN without mutation

## LoadURLsFromConfig

// [IMPL-EXTERNAL_LINKS] [ARCH-APP_ROUTER] [REQ-NAVIGATION_LINKS]: Load URLs from config

CONTRACT LoadURLsFromConfig
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-EXTERNAL_LINKS_LoadURLsFromConfig(context)
  // Load URLs from config
  CALL Load URLs from config
  ON invalid input OR missing data THEN RETURN without mutation

## UseATagsFor

// [IMPL-EXTERNAL_LINKS] [ARCH-APP_ROUTER] [REQ-NAVIGATION_LINKS]: Use <a> tags for external links

CONTRACT UseATagsFor
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-EXTERNAL_LINKS_UseATagsFor(context)
  // Use <a> tags for external links
  CALL Use <a> tags for external links
  ON invalid input OR missing data THEN RETURN without mutation

## CodeLocations

// [IMPL-EXTERNAL_LINKS] [ARCH-APP_ROUTER] [REQ-NAVIGATION_LINKS]: map implementing and verifying source files for this IMPL

// FILE: src/app/page.tsx — External links in home page

## ErrorHandling

// [IMPL-EXTERNAL_LINKS] [ARCH-APP_ROUTER] [REQ-NAVIGATION_LINKS]: surface recoverable failures without breaking pane invariants

PROCEDURE IMPL-EXTERNAL_LINKS_on_error(context, error)
  LOG diagnostic with IMPL, ARCH, REQ token refs
  IF recoverable THEN retry or degrade gracefully
  ELSE propagate error to caller
