# Architecture Decision: Next.js Font Optimization with Google Fonts

**Token**: [ARCH-GOOGLE_FONTS]  
**Status**: ✅ Implemented  
**Last Updated**: 2026-02-06

## Context and Problem Statement

The application requires custom fonts (Geist Sans and Geist Mono) that load quickly, don't cause layout shift, and work across all browsers. The font loading solution must integrate with Next.js and provide optimal performance.

## Decision Drivers

- **Performance**: Fast font loading without blocking render
- **Layout Stability**: No Cumulative Layout Shift (CLS)
- **Optimization**: Automatic subsetting and preloading
- **Developer Experience**: Simple API for font configuration
- **Type Safety**: TypeScript support for font configuration
- **Self-Hosting**: Fonts served from app domain (privacy, performance)
- **Next.js Integration**: Use Next.js built-in optimizations

## Considered Options

1. **next/font/google** - Next.js Google Fonts optimization
2. **Google Fonts CDN** - Direct link to fonts.googleapis.com
3. **Self-Hosted Fonts** - Manual font files in public directory
4. **@fontsource Packages** - NPM packages for self-hosted fonts
5. **System Fonts Only** - Use system font stack

## Decision Outcome

**Chosen option**: "next/font/google with automatic optimization"

### Rationale

next/font/google provides:
- **Automatic Optimization**: Fonts downloaded at build time
- **Self-Hosting**: Fonts served from app domain (no external requests)
- **Zero Layout Shift**: Font metrics calculated to prevent CLS
- **Preloading**: Critical fonts preloaded automatically
- **Subsetting**: Only includes used character sets
- **CSS Variables**: Automatic CSS variable generation
- **Type Safety**: TypeScript definitions included
- **Caching**: Fonts cached efficiently

### How It Works

1. **Build Time**: Next.js downloads fonts during build
2. **Self-Hosting**: Fonts included in application bundle
3. **CSS Generation**: Automatic @font-face CSS
4. **Variables**: Creates CSS variables for font families
5. **Preload**: Adds `<link rel="preload">` tags
6. **No Layout Shift**: Size-adjust CSS prevents CLS

### Positive Consequences

- Zero layout shift from fonts (perfect Lighthouse score)
- No external font requests (privacy and performance)
- Automatic font subsetting (smaller file sizes)
- Type-safe font configuration
- Simple API (import and use)
- Fonts load in parallel with other resources
- CSS variables enable flexible usage

### Negative Consequences

- Fonts included in build (larger build size)
- Need rebuild to change fonts
- Limited to fonts available on Google Fonts
- Build time slightly increased

## Requirements Fulfilled

- **[REQ-FONT_SYSTEM]** - Custom font loading with optimization
- **[REQ-ROOT_LAYOUT]** - Fonts configured in root layout
- **[REQ-GLOBAL_STYLES]** - Font variables accessible globally

## Implementation Notes

### Font Configuration

**src/app/layout.tsx**:
```typescript
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
```

### CSS Variable Usage

The configuration creates CSS variables:
- `--font-geist-sans`: Variable for sans-serif font
- `--font-geist-mono`: Variable for monospace font

These can be used in CSS or Tailwind:
```css
@theme inline {
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

### Font Object Properties

- `variable`: CSS variable name
- `className`: Class to apply font directly
- `style`: Inline style object
- `subsets`: Character sets to include

## Related Decisions

- **[ARCH-LAYOUT_PATTERN]** - Fonts loaded in root layout
- **[ARCH-CSS_VARIABLES_FONTS]** - CSS variables for font application
- **[ARCH-NEXTJS_FRAMEWORK]** - next/font is a Next.js feature

## References

- [Next.js Font Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)
- [next/font/google API](https://nextjs.org/docs/app/api-reference/components/font)
- [Web Font Best Practices](https://web.dev/font-best-practices/)

## Implementation Tokens

- **[IMPL-FONT_LOADING]** - Font configuration and loading implementation
