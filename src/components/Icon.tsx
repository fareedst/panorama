// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_ACTIONS] Icon component for toolbar buttons
// Unified SVG icon system supporting all file manager toolbar actions

import React from "react";

export interface IconProps {
  name: string;
  size?: number;
  className?: string;
}

/**
 * Icon component - renders SVG icons for toolbar buttons
 * Uses Lucide React style icon definitions
 * [IMPL-TOOLBAR_COMPONENT] [REQ-TOOLBAR_SYSTEM]
 */
export function Icon({ name, size = 20, className = "" }: IconProps) {
  const iconPaths = getIconPath(name);
  
  if (!iconPaths) {
    // Fallback: question mark icon for unknown icons
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

/**
 * Get SVG path elements for icon name
 * Icon definitions based on Lucide icons (MIT licensed)
 */
function getIconPath(name: string): React.ReactNode | null {
  const icons: Record<string, React.ReactNode> = {
    // File operations
    'copy': <><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></>,
    'move': <><path d="m5 9-3 3 3 3M9 5l3-3 3 3" /><path d="M15 19l-3 3-3-3M19 9l3 3-3 3" /><path d="M2 12h20M12 2v20" /></>,
    'trash': <><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></>,
    'delete': <><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></>,
    'edit': <><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /><path d="m15 5 4 4" /></>,
    'rename': <><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /><path d="m15 5 4 4" /></>,
    
    // Navigation arrows
    'arrow-up': <><path d="m18 15-6-6-6 6" /></>,
    'arrow-down': <><path d="m6 9 6 6 6-6" /></>,
    'arrow-left': <><path d="m15 18-6-6 6-6" /></>,
    'arrow-right': <><path d="m9 18 6-6-6-6" /></>,
    'chevrons-up': <><path d="m17 11-5-5-5 5M17 18l-5-5-5 5" /></>,
    'chevrons-down': <><path d="m7 13 5 5 5-5M7 6l5 5 5-5" /></>,
    
    // Core navigation
    'home': <><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>,
    'folder': <><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" /></>,
    'folder-open': <><path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2" /></>,
    
    // Marking
    'checkbox': <><rect width="18" height="18" x="3" y="3" rx="2" /><path d="m9 12 2 2 4-4" /></>,
    'checkbox-multiple': <><path d="M8 7V3m8 4V3m-4 4V3M3 11h18M3 19h18M3 7h18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" /></>,
    'checkbox-invert': <><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M3 12h18" /></>,
    'x-circle': <><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6M9 9l6 6" /></>,
    
    // View & Sort
    'sort': <><path d="m3 16 4 4 4-4M7 20V4M21 8l-4-4-4 4M17 4v16" /></>,
    'compare': <><circle cx="18" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><path d="M13 6h3a2 2 0 0 1 2 2v7M11 18H8a2 2 0 0 1-2-2V9" /></>,
    'eye': <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>,
    'link': <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></>,
    
    // Preview & Info
    'info': <><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></>,
    'file-text': <><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8" /></>,
    'preview': <><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /></>,
    
    // System
    'help-circle': <><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" /></>,
    'command': <><path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" /></>,
    'search': <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>,
    'file-search': <><path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v3" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><circle cx="5" cy="14" r="3" /><path d="m9 18-1.5-1.5" /></>,
    
    // Pane management
    'plus': <><path d="M5 12h14M12 5v14" /></>,
    'minus': <><path d="M5 12h14" /></>,
    'refresh-cw': <><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" /></>,
    'refresh-ccw': <><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></>,
    'refresh': <><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></>,
    'refresh-all': <><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5M12 8v8M8 12h8" /></>,
    
    // Bookmarks & History
    'bookmark': <><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" /></>,
    'bookmark-plus': <><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16zM12 7v6M9 10h6" /></>,
    'bookmark-list': <><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z" /><path d="M9 10h6M9 14h4" /></>,
    'undo': <><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" /></>,
    'redo': <><path d="M21 7v6h-6" /><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" /></>,
  };

  return icons[name] || null;
}
