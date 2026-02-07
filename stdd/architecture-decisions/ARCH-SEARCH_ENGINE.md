# [ARCH-SEARCH_ENGINE] File Search System Architecture

**Status**: Active  
**Created**: 2026-02-07  
**Last Updated**: 2026-02-07  
**Cross-References**: `[REQ-FILE_SEARCH]`

## Decision

Implement a hybrid search system with **client-side incremental file finding** and **server-side content searching**, using a modular architecture that separates search logic from UI components.

## Context

The file manager needs two distinct search capabilities:

1. **Incremental File Finder**: Fast, real-time filtering of visible files by name
2. **Content Search**: Thorough search of file contents, potentially across large directories

These have fundamentally different performance and security characteristics, requiring different architectural approaches.

## Rationale

### Why This Architecture?

**Client-Side File Finder**:
- File list already loaded in browser (no API call needed)
- Real-time filtering provides instant feedback
- Fuzzy matching algorithm lightweight enough for client-side execution
- No security risk (only searches names, not content)

**Server-Side Content Search**:
- Cannot read large files in browser memory
- Node.js `fs` and stream APIs provide efficient file reading
- Server can limit search scope to prevent abuse
- Security: server validates paths and patterns

### Problems Solved

1. **Performance**: Client-side finder avoids network latency
2. **Security**: Server-side content search controls file access
3. **Scalability**: Server can handle large file searches efficiently
4. **Modularity**: Search logic separated from UI for testability

### Benefits

- Fast incremental file finding (< 50ms response)
- Secure content searching with validation
- Reusable search utilities for other features
- Easy to add new search types (by author, by date, etc.)

## Alternatives Considered

### Alternative 1: All Client-Side Search

**Description**: Load all file metadata and content into browser, perform all search client-side.

**Pros**:
- No API calls, instant results
- Works offline
- Simple architecture

**Cons**:
- Cannot load large file contents into browser
- Security risk (exposes all file content)
- Memory constraints on large directories
- Poor performance for content search

**Rejected Reason**: Cannot safely or efficiently search file contents in browser.

### Alternative 2: All Server-Side Search

**Description**: Both file finder and content search execute on server.

**Pros**:
- Consistent architecture
- All search logic in one place
- Better for very large directories

**Cons**:
- Network latency makes incremental finder feel sluggish
- Wasted API calls for simple name filtering
- Server load increases unnecessarily

**Rejected Reason**: Incremental file finder needs instant feedback, which requires client-side execution.

### Alternative 3: Use External Search Service (Elasticsearch, etc.)

**Description**: Index files in external search service.

**Pros**:
- Very fast full-text search
- Advanced query capabilities
- Handles massive file sets

**Cons**:
- Requires external dependency
- Complex setup and maintenance
- Overkill for typical use case
- Index synchronization overhead

**Rejected Reason**: Too complex for typical file manager use case; most directories have < 1000 files.

## Implementation Approach

### Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     WorkspaceView (Client)                  │
│  - Manages search dialog state                              │
│  - Integrates keyboard shortcuts (Ctrl+F, Ctrl+Shift+F)     │
└────────────┬────────────────────────────────┬───────────────┘
             │                                │
    ┌────────▼────────┐              ┌───────▼────────┐
    │  FinderDialog   │              │  SearchDialog  │
    │   (Client)      │              │    (Client)    │
    │                 │              │                │
    │ - Input field   │              │ - Input field  │
    │ - Fuzzy filter  │              │ - Options UI   │
    │ - Result list   │              │ - Result list  │
    └────────┬────────┘              └───────┬────────┘
             │                               │
    ┌────────▼────────┐              ┌──────▼─────────┐
    │ files.search.ts │              │ /api/files/    │
    │   (Client)      │              │   search       │
    │                 │              │  (Server)      │
    │ - fuzzyMatch()  │              │                │
    │ - filterFiles() │              │ - searchFiles()│
    │ - searchHistory │              │ - streamResult │
    └─────────────────┘              └────────────────┘
```

### Data Flow

**File Finder Flow**:
```
User types → FinderDialog → files.search.fuzzyMatch()
          → Filter file list → Update UI (< 50ms)
```

**Content Search Flow**:
```
User submits → SearchDialog → POST /api/files/search
            → Server reads files → Stream results
            → SearchDialog displays → User clicks result
            → WorkspaceView navigates
```

### Key Design Decisions

#### 1. Search Algorithm Choice

**Decision**: Use simple substring fuzzy matching for file finder.

**Rationale**:
- Substring matching is intuitive and fast
- Covers 95% of use cases
- Can be enhanced later with Levenshtein distance if needed

**Implementation**:
```typescript
function fuzzyMatch(pattern: string, target: string): boolean {
  const p = pattern.toLowerCase();
  const t = target.toLowerCase();
  return t.includes(p);
}
```

#### 2. Content Search API Design

**Decision**: POST endpoint with streaming response for large result sets.

**Endpoint**: `POST /api/files/search`

**Request**:
```typescript
interface SearchRequest {
  pattern: string;        // Search pattern
  basePath: string;       // Directory to search
  recursive: boolean;     // Include subdirectories
  regex: boolean;         // Treat pattern as regex
  caseSensitive: boolean; // Case-sensitive matching
  filePattern?: string;   // Filter by filename (glob)
  maxResults?: number;    // Limit results (default 500)
}
```

**Response**:
```typescript
interface SearchResponse {
  results: SearchResult[];
  totalMatches: number;
  truncated: boolean;
  duration: number; // milliseconds
}

interface SearchResult {
  path: string;        // Relative path to file
  matches: Match[];    // Array of matches in file
}

interface Match {
  line: number;        // Line number (1-indexed)
  content: string;     // Full line content
  column: number;      // Column of match start
  length: number;      // Length of match
}
```

#### 3. Search History Storage

**Decision**: Use localStorage with separate histories for file finder and content search.

**Keys**:
- `files:search:finder:history` - File finder history
- `files:search:content:history` - Content search history

**Format**:
```typescript
interface SearchHistoryEntry {
  pattern: string;
  timestamp: number;
  options?: SearchOptions; // For content search
}

// Max 20 entries per history type (LRU)
```

#### 4. Security and Validation

**Server-Side Validations**:
```typescript
// 1. Path validation (prevent directory traversal)
function validatePath(basePath: string): void {
  if (basePath.includes('..') || !basePath.startsWith('/valid/prefix')) {
    throw new Error('Invalid path');
  }
}

// 2. Regex validation (prevent ReDoS)
function validateRegex(pattern: string): void {
  if (pattern.length > 500) throw new Error('Pattern too long');
  if (/(\*\+|\+\*|\{\d{4,}\})/.test(pattern)) {
    throw new Error('Potentially malicious regex');
  }
  new RegExp(pattern); // Throws if invalid
}

// 3. Result limits
const MAX_RESULTS = 500;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
```

#### 5. Performance Optimization

**Client-Side File Finder**:
- Debounce input (200ms) to reduce filter calls
- Use `useMemo` for filtered results
- Limit displayed results to 100 (virtual scrolling if needed)

**Server-Side Content Search**:
- Read files in parallel (up to 10 concurrent)
- Skip binary files (check magic bytes)
- Stop reading file after 500th match
- Use streams for large files
- Return results incrementally (chunked response)

## Trade-offs and Consequences

### Positive Consequences
- ✅ Fast file finding (instant feedback)
- ✅ Secure content search (server-controlled)
- ✅ Scalable to moderate-sized directories (< 10,000 files)
- ✅ Extensible (easy to add search types)

### Negative Consequences
- ❌ Content search requires network round-trip
- ❌ Cannot search very large files efficiently (> 100MB)
- ❌ Server CPU usage during content search
- ❌ Two separate search implementations to maintain

### Mitigation Strategies
- Cache recent content search results client-side
- Provide progress indicator for long searches
- Add timeout and cancellation for content search
- Consider indexing for very large directories (future enhancement)

## Implementation Plan

### Phase 1: Search Utilities
1. Create `src/lib/files.search.ts` with:
   - `fuzzyMatch(pattern, target)` - Fuzzy matching algorithm
   - `filterFiles(files, pattern)` - Filter file list
   - `SearchHistory` class - History management

### Phase 2: File Finder
1. Create `src/app/files/components/FinderDialog.tsx`
2. Integrate with `WorkspaceView` keyboard handler
3. Add unit tests for fuzzy matching

### Phase 3: Content Search API
1. Create `src/app/api/files/search/route.ts`
2. Implement file reading and pattern matching
3. Add validation and security checks
4. Add API tests

### Phase 4: Content Search UI
1. Create `src/app/files/components/SearchDialog.tsx`
2. Integrate with `WorkspaceView` keyboard handler
3. Add result navigation
4. Add integration tests

### Phase 5: Search History
1. Implement history in `files.search.ts`
2. Add history dropdown to both dialogs
3. Add history tests

## Validation

### Performance Targets
- File finder: < 50ms per keystroke (1000 files)
- Content search: < 5s for 100 files (< 1MB each)
- Search history: < 10ms load time

### Test Coverage
- Unit tests: 100% coverage for search utilities
- Integration tests: API endpoint and UI interactions
- Performance tests: Benchmark with 1000+ files

## Future Enhancements

1. **Advanced File Finder**: Levenshtein distance for typo tolerance
2. **Search Result Preview**: Show file preview in search results
3. **Search Filters**: By date, size, type, author
4. **Search Indexing**: For very large directories (> 10,000 files)
5. **Search Shortcuts**: Save searches with custom keyboard shortcuts
6. **Multi-File Replace**: Find and replace across files

---

**Document Maintained By**: AI Agent  
**STDD Version**: 1.5.0
