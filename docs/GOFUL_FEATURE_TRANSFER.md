# Goful Feature Transfer Plan

**Version**: 1.0  
**Date**: 2026-02-07  
**Status**: Planning Phase  
**Tokens**: `[REQ-GOFUL_FEATURE_TRANSFER]`, `[ARCH-GOFUL_UX_PATTERNS]`, `[IMPL-GOFUL_FEATURES]`

---

## Executive Summary

This document outlines the comprehensive plan to transfer all UX patterns and file system features from the terminal-based Goful file manager to the web-based multi-pane file manager in this project. The current implementation provides basic single-pane viewing with directory navigation. This plan details 12 implementation phases to achieve feature parity with Goful's core functionality.

**Current State**: Basic single-pane file manager with:
- 2-pane layout with Tile algorithm
- Directory navigation (Enter, Backspace)
- File listing with metadata (name, size, mtime)
- Basic sorting (name, size, time, extension)
- Server-side filesystem access via API routes
- Configuration-driven UI (files.yaml, theme.yaml)
- 108 passing tests (34 data layer, 62 layout, 12 component)

**Target State**: Full-featured multi-pane file manager with:
- File marking for batch operations
- Bulk copy, move, delete, rename
- Cross-pane file comparison with color-coding
- Advanced navigation (history, bookmarks, goto dialog)
- File search and filtering
- Comprehensive keyboard shortcuts
- Context menus and mouse support
- File preview and info panels
- Performance optimization for large directories

---

## Feature Analysis from Goful

### Core Features to Transfer

| Feature Category | Goful Implementation | Priority | Complexity | Estimated Effort |
|-----------------|---------------------|----------|------------|------------------|
| File Marking | Space to mark, Shift+M invert, visual asterisk | P0 | Low | 3 days |
| Batch Operations | Copy/move/delete marked files | P0 | Medium | 5 days |
| Directory History | Per-directory cursor persistence | P1 | Low | 2 days |
| File Comparison | Color-coded size/time comparison | P1 | Medium | 4 days |
| Advanced Sorting | Multiple criteria, ascending/descending | P1 | Low | 2 days |
| File Search | Incremental finder, content search | P1 | High | 7 days |
| Linked Navigation | Synchronized pane navigation | P2 | Medium | 3 days |
| File Preview | Text/image/archive preview | P2 | High | 6 days |
| Keyboard Shortcuts | Complete shortcut system with help | P0 | Medium | 4 days |
| Mouse Support | Click, drag-drop, context menu | P2 | High | 5 days |
| Configuration | Complete config-driven UI | P1 | Medium | 3 days |
| Performance | Virtual scrolling, lazy loading | P1 | High | 5 days |

**Total Estimated Effort**: 49 days (approximately 10 weeks)

---

## Phase-by-Phase Implementation

### Phase 1: File Marking and Selection (3 days) [P0]

**Semantic Tokens**: `[REQ-FILE_MARKING_WEB]`, `[ARCH-MARKING_STATE]`, `[IMPL-FILE_MARKING]`

#### Requirements
- Users can mark/unmark files for batch operations
- Mark state persists across directory refresh/sort
- Visual distinction for marked files (checkbox + highlight)
- Display marked count in footer

#### Architecture Decisions
- **Client-side state management**: Store marks in React state (Set<string> of filenames)
- **Persistence strategy**: Name-based (survives re-sort), not index-based
- **Visual design**: Checkbox icon + background color for marked files
- **API design**: No server-side mark storage (client-only feature)

#### Implementation Details
```typescript
// Extended PaneState interface
interface PaneState {
  path: string;
  files: FileStat[];
  cursor: number;
  marks: Set<string>; // NEW: marked filenames
  scrollTop: number;
}

// New marking operations
function handleToggleMark(paneIndex: number, filename: string)
function handleMarkAll(paneIndex: number)
function handleInvertMarks(paneIndex: number)
function handleClearMarks(paneIndex: number)
```

#### Files to Create/Modify
- `src/app/files/WorkspaceView.tsx`: Add marks state, keyboard handlers
- `src/app/files/components/FilePane.tsx`: Visual marking UI
- `config/files.yaml`: Marking UI copy (toggle hint, count format)
- `config/theme.yaml`: Marked file colors

#### Tests
- Unit tests: Mark toggle, mark all, invert, clear
- Integration tests: Mark persistence across sort/refresh
- UI tests: Visual appearance of marked files

---

### Phase 2: File Operations Enhancement (5 days) [P0]

**Semantic Tokens**: `[REQ-BULK_FILE_OPS]`, `[ARCH-BATCH_OPERATIONS]`, `[IMPL-BULK_OPS]`

#### Requirements
- Copy marked files to target pane (C key)
- Move marked files to target pane (M key)
- Delete marked files with confirmation (D key)
- Rename single file or bulk rename (R key)
- Progress indication for long operations

#### Architecture Decisions
- **Operation targets**: If marks exist, operate on marks; else operate on cursor file
- **Cross-pane operations**: Source = focused pane, destination = other pane
- **Async execution**: Use Promise.all for parallel operations
- **Progress tracking**: Real-time progress updates via callback

#### Implementation Details
```typescript
// Extended API route: POST /api/files
// Request body: { operation: 'bulk-copy', sources: string[], dest: string }

// Progress callback interface
interface OperationProgress {
  total: number;
  completed: number;
  currentFile: string;
  errors: Array<{file: string, error: string}>;
}

// Bulk operation functions
async function bulkCopy(sources: string[], dest: string, onProgress: (p: OperationProgress) => void)
async function bulkMove(sources: string[], dest: string, onProgress: (p: OperationProgress) => void)
async function bulkDelete(sources: string[], onProgress: (p: OperationProgress) => void)
```

#### Files to Create/Modify
- `src/app/api/files/route.ts`: Add bulk operation handlers
- `src/lib/files.data.ts`: Bulk operation functions
- `src/app/files/WorkspaceView.tsx`: Operation keyboard handlers
- `src/app/files/components/OperationDialog.tsx`: NEW - Confirmation dialogs
- `src/app/files/components/ProgressBar.tsx`: NEW - Progress indicator

#### Tests
- Unit tests: Bulk copy/move/delete operations
- Integration tests: Cross-pane operations
- Error handling tests: Permission errors, disk full
- Progress tracking tests: Progress callback invocation

---

### Phase 3: Advanced Navigation (2 days) [P1]

**Semantic Tokens**: `[REQ-ADVANCED_NAV]`, `[ARCH-DIRECTORY_HISTORY]`, `[IMPL-DIR_HISTORY]`

#### Requirements
- Per-directory cursor position history
- Parent navigation positions cursor on previous directory
- Goto dialog for direct path entry (G key)
- Recent directories list (Alt+Left/Right)
- Bookmark system (B to add, Ctrl+B to list)

#### Architecture Decisions
- **History storage**: Map<pane_id, Map<path, cursor_position>>
- **Parent navigation**: Search for previous directory name in parent listing
- **Bookmarks**: LocalStorage for persistence across sessions
- **Recent dirs**: LRU cache of last 20 visited directories per pane

#### Implementation Details
```typescript
// Directory history interface
interface DirectoryHistory {
  [paneId: string]: {
    [path: string]: {
      cursorPosition: number;
      scrollTop: number;
      lastVisited: number; // timestamp
    };
  };
}

// Bookmark interface
interface Bookmark {
  id: string;
  path: string;
  label: string;
  created: number;
}

// History functions
function saveCursorPosition(paneId: string, path: string, position: number)
function restoreCursorPosition(paneId: string, path: string): number | null
function getRecentDirectories(paneId: string): string[]
```

#### Files to Create/Modify
- `src/lib/files.history.ts`: NEW - History management
- `src/lib/files.bookmarks.ts`: NEW - Bookmark management
- `src/app/files/components/GotoDialog.tsx`: NEW - Path entry dialog
- `src/app/files/components/BookmarkDialog.tsx`: NEW - Bookmark management UI
- `src/app/files/WorkspaceView.tsx`: Navigation keyboard handlers

#### Tests
- Unit tests: History save/restore, bookmark CRUD
- Integration tests: Parent navigation cursor positioning
- LocalStorage tests: Bookmark persistence

---

### Phase 4: Cross-Pane Comparison (4 days) [P1]

**Semantic Tokens**: `[REQ-FILE_COMPARISON_VISUAL]`, `[ARCH-COMPARISON_COLORING]`, `[IMPL-COMPARISON_COLORS]`

#### Requirements
- Color-code files with same name across panes
- Size comparison: equal (green), smaller (blue), larger (red)
- Time comparison: equal (green), older (blue), newer (red)
- Toggle comparison mode (backtick key)
- Configurable comparison colors

#### Architecture Decisions
- **Comparison index**: Extend existing ComparisonIndex to include size/time data
- **Color application**: Apply via CSS classes based on comparison result
- **Performance**: Rebuild index only when pane contents change
- **Configuration**: Define color scheme in theme.yaml

#### Implementation Details
```typescript
// Extended ComparisonState interface
interface ComparisonState {
  panes: number[];
  sizes: number[];
  mtimes: Date[];
  // NEW: comparison results
  sizeClass: 'equal' | 'smallest' | 'largest' | null;
  timeClass: 'equal' | 'earliest' | 'latest' | null;
}

// Comparison index builder
function buildEnhancedComparisonIndex(panes: FileStat[][]): ComparisonIndex {
  // For each filename appearing in multiple panes:
  // - Identify which panes have it
  // - Compare sizes across panes
  // - Compare mtimes across panes
  // - Assign size/time classes
}
```

#### Files to Create/Modify
- `src/lib/files.data.ts`: Enhance buildComparisonIndex
- `src/lib/files.types.ts`: Extend ComparisonState interface
- `src/app/files/components/FilePane.tsx`: Apply comparison CSS classes
- `config/theme.yaml`: Comparison color definitions
- `src/app/files/WorkspaceView.tsx`: Toggle comparison mode (backtick)

#### Tests
- Unit tests: Comparison index with size/time analysis
- Visual tests: Color application for all comparison states
- Toggle tests: Comparison mode on/off

---

### Phase 5: File Sorting and Filtering (2 days) [P1]

**Semantic Tokens**: `[REQ-FILE_SORTING_ADVANCED]`, `[IMPL-SORT_FILTER]`

#### Requirements
- Sort menu with multiple criteria (S key)
- Ascending/descending toggle
- Directories-first option
- Case-sensitive/insensitive name sorting
- Hidden files toggle (H key)
- Glob filter for filenames (/ key)

#### Architecture Decisions
- **Sort state**: Store in pane state (sortBy, sortAscending, dirsFirst)
- **Hidden files**: Filter on client side before rendering
- **Glob filter**: Simple wildcard matching (* and ?)
- **Sort persistence**: Maintain sort across directory changes

#### Implementation Details
```typescript
// Extended PaneState
interface PaneState {
  // ... existing fields
  sortBy: 'name' | 'size' | 'time' | 'extension';
  sortAscending: boolean;
  showHidden: boolean;
  globFilter: string | null;
}

// Sort and filter functions
function applySortAndFilter(files: FileStat[], state: PaneState): FileStat[]
function matchGlob(filename: string, pattern: string): boolean
```

#### Files to Create/Modify
- `src/app/files/WorkspaceView.tsx`: Sort/filter state and handlers
- `src/app/files/components/SortMenu.tsx`: NEW - Sort options menu
- `src/app/files/components/FilterDialog.tsx`: NEW - Glob filter input
- `src/lib/files.utils.ts`: Sort and filter utility functions

#### Tests
- Unit tests: Sort functions for all criteria
- Unit tests: Glob pattern matching
- Integration tests: Filter persistence

---

### Phase 6: File Preview and Info (6 days) [P2]

**Semantic Tokens**: `[REQ-FILE_PREVIEW]`, `[ARCH-PREVIEW_SYSTEM]`, `[IMPL-FILE_PREVIEW]`

#### Requirements
- Info panel with detailed file metadata (I key)
- Text file preview (Q key)
- Image thumbnail preview
- Archive contents preview (zip, tar)
- File type detection

#### Architecture Decisions
- **Preview pane**: Split-pane view (file list + preview)
- **Server-side rendering**: API endpoint for file content/info
- **File type detection**: Use file extension + magic bytes
- **Security**: Limit preview to safe file types, sanitize content

#### Implementation Details
```typescript
// Preview API: GET /api/files/preview?path=...&type=...
// Response: { type: 'text' | 'image' | 'archive', content: string | ArrayBuffer }

// File info API: GET /api/files/info?path=...
// Response: { stat: FileStat, permissions: string, owner: string, group: string, links: number }

// Preview components
<FileInfoPanel stat={FileStat} />
<TextPreview content={string} />
<ImagePreview url={string} />
<ArchivePreview entries={ArchiveEntry[]} />
```

#### Files to Create/Modify
- `src/app/api/files/preview/route.ts`: NEW - Preview content endpoint
- `src/app/api/files/info/route.ts`: NEW - File metadata endpoint
- `src/app/files/components/PreviewPane.tsx`: NEW - Preview container
- `src/app/files/components/FileInfoPanel.tsx`: NEW - Detailed metadata
- `src/app/files/components/TextPreview.tsx`: NEW - Text file viewer
- `src/app/files/components/ImagePreview.tsx`: NEW - Image viewer
- `src/app/files/components/ArchivePreview.tsx`: NEW - Archive listing

#### Tests
- Unit tests: File type detection
- Integration tests: Preview content loading
- Security tests: Malicious file handling

---

### Phase 7: Keyboard Shortcuts System (4 days) [P0]

**Semantic Tokens**: `[REQ-KEYBOARD_SHORTCUTS_COMPLETE]`, `[ARCH-KEYBIND_SYSTEM]`, `[IMPL-KEYBINDS]`

#### Requirements
- Comprehensive keyboard shortcut system
- Help overlay showing all shortcuts (? key)
- Configurable keybindings (files.yaml)
- Modal dialogs for confirmations
- Command palette (Ctrl+P)

#### Architecture Decisions
- **Keybind registry**: Map<key_combo, action_handler>
- **Configuration**: Define keybinds in files.yaml
- **Overlay UI**: Modal popup with categorized shortcuts
- **Command palette**: Fuzzy search for actions

#### Implementation Details
```typescript
// Keybinding configuration
interface Keybinding {
  key: string; // e.g., "c", "ctrl+c", "shift+m"
  action: string; // e.g., "copy", "mark_all", "goto_dialog"
  description: string;
  category: string;
}

// Keybind registry
const keybinds: Keybinding[] = loadKeybindings();

// Keyboard event handler
function handleGlobalKeypress(event: KeyboardEvent) {
  const combo = formatKeyCombo(event);
  const binding = keybinds.find(kb => kb.key === combo);
  if (binding) {
    executeAction(binding.action);
  }
}
```

#### Files to Create/Modify
- `src/lib/files.keybinds.ts`: NEW - Keybind registry and handler
- `src/app/files/components/HelpOverlay.tsx`: NEW - Shortcut help UI
- `src/app/files/components/CommandPalette.tsx`: NEW - Command search UI
- `config/files.yaml`: Keybinding configuration section
- `src/app/files/WorkspaceView.tsx`: Integrate global keyboard handler

#### Tests
- Unit tests: Keybind parsing and matching
- Integration tests: Action execution
- UI tests: Help overlay display

---

### Phase 8: Search and Find (7 days) [P1]

**Semantic Tokens**: `[REQ-FILE_SEARCH]`, `[ARCH-SEARCH_ENGINE]`, `[IMPL-FILE_SEARCH]`

#### Requirements
- Incremental file finder (Ctrl+F)
- Content search within files (Ctrl+Shift+F)
- Search across multiple directories
- Search result highlighting
- Regex pattern support
- Search history

#### Architecture Decisions
- **Incremental finder**: Client-side fuzzy match on visible files
- **Content search**: Server-side grep-like search
- **Search API**: POST /api/files/search with pattern and options
- **Result format**: Array of matches with line numbers and context
- **History**: LocalStorage for recent search patterns

#### Implementation Details
```typescript
// Search API: POST /api/files/search
// Request: { pattern: string, paths: string[], regex: boolean, caseSensitive: boolean }
// Response: { results: SearchResult[] }

interface SearchResult {
  file: string;
  matches: Array<{
    line: number;
    content: string;
    position: number;
  }>;
}

// Incremental finder
function incrementalFind(files: FileStat[], pattern: string): FileStat[]

// Content search
async function searchContent(pattern: string, options: SearchOptions): Promise<SearchResult[]>
```

#### Files to Create/Modify
- `src/app/api/files/search/route.ts`: NEW - Content search endpoint
- `src/app/files/components/FinderDialog.tsx`: NEW - Incremental finder UI
- `src/app/files/components/SearchDialog.tsx`: NEW - Content search UI
- `src/app/files/components/SearchResults.tsx`: NEW - Search results viewer
- `src/lib/files.search.ts`: NEW - Search utility functions

#### Tests
- Unit tests: Pattern matching (fuzzy, regex)
- Integration tests: Search API
- Performance tests: Large file search

---

### Phase 9: Linked Pane Navigation (3 days) [P2]

**Semantic Tokens**: `[REQ-LINKED_PANES]`, `[IMPL-LINKED_NAV]`

#### Requirements
- Toggle linked navigation mode (L key)
- Synchronize directory changes across panes
- Visual indicator for linked panes
- Configurable link groups

#### Implementation Details
```typescript
// Link state
interface LinkState {
  enabled: boolean;
  groups: Array<Set<number>>; // pane indices in each link group
}

// Navigation handler with link sync
function handleNavigate(paneIndex: number, path: string) {
  navigatePaneToPath(paneIndex, path);
  
  if (linkState.enabled) {
    const group = getLinkGroup(paneIndex);
    for (const linkedPane of group) {
      if (linkedPane !== paneIndex) {
        navigatePaneToPath(linkedPane, path);
      }
    }
  }
}
```

#### Files to Create/Modify
- `src/app/files/WorkspaceView.tsx`: Link state and sync logic
- `src/app/files/components/FilePane.tsx`: Link indicator in header

---

### Phase 10: Context Menu and Mouse Support (5 days) [P2]

**Semantic Tokens**: `[REQ-MOUSE_INTERACTION]`, `[IMPL-MOUSE_SUPPORT]`

#### Requirements
- Right-click context menu
- File selection via click
- Double-click to open/enter
- Drag-and-drop operations
- Scroll wheel support

#### Implementation Details
```typescript
// Context menu
<ContextMenu>
  <MenuItem action="copy">Copy</MenuItem>
  <MenuItem action="move">Move</MenuItem>
  <MenuItem action="delete">Delete</MenuItem>
  <MenuItem action="rename">Rename</MenuItem>
  <MenuItem separator />
  <MenuItem action="info">Properties</MenuItem>
</ContextMenu>

// Drag-and-drop
function handleDragStart(file: FileStat)
function handleDrop(targetPane: number, targetPath: string)
```

#### Files to Create/Modify
- `src/app/files/components/ContextMenu.tsx`: NEW - Right-click menu
- `src/app/files/components/FilePane.tsx`: Mouse event handlers

---

### Phase 11: Configuration and Customization (3 days) [P1]

**Semantic Tokens**: `[REQ-FILES_CONFIG_COMPLETE]`, `[IMPL-FILES_CONFIG_COMPLETE]`

#### Requirements
- Complete files.yaml configuration
- Keybinding configuration
- Comparison color configuration
- File type icons/colors
- Layout preferences
- Startup directories

#### Files to Create/Modify
- `config/files.yaml`: Extend with all configuration sections
- `config/theme.yaml`: Complete color scheme

---

### Phase 12: Performance and Polish (5 days) [P1]

**Semantic Tokens**: `[REQ-FILES_PERFORMANCE]`, `[IMPL-PERFORMANCE_OPT]`

#### Requirements
- Virtual scrolling for 1000+ files
- Lazy loading for file metadata
- Debounced comparison updates
- Optimized sort algorithms
- Memory profiling

#### Implementation Details
```typescript
// Virtual scrolling with react-window
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={paneHeight}
  itemCount={files.length}
  itemSize={25}
  width="100%"
>
  {Row}
</FixedSizeList>
```

---

## Risk Assessment and Mitigation

| Risk | Probability | Impact | Mitigation Strategy |
|------|------------|--------|---------------------|
| Server-side file operations too slow | Medium | High | Implement streaming responses, parallel operations |
| Browser security restrictions | Low | Medium | Document limitations, provide alternatives |
| Large directory performance | High | High | Implement virtual scrolling (Phase 12) |
| Cross-browser compatibility | Medium | Medium | Test on Chrome, Firefox, Safari; use polyfills |
| Keyboard shortcut conflicts | Low | Low | Make keybindings configurable |
| File encoding issues | Medium | Medium | Detect encoding, provide charset selection |

---

## Testing Strategy

### Unit Tests (per phase)
- Data layer functions (files.data.ts)
- Utility functions (files.utils.ts, files.keybinds.ts)
- State management logic
- Component rendering (FilePane, dialogs)

### Integration Tests
- API route handlers
- Cross-pane operations
- Keyboard event handling
- File operation workflows

### Performance Tests
- Large directory rendering (1000+ files)
- Bulk operation throughput
- Search performance
- Memory usage profiling

### User Acceptance Tests
- Complete workflow scenarios (copy, move, search)
- Keyboard navigation flows
- Cross-browser testing
- Accessibility testing

---

## Dependencies and Prerequisites

### External Libraries
- `react-window`: Virtual scrolling (Phase 12)
- `fuse.js`: Fuzzy search (Phase 8)
- `minimatch`: Glob pattern matching (Phase 5)
- `jszip`: Archive preview (Phase 6)

### Configuration Files
- `config/files.yaml`: Extended configuration
- `config/theme.yaml`: Complete color scheme
- `.env`: Environment variables for logging

### API Routes
- `GET /api/files`: Directory listing (existing)
- `POST /api/files`: File operations (existing, to be extended)
- `GET /api/files/info`: Detailed file metadata (new)
- `GET /api/files/preview`: File preview content (new)
- `POST /api/files/search`: Content search (new)

---

## Documentation Requirements

### User Documentation
- Keyboard shortcuts reference
- Feature guide (marking, operations, search)
- Configuration guide
- Troubleshooting guide

### Developer Documentation
- Architecture overview
- API documentation
- Component hierarchy
- Testing guide
- Contribution guidelines

### STDD Documentation Updates
- Requirements: 12 new REQ-* tokens
- Architecture: 12 new ARCH-* tokens
- Implementation: 30+ new IMPL-* tokens
- All tokens referenced in code and tests
- Complete traceability matrix

---

## Success Criteria

### Functional Completeness
- ✅ All 12 phases implemented and tested
- ✅ Feature parity with goful core functionality
- ✅ All tests passing (target: 300+ tests)
- ✅ Zero critical bugs, < 5 minor bugs

### Performance Targets
- ✅ Directory with 1000 files loads in < 1 second
- ✅ File operation on 100 files completes in < 5 seconds
- ✅ Search across 1000 files completes in < 2 seconds
- ✅ UI remains responsive during all operations

### Code Quality
- ✅ Test coverage > 80%
- ✅ All linter warnings resolved
- ✅ TypeScript strict mode passing
- ✅ All semantic tokens validated

### User Experience
- ✅ Keyboard navigation fully functional
- ✅ Visual feedback for all operations
- ✅ Error messages clear and actionable
- ✅ Configuration intuitive and complete

---

## Conclusion

This plan provides a comprehensive roadmap for transferring all essential features from Goful to the web-based file manager. The phased approach allows for incremental delivery and validation at each step. Priority is given to foundational features (marking, operations, keyboard shortcuts) before advanced features (preview, mouse support).

**Estimated Timeline**: 10 weeks (49 days)  
**Team Size**: 1 developer  
**Risk Level**: Medium (manageable with mitigation strategies)

---

*Document Version*: 1.0  
*Last Updated*: 2026-02-07  
*Next Review*: After Phase 1 completion
