# IMPL-NSYNC_VERIFY essence pseudocode

// [IMPL-NSYNC_VERIFY] [ARCH-HASH_VERIFICATION] [REQ-VERIFY_DEST]: Top-level Destination Verification Implementation: Destination file verification by recomputing hash and comparing to source

## Summary contract

// [IMPL-NSYNC_VERIFY] [ARCH-HASH_VERIFICATION] [REQ-VERIFY_DEST]: bound module inputs, outputs, and shared data for all runtime blocks below

CONTRACT Summary
  INPUT: caller context, pane state, configuration
  OUTPUT: behavior required by IMPL-NSYNC_VERIFY
  DATA: state and configuration per implementation_approach

## VerifyDestination

// [IMPL-NSYNC_VERIFY] [ARCH-HASH_VERIFICATION] [REQ-VERIFY_DEST]: re-hash destination and compare to source hash after copy

CONTRACT VerifyDestination
  INPUT: pane or module context for this block
  OUTPUT: updated state or side effect described below
  DATA: fields referenced in steps

PROCEDURE IMPL-NSYNC_VERIFY_VerifyDestination(context)
  IF verify option false THEN RETURN success
  AWAIT computeFileHash on destination
  IF destHash not equals sourceHash THEN RETURN verification failure

## CodeLocations

// [IMPL-NSYNC_VERIFY] [ARCH-HASH_VERIFICATION] [REQ-VERIFY_DEST]: map implementing and verifying source files for this IMPL

// FILE: src/lib/sync/verify.ts — IMPL-NSYNC_VERIFY

## ErrorHandling

// [IMPL-NSYNC_VERIFY] [ARCH-HASH_VERIFICATION] [REQ-VERIFY_DEST]: surface recoverable failures without breaking pane invariants

PROCEDURE IMPL-NSYNC_VERIFY_on_error(context, error)
  LOG diagnostic with IMPL, ARCH, REQ token refs
  IF recoverable THEN retry or degrade gracefully
  ELSE propagate error to caller
