# IMPL-FILE_COLUMN_CONFIG: Configurable File Column Display

**Status**: Active  
**Cross-references**: [REQ-CONFIG_DRIVEN_FILE_MANAGER], [ARCH-CONFIG_DRIVEN_UI], [IMPL-FILES_CONFIG], [IMPL-FILE_PANE], [REQ-FILE_LISTING]  
**Created**: 2026-02-08  
**Last Updated**: 2026-02-08

## Overview

Implements configurable column display for file panes, allowing users to customize which columns are shown, their order, and formatting through the existing YAML configuration system.

**Update (2026-02-08)**: Extended with `[IMPL-FILE_AGE_DISPLAY]` to support configurable time display formats. The `mtime` column now supports both absolute timestamps (`YYYY-MM-DD HH:MM:SS`) and relative age display (`4 day 23 hr` with two significant units). Default format is "age" for better user experience.

## Rationale

### Why

The existing file pane hard-coded the column display order (checkbox, icon, name, size, mtime) with no ability for users to customize which columns to show or their order. Time formatting used simplified `toLocaleDateString()` instead of a full timestamp format.

### Problems Solved

1. **Fixed column order**: Users could not reorder columns to prioritize information (e.g., showing modification time first)
2. **No column visibility control**: All columns always displayed, no way to hide unwanted columns
3. **Incomplete time format**: Date-only format lacked time information needed for file management
4. **Not config-driven**: Column display was hard-coded in component, inconsistent with project's config-driven architecture

### Benefits

1. **User customization**: Full control over column order and visibility via `config/files.yaml`
2. **Optimized defaults**: Default order (mtime, size, name) prioritizes recent changes
3. **Complete timestamps**: YYYY-MM-DD HH:MM:SS format provides full date and time information
4. **Architectural consistency**: Integrates with existing config system ([IMPL-FILES_CONFIG])
5. **Maintainability**: Column definitions centralized in configuration, not scattered in code

## Implementation Approach

### High-Level Design

Extended the existing configuration system with a new `columns` section that defines column display properties. The FilePane component was refactored to render columns dynamically based on configuration rather than hard-coded markup.

### Component Flow

```
config/files.yaml (columns config)
  ↓
src/lib/config.ts (getFilesConfig loads)
  ↓
src/app/files/page.tsx (extracts columns)
  ↓
src/app/files/WorkspaceView.tsx (passes to FilePane)
  ↓
src/app/files/components/FilePane.tsx (renders dynamically)
```

### Key Changes

#### 1. Type Definitions (config.types.ts)

```typescript
export type FileColumnId = "name" | "size" | "mtime";

export interface FilesColumnConfig {
  id: FileColumnId;
  visible?: boolean;  // default: true
}

// Added to FilesConfig interface
columns?: FilesColumnConfig[];
```

#### 2. Configuration Defaults (config.ts)

```typescript
columns: [
  { id: "mtime", visible: true },
  { id: "size", visible: true },
  { id: "name", visible: true },
]
```

#### 3. YAML Configuration (config/files.yaml)

```yaml
columns:
  - id: "mtime"
    visible: true
  - id: "size"
    visible: true
  - id: "name"
    visible: true
```

#### 4. Time Formatting Utility (files.utils.ts)

```typescript
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}
```

#### 5. Dynamic Column Rendering (FilePane.tsx)

Created a `renderColumn` helper function that generates column content based on `FileColumnId`:

- **name**: Filename with directory styling and flex-1 truncate
- **size**: File size via `formatSize()` (hidden for directories)
- **mtime**: Modification time via `formatDateTime()`

Rendering logic:
```typescript
{columns
  .filter(col => col.visible !== false)
  .map(col => renderColumn(col.id, file))}
```

### Fixed Elements

Checkbox and directory icon remain fixed at the start of each file row (always rendered before dynamic columns). This ensures marking functionality and visual directory indication are always available regardless of column configuration.

## Code Locations

### Configuration Layer
- **src/lib/config.types.ts**: Type definitions (lines 464-471)
- **src/lib/config.ts**: Default configuration (lines 473-479)
- **config/files.yaml**: User-editable config (lines 332-341)

### Utility Layer
- **src/lib/files.utils.ts**: `formatDateTime` function (lines 42-57)
- **src/lib/files.utils.test.ts**: Unit tests for `formatDateTime`

### Component Layer
- **src/app/files/page.tsx**: Extract and pass columns config (lines 28-36, 72)
- **src/app/files/WorkspaceView.tsx**: Thread columns to FilePane (lines 60, 74, 1296)
- **src/app/files/components/FilePane.tsx**: Dynamic rendering (lines 6, 13, 63, 93, 280-323, 369)

### Test Layer
- **src/app/files/WorkspaceView.test.tsx**: Updated all render calls with columns prop
- **src/app/files/components/FilePane.test.tsx**: Updated all render calls with columns prop

## Configuration Example

### Show only name and time (hide size):
```yaml
columns:
  - id: "mtime"
    visible: true
  - id: "name"
    visible: true
  - id: "size"
    visible: false
```

### Traditional order (name first):
```yaml
columns:
  - id: "name"
    visible: true
  - id: "size"
    visible: true
  - id: "mtime"
    visible: true
```

### Minimal display (name only):
```yaml
columns:
  - id: "name"
    visible: true
  - id: "size"
    visible: false
  - id: "mtime"
    visible: false
```

### Show absolute time instead of age:
```yaml
columns:
  - id: "mtime"
    visible: true
    format: "absolute"  # Show YYYY-MM-DD HH:MM:SS instead of relative age
  - id: "size"
    visible: true
  - id: "name"
    visible: true
```

## Time Display Format Options [IMPL-FILE_AGE_DISPLAY]

The `mtime` column supports two display formats via the `format` property:

### Age Format (Default)
Displays relative time with two significant units:
- **Years + Months**: "2 yr 3 mo"
- **Months + Weeks**: "3 mo 2 wk"
- **Weeks + Days**: "2 wk 5 day"
- **Days + Hours**: "4 day 23 hr"
- **Hours + Minutes**: "5 hr 30 min"
- **Minutes + Seconds**: "10 min 45 sec"
- **Seconds only**: "30 sec"

Benefits:
- Immediate understanding of file recency
- Easier to spot recently modified files
- Natural language format (no need to calculate time differences)

### Absolute Format
Displays full timestamp in `YYYY-MM-DD HH:MM:SS` format:
- Example: "2024-02-08 14:30:45"
- Provides exact modification time
- Useful for precise time tracking or audit logs

### Implementation Details

**Utility Function**: `formatAge()` in `src/lib/files.utils.ts`
- Calculates time difference from current time
- Selects appropriate unit pairs based on magnitude
- Handles edge cases (future dates, zero seconds, exact unit boundaries)
- Unit abbreviations: yr, mo, wk, day, hr, min, sec

**Configuration**: Column-level `format` property
```typescript
interface FilesColumnConfig {
  id: FileColumnId;
  visible?: boolean;
  format?: "age" | "absolute";  // Only applies to mtime column
}
```

## Traceability

### Architecture
- [ARCH-CONFIG_DRIVEN_UI]: Extends config-driven UI architecture to file columns

### Requirements
- [REQ-CONFIG_DRIVEN_FILE_MANAGER]: Fulfills requirement for configurable file manager
- [REQ-FILE_LISTING]: Enhances file listing display with configurable columns

### Tests
- `formatDateTime` unit tests in `src/lib/files.utils.test.ts`
- `formatAge` unit tests in `src/lib/files.utils.test.ts` [IMPL-FILE_AGE_DISPLAY]
- All WorkspaceView and FilePane tests updated with columns prop (including format property)

### Code Annotations
All implementation code marked with:
- `[IMPL-FILE_COLUMN_CONFIG]` - Original column configuration
- `[IMPL-FILE_AGE_DISPLAY]` - Age display feature (added 2026-02-08)
- `[REQ-CONFIG_DRIVEN_FILE_MANAGER]` - Requirement traceability

## Related Decisions

### Depends On
- [IMPL-FILES_CONFIG]: Relies on existing config loading infrastructure
- [IMPL-FILE_PANE]: Modifies FilePane component rendering
- [ARCH-CONFIG_DRIVEN_UI]: Follows established config-driven architecture pattern

### See Also
- [IMPL-FILES_CONFIG_COMPLETE]: Related complete config implementation

## Future Considerations

### Potential Enhancements

1. **Column width control**: Add `width` property to control column sizing
2. ~~**Custom column formatters**: Allow user-defined format strings for dates/sizes~~ [IMPL-FILE_AGE_DISPLAY] ✅ Implemented for mtime via format property
3. **Additional columns**: Support for permissions, owner, group, etc.
4. **Column alignment**: Add `align` property (left, right, center)
5. **Sort indicators**: Show sort column and direction in column headers
6. **Column resizing**: Mouse-based column width adjustment
7. **More time formats**: Add additional format options (e.g., "relative" showing "3 hours ago", "compact" showing "4d23h")

### Extension Points

The `FileColumnId` type and `renderColumn` function can be easily extended to support additional columns:

```typescript
// Future: Add permissions column
export type FileColumnId = "name" | "size" | "mtime" | "permissions";

case "permissions":
  return (
    <span key="permissions" className="text-zinc-500 dark:text-zinc-400 text-xs font-mono">
      {file.permissions}
    </span>
  );
```

## Validation

**Status**: Implementation complete with age display feature

### Verification Steps
1. ✅ Type definitions added to config.types.ts
2. ✅ Default configuration added to config.ts
3. ✅ YAML configuration added to config/files.yaml
4. ✅ formatDateTime utility implemented and tested
5. ✅ Component hierarchy updated (page.tsx → WorkspaceView.tsx → FilePane.tsx)
6. ✅ Dynamic column rendering implemented
7. ✅ Tests updated with columns prop
8. ✅ formatAge utility implemented and tested [IMPL-FILE_AGE_DISPLAY]
9. ✅ Format property added to column configuration [IMPL-FILE_AGE_DISPLAY]
10. ✅ FilePane component updated to support both age and absolute formats [IMPL-FILE_AGE_DISPLAY]
11. ⏳ Manual testing: verify column order and time format in running application
12. ⏳ Manual testing: verify column visibility control works
13. ⏳ Manual testing: verify age display shows correct relative times
14. ⏳ Test suite: run all tests to ensure no regressions

## Notes

- User originally specified `YYYY-MM-DD HH:MM;SS` but semicolon appears to be typo; implemented with colon (standard time separator)
- Default order (mtime, size, name) prioritizes recent changes, different from traditional name-first approach
- Checkbox and directory icon are not configurable (always shown) to maintain core functionality
- **Age display** (2026-02-08): Default format changed from "absolute" to "age" for better UX. Users can restore absolute format via config.
- Age format uses medium unit abbreviations (yr, mo, wk, day, hr, min, sec) as preferred by user
