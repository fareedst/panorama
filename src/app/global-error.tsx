// [IMPL-GLOBAL_ERROR_BOUNDARY] [ARCH-NEXTJS_FRAMEWORK] [REQ-ERROR_HANDLING]
// Global error boundary component that catches errors at the root layout level.
// This component renders a full HTML document (including <html> and <body>) to
// replace the root layout when an unexpected error occurs in production.
// Must be a client component to use the reset() function and interactive UI.

"use client";

// [IMPL-GLOBAL_ERROR_BOUNDARY] [ARCH-NEXTJS_FRAMEWORK] [REQ-ERROR_HANDLING]
// Global error boundary props interface following Next.js convention.
// error: The caught error object with optional digest for server-side log matching
// reset: Function to attempt recovery by re-rendering the error boundary
interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// [IMPL-GLOBAL_ERROR_BOUNDARY] [ARCH-NEXTJS_FRAMEWORK] [REQ-ERROR_HANDLING]
// Root-level error boundary component. Renders its own <html> and <body> tags
// because it replaces the entire root layout when activated. Provides a
// user-friendly error message and a "Try again" button that calls reset().
// Only functions in production; development shows the Next.js error overlay.
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Something went wrong</title>
        {/* [IMPL-GLOBAL_ERROR_BOUNDARY] Basic inline styles to ensure the error
            page is presentable even if global CSS or config-driven styles fail
            to load. Uses minimal, self-contained styling. */}
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          html, body {
            height: 100%;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            background: #000;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
          }
          .container {
            max-width: 600px;
            text-align: center;
          }
          h1 {
            font-size: 2rem;
            margin-bottom: 1rem;
            font-weight: 600;
          }
          p {
            font-size: 1rem;
            margin-bottom: 2rem;
            color: #999;
            line-height: 1.6;
          }
          button {
            background: #fff;
            color: #000;
            border: none;
            padding: 0.75rem 2rem;
            font-size: 1rem;
            font-weight: 500;
            border-radius: 0.5rem;
            cursor: pointer;
            transition: opacity 0.2s;
          }
          button:hover {
            opacity: 0.8;
          }
          .error-details {
            margin-top: 2rem;
            padding: 1rem;
            background: #111;
            border-radius: 0.5rem;
            border: 1px solid #333;
          }
          .error-details summary {
            cursor: pointer;
            font-weight: 500;
            margin-bottom: 0.5rem;
          }
          .error-details pre {
            text-align: left;
            font-size: 0.875rem;
            color: #999;
            overflow-x: auto;
            white-space: pre-wrap;
            word-wrap: break-word;
          }
          a {
            color: #0070f3;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
        `}</style>
      </head>
      <body>
        {/* [IMPL-GLOBAL_ERROR_BOUNDARY] [REQ-ERROR_HANDLING] [REQ-ACCESSIBILITY]
            Error UI container with semantic HTML, helpful message, and recovery option */}
        <div className="container">
          <h1>Something went wrong</h1>
          <p>
            An unexpected error occurred. You can try again, or return to the{" "}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/">home page</a>.
          </p>
          
          {/* [IMPL-GLOBAL_ERROR_BOUNDARY] [REQ-ERROR_HANDLING]
              Reset button calls the Next.js reset() function to attempt recovery
              by re-rendering the error boundary's contents */}
          <button onClick={reset}>Try again</button>

          {/* [IMPL-GLOBAL_ERROR_BOUNDARY] [REQ-ERROR_HANDLING]
              Display error details in a collapsible section for debugging.
              Shows error message and digest (if present) for server-side log matching */}
          <details className="error-details">
            <summary>Error details</summary>
            <pre>
              {error.message || "An unknown error occurred"}
              {error.digest && `\n\nError digest: ${error.digest}`}
            </pre>
          </details>
        </div>
      </body>
    </html>
  );
}
