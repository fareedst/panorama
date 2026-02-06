# Semantic Tokens Directory

**STDD Methodology Version**: 1.3.0

## Overview
This document serves as the **central directory/registry** for all semantic tokens used in the project. Semantic tokens (`[REQ-*]`, `[ARCH-*]`, `[IMPL-*]`) provide a consistent vocabulary and traceability mechanism that ties together all documentation, code, and tests.

**For detailed information about tokens, see:**
- **Requirements tokens**: See `requirements.md` for full descriptions, rationale, satisfaction criteria, and validation criteria
- **Architecture tokens**: See `architecture-decisions.md` for architectural decisions, rationale, and alternatives considered
- **Implementation tokens**: See `implementation-decisions.md` for implementation details, code structures, and algorithms
- **Code vs docs audit**: See `STDD-AUDIT-CODE-VS-DOCS.md` for whether code and semantic tokens are correctly represented for agent recreatability

## AI Assistant Integration Guidelines [REQ-DOC_016]

### Token Usage for AI Assistants

AI assistants should use semantic tokens for:

1. **Code Navigation**: Search for `[REQ-*]`, `[ARCH-*]`, `[IMPL-*]` tokens to find related code
2. **Feature Understanding**: Trace features from requirements through architecture to implementation
3. **Change Impact Analysis**: Use token cross-references to identify affected components
4. **Test Discovery**: Find tests for features using `[REQ-*]` tokens in test names

### Token-Based Code Navigation

```bash
# Find all implementations of a requirement
grep -r "\[REQ-FEATURE_NAME\]" --include="*.tsx" --include="*.ts" --include="*.css" .

# Find all tests for a requirement
grep -r "REQ_FEATURE_NAME" --include="*.test.tsx" --include="*.test.ts" .

# Find architecture decisions for a feature
grep -r "\[ARCH-FEATURE_NAME\]" --include="*.md" .

# Find implementation details
grep -r "\[IMPL-FEATURE_NAME\]" --include="*.tsx" --include="*.ts" --include="*.css" .
```

### Token Creation Requirements

When implementing features:
1. **ALWAYS** create `[REQ-*]` token in `requirements.md` first
2. **ALWAYS** create `[ARCH-*]` token in `architecture-decisions.md` for design decisions
3. **ALWAYS** add `[IMPL-*]` tokens to code comments
4. **ALWAYS** reference `[REQ-*]` tokens in test names/comments
5. **ALWAYS** update `semantic-tokens.md` registry when creating new tokens
6. **ALWAYS** document any `[PROC-*]` process tokens in `processes.md` when defining operational workflows

### Token Audit Workflow `[PROC-TOKEN_AUDIT]`

- Map requirement → architecture → implementation tokens before touching code.
- Annotate every code edit with `[IMPL-*] [ARCH-*] [REQ-*]` (same triplet used in documentation).
- Require tests to include the `[REQ-*]` (and optional `[TEST-*]`) identifiers in both the test name and supporting comments.
- Record the audit result inside the relevant task/subtask so future agents can see when the chain was verified.

### Automated Validation `[PROC-TOKEN_VALIDATION]`

- Run `./scripts/validate_tokens.sh` (or repo-specific equivalent) after each audit to ensure every referenced token exists in the registry.
- Treat validation failures as blocking defects until the registry and documents are synchronized.
- Capture validation outputs in `implementation-decisions.md` so audits remain reproducible.

### Token Validation Requirements

Before marking features complete:
1. **ALWAYS** run token validation scripts (e.g., `./scripts/validate_tokens.sh`) and store the `[PROC-TOKEN_VALIDATION]` result in `implementation-decisions.md`.
2. **ALWAYS** ensure token consistency across all layers
3. **ALWAYS** verify token traceability in documentation
4. **ALWAYS** check that all cross-references are valid

## Token Format

```
[TYPE-IDENTIFIER]
```

## Token Types

- `[REQ-*]` - Requirements (functional/non-functional) - **The source of intent**
- `[ARCH-*]` - Architecture decisions - **High-level design choices that preserve intent**
- `[IMPL-*]` - Implementation decisions - **Low-level choices that preserve intent**
- `[TEST-*]` - Test specifications - **Validation of intent**
- `[PROC-*]` - Process definitions for survey/build/test/deploy work that stay linked to `[REQ-*]`

## Token Naming Convention

- Use UPPER_SNAKE_CASE for identifiers
- Be descriptive but concise
- Example: `[REQ-DUPLICATE_PREVENTION]` not `[REQ-DP]`

## Cross-Reference Format

When referencing other tokens:

```markdown
[IMPL-EXAMPLE] Description [ARCH-DESIGN] [REQ-REQUIREMENT]
```

## Requirements Tokens Registry

### Job Search Tracking

| Token | Description | Status | Document |
|-------|-------------|--------|----------|
| `[REQ-JOB_TRACKER_DATA]` | Job position data storage and retrieval | Planned | [requirements.md](requirements.md) |
| `[REQ-JOB_TRACKER_LIST]` | View all job positions in table | Planned | [requirements.md](requirements.md) |
| `[REQ-JOB_TRACKER_EDIT]` | Edit job position records | Planned | [requirements.md](requirements.md) |
| `[REQ-JOB_TRACKER_STATUS]` | Track application status with dates/notes | Planned | [requirements.md](requirements.md) |
| `[REQ-JOB_TRACKER_CRUD]` | Create, update, and delete job positions | Planned | [requirements.md](requirements.md) |



**📖 Full details**: See `requirements.md`

### Immutable Requirements

### Core Functional Requirements
- `[REQ-STDD_SETUP]` - STDD methodology setup
- `[REQ-MODULE_VALIDATION]` - Independent module validation before integration
- `[REQ-APP_STRUCTURE]` - Next.js App Router application structure
- `[REQ-ROOT_LAYOUT]` - Root layout with HTML structure and body
- `[REQ-HOME_PAGE]` - Home page with welcome content and links
- `[REQ-NAVIGATION_LINKS]` - External navigation links (Templates, Learning, Deploy, Docs)
- `[REQ-BRANDING]` - Next.js branding (logo, title)
- `[REQ-METADATA]` - Page metadata (title, description)

### Non-Functional Requirements
- `[REQ-RESPONSIVE_DESIGN]` - Responsive layout that adapts to mobile/desktop
- `[REQ-DARK_MODE]` - Dark mode support with automatic theme detection
- `[REQ-FONT_SYSTEM]` - Custom font loading (Geist Sans & Geist Mono)
- `[REQ-TAILWIND_STYLING]` - Tailwind CSS v4 for styling system
- `[REQ-GLOBAL_STYLES]` - Global CSS with CSS variables for theming
- `[REQ-ACCESSIBILITY]` - Semantic HTML and accessible image alt text
- `[REQ-TYPESCRIPT]` - TypeScript type safety throughout
- `[REQ-BUILD_SYSTEM]` - Next.js build and development scripts

### Configurability Requirements
- `[REQ-CONFIG_DRIVEN_UI]` - Configuration-driven UI via YAML files for all page elements
- `[REQ-CONFIG_DRIVEN_APPEARANCE]` - All page elements appearance and layout from config (template scope)

## Architecture Tokens Registry

### Job Search Tracking

| Token | Description | Status | Document |
|-------|-------------|--------|----------|
| `[ARCH-JOB_TRACKER_STORAGE]` | Job tracker YAML storage architecture | Planned | [architecture-decisions/ARCH-JOB_TRACKER_STORAGE.md](architecture-decisions/ARCH-JOB_TRACKER_STORAGE.md) |
| `[ARCH-JOB_TRACKER_UI]` | Job tracker UI page architecture | Planned | [architecture-decisions/ARCH-JOB_TRACKER_UI.md](architecture-decisions/ARCH-JOB_TRACKER_UI.md) |
| `[ARCH-JOB_TRACKER_API]` | Job tracker API route architecture | Planned | [architecture-decisions/ARCH-JOB_TRACKER_API.md](architecture-decisions/ARCH-JOB_TRACKER_API.md) |

**📖 Full details**: See `architecture-decisions.md` (index) and `architecture-decisions/` (detail files)

- `[ARCH-STDD_STRUCTURE]` - STDD project structure [REQ-STDD_SETUP]
- `[ARCH-MODULE_VALIDATION]` - Module validation strategy [REQ-MODULE_VALIDATION]
- `[ARCH-NEXTJS_FRAMEWORK]` - Next.js 16.1 with App Router [REQ-APP_STRUCTURE] [REQ-BUILD_SYSTEM]
- `[ARCH-REACT_VERSION]` - React 19.2 with Server Components [REQ-APP_STRUCTURE]
- `[ARCH-TYPESCRIPT_LANG]` - TypeScript for type safety [REQ-TYPESCRIPT]
- `[ARCH-TAILWIND_V4]` - Tailwind CSS v4 styling system [REQ-TAILWIND_STYLING]
- `[ARCH-APP_ROUTER]` - Next.js App Router pattern [REQ-APP_STRUCTURE]
- `[ARCH-LAYOUT_PATTERN]` - Root layout pattern for shared UI [REQ-ROOT_LAYOUT]
- `[ARCH-SERVER_COMPONENTS]` - Server Components as default [REQ-APP_STRUCTURE]
- `[ARCH-CSS_VARIABLES]` - CSS Variables for dark mode theming [REQ-DARK_MODE] [REQ-GLOBAL_STYLES]
- `[ARCH-RESPONSIVE_FIRST]` - Mobile-first responsive design [REQ-RESPONSIVE_DESIGN]
- `[ARCH-GOOGLE_FONTS]` - Google Fonts optimization with next/font [REQ-FONT_SYSTEM]
- `[ARCH-CSS_VARIABLES_FONTS]` - CSS Variables for font assignment [REQ-FONT_SYSTEM]
- `[ARCH-TEST_FRAMEWORK]` - Vitest testing framework with React Testing Library [REQ-BUILD_SYSTEM]
- `[ARCH-CONFIG_DRIVEN_UI]` - YAML configuration-driven UI architecture [REQ-CONFIG_DRIVEN_UI]
- `[ARCH-THEME_INJECTION]` - CSS variable injection from theme config [REQ-CONFIG_DRIVEN_UI] [ARCH-CSS_VARIABLES]
- `[ARCH-CLASS_OVERRIDES]` - Tailwind class override system via config [REQ-CONFIG_DRIVEN_UI] [ARCH-TAILWIND_V4]
- `[ARCH-CONFIG_DRIVEN_APPEARANCE]` - Config-driven appearance for all pages [REQ-CONFIG_DRIVEN_APPEARANCE] [REQ-CONFIG_DRIVEN_UI]
- `[ARCH-JOB_TRACKER_STORAGE]` - Job tracker YAML storage architecture [REQ-JOB_TRACKER_DATA] [REQ-JOB_TRACKER_STATUS]
- `[ARCH-JOB_TRACKER_UI]` - Job tracker UI page architecture [REQ-JOB_TRACKER_LIST] [REQ-JOB_TRACKER_EDIT]
- `[ARCH-JOB_TRACKER_API]` - Job tracker API route architecture [REQ-JOB_TRACKER_CRUD]

## Implementation Tokens Registry

### Job Search Tracking

| Token | Description | Status | Document |
|-------|-------------|--------|----------|
| `[IMPL-JOBS_CONFIG]` | Jobs configuration loader and types | Planned | [implementation-decisions/IMPL-JOBS_CONFIG.md](implementation-decisions/IMPL-JOBS_CONFIG.md) |
| `[IMPL-JOBS_LIST_PAGE]` | Jobs list page with table view | Planned | [implementation-decisions/IMPL-JOBS_LIST_PAGE.md](implementation-decisions/IMPL-JOBS_LIST_PAGE.md) |
| `[IMPL-JOBS_EDIT_PAGE]` | Jobs edit page with form | Planned | [implementation-decisions/IMPL-JOBS_EDIT_PAGE.md](implementation-decisions/IMPL-JOBS_EDIT_PAGE.md) |
| `[IMPL-JOBS_API]` | Jobs API route handlers | Planned | [implementation-decisions/IMPL-JOBS_API.md](implementation-decisions/IMPL-JOBS_API.md) |

**📖 Full details**: See `implementation-decisions.md` (index) and `implementation-decisions/` (detail files)

- `[IMPL-MODULE_VALIDATION]` - Module validation implementation [ARCH-MODULE_VALIDATION] [REQ-MODULE_VALIDATION]
- `[IMPL-ROOT_LAYOUT]` - Root layout component with fonts and metadata [ARCH-LAYOUT_PATTERN] [REQ-ROOT_LAYOUT]
- `[IMPL-HOME_PAGE]` - Home page component structure [ARCH-SERVER_COMPONENTS] [REQ-HOME_PAGE]
- `[IMPL-DARK_MODE]` - Dark mode CSS variables and classes [ARCH-CSS_VARIABLES] [REQ-DARK_MODE]
- `[IMPL-FONT_LOADING]` - Geist font configuration with next/font [ARCH-GOOGLE_FONTS] [REQ-FONT_SYSTEM]
- `[IMPL-IMAGE_OPTIMIZATION]` - Next.js Image component usage [ARCH-NEXTJS_FRAMEWORK] [REQ-BRANDING]
- `[IMPL-EXTERNAL_LINKS]` - External link security attributes [ARCH-APP_ROUTER] [REQ-NAVIGATION_LINKS]
- `[IMPL-METADATA]` - Static metadata export [ARCH-NEXTJS_FRAMEWORK] [REQ-METADATA]
- `[IMPL-RESPONSIVE_CLASSES]` - Mobile-first responsive utilities [ARCH-RESPONSIVE_FIRST] [REQ-RESPONSIVE_DESIGN]
- `[IMPL-FLEX_LAYOUT]` - Flexbox layout patterns [ARCH-TAILWIND_V4] [REQ-ROOT_LAYOUT]
- `[IMPL-TEST_CONFIG]` - Vitest configuration with coverage settings [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM]
- `[IMPL-BUILD_SCRIPTS]` - NPM scripts for build, dev, and test [ARCH-NEXTJS_FRAMEWORK] [REQ-BUILD_SYSTEM]
- `[IMPL-TEST_SETUP]` - Test setup with mocks and utilities [ARCH-TEST_FRAMEWORK] [REQ-BUILD_SYSTEM]
- `[IMPL-STDD_FILES]` - STDD methodology file creation and structure [ARCH-STDD_STRUCTURE] [REQ-STDD_SETUP]
- `[IMPL-YAML_CONFIG]` - YAML configuration file structure [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_UI]
- `[IMPL-CONFIG_LOADER]` - Config loader module with YAML parsing and caching [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_UI]
- `[IMPL-THEME_INJECTION]` - CSS variable injection from theme config in layout [ARCH-THEME_INJECTION] [REQ-CONFIG_DRIVEN_UI]
- `[IMPL-CLASS_OVERRIDES]` - tailwind-merge class override implementation [ARCH-CLASS_OVERRIDES] [REQ-CONFIG_DRIVEN_UI]
- `[IMPL-CONFIG_DRIVEN_APPEARANCE]` - Config-driven appearance for all pages (jobs config loader, theme extension, jobs UI refactor) [ARCH-CONFIG_DRIVEN_APPEARANCE] [REQ-CONFIG_DRIVEN_APPEARANCE]
- `[IMPL-JOBS_DATA]` - Jobs data layer (jobs.data.ts, jobs.types.ts) for Position/Application entities [ARCH-JOB_TRACKER_STORAGE] [REQ-JOB_TRACKER_DATA]
- `[IMPL-JOBS_ACTIONS]` - Server actions for CRUD operations [ARCH-JOB_TRACKER_UI] [REQ-JOB_TRACKER_CRUD]
- `[IMPL-JOBS_LIST_PAGE]` - Jobs list page with table view (page.tsx, JobsTable.tsx) [ARCH-JOB_TRACKER_UI] [REQ-JOB_TRACKER_LIST]
- `[IMPL-JOBS_EDIT_PAGE]` - Jobs edit/create pages and forms (PositionForm, ApplicationForm) [ARCH-JOB_TRACKER_UI] [REQ-JOB_TRACKER_EDIT]
- `[IMPL-JOBS_API]` - Jobs API route handlers using jobs.data.ts [ARCH-JOB_TRACKER_API] [REQ-JOB_TRACKER_CRUD]

## Token Relationships

### Hierarchical Relationships
- `[REQ-PARENT_FEATURE]` contains `[REQ-SUB_FEATURE_1]`, `[REQ-SUB_FEATURE_2]`
- `[ARCH-FEATURE]` includes `[ARCH-COMPONENT_1]`, `[ARCH-COMPONENT_2]`

### Flow Relationships
- `[REQ-FEATURE]` → `[ARCH-DESIGN]` → `[IMPL-IMPLEMENTATION]` → Code + Tests

### Dependency Relationships
- `[IMPL-FEATURE]` depends on `[ARCH-DESIGN]` and `[REQ-FEATURE]`
- `[ARCH-DESIGN]` depends on `[REQ-FEATURE]`

## Process Tokens Registry

**📖 Full details**: See `processes.md`

- `[PROC-PROJECT_SURVEY_AND_SETUP]` - Survey and readiness process supporting `[REQ-STDD_SETUP]` and `[ARCH-STDD_STRUCTURE]`
- `[PROC-BUILD_PIPELINE_VALIDATION]` - Build/deploy validation tied to `[REQ-MODULE_VALIDATION]`
- `[PROC-TOKEN_AUDIT]` - Mandatory checklist ensuring every requirement → architecture → implementation → code/test path is annotated and documented
- `[PROC-TOKEN_VALIDATION]` - Automated validation workflow (e.g., `./scripts/validate_tokens.sh`) that proves all referenced tokens exist in the registry
- Add your process tokens here

## Usage Examples

### In Code Comments
```[your-language]
// [REQ-EXAMPLE_FEATURE] Implementation of example feature
// [IMPL-EXAMPLE_IMPLEMENTATION] [ARCH-EXAMPLE_DECISION] [REQ-EXAMPLE_FEATURE]
function exampleFunction() {
    // ...
}
```
> **NOTE**: Code merged without these annotations is considered incomplete because it fails `[PROC-TOKEN_AUDIT]`.

### In Tests
```[your-language]
// Test validates [REQ-EXAMPLE_FEATURE] is met
function testExampleFeature_REQ_EXAMPLE_FEATURE() {
    // Test implementation
}
```
> **NOTE**: Tests without `[REQ-*]` markers are rejected during `[PROC-TOKEN_VALIDATION]` because they cannot prove intent.

### In Documentation
```markdown
The feature uses [ARCH-ARCHITECTURE_NAME] to fulfill [REQ-FEATURE_NAME].
Implementation details are documented in [IMPL-IMPLEMENTATION_NAME].
```

## Token Validation Guidelines

### Cross-Layer Token Consistency

Every feature must have proper token coverage across all layers:

1. **Requirements Layer**: Feature must have `[REQ-*]` token in `requirements.md`
2. **Architecture Layer**: Architecture decisions must have `[ARCH-*]` tokens in `architecture-decisions.md`
3. **Implementation Layer**: Implementation must have `[IMPL-*]` tokens in code comments
4. **Test Layer**: Tests must reference `[REQ-*]` tokens in test names/comments
5. **Documentation Layer**: All documentation must cross-reference tokens consistently

### Token Format Validation

1. **Token Format**: Must follow `[TYPE-IDENTIFIER]` pattern exactly
2. **Token Types**: Must use valid types (`REQ`, `ARCH`, `IMPL`, `TEST`, `PROC`)
3. **Identifier Format**: Must use UPPER_SNAKE_CASE
4. **Cross-References**: Implementation tokens must reference architecture and requirement tokens

### Token Traceability Validation

1. Every requirement in `requirements.md` must have corresponding implementation tokens
2. Every architecture decision must have corresponding implementation tokens
3. Every test must link to specific requirements via `[REQ-*]` tokens
4. All tokens must be discoverable through automated validation
## Token Creation Requirements

When implementing features:
1. **ALWAYS** create `[REQ-*]` token in `requirements.md` first
2. **ALWAYS** create `[ARCH-*]` token in `architecture-decisions.md` for design decisions
3. **ALWAYS** add `[IMPL-*]` tokens to code comments
4. **ALWAYS** reference `[REQ-*]` tokens in test names/comments
5. **ALWAYS** update `semantic-tokens.md` registry when creating new tokens
6. **ALWAYS** document any `[PROC-*]` process tokens in `processes.md` when defining operational workflows

