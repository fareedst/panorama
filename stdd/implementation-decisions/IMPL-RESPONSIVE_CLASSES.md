# Implementation Decision: Responsive Utility Classes

**Token**: [IMPL-RESPONSIVE_CLASSES]  
**Status**: ✅ Implemented  
**Last Updated**: 2026-02-06

## Cross-References

- **Architecture**: [ARCH-RESPONSIVE_FIRST], [ARCH-TAILWIND_V4]
- **Requirements**: [REQ-RESPONSIVE_DESIGN]

## Implementation

### Mobile-First Approach

**File**: `src/app/page.tsx`

Default styles apply to mobile, breakpoint prefixes add complexity for larger screens.

### Breakpoint Usage Patterns

#### Text Alignment

```jsx
<div className="text-center sm:text-left">
  {/* Mobile: center, Desktop: left */}
</div>
```

#### Layout Direction

```jsx
<div className="flex flex-col gap-6 sm:items-start">
  {/* Mobile: vertical, centered */}
  {/* Desktop: vertical, left-aligned */}
</div>
```

#### Button Layout

```jsx
<div className="flex flex-col gap-4 sm:flex-row">
  {/* Mobile: vertical stack */}
  {/* Desktop: horizontal row */}
</div>
```

#### Button Width

```jsx
<a className="w-full md:w-[158px]">
  {/* Mobile: full width */}
  {/* Desktop: fixed width */}
</a>
```

## Tailwind Breakpoints

### Default Breakpoints

```css
/* Mobile first (no prefix) - 0px+ */
.class { }

/* sm - 640px+ (large phones, small tablets) */
@media (min-width: 640px) {
  .sm\:class { }
}

/* md - 768px+ (tablets, small laptops) */
@media (min-width: 768px) {
  .md\:class { }
}

/* lg - 1024px+ (laptops, desktops) */
@media (min-width: 1024px) {
  .lg\:class { }
}

/* xl - 1280px+ (large desktops) */
@media (min-width: 1280px) {
  .xl\:class { }
}

/* 2xl - 1536px+ (extra large screens) */
@media (min-width: 1536px) {
  .xl\:class { }
}
```

## Common Patterns

### Layout Changes

**Mobile → Desktop Transformation**:

```jsx
// Mobile: Stack vertically
// Desktop: Arrange horizontally
<div className="flex flex-col sm:flex-row">

// Mobile: Center content
// Desktop: Left align
<div className="items-center sm:items-start">

// Mobile: Full width
// Desktop: Constrained width
<div className="w-full sm:max-w-3xl">
```

### Spacing Adjustments

```jsx
// Mobile: Tighter spacing
// Desktop: More generous spacing
<div className="py-16 sm:py-32">

// Mobile: Smaller gap
// Desktop: Larger gap
<div className="gap-4 sm:gap-6">
```

### Typography

```jsx
// Mobile: Smaller text
// Desktop: Larger text
<h1 className="text-2xl sm:text-3xl">

// Mobile: Shorter line height
// Desktop: More comfortable reading
<p className="leading-6 sm:leading-8">
```

### Visibility

```jsx
// Hide on mobile, show on desktop
<div className="hidden sm:block">

// Show on mobile, hide on desktop
<div className="block sm:hidden">
```

## Implementation Examples

### Home Page Layout

```jsx
<main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
  {/* 
    Mobile: 
    - Centered items (items-center)
    Desktop (sm:):
    - Left-aligned items (sm:items-start)
  */}
</main>
```

### Content Section

```jsx
<div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
  {/*
    Mobile:
    - Vertical flex (flex-col)
    - Centered (items-center)
    - Center text (text-center)
    
    Desktop (sm:):
    - Still vertical flex
    - Left aligned (sm:items-start)
    - Left text (sm:text-left)
  */}
</div>
```

### Button Group

```jsx
<div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
  {/*
    Mobile:
    - Vertical stack (flex-col)
    - 1rem gap (gap-4)
    
    Desktop (sm:):
    - Horizontal row (sm:flex-row)
    - Same gap maintained
  */}
</div>
```

## Testing Strategy

### Breakpoint Testing

Test at these viewport widths:
- **320px**: Small mobile
- **375px**: iPhone SE
- **640px**: Small tablet (sm breakpoint)
- **768px**: iPad (md breakpoint)
- **1024px**: Desktop (lg breakpoint)
- **1920px**: Large desktop

### Responsive Behavior Checks

- Layout transforms correctly
- No horizontal scroll
- Touch targets appropriate size (44px minimum)
- Text remains readable
- Images scale properly

## Performance Considerations

### CSS Purging

- Unused responsive classes purged in production
- Only classes actually used are included
- Minimal CSS overhead

### Media Query Efficiency

- Mobile-first means less CSS for mobile
- Progressive enhancement for larger screens
- Efficient media query grouping

## Accessibility Impact

### Touch Targets

```jsx
// Ensure minimum 44px touch target
<button className="h-12 w-full sm:w-[158px]">
  {/* 48px height exceeds 44px minimum */}
</button>
```

### Reading Comfort

- Mobile: Shorter line lengths for readability
- Desktop: Wider content area with max-width constraint
- Appropriate spacing for screen size

## Rationale

Mobile-first responsive classes provide:

1. **Better Performance**: Minimal CSS for mobile devices
2. **Progressive Enhancement**: Add features for larger screens
3. **Clear Mental Model**: Start simple, add complexity
4. **Maintainable**: Easy to understand cascade
5. **Accessible**: Ensures mobile usability first

## Related Implementations

- **[IMPL-HOME_PAGE]** - Uses responsive classes throughout
- **[IMPL-FLEX_LAYOUT]** - Responsive flexbox patterns
- **[IMPL-DARK_MODE]** - Works alongside responsive design

## Common Mistakes Avoided

### ❌ Desktop-First

```jsx
// Wrong: Subtractive approach
<div className="flex-row lg:flex-col">
```

### ✅ Mobile-First

```jsx
// Correct: Additive approach
<div className="flex-col lg:flex-row">
```

## Validation

**Token Audit** `[PROC-TOKEN_AUDIT]`:
- File: `src/app/page.tsx`
- Comments: Include `[IMPL-RESPONSIVE_CLASSES] [ARCH-RESPONSIVE_FIRST] [REQ-RESPONSIVE_DESIGN]`
- Tests: `src/test/responsive.test.tsx`

**Last Updated**: 2026-02-06
