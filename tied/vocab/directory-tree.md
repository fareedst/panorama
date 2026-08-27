# Directory tree vocabulary (canonical)

## Scope

**Lazy hierarchical tree listing** under each pane's **base directory** (`pane.path`). Excludes **multi-target sync** ([nsync-multi-target.md](nsync-multi-target.md)) and **linked re-root** mechanics ([linked-navigation.md](linked-navigation.md)).

## Traceability

| Kind | Tokens / artifacts |
| --- | --- |
| REQ | [REQ-DIRECTORY_TREE](../requirements/REQ-DIRECTORY_TREE.yaml), [REQ-FILE_LISTING](../requirements/REQ-FILE_LISTING.yaml), [REQ-DIRECTORY_NAVIGATION](../requirements/REQ-DIRECTORY_NAVIGATION.yaml) |
| ARCH | [ARCH-DIRECTORY_TREE](../architecture-decisions/ARCH-DIRECTORY_TREE.yaml), [ARCH-FILE_MANAGER_HIERARCHY](../architecture-decisions/ARCH-FILE_MANAGER_HIERARCHY.yaml) |
| IMPL | [IMPL-DIRECTORY_TREE](../implementation-decisions/IMPL-DIRECTORY_TREE.yaml), [IMPL-WORKSPACE_VIEW](../implementation-decisions/IMPL-WORKSPACE_VIEW.yaml), [IMPL-FILE_PANE](../implementation-decisions/IMPL-FILE_PANE.yaml) |
| Pseudo-code | [IMPL-DIRECTORY_TREE-pseudocode.md](../implementation-decisions/IMPL-DIRECTORY_TREE-pseudocode.md) |

## See also

- [workspace-pane.md](workspace-pane.md) — **Base directory**, **Set as Base directory**
- [linked-navigation.md](linked-navigation.md) — linked sync on re-root only
- [file-marking.md](file-marking.md) — path-keyed marks on **visible rows**

## Preferred term vs synonyms

| Preferred | Synonyms / notes |
| --- | --- |
| **Base directory** | `pane.path` — listing anchor; re-root via Set Base, header `..`, bookmarks |
| **Tree node** | Directory entry in the tree; absolute path identifies node |
| **Expanded path** | Absolute directory path in `expandedPaths` Set |
| **Visible row** | Flattened pre-order entry (file or dir) for cursor and marks |
| **Tree expand toggle** | Double-click, Enter, or chevron — expand/collapse; not re-root |
| **Lazy child load** | `fetchDirectoryListing(nodePath, displaySpecId)` on first expand |
| **File tree state** | `FileTreeState`: `basePath`, `expandedPaths`, `childrenByPath` |

## Linked navigation boundary

| Action | Linked sync? |
| --- | --- |
| Tree expand/collapse | **No** |
| Header `..` / `navigate.parent` | **Yes** (when linked) |
| Set as Base directory | Per existing rules |
| Bookmarks, home, refresh | **Yes** when linked |
| Cursor filename sync | **Yes** (basename on visible rows) |

## Pseudo-code block names

| Preferred term | UPPER_SNAKE block | Owning IMPL |
| --- | --- | --- |
| Initial tree | `CREATE_INITIAL_TREE_STATE` | IMPL-DIRECTORY_TREE |
| Toggle expand | `TOGGLE_EXPANDED` | IMPL-DIRECTORY_TREE |
| Cache children | `SET_CHILDREN` | IMPL-DIRECTORY_TREE |
| Flatten listing | `FLATTEN_VISIBLE_ROWS` | IMPL-DIRECTORY_TREE |
| Mark/cursor reconcile | `RECONCILE_TREE_SELECTION` | IMPL-DIRECTORY_TREE |
| Refresh expanded nodes | `REFRESH_PANE_TREE` | IMPL-DIRECTORY_TREE |
| Re-root reset | `HANDLE_NAVIGATE_TREE_RESET` | IMPL-DIRECTORY_TREE |

## Alphabetical index

| Term | Section |
| --- | --- |
| base directory | Preferred term vs synonyms |
| expanded path | Preferred term vs synonyms |
| file tree state | Preferred term vs synonyms |
| lazy child load | Preferred term vs synonyms |
| tree node | Preferred term vs synonyms |
| tree expand toggle | Preferred term vs synonyms |
| visible row | Preferred term vs synonyms |
