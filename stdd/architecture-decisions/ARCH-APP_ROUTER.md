# Architecture Decision: Next.js App Router Pattern

**Token**: [ARCH-APP_ROUTER]  
**Status**: ✅ Implemented  
**Last Updated**: 2026-02-06

## Context and Problem Statement

The application requires a routing system that enables file-based routing, supports server and client components, enables layouts and nested routing, and provides excellent developer experience. The system must integrate with Next.js and support modern React patterns.

## Decision Drivers

- **File-Based Routing**: Want automatic routing based on file structure
- **Nested Layouts**: Need shared layouts across route groups
- **Server Components**: Require server-side rendering by default
- **Data Fetching**: Want simplified data fetching patterns
- **Type Safety**: Need type-safe routing where possible
- **Performance**: Require automatic code splitting per route
- **Developer Experience**: Want intuitive routing conventions

## Considered Options

1. **Next.js App Router** - Modern routing with Server Components
2. **Next.js Pages Router** - Traditional Next.js routing
3. **React Router** - Client-side routing library
4. **TanStack Router** - Type-safe routing library

## Decision Outcome

**Chosen option**: "Next.js App Router"

### Rationale

App Router provides:
- **File-Based Routing**: Folders in `app/` directory create routes
- **Layouts**: `layout.tsx` files create shared UI across routes
- **Server Components**: Components are server-rendered by default
- **Streaming**: Supports React Suspense for progressive rendering
- **Nested Routes**: Folder hierarchy creates nested route structure
- **Route Groups**: Organize routes without affecting URL structure
- **Parallel Routes**: Multiple pages rendered simultaneously
- **Intercepting Routes**: Override routes for modals/overlays

### Positive Consequences

- Intuitive file-based routing (folder = route)
- Automatic code splitting per route segment
- Server Components by default for better performance
- Layouts enable shared UI without prop drilling
- Built-in loading and error states
- Simplified data fetching with async components
- Type-safe route parameters with TypeScript
- Future-proof architecture (Next.js direction)

### Negative Consequences

- Learning curve compared to Pages Router
- Client-side features require "use client" directive
- Some React features (hooks, events) only work in Client Components
- Migration from Pages Router requires refactoring
- Less mature ecosystem than Pages Router (but growing rapidly)

## Requirements Fulfilled

- **[REQ-APP_STRUCTURE]** - App Router provides the application structure
- **[REQ-ROOT_LAYOUT]** - Root layout pattern from App Router
- **[REQ-HOME_PAGE]** - Home page as `app/page.tsx`
- **[REQ-NAVIGATION_LINKS]** - Standard anchor tags work for navigation

## Implementation Notes

### Directory Structure

```
src/app/
├── layout.tsx       # Root layout (wraps all pages)
├── page.tsx         # Home page (/)
├── globals.css      # Global styles
└── favicon.ico      # Favicon
```

### Key Concepts

1. **Layouts**: `layout.tsx` files wrap child routes with shared UI
2. **Pages**: `page.tsx` files define the UI for a route
3. **Server Components**: Default rendering mode (no "use client")
4. **Client Components**: Use "use client" for interactivity
5. **Route Parameters**: `[param]` folder names create dynamic routes

### Server vs Client Components

- **Server Components** (default): Data fetching, secure operations, no interactivity
- **Client Components** ("use client"): Event handlers, hooks, browser APIs

## Related Decisions

- **[ARCH-NEXTJS_FRAMEWORK]** - App Router is part of Next.js framework
- **[ARCH-SERVER_COMPONENTS]** - Server Components enabled by App Router
- **[ARCH-LAYOUT_PATTERN]** - Layout pattern provided by App Router
- **[ARCH-REACT_VERSION]** - React 19 supports Server Components

## References

- [App Router Documentation](https://nextjs.org/docs/app)
- [Routing Fundamentals](https://nextjs.org/docs/app/building-your-application/routing)
- [Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)

## Implementation Tokens

- **[IMPL-ROOT_LAYOUT]** - Root layout using App Router pattern
- **[IMPL-HOME_PAGE]** - Home page as App Router page component
- **[IMPL-EXTERNAL_LINKS]** - External links using standard anchors
