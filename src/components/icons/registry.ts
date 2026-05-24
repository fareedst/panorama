// [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_ACTIONS] [REQ-TOOLBAR_SYSTEM]: Merged icon registry for toolbar Icon component
import type { ReactNode } from "react";
import { LUCIDE_ICONS } from "./lucide-icons";
import { PANORAMA_ICONS } from "./panorama-icons";

// [ICON_REGISTRY] [IMPL-TOOLBAR_COMPONENT] [ARCH-TOOLBAR_ACTIONS] [REQ-TOOLBAR_SYSTEM]: merge lucide + panorama SVG definitions
export const ICON_REGISTRY: Record<string, ReactNode> = {
  ...LUCIDE_ICONS,
  ...PANORAMA_ICONS,
};

export const REGISTERED_ICON_NAMES = Object.freeze(
  Object.keys(ICON_REGISTRY).sort(),
) as readonly string[];

/** [ARCH-TOOLBAR_ACTIONS] Resolve SVG children for a registered icon name */
export function getIconPaths(name: string): ReactNode | null {
  return ICON_REGISTRY[name] ?? null;
}

/** [ARCH-TOOLBAR_ACTIONS] Whether the icon name has a registry entry */
export function isIconRegistered(name: string): boolean {
  return name in ICON_REGISTRY;
}
