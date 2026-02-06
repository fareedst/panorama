# Implementation Decisions

**STDD Methodology Version**: 1.3.0

## Overview

This document serves as the **index** for all implementation decisions in this project. Each implementation decision is stored in its own file within the `implementation-decisions/` directory for scalability.

All decisions are cross-referenced with architecture decisions using `[ARCH-*]` tokens and requirements using `[REQ-*]` tokens for traceability.

## Directory Structure

```
stdd/
├── implementation-decisions.md              # This index file
├── implementation-decisions/                # Detail files directory
│   ├── IMPL-CONFIG_STRUCT.md
│   ├── IMPL-STDD_FILES.md
│   ├── IMPL-MODULE_VALIDATION.md
│   └── ...
```

## Filename Convention

Token names contain `:` which is invalid in filenames on many operating systems. Use this mapping:

| Token Format | Filename Format |
|--------------|-----------------|
| `[IMPL-CONFIG_STRUCT]` | `IMPL-CONFIG_STRUCT.md` |
| `[IMPL-MODULE_VALIDATION]` | `IMPL-MODULE_VALIDATION.md` |

**Rule**: Replace `[`, `]`, and `:` → Remove brackets, replace `:` with `-`, append `.md`

## Notes

- All implementation decisions MUST be recorded IMMEDIATELY when made
- Each decision MUST include `[IMPL-*]` token and cross-reference both `[ARCH-*]` and `[REQ-*]` tokens
- Implementation decisions are dependent on both architecture decisions and requirements
- DO NOT defer implementation documentation - record decisions as they are made
- Record where code/tests are annotated so `[PROC-TOKEN_AUDIT]` can succeed later
- Include the most recent `[PROC-TOKEN_VALIDATION]` run information so future contributors know the last verified state
- **Language-Specific Implementation**: Language-specific implementation details (APIs, libraries, syntax patterns, idioms) belong in implementation decisions. Code examples in documentation should use `[your-language]` placeholders or be language-agnostic pseudo-code unless demonstrating a specific language requirement. Requirements and architecture decisions should remain language-agnostic.

## How to Add a New Implementation Decision

1. **Create a new detail file** in `implementation-decisions/` using the naming convention above
2. **Use the detail file template** (see below)
3. **Add an entry to the index table** below
4. **Update `semantic-tokens.md`** registry with the new `[IMPL-*]` token

---

## Implementation Decisions Index

| Token | Title | Status | Cross-References | Detail File |
|-------|-------|--------|------------------|-------------|
| `[IMPL-MODULE_VALIDATION]` | Module Validation | Active | [ARCH-MODULE_VALIDATION] [REQ-MODULE_VALIDATION] | [Detail](implementation-decisions/IMPL-MODULE_VALIDATION.md) |
| `[IMPL-ROOT_LAYOUT]` | Root Layout Component | Active | [ARCH-LAYOUT_PATTERN] [REQ-ROOT_LAYOUT] | [Detail](implementation-decisions/IMPL-ROOT_LAYOUT.md) |
| `[IMPL-HOME_PAGE]` | Home Page Component | Active | [ARCH-SERVER_COMPONENTS] [REQ-HOME_PAGE] | [Detail](implementation-decisions/IMPL-HOME_PAGE.md) |
| `[IMPL-DARK_MODE]` | Dark Mode Implementation | Active | [ARCH-CSS_VARIABLES] [REQ-DARK_MODE] | [Detail](implementation-decisions/IMPL-DARK_MODE.md) |
| `[IMPL-FONT_LOADING]` | Font Loading Configuration | Active | [ARCH-GOOGLE_FONTS] [REQ-FONT_SYSTEM] | [Detail](implementation-decisions/IMPL-FONT_LOADING.md) |
| `[IMPL-IMAGE_OPTIMIZATION]` | Image Optimization | Active | [ARCH-NEXTJS_FRAMEWORK] [REQ-BRANDING] | [Detail](implementation-decisions/IMPL-IMAGE_OPTIMIZATION.md) |
| `[IMPL-EXTERNAL_LINKS]` | External Link Security | Active | [ARCH-APP_ROUTER] [REQ-NAVIGATION_LINKS] | [Detail](implementation-decisions/IMPL-EXTERNAL_LINKS.md) |
| `[IMPL-METADATA]` | Metadata Configuration | Active | [ARCH-NEXTJS_FRAMEWORK] [REQ-METADATA] | [Detail](implementation-decisions/IMPL-METADATA.md) |
| `[IMPL-RESPONSIVE_CLASSES]` | Responsive Utility Classes | Active | [ARCH-RESPONSIVE_FIRST] [REQ-RESPONSIVE_DESIGN] | [Detail](implementation-decisions/IMPL-RESPONSIVE_CLASSES.md) |
| `[IMPL-FLEX_LAYOUT]` | Flexbox Layout Patterns | Active | [ARCH-TAILWIND_V4] [REQ-ROOT_LAYOUT] | [Detail](implementation-decisions/IMPL-FLEX_LAYOUT.md) |
| `[IMPL-TEST_CONFIG]` | Vitest Test Configuration | Active | [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM] | [Detail](implementation-decisions/IMPL-TEST_CONFIG.md) |
| `[IMPL-BUILD_SCRIPTS]` | Build and Test Scripts | Active | [ARCH-NEXTJS_FRAMEWORK] [REQ-BUILD_SYSTEM] | [Detail](implementation-decisions/IMPL-BUILD_SCRIPTS.md) |
| `[IMPL-TEST_SETUP]` | Test Setup and Utilities | Active | [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM] | [Detail](implementation-decisions/IMPL-TEST_SETUP.md) |
| `[IMPL-STDD_FILES]` | STDD Methodology Files | Active | [ARCH-STDD_STRUCTURE] [REQ-STDD_SETUP] | [Detail](implementation-decisions/IMPL-STDD_FILES.md) |
| `[IMPL-YAML_CONFIG]` | YAML Configuration File Structure | Active | [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_UI] | [Detail](implementation-decisions/IMPL-YAML_CONFIG.md) |
| `[IMPL-CONFIG_LOADER]` | Configuration Loader Module | Active | [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_UI] | [Detail](implementation-decisions/IMPL-CONFIG_LOADER.md) |
| `[IMPL-THEME_INJECTION]` | Theme CSS Variable Injection | Active | [ARCH-THEME_INJECTION] [REQ-CONFIG_DRIVEN_UI] | [Detail](implementation-decisions/IMPL-THEME_INJECTION.md) |
| `[IMPL-CLASS_OVERRIDES]` | Tailwind Class Override Implementation | Active | [ARCH-CLASS_OVERRIDES] [REQ-CONFIG_DRIVEN_UI] | [Detail](implementation-decisions/IMPL-CLASS_OVERRIDES.md) |
| `[IMPL-CONFIG_DRIVEN_APPEARANCE]` | Config-Driven Appearance for All Pages | Active | [ARCH-CONFIG_DRIVEN_APPEARANCE] [REQ-CONFIG_DRIVEN_APPEARANCE] | [Detail](implementation-decisions/IMPL-CONFIG_DRIVEN_APPEARANCE.md) |
| `[IMPL-JOBS_DATA]` | Jobs Data Layer Implementation | Active | [ARCH-JOB_TRACKER_STORAGE] [REQ-JOB_TRACKER_DATA] | [Detail](implementation-decisions/IMPL-JOBS_DATA.md) |
| `[IMPL-JOBS_ACTIONS]` | Jobs Server Actions Implementation | Active | [ARCH-JOB_TRACKER_UI] [REQ-JOB_TRACKER_CRUD] | [Detail](implementation-decisions/IMPL-JOBS_ACTIONS.md) |
| `[IMPL-JOBS_LIST_PAGE]` | Jobs List Page Implementation | Active | [ARCH-JOB_TRACKER_UI] [REQ-JOB_TRACKER_LIST] | [Detail](implementation-decisions/IMPL-JOBS_LIST_PAGE.md) |
| `[IMPL-JOBS_EDIT_PAGE]` | Jobs Edit Page Implementation | Active | [ARCH-JOB_TRACKER_UI] [REQ-JOB_TRACKER_EDIT] | [Detail](implementation-decisions/IMPL-JOBS_EDIT_PAGE.md) |
| `[IMPL-JOBS_API]` | Jobs API Implementation | Active | [ARCH-JOB_TRACKER_API] [REQ-JOB_TRACKER_CRUD] | [Detail](implementation-decisions/IMPL-JOBS_API.md) |
| `[IMPL-CALENDAR_PAGE]` | Calendar Page Server Component | Planned | [ARCH-CALENDAR_VIEW] [REQ-JOB_TRACKER_CALENDAR] | [Detail](implementation-decisions/IMPL-CALENDAR_PAGE.md) |
| `[IMPL-CALENDAR_GRID]` | Calendar Grid Client Component | Planned | [ARCH-CALENDAR_VIEW] [REQ-JOB_TRACKER_CALENDAR] | [Detail](implementation-decisions/IMPL-CALENDAR_GRID.md) |
| `[IMPL-EDIT_PAGE_RETURN_SOURCE]` | Edit Position Return to Source View | Active | [ARCH-JOB_TRACKER_UI] [ARCH-CALENDAR_VIEW] [REQ-JOB_TRACKER_EDIT] [REQ-JOB_TRACKER_CALENDAR] | [Detail](implementation-decisions/IMPL-EDIT_PAGE_RETURN_SOURCE.md) |
| `[IMPL-GLOBAL_ERROR_BOUNDARY]` | Global Error Boundary Component | Active | [ARCH-NEXTJS_FRAMEWORK] [REQ-ERROR_HANDLING] | [Detail](implementation-decisions/IMPL-GLOBAL_ERROR_BOUNDARY.md) |

### Status Values

- **Active**: Currently in use and maintained
- **Deprecated**: No longer recommended; kept for historical reference
- **Template**: Example/template entry for reference
- **Superseded**: Replaced by another decision (note the replacement in the detail file)

---

## Detail File Template

Use this template when creating a new implementation decision file in `implementation-decisions/`:

```markdown
# [IMPL-IDENTIFIER] Implementation Title

**Cross-References**: [ARCH-RELATED_ARCHITECTURE] [REQ-RELATED_REQUIREMENT]  
**Status**: Active  
**Created**: YYYY-MM-DD  
**Last Updated**: YYYY-MM-DD

---

## Decision

Brief description of the implementation decision.

## Rationale

- Why this implementation approach was chosen
- What problems it solves
- How it fulfills the architecture decision

## Implementation Approach

- Specific technical details
- Code structure or patterns
- API design decisions

### Data Structures

```[your-language]
// [IMPL-IDENTIFIER] [ARCH-RELATED_ARCHITECTURE] [REQ-RELATED_REQUIREMENT]
// Define your data structures here
type ExampleStruct struct {
    Field1 string
    Field2 int
}
```

### Key Algorithms

Description of key algorithms and their implementation.

### Platform-Specific Considerations

- Platform 1: Specific considerations
- Platform 2: Specific considerations

## Code Markers

Specific code locations, function names, or patterns to look for:
- `path/to/file.ext`: Description of what's implemented there
- Function `exampleFunction()`: What it does

## Token Coverage `[PROC-TOKEN_AUDIT]`

Files/functions that must carry the `[IMPL-*] [ARCH-*] [REQ-*]` annotations:
- [ ] `path/to/implementation.ext` - Main implementation
- [ ] `path/to/helper.ext` - Helper functions

Tests that must reference the matching `[REQ-*]`:
- [ ] `testFeatureName_REQ_IDENTIFIER` in `path/to/test_file.ext`

## Validation Evidence `[PROC-TOKEN_VALIDATION]`

| Date | Commit | Validation Result | Notes |
|------|--------|-------------------|-------|
| YYYY-MM-DD | `abc1234` | ✅ Pass | Initial validation |

Latest `./scripts/validate_tokens.sh` output summary:
```
(paste relevant output here)
```

## Related Decisions

- Depends on: [IMPL-OTHER_DECISION]
- Supersedes: (if applicable)
- See also: [ARCH-RELATED_ARCHITECTURE]

---

*Last validated: YYYY-MM-DD by [agent/contributor]*
```

---

## Quick Reference: Creating a New Implementation Decision

```bash
# 1. Create the detail file
touch stdd/implementation-decisions/IMPL-YOUR_TOKEN.md

# 2. Copy the template above into the new file

# 3. Fill in the details

# 4. Add entry to the index table in this file

# 5. Update semantic-tokens.md registry
```

---

## Grouping by Domain (Optional)

For very large projects, organize detail files by domain:

```
implementation-decisions/
├── core/
│   ├── IMPL-CONFIG_STRUCT.md
│   └── IMPL-ERROR_HANDLING.md
├── auth/
│   ├── IMPL-AUTH_FLOW.md
│   └── IMPL-SESSION_MGMT.md
└── api/
    └── IMPL-REST_ENDPOINTS.md
```

When using subdirectories, update the Detail File column in the index:
```markdown
| `[IMPL-AUTH_FLOW]` | Auth Flow | Active | ... | [Detail](implementation-decisions/auth/IMPL-AUTH_FLOW.md) |
```

---

## Migration from Monolithic File

If migrating from a single `implementation-decisions.md` file:

1. Create the `implementation-decisions/` directory
2. For each numbered section in the old file:
   - Create `IMPL-{TOKEN_NAME}.md` using the detail template
   - Copy content into the new file
   - Add metadata (Status, Created, Last Updated)
3. Replace section content in this file with an index row
4. Update `semantic-tokens.md` to note the new structure
5. Verify all links work correctly

