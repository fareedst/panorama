# [IMPL-GLOBAL_ERROR_BOUNDARY] Global Error Boundary Component

**Cross-References**: [ARCH-NEXTJS_FRAMEWORK] [REQ-ERROR_HANDLING]  
**Status**: Active  
**Created**: 2026-02-06  
**Last Updated**: 2026-02-06

---

## Decision

Implement a root-level error boundary component (`global-error.tsx`) that catches unexpected errors at the root layout level and provides users with a friendly error message and recovery option in production.

## Rationale

- **Production Resilience**: Without a global error boundary, errors in the root layout or uncaught errors that bubble to the top can result in a blank screen or generic browser error page, providing no guidance to users.
- **Next.js Best Practice**: Next.js tooling (eslint-config-next, IDE extensions) recommends adding `global-error.tsx` to ensure production apps handle root-level errors gracefully.
- **User Experience**: A custom error page maintains brand consistency and provides actionable recovery options (try again, return home) rather than leaving users confused.
- **Developer Experience**: The error digest property allows matching client-side errors with server-side logs for debugging production issues.

## Implementation Approach

### File Structure

```
src/app/
  ├── global-error.tsx          # Root-level error boundary (this implementation)
  ├── layout.tsx                # Root layout
  └── ...
```

### Key Design Decisions

1. **Full HTML Document**: Must render `<html>` and `<body>` tags because it replaces the entire root layout when activated (unlike segment-level `error.tsx` files).

2. **Client Component**: Uses `"use client"` directive because it needs interactive UI (reset button) and event handlers.

3. **Self-Contained Styling**: Uses inline `<style>` tag with minimal CSS to ensure the error page is presentable even if:
   - Global CSS fails to load
   - Config-driven theme system fails
   - Tailwind CSS is unavailable
   
   This independence is critical because the error boundary may be triggered by failures in those systems.

4. **Recovery Options**:
   - **Try Again Button**: Calls `reset()` function provided by Next.js to attempt re-rendering
   - **Home Link**: Provides explicit escape route back to the root page
   - **Error Details**: Collapsible section shows error message and digest for debugging

5. **Production-Only**: This boundary only functions in production builds (`npm run build && npm run start`). Development mode shows the Next.js error overlay for better debugging.

### Props Interface

```typescript
interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}
```

- `error`: The caught error object with optional `digest` property for server-side log correlation
- `reset()`: Function to attempt recovery by re-rendering the error boundary

## Implementation Details

### File Location
- **Path**: `src/app/global-error.tsx`
- **Convention**: Must be named exactly `global-error.tsx` and placed in the root `app/` directory

### Styling Approach
- Dark theme by default (black background, white text) matching the app's existing dark mode
- System fonts fallback chain for maximum compatibility
- Responsive and centered layout
- Accessible color contrast ratios
- Minimal external dependencies

### Error Information Display
- User-friendly heading: "Something went wrong"
- Actionable instructions with links
- Collapsible `<details>` element for error message and digest (debugging aid)

## Code Locations

### Main Implementation
- File: `src/app/global-error.tsx`
- Components: `GlobalError` (default export)
- Semantic tokens in code: `[IMPL-GLOBAL_ERROR_BOUNDARY]`, `[ARCH-NEXTJS_FRAMEWORK]`, `[REQ-ERROR_HANDLING]`, `[REQ-ACCESSIBILITY]`

## Testing Considerations

### Manual Testing
1. Build production: `npm run build`
2. Start production server: `npm run start`
3. Trigger error in root layout (e.g., throw error in `layout.tsx`)
4. Verify error boundary displays with proper styling and functionality

### Automated Testing
- Global error boundaries are difficult to test in unit tests because they require production builds
- Integration tests could verify the component renders correctly given error props
- Consider E2E tests for complete error boundary flow

## Alternatives Considered

### 1. Segment-Level error.tsx Only
**Rejected**: Would not catch errors in the root layout itself, leaving a gap in error handling.

### 2. Using Global CSS/Tailwind for Styling
**Rejected**: Error boundary must be independent of potentially failing systems. Inline styles ensure the error page always renders correctly.

### 3. External CSS File
**Rejected**: Additional network request that could fail. Inline styles are more reliable for error scenarios.

### 4. Minimal Error Message Only
**Rejected**: Including recovery options (reset button, home link) and error details provides better UX and debugging capability.

## Dependencies

- Next.js 16+ with App Router
- React 19+ (for client component support)
- No external styling dependencies (self-contained)

## Migration Notes

- No migration required for existing code
- This is a new addition that enhances error handling
- Optional: Consider adding segment-level `error.tsx` files for more granular error boundaries

## Validation

### Token Audit
- ✅ `[IMPL-GLOBAL_ERROR_BOUNDARY]` tokens added to code comments
- ✅ Cross-references `[ARCH-NEXTJS_FRAMEWORK]` and `[REQ-ERROR_HANDLING]`
- ✅ Registered in `semantic-tokens.md`
- ✅ Indexed in `implementation-decisions.md`

### Next.js Convention Compliance
- ✅ Named `global-error.tsx`
- ✅ Located in `src/app/` root directory
- ✅ Renders full `<html>` and `<body>` tags
- ✅ Uses `"use client"` directive
- ✅ Accepts correct props interface
- ✅ Satisfies Next.js tooling requirement (tooltip resolved)

## Future Enhancements

1. **Error Logging**: Integrate with error tracking service (Sentry, LogRocket) to capture client errors
2. **Custom Branding**: Pull app name/logo from config to maintain brand consistency in error page
3. **Localization**: Support multiple languages for error messages
4. **Error Recovery Strategies**: Implement more sophisticated recovery based on error type
5. **Segment Error Boundaries**: Add granular `error.tsx` files in route segments for better error isolation

## References

- [Next.js Error Handling Documentation](https://nextjs.org/docs/app/building-your-application/routing/error-handling)
- [Next.js File Conventions: error.js](https://nextjs.org/docs/app/api-reference/file-conventions/error)
- STDD Methodology: Error Handling Best Practices
