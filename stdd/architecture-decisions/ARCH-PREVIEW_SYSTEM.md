# [ARCH-PREVIEW_SYSTEM] Server-Side File Preview Rendering

**Cross-References**: [REQ-FILE_PREVIEW]  
**Status**: ✅ Implemented  
**Created**: 2026-02-07  
**Last Updated**: 2026-02-07

---

## Decision

File preview and metadata are served via server-side API routes. Client components (InfoPanel, PreviewPanel) fetch from GET /api/files/info and GET /api/files/preview. Type detection (text, image, archive) and content limits (e.g. text 100KB) are enforced on the server.

## Rationale

Client cannot access server filesystem; preview and security (path validation, type checks) must run on the server. Separate info vs preview endpoints keep metadata (cheap stat) distinct from content (potentially expensive reads).

## Implementation Approach

See `architecture-decisions.yaml` § ARCH-PREVIEW_SYSTEM. Key: GET /api/files/info (metadata), GET /api/files/preview (content by type); extension-based type detection; text truncation; image metadata; archive stub.

## Token Coverage [PROC-TOKEN_AUDIT]

Code and tests annotated with [ARCH-PREVIEW_SYSTEM], [IMPL-FILE_PREVIEW], [REQ-FILE_PREVIEW].

## Validation Evidence [PROC-TOKEN_VALIDATION]

| Date       | Commit  | Result | Notes                                      |
|------------|---------|--------|--------------------------------------------|
| 2026-02-07 | Phase 6 | ✅ Pass | 12 API tests (5 info + 7 preview), build ok |

## Related Decisions

- **Informs**: [IMPL-FILE_PREVIEW]
- **See also**: [ARCH-SERVER_CLIENT_BOUNDARY]

---

*Status*: Implemented and validated  
*Created*: 2026-02-07
