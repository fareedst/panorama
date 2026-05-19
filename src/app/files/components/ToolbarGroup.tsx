// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [ARCH-TOOLBAR_ACTIONS] [REQ-TOOLBAR_SYSTEM]: Top-level Toolbar React Component Implementation: React components for toolbar system including base and specialized toolbars with compact icon-only button design
// ToolbarGroup component - groups related toolbar buttons with visual separator

"use client";

export interface ToolbarGroupProps {
  name: string;
  children: React.ReactNode;
  showSeparator?: boolean;
  className?: string;
}

/**
 * ToolbarGroup - container for related toolbar buttons
 * Renders visual separator and provides semantic grouping
 * [IMPL-TOOLBAR_COMPONENT] [REQ-TOOLBAR_SYSTEM]
 */
export function ToolbarGroup({
  name,
  children,
  showSeparator = false,
  className = "",
}: ToolbarGroupProps) {
  return (
    <>
      {showSeparator && (
        <div
          className="h-8 w-px bg-gray-300 dark:bg-gray-700"
          role="separator"
          aria-orientation="vertical"
        />
      )}
      <div
        className={`flex items-center gap-0.5 ${className}`.trim()}
        role="group"
        aria-label={name}
      >
        {children}
      </div>
    </>
  );
}
