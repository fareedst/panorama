# Architecture Decision: CSS Variables for Font Assignment

**Token**: [ARCH-CSS_VARIABLES_FONTS]  
**Status**: ✅ Implemented  
**Last Updated**: 2026-02-06

## Context and Problem Statement

The application requires a flexible way to apply custom fonts (Geist Sans and Geist Mono) throughout the application, enabling both direct application via classes and theme-level assignment through Tailwind CSS configuration.

## Decision Drivers

- **Flexibility**: Apply fonts via classes or CSS
- **Tailwind Integration**: Use fonts in Tailwind utilities
- **Consistency**: Single source of truth for font families
- **Maintainability**: Easy to change fonts globally
- **Performance**: No JavaScript runtime cost
- **Type Safety**: Ensure font variables are defined
- **Developer Experience**: Clear API for using fonts

## Considered Options

1. **CSS Variables** - Use CSS custom properties for font families
2. **Direct Classes** - Apply font className directly
3. **Tailwind Config** - Hard-code fonts in Tailwind config
4. **CSS-in-JS** - JavaScript-based font injection

## Decision Outcome

**Chosen option**: "CSS Variables for Font Families"

### Rationale

CSS variables for fonts provide:
- **Flexibility**: Apply fonts via class or CSS
- **Tailwind Integration**: Variables work with Tailwind theme
- **Single Source**: One place to define fonts
- **Global Access**: Available throughout CSS
- **No Runtime**: Pure CSS solution
- **Easy Updates**: Change font by updating variable
- **Fallbacks**: Can provide font stack fallbacks

### Implementation Pattern

1. **next/font creates variables**: `--font-geist-sans`, `--font-geist-mono`
2. **Apply to body**: Variables applied via className
3. **Tailwind theme**: Variables mapped to Tailwind utilities
4. **Usage**: Use via Tailwind classes or CSS

### Positive Consequences

- Fonts accessible throughout application
- Can change fonts by updating variable value
- Works with Tailwind's font utilities
- No JavaScript required
- Clear separation of font definition and usage
- Can provide font stack fallbacks
- Type-safe through Tailwind IntelliSense

### Negative Consequences

- Requires understanding of CSS variables
- Need to maintain Tailwind theme configuration
- Variables must be defined before use
- No compile-time validation of variable names

## Requirements Fulfilled

- **[REQ-FONT_SYSTEM]** - CSS variables enable flexible font application
- **[REQ-TAILWIND_STYLING]** - Variables integrate with Tailwind
- **[REQ-GLOBAL_STYLES]** - Font variables defined globally

## Implementation Notes

### Variable Definition

**src/app/layout.tsx**:
```typescript
const geistSans = Geist({
  variable: "--font-geist-sans", // Creates CSS variable
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono", // Creates CSS variable
  subsets: ["latin"],
});

// Apply to body
<body className={`${geistSans.variable} ${geistMono.variable}`}>
```

### Tailwind Theme Integration

**src/app/globals.css**:
```css
@theme inline {
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

This makes fonts available as Tailwind utilities:
- `font-sans` uses Geist Sans
- `font-mono` uses Geist Mono

### Usage Examples

**Via Tailwind Classes**:
```jsx
<p className="font-sans">Body text in Geist Sans</p>
<code className="font-mono">Code in Geist Mono</code>
```

**Via CSS**:
```css
.custom-class {
  font-family: var(--font-geist-sans);
}
```

**With Fallbacks**:
```css
@theme inline {
  --font-sans: var(--font-geist-sans), system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), monospace;
}
```

## Related Decisions

- **[ARCH-GOOGLE_FONTS]** - Fonts loaded via next/font create variables
- **[ARCH-TAILWIND_V4]** - Tailwind accesses font variables via theme
- **[ARCH-LAYOUT_PATTERN]** - Variables applied in root layout
- **[ARCH-CSS_VARIABLES]** - Same pattern used for color theming

## References

- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [Tailwind CSS Fonts](https://tailwindcss.com/docs/font-family)
- [Next.js Font Variables](https://nextjs.org/docs/app/api-reference/components/font#variable)

## Implementation Tokens

- **[IMPL-FONT_LOADING]** - Font variable creation and application
