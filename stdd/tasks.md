# Tasks and Incomplete Subtasks

**STDD Methodology Version**: 1.3.0

## Overview
This document tracks all tasks and subtasks for implementing this project. Tasks are organized by priority and implementation phase.

## Priority Levels

- **P0 (Critical)**: Must have - Core functionality, blocks other work
- **P1 (Important)**: Should have - Enhanced functionality, better error handling
- **P2 (Nice-to-Have)**: Could have - UI/UX improvements, convenience features
- **P3 (Future)**: Won't have now - Deferred features, experimental ideas

## Task Format

```markdown
## P0: Task Name [REQ-IDENTIFIER] [ARCH-IDENTIFIER] [IMPL-IDENTIFIER]

**Status**: 🟡 In Progress | ✅ Complete | ⏸️ Blocked | ⏳ Pending

**Description**: Brief description of what this task accomplishes.

**Dependencies**: List of other tasks/tokens this depends on.

**Subtasks**:
- [ ] Subtask 1 [REQ-X] [IMPL-Y]
- [ ] Subtask 2 [REQ-X] [IMPL-Z]
- [ ] Subtask 3 [TEST-X]
- [ ] Token audit & validation [PROC-TOKEN_AUDIT] [PROC-TOKEN_VALIDATION]

**Completion Criteria**:
- [ ] All subtasks complete
- [ ] Code implements requirement
- [ ] Tests pass with semantic token references
- [ ] Documentation updated
- [ ] `[PROC-TOKEN_AUDIT]` and `[PROC-TOKEN_VALIDATION]` outcomes logged

**Priority Rationale**: Why this is P0/P1/P2/P3
```

## Task Management Rules

1. **Subtasks are Temporary**
   - Subtasks exist only while the parent task is in progress
   - Remove subtasks when parent task completes

2. **Priority Must Be Justified**
   - Each task must have a priority rationale
   - Priorities follow: Tests/Code/Functions > DX > Infrastructure > Security

3. **Semantic Token References Required**
   - Every task MUST reference at least one semantic token
   - Cross-reference to related tokens

4. **Token Audits & Validation Required**
   - Every task must include a `[PROC-TOKEN_AUDIT]` subtask and capture its result
   - `./scripts/validate_tokens.sh` (or repo-specific equivalent) must run before closing the task, with results logged under `[PROC-TOKEN_VALIDATION]`

5. **Completion Criteria Must Be Met**
   - All criteria must be checked before marking complete
   - Documentation must be updated

## Task Status Icons

- 🟡 **In Progress**: Actively being worked on
- ✅ **Complete**: All criteria met, subtasks removed
- ⏸️ **Blocked**: Waiting on dependency
- ⏳ **Pending**: Not yet started

## Active Tasks

## P0: Setup STDD Methodology [REQ-STDD_SETUP] [ARCH-STDD_STRUCTURE] [IMPL-STDD_FILES]

**Status**: ✅ Complete

**Description**: Initialize the project with the STDD directory structure and documentation files.

**Dependencies**: None

**Subtasks**:
- [x] Create `stdd/` directory
- [x] Instantiate documentation files from templates
- [x] Update `.cursorrules`
- [x] Register semantic tokens

**Completion Criteria**:
- [x] All subtasks complete
- [x] Code implements requirement
- [x] Documentation updated

**Priority Rationale**: P0 because this is the foundation for all future work.

## P0: Promote Processes into Core Methodology [REQ-STDD_SETUP] [ARCH-STDD_STRUCTURE] [IMPL-STDD_FILES]

**Status**: ✅ Complete

**Description**: Align every methodology reference (docs, templates, registry files) to STDD v1.1.0 after elevating Processes into the primary STDD workflow.

**Dependencies**: None

**Subtasks**:
- [x] Update STDD version references across methodology docs and guides
- [x] Update all template files and project copies with the new version marker
- [x] Refresh `VERSION`, `CHANGELOG.md`, and supporting metadata to announce v1.1.0

**Completion Criteria**:
- [x] All semantic references cite STDD v1.1.0
- [x] VERSION file, changelog, and documentation agree on the new version
- [x] Tasks and supporting docs reflect completion of this work

**Priority Rationale**: Processes are now a primary STDD concern; all consumers must see the v1.1.0 upgrade immediately to maintain alignment.

## P0: Configuration-Driven UI [REQ-CONFIG_DRIVEN_UI] [ARCH-CONFIG_DRIVEN_UI] [IMPL-CONFIG_LOADER]

**Status**: ✅ Complete

**Description**: Extract all hard-coded appearance, layout, and content values from page components into YAML configuration files, making the project a highly configurable template.

**Dependencies**: [REQ-APP_STRUCTURE], [REQ-DARK_MODE], [REQ-TAILWIND_STYLING]

**Completion Criteria**:
- [x] Two YAML config files created (config/site.yaml, config/theme.yaml)
- [x] TypeScript interfaces define config schemas (src/lib/config.types.ts)
- [x] Config loader module reads YAML, merges with defaults, caches (src/lib/config.ts)
- [x] globals.css simplified to reference CSS variables only (no hard-coded colors)
- [x] layout.tsx consumes config for metadata, locale, and theme CSS injection
- [x] page.tsx consumes config for all content, links, images, and class overrides
- [x] Config loader unit tests pass (31 tests)
- [x] All component/integration tests updated for config-driven content (102 total tests)
- [x] STDD documentation complete (requirement, 3 ARCH decisions, 4 IMPL decisions, registries updated)
- [x] `[PROC-TOKEN_AUDIT]` verified across all new/modified files

**Priority Rationale**: P0 because configuration-driven UI is the core differentiator that makes this project a usable template. Without it, every customization requires code changes.

## P1: Job Search Tracker [REQ-JOB_SEARCH_TRACKER] [ARCH-CONFIG_DRIVEN_CRUD] [IMPL-JOB_SEARCH_TRACKER]

**Status**: ✅ Complete

**Description**: Implement a config-driven job search activity tracker with YAML data storage, dynamic form/table UI, and RESTful API routes. Extends the existing config-driven architecture to CRUD features.

**Dependencies**: [REQ-CONFIG_DRIVEN_UI], [REQ-APP_STRUCTURE]

**Completion Criteria**:
- [x] YAML config file (`config/jobs.yaml`) defines 7 fields, 5 status options, and table settings
- [x] YAML data file (`data/jobs.yaml`) persists records
- [x] TypeScript interfaces define config and data schemas (`src/lib/jobs.types.ts`)
- [x] Data layer module provides config loading + CRUD operations (`src/lib/jobs.ts`)
- [x] API routes handle GET/POST/PUT/DELETE (`src/app/api/jobs/`)
- [x] Table page renders config-driven columns (`/jobs`)
- [x] Form component dynamically renders field types (`JobForm`)
- [x] Edit and new pages use shared form component
- [x] Home page navigation updated with link to `/jobs`
- [x] Full CRUD cycle verified (POST 201, GET 200, PUT 200, DELETE 204)
- [x] TypeScript compilation passes without errors
- [x] STDD documentation complete (1 REQ, 2 ARCH decisions, 4 IMPL decisions, registries updated)
- [x] `[PROC-TOKEN_AUDIT]` verified across all new files

**Priority Rationale**: P1 because this is the first data-backed feature demonstrating the config-driven architecture's extensibility to CRUD applications.

## P0: Config-Driven Appearance for All Pages [REQ-CONFIG_DRIVEN_APPEARANCE] [ARCH-CONFIG_DRIVEN_APPEARANCE] [IMPL-CONFIG_DRIVEN_APPEARANCE]

**Status**: ✅ Complete

**Description**: Ensure appearance and layout of all page elements are dictated by configuration files so the project serves as a highly-configurable template. Extend config-driven UI to jobs routes and components; remove hard-coded layout, copy, and styling from jobs app.

**Dependencies**: [REQ-CONFIG_DRIVEN_UI], [REQ-JOB_TRACKER_LIST], [REQ-JOB_TRACKER_EDIT]

**Subtasks** (completed):
- [x] Add jobs config loader (`getJobsConfig()`) and types for `config/jobs.yaml` (schema + copy section) [IMPL-CONFIG_DRIVEN_APPEARANCE]
- [x] Extend `config/theme.yaml` with jobs layout/overrides and status badge class mapping [ARCH-CONFIG_DRIVEN_APPEARANCE]
- [x] Extend config.types.ts (or theme types) with jobs overrides and jobs copy types [IMPL-CONFIG_DRIVEN_APPEARANCE]
- [x] Refactor jobs list page to use getJobsConfig() + getThemeConfig() for layout, copy, and classes [IMPL-JOBS_LIST_PAGE]
- [x] Refactor jobs new and edit pages to use config for layout, headings, and copy [IMPL-JOBS_EDIT_PAGE]
- [x] Refactor JobsTable to receive copy and status badge class map as props; remove getStatusColorClass [IMPL-JOBS_LIST_PAGE]
- [x] Refactor PositionForm, ApplicationForm, DeletePositionButton to receive copy and class props from config [IMPL-JOBS_EDIT_PAGE]
- [x] Add/update tests for config-driven jobs UI and config loader [REQ-CONFIG_DRIVEN_APPEARANCE]
- [x] Run `[PROC-TOKEN_AUDIT]` and `./scripts/validate_tokens.sh`; log outcomes [PROC-TOKEN_VALIDATION]

**Completion Criteria**:
- [x] All jobs pages and components consume config for layout, copy, and styling; no hard-coded user-facing strings or layout-only classes in jobs TSX
- [x] Changing config/jobs.yaml or config/theme.yaml (jobs section) changes jobs UI without code changes
- [x] Documentation and semantic tokens updated; token audit and validation logged

**Priority Rationale**: P0 because it is required for the project to qualify as a highly-configurable template; without it, the template promise is incomplete.

## Phase 2: Core Components

### Task 2.1: Core Feature Implementation
**Status:** ⏳ Pending  
**Priority:** P0 (Critical)  
**Semantic Tokens:** `[REQ-EXAMPLE_FEATURE]`, `[ARCH-EXAMPLE_DECISION]`, `[IMPL-EXAMPLE_IMPLEMENTATION]`

**Description**: Implement the core feature according to requirements and architecture.

**Subtasks**:
- [ ] Identify logical modules and document module boundaries [REQ-MODULE_VALIDATION]
- [ ] Define module interfaces and validation criteria [REQ-MODULE_VALIDATION]
- [ ] Develop Module 1 independently
- [ ] Validate Module 1 independently (unit tests, contract tests, edge cases, error handling) [REQ-MODULE_VALIDATION]
- [ ] Develop Module 2 independently
- [ ] Validate Module 2 independently (unit tests, contract tests, edge cases, error handling) [REQ-MODULE_VALIDATION]
- [ ] Integrate validated modules [REQ-MODULE_VALIDATION]
- [ ] Write integration tests for combined behavior
- [ ] Write end-to-end tests [REQ-EXAMPLE_FEATURE]
- [ ] Run `[PROC-TOKEN_AUDIT]` + `./scripts/validate_tokens.sh` and record outcomes [PROC-TOKEN_VALIDATION]

**Completion Criteria**:
- [ ] All modules identified and documented
- [ ] All modules validated independently before integration
- [ ] Integration tests pass
- [ ] All documentation updated
- [ ] Token audit + validation logged


