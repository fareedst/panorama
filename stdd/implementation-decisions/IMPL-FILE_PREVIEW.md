# [IMPL-FILE_PREVIEW] Server-Side Preview API Routes and Panels

**Cross-References**: [ARCH-PREVIEW_SYSTEM] [REQ-FILE_PREVIEW]  
**Status**: ✅ Implemented  
**Created**: 2026-02-07  
**Last Updated**: 2026-02-07

---

## Implementation Approach

See `implementation-decisions.yaml` § IMPL-FILE_PREVIEW. Two API routes: GET /api/files/info (metadata), GET /api/files/preview (content). Two client panels: InfoPanel (I key, 320px), PreviewPanel (Q key, 384px). WorkspaceView state: `previewPanel: "info" | "preview" | null`.

## Code Locations

- **API**: `src/app/api/files/info/route.ts`, `src/app/api/files/preview/route.ts`
- **UI**: `src/app/files/components/InfoPanel.tsx`, `src/app/files/components/PreviewPanel.tsx`
- **Integration**: `src/app/files/WorkspaceView.tsx` — preview state, I/Q handlers, close handlers

## Validation Evidence [PROC-TOKEN_VALIDATION]

| Date       | Commit  | Result | Notes                                  |
|------------|---------|--------|----------------------------------------|
| 2026-02-07 | Phase 6 | ✅ Pass | 5 info API tests + 7 preview API tests |

**Coverage**: Valid requests, directory traversal security, missing param, 404, 403; text small/truncation, image metadata, archive stub, directory preview rejected.

## Known Limitations

- Archive preview: stub only; full ZIP/TAR listing deferred.
- Image: served via API; Next.js Image optimization possible later.
- Type detection: extension-only; magic bytes deferred.
- Syntax highlighting: not implemented; raw text only.

## Performance Notes

- Info: <10ms (stat only). Text preview: <50ms small, <100ms truncated. Image metadata: <20ms.
- Panel open/close: <16ms.

## Lessons Learned [Phase 6 session]

1. **Client vs server boundary**: Client components must not import server-only modules (logger, fs). Keep logging and file access in API routes only.
2. **Type guards**: Use strict null checks before fetch (e.g. `if (!filePath) return;`).
3. **Panel positioning**: Fixed right panels (320px / 384px) work well and don’t interfere with the pane grid.
4. **Separate endpoints**: Info (cheap stat) vs preview (possibly expensive read) lets the client request only what it needs.

## Related Decisions

See YAML. Depends on [ARCH-PREVIEW_SYSTEM]; see also [IMPL-FILES_API].

---

*Status*: Implemented and validated  
*Created*: 2026-02-07
