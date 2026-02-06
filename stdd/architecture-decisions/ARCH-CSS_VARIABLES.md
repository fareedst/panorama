# Architecture Decision: CSS Variables for Dark Mode Theming

**Token**: [ARCH-CSS_VARIABLES]  
**Status**: ✅ Implemented  
**Last Updated**: 2026-02-06

## Context and Problem Statement

The application requires a theming system that supports light and dark modes, enables runtime theme switching if needed in the future, maintains consistency across components, and integrates with Tailwind CSS. The system must respond to system color scheme preferences automatically.

## Decision Drivers

- **Dark Mode**: Need automatic light/dark mode switching
- **Consistency**: Want consistent colors across all components
- **System Preference**: Must respect user's system color scheme
- **Flexibility**: Should enable future theme customization
- **Integration**: Must work with Tailwind CSS utilities
- **Performance**: No JavaScript runtime cost for theme switching
- **Maintainability**: Single source of truth for theme colors

## Considered Options

1. **CSS Custom Properties (Variables)** - Native CSS variables with media queries
2. **Tailwind Dark Mode Classes** - Utility classes only
3. **Theme Context** - React context with JavaScript theme switching
4. **CSS-in-JS Theming** - Runtime theming with styled-components
5. **Separate Stylesheets** - Load different CSS for light/dark

## Decision Outcome

**Chosen option**: "CSS Custom Properties with prefers-color-scheme"

### Rationale

CSS variables provide:
- **Native Support**: No library dependencies
- **Automatic Switching**: Media query respects system preference
- **Runtime Updates**: Variables can change without page reload
- **Tailwind Integration**: Variables work with Tailwind's theme
- **No JavaScript**: Pure CSS solution (zero runtime cost)
- **Flexibility**: Easy to add more themes in future
- **Single Source**: Define colors once, use everywhere

### Positive Consequences

- Automatic dark mode based on system preference
- Zero JavaScript runtime cost
- Smooth theme transitions possible with CSS
- Easy to extend with more theme colors
- Works seamlessly with Tailwind utilities
- Single source of truth for theme colors
- Future-proof for theme customization

### Negative Consequences

- Requires understanding of CSS custom properties
- Need to maintain light and dark color values
- Manual management of color relationships (contrast, etc.)
- No TypeScript types for color names (unless generated)

## Requirements Fulfilled

- **[REQ-DARK_MODE]** - Dark mode with automatic theme detection
- **[REQ-GLOBAL_STYLES]** - CSS variables defined in global styles
- **[REQ-TAILWIND_STYLING]** - Integrates with Tailwind's theme system

## Implementation Notes

### CSS Variables Definition

**globals.css**:
```css
:root {
  --background: #ffffff;
  --foreground: #171717;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

body {
  background: var(--background);
  color: var(--foreground);
}
```

### Tailwind Integration

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
}
```

This makes variables available as Tailwind utilities:
- `bg-background` uses `--color-background`
- `text-foreground` uses `--color-foreground`

### Usage Patterns

1. **Direct CSS Variables**: `background: var(--background);`
2. **Tailwind Utilities**: `className="bg-background text-foreground"`
3. **Dark Mode Classes**: `className="dark:bg-black"` (Tailwind's built-in)

## Related Decisions

- **[ARCH-TAILWIND_V4]** - Tailwind integrates with CSS variables
- **[ARCH-GLOBAL_STYLES]** - Variables defined in global stylesheet
- **[ARCH-RESPONSIVE_FIRST]** - Works alongside responsive design

## References

- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [prefers-color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme)
- [Tailwind CSS Theming](https://tailwindcss.com/docs/theme)

## Implementation Tokens

- **[IMPL-DARK_MODE]** - Dark mode implementation using CSS variables
- **[IMPL-FLEX_LAYOUT]** - Layout components use theme variables
