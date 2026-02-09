// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_LAYOUT] [REQ-TOOLBAR_SYSTEM]
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
