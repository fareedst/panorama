// [IMPL-EXTERNAL_LINKS] [REQ-NAVIGATION_LINKS] [REQ-WORKSPACE_MESH_BRIDGE]: Secure cross-surface links that open in a new tab with assistive disclosure

import Link from "next/link";
import type { ReactNode } from "react";

export interface NewTabLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  "data-testid"?: string;
  /** Overrides default aria-label derived from string children */
  ariaLabel?: string;
}

function visibleTextLabel(children: ReactNode): string | undefined {
  return typeof children === "string" ? children.trim() : undefined;
}

export function NewTabLink({
  href,
  children,
  className,
  "data-testid": testId,
  ariaLabel,
}: NewTabLinkProps) {
  const visibleLabel = visibleTextLabel(children);
  const resolvedAriaLabel =
    ariaLabel ??
    (visibleLabel ? `${visibleLabel} (opens in new tab)` : undefined);

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      prefetch={false}
      className={className}
      data-testid={testId}
      aria-label={resolvedAriaLabel}
    >
      {children}
      <span className="sr-only"> (opens in new tab)</span>
    </Link>
  );
}
