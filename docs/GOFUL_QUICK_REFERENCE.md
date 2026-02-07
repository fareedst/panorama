# Goful Feature Transfer - Quick Reference

**Quick Links**: [Full Plan](GOFUL_FEATURE_TRANSFER.md) | [Summary](GOFUL_TRANSFER_SUMMARY.md) | [Tasks](../stdd/tasks.md)

---

## Feature Checklist

### Phase 1: File Marking (3 days) [P0]
- [ ] Mark/unmark files (Space)
- [ ] Mark all (Shift+M)
- [ ] Invert marks (Ctrl+M)
- [ ] Clear marks (Escape)
- [ ] Visual checkboxes + highlighting
- [ ] Mark persistence across refresh
- [ ] Footer shows `[marked/total]`

### Phase 2: Batch Operations (5 days) [P0]
- [ ] Bulk copy (C key)
- [ ] Bulk move (M key)
- [ ] Bulk delete with confirmation (D key)
- [ ] Bulk rename (R key)
- [ ] Progress indicator
- [ ] Async execution
- [ ] Overwrite dialogs

### Phase 3: Advanced Navigation (2 days) [P1]
- [ ] Directory history
- [ ] Parent navigation cursor positioning
- [ ] Goto dialog (G key)
- [ ] Recent dirs (Alt+Left/Right)
- [ ] Bookmarks (B, Ctrl+B)
- [ ] Home shortcut (~ key)

### Phase 4: File Comparison (4 days) [P1]
- [ ] Color-code same names (yellow)
- [ ] Size colors (green/blue/red)
- [ ] Time colors (green/blue/red)
- [ ] Toggle mode (backtick)
- [ ] Configurable colors

### Phase 5: Sorting/Filtering (2 days) [P1]
- [ ] Sort menu (S key)
- [ ] Multiple criteria
- [ ] Ascending/descending
- [ ] Directories-first
- [ ] Hidden files toggle (H key)
- [ ] Glob filter (/ key)

### Phase 6: Preview (6 days) [P2]
- [ ] Info panel (I key)
- [ ] Text preview (Q key)
- [ ] Image thumbnails
- [ ] Archive contents
- [ ] File type detection

### Phase 7: Keyboard Shortcuts (4 days) [P0]
- [ ] Shortcut registry
- [ ] Help overlay (? key)
- [ ] Configurable keybindings
- [ ] Modal dialogs
- [ ] Command palette (Ctrl+P)

### Phase 8: Search (7 days) [P1]
- [ ] File finder (Ctrl+F)
- [ ] Content search (Ctrl+Shift+F)
- [ ] Multi-directory search
- [ ] Result highlighting
- [ ] Regex support
- [ ] Search history

### Phase 9: Linked Panes (3 days) [P2]
- [ ] Toggle linked mode (L key)
- [ ] Sync directory changes
- [ ] Visual link indicator

### Phase 10: Mouse Support (5 days) [P2]
- [ ] Context menu (right-click)
- [ ] Click selection
- [ ] Double-click to open
- [ ] Drag-and-drop
- [ ] Scroll wheel

### Phase 11: Configuration (3 days) [P1]
- [ ] Complete files.yaml
- [ ] Keybinding config
- [ ] Comparison colors
- [ ] File type colors
- [ ] Layout preferences
- [ ] Startup dirs

### Phase 12: Performance (5 days) [P1]
- [ ] Virtual scrolling
- [ ] Lazy metadata loading
- [ ] Debounced updates
- [ ] Optimized sorting
- [ ] Memory profiling

---

## Keyboard Shortcuts (Planned)

### File Operations
- `Space` - Toggle mark on current file
- `Shift+M` - Mark all files
- `Ctrl+M` - Invert marks
- `Escape` - Clear marks
- `C` - Copy marked files (or current file)
- `M` - Move marked files (or current file)
- `D` - Delete marked files (or current file)
- `R` - Rename file or bulk rename

### Navigation
- `Enter` - Enter directory
- `Backspace` - Go to parent directory
- `Tab` - Switch focus between panes
- `Arrow keys` - Move cursor
- `Home` - Jump to first file
- `End` - Jump to last file
- `Page Up/Down` - Scroll page
- `G` - Goto dialog (direct path entry)
- `~` - Go to home directory
- `Alt+Left` - Previous directory
- `Alt+Right` - Next directory
- `B` - Add bookmark
- `Ctrl+B` - View bookmarks

### View and Sort
- `S` - Sort menu
- `H` - Toggle hidden files
- `/` - Glob filter
- `` ` `` (backtick) - Toggle comparison mode
- `L` - Toggle linked panes
- `I` - Show file info panel
- `Q` - Show file preview
- `?` - Show help overlay

### Pane Management
- `=` - Add new pane
- `-` - Remove focused pane
- `Ctrl+R` - Refresh current pane
- `Ctrl+Shift+R` - Refresh all panes

### Search
- `Ctrl+F` - Find files
- `Ctrl+Shift+F` - Search content
- `Ctrl+P` - Command palette

---

## File Structure

### New Files to Create

```
src/
├── app/
│   └── files/
│       └── components/
│           ├── OperationDialog.tsx       (Phase 2)
│           ├── ProgressBar.tsx            (Phase 2)
│           ├── GotoDialog.tsx             (Phase 3)
│           ├── BookmarkDialog.tsx         (Phase 3)
│           ├── SortMenu.tsx               (Phase 5)
│           ├── FilterDialog.tsx           (Phase 5)
│           ├── PreviewPane.tsx            (Phase 6)
│           ├── FileInfoPanel.tsx          (Phase 6)
│           ├── TextPreview.tsx            (Phase 6)
│           ├── ImagePreview.tsx           (Phase 6)
│           ├── ArchivePreview.tsx         (Phase 6)
│           ├── HelpOverlay.tsx            (Phase 7)
│           ├── CommandPalette.tsx         (Phase 7)
│           ├── FinderDialog.tsx           (Phase 8)
│           ├── SearchDialog.tsx           (Phase 8)
│           ├── SearchResults.tsx          (Phase 8)
│           └── ContextMenu.tsx            (Phase 10)
└── lib/
    ├── files.history.ts                   (Phase 3)
    ├── files.bookmarks.ts                 (Phase 3)
    ├── files.keybinds.ts                  (Phase 7)
    └── files.search.ts                    (Phase 8)

src/app/api/files/
├── info/route.ts                          (Phase 6)
├── preview/route.ts                       (Phase 6)
└── search/route.ts                        (Phase 8)
```

### Files to Modify

```
src/
├── app/files/
│   ├── WorkspaceView.tsx       (All phases - state and handlers)
│   └── components/
│       └── FilePane.tsx         (Phases 1, 4, 5 - visual changes)
├── lib/
│   ├── files.data.ts            (Phases 2, 6, 8 - new functions)
│   ├── files.types.ts           (All phases - type extensions)
│   └── files.utils.ts           (Phases 5, 8 - utilities)
└── app/api/files/
    └── route.ts                 (Phase 2 - bulk operations)

config/
├── files.yaml                   (All phases - config additions)
└── theme.yaml                   (Phases 1, 4 - color definitions)
```

---

## Testing Checklist

### Phase 1: File Marking
- [ ] Unit: Toggle mark on file
- [ ] Unit: Mark all files
- [ ] Unit: Invert marks
- [ ] Unit: Clear marks
- [ ] Integration: Marks persist across sort
- [ ] UI: Visual appearance of marks

### Phase 2: Batch Operations
- [ ] Unit: Bulk copy operation
- [ ] Unit: Bulk move operation
- [ ] Unit: Bulk delete operation
- [ ] Integration: Cross-pane operations
- [ ] Error: Permission errors handled
- [ ] UI: Progress bar updates

### Phase 3: Navigation
- [ ] Unit: History save/restore
- [ ] Unit: Bookmark CRUD
- [ ] Integration: Parent cursor positioning
- [ ] LocalStorage: Bookmark persistence

### Phase 4: Comparison
- [ ] Unit: Comparison index builder
- [ ] Unit: Size/time analysis
- [ ] UI: Color classes applied
- [ ] Integration: Toggle mode

### Phase 5: Sorting/Filtering
- [ ] Unit: Sort by each criteria
- [ ] Unit: Glob pattern matching
- [ ] Integration: Hidden files filter

### Phase 6: Preview
- [ ] Unit: File type detection
- [ ] Integration: Preview content loading
- [ ] Security: Malicious file handling

### Phase 7: Keyboard
- [ ] Unit: Keybind parsing
- [ ] Integration: Action execution
- [ ] UI: Help overlay display

### Phase 8: Search
- [ ] Unit: Pattern matching
- [ ] Integration: Search API
- [ ] Performance: Large file search

### Phase 9: Linked Panes
- [ ] Unit: Link group management
- [ ] Integration: Sync navigation

### Phase 10: Mouse
- [ ] UI: Context menu display
- [ ] Integration: Drag-and-drop

### Phase 11: Configuration
- [ ] Unit: Config parsing
- [ ] Integration: Config application

### Phase 12: Performance
- [ ] Performance: 1000 files in < 1s
- [ ] Memory: No leaks
- [ ] Render: Virtual scrolling works

---

## Common Patterns

### Adding a New Keyboard Shortcut
```typescript
// 1. Add to keybindings config
// config/files.yaml
keybindings:
  - key: "x"
    action: "my_action"
    description: "Do something"

// 2. Add handler in WorkspaceView
function handleMyAction() {
  // implementation
}

// 3. Register in keyboard handler
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.key === 'x') {
      handleMyAction();
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, []);
```

### Adding a New File Operation
```typescript
// 1. Add to files.data.ts
export async function myOperation(source: string, dest: string): Promise<void> {
  // implementation with logger integration
  logger.info(['IMPL-FILES_DATA', 'REQ-FILE_OPERATIONS'], 
    `Starting myOperation from ${source} to ${dest}`);
}

// 2. Add API endpoint
// src/app/api/files/route.ts
if (operation === 'my-operation') {
  await myOperation(src, dest);
  return NextResponse.json({ success: true });
}

// 3. Add client handler
async function handleMyOperation() {
  const response = await fetch('/api/files', {
    method: 'POST',
    body: JSON.stringify({ operation: 'my-operation', src, dest })
  });
}
```

### Adding a New Dialog Component
```typescript
// 1. Create component
// src/app/files/components/MyDialog.tsx
'use client';
interface MyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: string) => void;
}
export function MyDialog({ isOpen, onClose, onConfirm }: MyDialogProps) {
  if (!isOpen) return null;
  return <div className="modal">...</div>;
}

// 2. Add state in WorkspaceView
const [showMyDialog, setShowMyDialog] = useState(false);

// 3. Trigger from keyboard handler
if (e.key === 'x') {
  setShowMyDialog(true);
}

// 4. Render in WorkspaceView
<MyDialog 
  isOpen={showMyDialog} 
  onClose={() => setShowMyDialog(false)}
  onConfirm={handleConfirm}
/>
```

---

## Semantic Token Usage

### In Code
```typescript
// [REQ-FILE_MARKING_WEB] [IMPL-FILE_MARKING]
function handleToggleMark(filename: string) {
  // Toggle mark on file
}
```

### In Tests
```typescript
// Test validates [REQ-FILE_MARKING_WEB]
test('handleToggleMark_REQ_FILE_MARKING_WEB', () => {
  // Test implementation
});
```

### In Documentation
```markdown
## File Marking [REQ-FILE_MARKING_WEB]

This feature implements [ARCH-MARKING_STATE] with [IMPL-FILE_MARKING].
```

---

## Progress Tracking

Use `tasks.md` to track progress:
```markdown
- [x] Mark toggle implementation
- [x] Mark all implementation  
- [x] Visual marking UI
- [ ] Mark persistence tests
```

Update semantic-tokens.md when complete:
```markdown
| `[IMPL-FILE_MARKING]` | File marking for selections | Implemented | ... |
```

---

## Getting Help

- **Full Plan**: See `docs/GOFUL_FEATURE_TRANSFER.md`
- **Task Breakdown**: See `stdd/tasks.md`
- **Semantic Tokens**: See `stdd/semantic-tokens.md`
- **Current Code**: See `src/app/files/` directory
- **Source Reference**: See goful STDD docs at `/Users/fareed/Documents/dev/go/goful/stdd/`

---

*Quick Reference Version*: 1.0  
*Last Updated*: 2026-02-07
