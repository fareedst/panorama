# [REQ-FILE_SEARCH] File and Content Search System

**Category**: Functional  
**Priority**: P1  
**Status**: In Progress  
**Created**: 2026-02-07  
**Last Updated**: 2026-02-07

## Rationale

### Why This Feature?

File managers require efficient search capabilities to help users locate files quickly in large directory structures. The Goful file manager provides both incremental file finding and content-based searching, which are essential for power user workflows.

### Problems Solved

1. **Slow File Location**: Manually scrolling through large directories is time-consuming
2. **No Content Search**: Users cannot find files by their content without external tools
3. **Poor Discoverability**: Files buried deep in directory hierarchies are hard to find
4. **Lack of History**: Users must re-type search patterns repeatedly

### Benefits

1. **Incremental File Finder**: Quickly locate files by name with fuzzy matching
2. **Content Search**: Find files containing specific text patterns
3. **Search History**: Recent searches saved for quick re-use
4. **Regex Support**: Advanced users can use regex patterns
5. **Multi-Directory Search**: Search across current directory and subdirectories
6. **Result Highlighting**: Clear visual indication of matches

## Satisfaction Criteria

- [ ] Incremental file finder opens with `Ctrl+F` and filters files as user types
- [ ] Fuzzy matching allows partial name matching (e.g., "tst" matches "test.ts")
- [ ] Content search opens with `Ctrl+Shift+F` and searches file contents
- [ ] Content search supports plain text and regex patterns
- [ ] Search results show filename, line number, and matching context
- [ ] Search history stored in localStorage (last 20 searches)
- [ ] Arrow keys navigate search results, Enter opens/highlights file
- [ ] ESC closes search dialogs
- [ ] Search works across current directory and subdirectories
- [ ] Large file search remains responsive (< 5s for 1000 files)

## Validation Criteria

### Unit Tests
- Pattern matching (fuzzy search algorithm)
- Regex validation and escaping
- Search history management (add, retrieve, max size)

### Integration Tests
- File finder integration with WorkspaceView
- Content search API endpoint
- Search result navigation

### Performance Tests
- Fuzzy search on 1000 files completes in < 100ms
- Content search on 100 files (< 1MB each) completes in < 5s
- Search history operations < 10ms

## Architecture Cross-References

- `[ARCH-SEARCH_ENGINE]`: Search system architecture

## Implementation Cross-References

- `[IMPL-FILE_SEARCH]`: Search implementation details

## Test Cross-References

- `[TEST-FILE_SEARCH]`: Search functionality tests

## Code Annotations

All implementation files should include `[REQ-FILE_SEARCH]` in comments.

## Related Requirements

### Depends On
- `[REQ-KEYBOARD_SHORTCUTS_COMPLETE]`: For Ctrl+F and Ctrl+Shift+F keybindings
- `[REQ-FILES_BASIC]`: Base file listing functionality

### Related To
- `[REQ-FILE_SORTING_ADVANCED]`: Search results can be sorted
- `[REQ-FILES_PERFORMANCE]`: Large directory search performance

### Supersedes
- None

## Constraints and Assumptions

### Constraints
1. Content search must be server-side (cannot read large files in browser)
2. Search patterns must be validated to prevent regex denial-of-service
3. Search results limited to prevent UI overload (max 500 results)

### Assumptions
1. Most searches will be on directories with < 1000 files
2. Users will search for recently modified files more frequently
3. Fuzzy matching is preferred over exact matching for file names
4. Content search typically used for text files, not binary

## User Stories

**As a developer**, I want to quickly find files by partial name matching, so I can navigate large codebases efficiently.

**As a power user**, I want to search file contents for specific text patterns, so I can locate files containing specific code or text.

**As a frequent searcher**, I want my recent searches saved, so I can re-run common searches without retyping.

**As a regex user**, I want to use regular expressions in search patterns, so I can perform complex pattern matching.

## Acceptance Criteria

### File Finder (Ctrl+F)
- Opens modal dialog with search input focused
- Filters visible files in real-time as user types
- Uses fuzzy matching (substring matching, case-insensitive by default)
- Displays match count (e.g., "3 of 50 files match")
- Arrow keys navigate filtered results
- Enter selects highlighted file and closes dialog
- ESC closes dialog without selection

### Content Search (Ctrl+Shift+F)
- Opens modal dialog with search input and options
- Options: case-sensitive, regex, file pattern filter
- Submits search to server API
- Displays loading indicator during search
- Shows results with: filename, line number, matching line
- Truncates long lines with "..." indicator
- Click result navigates to file
- Supports search across subdirectories (optional checkbox)

### Search History
- Stores last 20 searches (file finder and content search separately)
- Dropdown shows recent searches on input focus
- Click history item fills search input
- History persists across sessions (localStorage)

## Non-Functional Requirements

### Performance
- File finder response time: < 50ms per keystroke
- Content search on 100 text files: < 5 seconds
- Search history load time: < 10ms

### Usability
- Keyboard-first design (minimal mouse required)
- Clear visual feedback for search in progress
- Graceful handling of no results found

### Security
- Regex patterns validated to prevent ReDoS attacks
- File paths validated to prevent directory traversal
- Search limited to accessible directories only

## Success Metrics

- 80% of file navigation uses search instead of manual scrolling
- Average search-to-file time < 3 seconds
- Search feature used in 50%+ of user sessions
- < 5% of searches result in "no results"

---

**Document Maintained By**: AI Agent  
**STDD Version**: 1.5.0
