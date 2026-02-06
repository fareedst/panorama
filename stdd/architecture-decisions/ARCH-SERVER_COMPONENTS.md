# Architecture Decision: Server Components as Default

**Token**: [ARCH-SERVER_COMPONENTS]  
**Status**: ✅ Implemented  
**Last Updated**: 2026-02-06

## Context and Problem Statement

The application requires a rendering strategy that provides excellent performance, reduces JavaScript bundle size, enables direct data fetching, and improves SEO. The strategy must work with Next.js App Router and React 19 features.

## Decision Drivers

- **Performance**: Reduce client-side JavaScript
- **SEO**: Need server-side rendering for search engines
- **Data Fetching**: Want direct database/API access
- **Bundle Size**: Minimize client JavaScript bundle
- **Security**: Keep sensitive logic on server
- **User Experience**: Fast initial page loads
- **Developer Experience**: Simplified data fetching

## Considered Options

1. **Server Components Default** - Components render on server unless marked "use client"
2. **Client Components Default** - Traditional React approach
3. **Static Generation** - Build-time rendering only
4. **Server-Side Rendering (SSR)** - Dynamic server rendering with Pages Router

## Decision Outcome

**Chosen option**: "Server Components as Default"

### Rationale

Server Components provide:
- **Zero Client JS**: Server components don't ship to client
- **Direct Data Access**: Can query databases directly
- **Better Performance**: Smaller JavaScript bundles
- **Improved SEO**: Content rendered on server
- **Security**: Sensitive logic stays on server
- **Streaming**: Progressive rendering with Suspense
- **Automatic Code Splitting**: Per-component splitting

### Server vs Client Component Guidelines

**Use Server Components (default) for**:
- Data fetching (API calls, database queries)
- Backend resource access
- Sensitive information handling
- Large dependencies (keep on server)
- Static content rendering

**Use Client Components ("use client") for**:
- Event handlers (onClick, onChange, etc.)
- React hooks (useState, useEffect, etc.)
- Browser APIs (localStorage, window, etc.)
- Interactive elements
- Real-time features

### Positive Consequences

- Dramatically smaller JavaScript bundles
- Faster initial page loads
- Better SEO with server-rendered content
- Direct backend access without API routes
- Sensitive code stays on server
- Automatic code splitting
- Can mix server and client components

### Negative Consequences

- Need to understand server vs client boundary
- Must mark interactive components with "use client"
- Some React features only work in client components
- Debugging can be more complex (server + client)
- Third-party libraries may not support server components yet

## Requirements Fulfilled

- **[REQ-APP_STRUCTURE]** - Server Components are core to App Router
- **[REQ-HOME_PAGE]** - Home page uses server components
- **[REQ-ROOT_LAYOUT]** - Layout is a server component
- **[REQ-ACCESSIBILITY]** - Server-rendered HTML improves accessibility

## Implementation Notes

### Server Component (Default)

```typescript
// src/app/page.tsx
// No "use client" directive - this is a server component
export default function Page() {
  // Can fetch data directly here
  return <div>Server-rendered content</div>;
}
```

### Client Component (Explicit)

```typescript
// src/components/Counter.tsx
"use client"; // Mark as client component

import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

### Mixing Server and Client

```typescript
// Server component can import client components
import { Counter } from "@/components/Counter";

export default function Page() {
  // Server-side logic
  return (
    <div>
      <h1>Server Content</h1>
      <Counter /> {/* Client component for interactivity */}
    </div>
  );
}
```

### Component Boundaries

- Server components can import client components
- Client components CANNOT import server components directly
- Pass server components to client components as children/props

## Related Decisions

- **[ARCH-REACT_VERSION]** - React 19 supports Server Components
- **[ARCH-APP_ROUTER]** - App Router enables Server Components
- **[ARCH-NEXTJS_FRAMEWORK]** - Next.js implements Server Components

## References

- [React Server Components](https://react.dev/reference/rsc/server-components)
- [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [When to use Server vs Client Components](https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns)

## Implementation Tokens

- **[IMPL-ROOT_LAYOUT]** - Layout as server component
- **[IMPL-HOME_PAGE]** - Home page as server component
