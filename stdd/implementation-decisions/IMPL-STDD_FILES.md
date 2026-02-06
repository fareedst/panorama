# Implementation Decision: STDD Methodology Files

**Token**: [IMPL-STDD_FILES]  
**Status**: ✅ Implemented  
**Last Updated**: 2026-02-06

## Cross-References

- **Architecture**: [ARCH-STDD_STRUCTURE]
- **Requirements**: [REQ-STDD_SETUP]

## Implementation

### STDD Directory Structure

The project follows the STDD (Semantic Token-Driven Development) methodology v1.3.0 with a dedicated `stdd/` directory containing all methodology documentation.

**Directory Layout**:
```
stdd/
├── requirements.md                      # Requirements registry with [REQ-*] tokens
├── architecture-decisions.md            # Architecture decisions index
├── architecture-decisions/              # Architecture decision detail files
│   ├── ARCH-APP_ROUTER.md
│   ├── ARCH-CSS_VARIABLES.md
│   ├── ARCH-CSS_VARIABLES_FONTS.md
│   ├── ARCH-GOOGLE_FONTS.md
│   ├── ARCH-LAYOUT_PATTERN.md
│   ├── ARCH-MODULE_VALIDATION.md
│   ├── ARCH-NEXTJS_FRAMEWORK.md
│   ├── ARCH-REACT_VERSION.md
│   ├── ARCH-RESPONSIVE_FIRST.md
│   ├── ARCH-SERVER_COMPONENTS.md
│   ├── ARCH-STDD_STRUCTURE.md
│   ├── ARCH-TAILWIND_V4.md
│   ├── ARCH-TEST_FRAMEWORK.md
│   └── ARCH-TYPESCRIPT_LANG.md
├── implementation-decisions.md          # Implementation decisions index
├── implementation-decisions/            # Implementation decision detail files
│   ├── IMPL-BUILD_SCRIPTS.md
│   ├── IMPL-DARK_MODE.md
│   ├── IMPL-EXTERNAL_LINKS.md
│   ├── IMPL-FLEX_LAYOUT.md
│   ├── IMPL-FONT_LOADING.md
│   ├── IMPL-HOME_PAGE.md
│   ├── IMPL-IMAGE_OPTIMIZATION.md
│   ├── IMPL-METADATA.md
│   ├── IMPL-MODULE_VALIDATION.md
│   ├── IMPL-RESPONSIVE_CLASSES.md
│   ├── IMPL-ROOT_LAYOUT.md
│   ├── IMPL-STDD_FILES.md
│   ├── IMPL-TEST_CONFIG.md
│   └── IMPL-TEST_SETUP.md
├── semantic-tokens.md                   # Canonical token registry
├── tasks.md                             # Task tracking with priorities
└── processes.md                         # Process definitions
```

### Root-Level STDD Files

In addition to the `stdd/` directory, the following root-level files support the STDD methodology:

- **`AGENTS.md`** - AI Agent Operating Guide (canonical rules for AI assistants)
- **`ai-principles.md`** - AI-First Principles & Process Guide
- **`.cursorrules`** - IDE loader pointing to `AGENTS.md`

### File Responsibilities

| File | Purpose |
| --- | --- |
| `stdd/requirements.md` | Registry of all `[REQ-*]` tokens with descriptions, rationale, and criteria |
| `stdd/architecture-decisions.md` | Index of `[ARCH-*]` decisions with links to detail files |
| `stdd/architecture-decisions/*.md` | Individual architecture decision detail files |
| `stdd/implementation-decisions.md` | Index of `[IMPL-*]` decisions with links to detail files |
| `stdd/implementation-decisions/*.md` | Individual implementation decision detail files |
| `stdd/semantic-tokens.md` | Canonical registry of all semantic tokens across all types |
| `stdd/tasks.md` | Task tracking with priorities, statuses, and token references |
| `stdd/processes.md` | Process definitions for `[PROC-*]` tokens |

### Naming Conventions

- **Architecture files**: `ARCH-TOKEN_NAME.md` (e.g., `ARCH-APP_ROUTER.md`)
- **Implementation files**: `IMPL-TOKEN_NAME.md` (e.g., `IMPL-ROOT_LAYOUT.md`)
- **Token format**: `[TYPE-UPPER_SNAKE_CASE]` (e.g., `[REQ-HOME_PAGE]`)

## Rationale

Centralizing STDD documentation in a dedicated `stdd/` directory:

1. **Organization**: Keeps methodology docs separate from source code
2. **Discoverability**: AI agents can find all context in one place
3. **Scalability**: Detail files per decision scale better than monolithic docs
4. **Traceability**: Cross-references between REQ, ARCH, and IMPL tokens maintain intent chain
5. **Methodology Compliance**: Follows STDD v1.3.0 structure requirements

## Related Implementations

- **[IMPL-BUILD_SCRIPTS]** - Build configuration documented in STDD format
- **[IMPL-TEST_CONFIG]** - Test configuration documented in STDD format

## Validation

**Token Audit** `[PROC-TOKEN_AUDIT]`:
- Directory: `stdd/` with all required files
- Root files: `AGENTS.md`, `ai-principles.md`, `.cursorrules`
- All tokens registered in `semantic-tokens.md`

**Last Updated**: 2026-02-06
