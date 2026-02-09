# IMPL-TOOLBAR_COMPACT_DESIGN: Compact Icon-Only Button Design

**Status**: Implemented  
**Date**: 2026-02-08

## Overview

Implementation decision to use a compact icon-only button design for toolbar buttons, showing icon + keystroke badge instead of icon + label + keystroke.

## Requirements

- `[REQ-TOOLBAR_SYSTEM]` - Main toolbar functionality

## Architecture

- `[ARCH-TOOLBAR_LAYOUT]` - Layout and positioning decisions
- `[ARCH-TOOLBAR_ACTIONS]` - Action-to-button mapping

## Problem

Initial toolbar implementation with icon + label + keystroke badges caused button overflow with high-density toolbars (particularly the Pane toolbar with 12 actions across 3 groups). Buttons extended past the container edge, creating a poor user experience.

## Decision

Implement compact button design:
- Display: **Icon + Keystroke badge** (when icon available)
- Fallback: **Label + Keystroke badge** (when no icon available)
- Remove text labels when icon is present

## Rationale

### Why This Approach

1. **Density**: Compact buttons allow 12+ actions in single toolbar without overflow
2. **Discoverability**: Keystroke badges still visible, icons provide visual recognition
3. **Tooltips**: Full description available on hover maintains discoverability
4. **Accessibility**: ARIA labels preserve screen reader functionality
5. **Consistency**: Icons are consistent across all toolbar buttons

### Alternatives Considered

1. **Keep icon + label + keystroke** (original design)
   - ❌ Caused overflow with 12+ buttons
   - ❌ Required horizontal scrolling
   - ❌ Poor mobile experience

2. **Icon only (no keystroke)**
   - ❌ Removed keyboard shortcut discoverability
   - ❌ Violated original requirement to show keystrokes

3. **Dropdown overflow menu**
   - ❌ Hidden actions reduce discoverability
   - ❌ Added complexity
   - ✅ May revisit for mobile/tablet responsive design

4. **Icon + keystroke (chosen)**
   - ✅ Compact enough to fit 12+ buttons
   - ✅ Maintains keystroke visibility
   - ✅ Icons provide quick recognition
   - ✅ Tooltips preserve full descriptions

## Implementation Changes

### ToolbarButton.tsx

```typescript
// [REQ-TOOLBAR_SYSTEM] Only show label if no icon present
const showLabel = !icon;

// Rendering logic:
{icon && <Icon name={icon} size={16} />}
{showLabel && <span>{label}</span>}
<span className="keystroke-badge">{keystroke}</span>
```

**Size reductions**:
- Button padding: `px-3 py-2` → `px-1.5 py-1`
- Icon size: `20px` → `16px`
- Font size: `text-sm` → `text-xs`
- Gap between elements: `gap-2` → `gap-1`

### Toolbar.tsx

**Spacing reductions**:
- Toolbar padding: `px-4 py-2` → `px-2 py-1`
- Group gap: `gap-2` → `gap-1`

### ToolbarGroup.tsx

**Button spacing**:
- Button gap: `gap-1` → `gap-0.5`
- Separator height: `h-8` → `h-6`

## Visual Comparison

### Before (Overflow Issue)
```
[📋 Copy C] [✂️ Move V] [🗑️ Delete D] [✏️ Rename R] [⬅️ Go ⌫] [🏠 Go ~] [↩️ Navigate Alt+←] [↪️ Navi...
                                                                           ^-- overflow
```

### After (Compact Design)
```
[📋 C] [✂️ V] [🗑️ D] [✏️ R] [⬅️ ⌫] [🏠 ~] [↩️ Alt+←] [↪️ Alt+→] [☑️ Space] [☑️☑️ Shift+M] [⇄ Ctrl+M] [❌ Esc]
```

## Impact on Requirements

Updated `[REQ-TOOLBAR_SYSTEM]` satisfaction criteria:
- ✅ "Each button displays icon (when available) + keyboard shortcut in compact format"
- ✅ "Label text only shown as fallback when no icon exists"
- ✅ "Buttons sized to prevent overflow even with 12+ actions per toolbar"

## Testing

### Validated Scenarios

1. **Pane toolbar (12 actions)**: No overflow, all buttons visible
2. **Workspace toolbar (6 actions)**: Ample space, proper grouping
3. **System toolbar (4 actions)**: Compact layout maintained
4. **Icon availability**: Labels correctly shown only for actions without icons
5. **Hover tooltips**: Full descriptions display correctly
6. **Active/disabled states**: Visual styling preserved

### Test Cases

```typescript
describe('ToolbarButton compact design', () => {
  it('shows icon + keystroke when icon available', () => {
    render(<ToolbarButton icon="copy" label="Copy" keystroke="C" />);
    expect(screen.getByRole('img')).toBeInTheDocument(); // icon
    expect(screen.queryByText('Copy')).not.toBeInTheDocument(); // no label
    expect(screen.getByText('C')).toBeInTheDocument(); // keystroke
  });
  
  it('shows label + keystroke when icon not available', () => {
    render(<ToolbarButton icon="" label="Special" keystroke="S" />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument(); // no icon
    expect(screen.getByText('Special')).toBeInTheDocument(); // label
    expect(screen.getByText('S')).toBeInTheDocument(); // keystroke
  });
});
```

## Accessibility Considerations

- **ARIA labels**: Unchanged, still include full description + keystroke
- **Tooltips**: Full action description available on hover
- **Screen readers**: Announce full action name, not affected by visual compactness
- **Keyboard navigation**: Tab/arrow key navigation preserved
- **Focus indicators**: Still visible with reduced padding

## Performance

- **Reduced DOM nodes**: Fewer text nodes when label hidden
- **Smaller component size**: Compact buttons reduce total toolbar width
- **Layout calculations**: Simpler with consistent icon-only sizing

## Future Considerations

1. **Responsive breakpoints**: May need different layouts for mobile/tablet
2. **Internationalization**: Keystroke text may vary by locale
3. **User preferences**: Could add config option to toggle label display
4. **Custom icons**: Icon set may need expansion for future actions

## Traceability

### Requirements
- `[REQ-TOOLBAR_SYSTEM]` - Updated satisfaction criteria

### Implementation
- `src/app/files/components/ToolbarButton.tsx` - Conditional label display
- `src/app/files/components/Toolbar.tsx` - Reduced spacing
- `src/app/files/components/ToolbarGroup.tsx` - Tighter gaps

### Tests
- Component tests for conditional rendering
- Integration tests for overflow scenarios

## Metadata

**Created**: 2026-02-08  
**Author**: AI Agent  
**Status**: Implemented  
**Impact**: Medium (visual design change, affects all toolbar buttons)
