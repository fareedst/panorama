# Tasks and Incomplete Subtasks

**STDD Methodology Version**: 1.3.0

## Overview
This document tracks active tasks. Completed work is recorded in **requirements** and **decisions** (requirements.yaml, architecture-decisions.yaml, implementation-decisions.yaml); plans for completed tasks are removed from here.

## Priority Levels

- **P0 (Critical)**: Must have - Core functionality, blocks other work
- **P1 (Important)**: Should have - Enhanced functionality, better error handling
- **P2 (Nice-to-Have)**: Could have - UI/UX improvements, convenience features
- **P3 (Future)**: Won't have now - Deferred features, experimental ideas

## Task Management Rules

1. **Subtasks are temporary** — Remove subtasks when the parent task completes.
2. **Only reqs and decisions are significant** — Completion details live in requirements.yaml and implementation-decisions.yaml, not in this file.
3. **Semantic token references** — Every task MUST reference at least one semantic token.
4. **Token audits** — Run `[PROC-TOKEN_AUDIT]` and validation before closing a task; log outcomes.

## Task Status Icons

- 🟡 **In Progress**: Actively being worked on
- ✅ **Complete**: Criteria met; see requirements/decisions for detail
- ⏸️ **Blocked**: Waiting on dependency
- ⏳ **Pending**: Not yet started

---

## Completed Tasks (minimal reference)

- **P0: Setup STDD Methodology** [REQ-STDD_SETUP] [ARCH-STDD_STRUCTURE] [IMPL-STDD_FILES] — ✅ Complete
- **P0: Promote Processes into Core Methodology** [REQ-STDD_SETUP] — ✅ Complete
- **P0: Configuration-Driven UI** [REQ-CONFIG_DRIVEN_UI] [ARCH-CONFIG_DRIVEN_UI] [IMPL-CONFIG_LOADER] — ✅ Complete
- **P1: Job Search Tracker** [REQ-JOB_TRACKER_*] [ARCH-CONFIG_DRIVEN_CRUD] [IMPL-JOBS_*] — ✅ Complete
- **P0: Config-Driven Appearance for All Pages** [REQ-CONFIG_DRIVEN_APPEARANCE] [IMPL-CONFIG_DRIVEN_APPEARANCE] — ✅ Complete
- **P1: Calendar Month View for Jobs** [REQ-JOB_TRACKER_CALENDAR] [ARCH-CALENDAR_VIEW] [IMPL-CALENDAR_*] — ✅ Complete
- **P2: Edit Position Return to Source View** [REQ-JOB_TRACKER_EDIT] [IMPL-EDIT_PAGE_RETURN_SOURCE] — ✅ Complete
- **P0: Multi-Pane File Manager** [REQ-FILE_MANAGER_PAGE] [ARCH-FILE_MANAGER_HIERARCHY] [IMPL-FILE_MANAGER_PAGE] [IMPL-WORKSPACE_VIEW] [IMPL-FILE_PANE] — ✅ Complete
- **P1: Session-Based Logging System** [REQ-LOGGING_SYSTEM] [ARCH-LOGGING_SYSTEM] [IMPL-LOGGER_MODULE] — ✅ Complete
- **Goful UX Phases 1–11** — ✅ Complete
  - Phase 1: File marking [REQ-FILE_MARKING_WEB] — Complete
  - Phase 2: Bulk ops [REQ-BULK_FILE_OPS] — Complete
  - Phase 3: Advanced nav [REQ-ADVANCED_NAV] — Complete
  - Phase 4: Comparison [REQ-FILE_COMPARISON_VISUAL] — Complete
  - Phase 5: Sorting [REQ-FILE_SORTING_ADVANCED] — Complete
  - Phase 6: Preview [REQ-FILE_PREVIEW] — Complete
  - Phase 7: Keyboard shortcuts [REQ-KEYBOARD_SHORTCUTS_COMPLETE] — Complete
  - Phase 8: Search [REQ-FILE_SEARCH] — Complete
  - Phase 9: Linked navigation [REQ-LINKED_PANES] — Complete
  - Phase 10: Mouse support [REQ-MOUSE_INTERACTION] — Complete
  - Phase 11: Configuration [REQ-FILES_CONFIG_COMPLETE] — Complete
  - See requirements/decisions for details
- **P1: Configurable File Columns** [REQ-CONFIG_DRIVEN_FILE_MANAGER] [IMPL-FILE_COLUMN_CONFIG] — ✅ Complete (2026-02-08)
  - Implemented dynamic column configuration with order and visibility control
  - Added YYYY-MM-DD HH:MM:SS time format
  - Default order: mtime, size, name
  - See implementation-decisions/IMPL-FILE_COLUMN_CONFIG.md for details

---

## Active Tasks

## P0: Complete File Manager UX from Goful [REQ-GOFUL_FEATURE_TRANSFER] [ARCH-GOFUL_UX_PATTERNS] [IMPL-GOFUL_FEATURES]

**Status**: 🟡 In Progress

**Description**: Transfer remaining file manager UX from Goful. Phases 1–9 complete (see requirements/decisions). Remaining: performance optimization.

**Dependencies**: [REQ-FILE_MANAGER_PAGE], [REQ-MULTI_PANE_LAYOUT], [REQ-DIRECTORY_NAVIGATION]

### Phase 12: Performance and Polish (P1) [REQ-FILES_PERFORMANCE] [IMPL-PERFORMANCE_OPT]
- [ ] Document [REQ-FILES_PERFORMANCE] requirement
- [ ] Virtual scrolling for large directories (1000+ files) [IMPL-PERFORMANCE_OPT]
- [ ] Lazy loading for file metadata [IMPL-PERFORMANCE_OPT]
- [ ] Debounced comparison index updates [IMPL-PERFORMANCE_OPT]
- [ ] Optimize sort algorithms [IMPL-PERFORMANCE_OPT]
- [ ] Memory profiling and optimization [IMPL-PERFORMANCE_OPT]
- [ ] Load time testing [IMPL-PERFORMANCE_OPT]
- [ ] Tests for performance [TEST-FILES_PERFORMANCE]

**Completion Criteria** (remaining): Phases 9–12 complete; tests passing; documentation in requirements/decisions updated; token audit and validation logged.

**Priority Rationale**: P0 — file manager is core; remaining phases complete feature parity and polish.

---

## Pending / Template

## Phase 2: Core Components — Task 2.1 [REQ-MODULE_VALIDATION]

**Status**: ⏳ Pending  
**Priority**: P0  
**Description**: Implement core feature with module validation. See requirements and architecture for scope.  
**Subtasks**: Identify modules, validate independently, integrate, run token audit/validation.
