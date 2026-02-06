# Architecture Decision: Tailwind CSS v4 Styling System

**Token**: [ARCH-TAILWIND_V4]  
**Status**: ✅ Implemented  
**Last Updated**: 2026-02-06

## Context and Problem Statement

The application requires a styling system that enables rapid UI development, maintains consistency, minimizes CSS bundle size, and integrates well with Next.js. The system must support responsive design, dark mode, and custom theming.

## Decision Drivers

- **Development Speed**: Need rapid UI prototyping and iteration
- **Consistency**: Want consistent spacing, colors, and typography
- **Bundle Size**: Require minimal CSS in production builds
- **Dark Mode**: Must support dark mode with minimal complexity
- **Responsive Design**: Need mobile-first responsive utilities
- **Maintainability**: Want to avoid CSS naming conflicts and specificity issues
- **TypeScript Integration**: Prefer type-safe styling where possible

## Considered Options

1. **Tailwind CSS v4** - Latest utility-first CSS framework
2. **CSS Modules** - Component-scoped CSS files
3. **Styled Components** - CSS-in-JS with tagged templates
4. **Emotion** - CSS-in-JS library
5. **Vanilla Extract** - Zero-runtime CSS-in-TypeScript

## Decision Outcome

**Chosen option**: "Tailwind CSS v4 with PostCSS"

### Rationale

Tailwind CSS v4 provides:
- **Utility-First**: Compose styles directly in JSX without naming overhead
- **Performance**: Production CSS purged to only used classes
- **Consistency**: Design tokens ensure consistent spacing/colors/fonts
- **Dark Mode**: Built-in `dark:` variants for dark mode styling
- **Responsive**: Mobile-first breakpoints (sm:, md:, lg:, xl:)
- **Customization**: `@theme` directive for custom design tokens
- **No Runtime**: Zero JavaScript runtime cost (pure CSS)
- **Modern Features**: CSS v4 uses modern CSS features

### Positive Consequences

- Extremely fast UI development with utility classes
- Consistent design system through design tokens
- Small production CSS bundles (only used classes)
- No CSS naming conflicts or specificity issues
- Dark mode implementation is straightforward
- Responsive design with mobile-first utilities
- No JavaScript runtime overhead
- Excellent IntelliSense support in IDEs

### Negative Consequences

- Verbose className strings in JSX
- Learning curve for utility-first approach
- Potential for repetition without component abstraction
- Custom styles require @theme or arbitrary values
- May be harder to share styles between projects without Tailwind

## Requirements Fulfilled

- **[REQ-TAILWIND_STYLING]** - Tailwind CSS v4 as primary styling system
- **[REQ-DARK_MODE]** - Dark mode support via `dark:` variants
- **[REQ-RESPONSIVE_DESIGN]** - Mobile-first responsive utilities
- **[REQ-GLOBAL_STYLES]** - Integrates with global CSS and CSS variables

## Implementation Notes

- Version: Tailwind CSS v4 (latest)
- PostCSS Plugin: @tailwindcss/postcss v4
- Configuration: Uses `@theme` directive in globals.css
- Dark Mode: Class-based (automatic via prefers-color-scheme)
- Custom Tokens: Background, foreground, font variables defined

### Configuration

**postcss.config.mjs**:
```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

**globals.css**:
```css
@import "tailwindcss";

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

## Related Decisions

- **[ARCH-CSS_VARIABLES]** - CSS variables for theming integrate with Tailwind
- **[ARCH-RESPONSIVE_FIRST]** - Mobile-first approach aligns with Tailwind's design
- **[ARCH-NEXTJS_FRAMEWORK]** - Tailwind integrates seamlessly with Next.js

## References

- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [Tailwind CSS Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [Tailwind CSS with Next.js](https://tailwindcss.com/docs/guides/nextjs)

## Implementation Tokens

- **[IMPL-FLEX_LAYOUT]** - Flexbox layouts using Tailwind utilities
- **[IMPL-RESPONSIVE_CLASSES]** - Responsive breakpoint utilities
- **[IMPL-DARK_MODE]** - Dark mode variants using `dark:` prefix
