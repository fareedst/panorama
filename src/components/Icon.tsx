// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [ARCH-TOOLBAR_ACTIONS] [REQ-TOOLBAR_SYSTEM]: Top-level Toolbar React Component Implementation
// Unified SVG icon system supporting all file manager toolbar actions

import React from "react";
import { getIconPaths } from "./icons/registry";

export interface IconProps {
  name: string;
  size?: number;
  className?: string;
}

/**
 * Icon component - renders SVG icons for toolbar buttons
 * [IMPL-TOOLBAR_COMPONENT] [REQ-TOOLBAR_SYSTEM] [ARCH-TOOLBAR_ACTIONS]
 */
export function Icon({ name, size = 20, className = "" }: IconProps) {
  const iconPaths = getIconPaths(name);

  if (!iconPaths) {
    // [ICON_REGISTRY] [IMPL-TOOLBAR_COMPONENT] [REQ-TOOLBAR_SYSTEM]: warn in dev and render icon-unknown fallback
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[REQ-TOOLBAR_SYSTEM] Icon not registered: "${name}". Add to src/components/icons/`,
      );
    }
    const unknown = getIconPaths("icon-unknown");
    if (unknown) {
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
          data-icon-fallback="icon-unknown"
        >
          {unknown}
        </svg>
      );
    }
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <circle cx="12" cy="17" r="0.5" />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {iconPaths}
    </svg>
  );
}
