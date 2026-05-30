# IMPL-EXTERNAL_LINKS essence pseudocode

## NEW_TAB_LINK_RENDER
# [IMPL-EXTERNAL_LINKS] [ARCH-APP_ROUTER] [REQ-NAVIGATION_LINKS] [REQ-WORKSPACE_MESH_BRIDGE]
# how: Reusable Next.js Link opens target in new tab with rel noopener noreferrer, prefetch off, and screen-reader disclosure.

```
NEW_TAB_LINK_RENDER(href, children, className, ariaLabel?):
  INPUT: href string, children ReactNode, optional className, optional ariaLabel override
  OUTPUT: rendered anchor with security and a11y attributes
  visibleLabel := TRIM(children) WHEN children is plain string ELSE undefined
  resolvedAriaLabel := ariaLabel OR (visibleLabel + " (opens in new tab)" when visibleLabel set)
  RENDER Link with href, target="_blank", rel="noopener noreferrer", prefetch=false
  RENDER children plus sr-only span " (opens in new tab)"
  SET aria-label := resolvedAriaLabel when defined
```

## EXPLICIT_ARIA_LABEL_OVERRIDE
# [IMPL-EXTERNAL_LINKS] [ARCH-APP_ROUTER] [REQ-NAVIGATION_LINKS] [REQ-WORKSPACE_MESH_BRIDGE]
# how: When children are not plain text, caller supplies ariaLabel for accessible new-tab disclosure.

```
EXPLICIT_ARIA_LABEL_OVERRIDE(href, ariaLabel, children):
  INPUT: non-string children (e.g. nested span)
  OUTPUT: link with aria-label exactly as provided (includes "(opens in new tab)" in label text)
  SKIP auto-derived label from visible text
  RENDER same security attributes as NEW_TAB_LINK_RENDER
```

## CROSS_SURFACE_USAGE
# [IMPL-EXTERNAL_LINKS] [ARCH-APP_ROUTER] [REQ-NAVIGATION_LINKS] [REQ-WORKSPACE_MESH_BRIDGE]
# how: WorkspaceView and MeshDetailClient use NewTabLink for Mesh ↔ File Manager navigation in a new tab.

```
CROSS_SURFACE_USAGE():
  DATA: href examples /files?meshId=… from mesh detail, /mesh from file manager toolbar
  OUTPUT: consistent new-tab behavior across internal cross-surface routes (not only external URLs)
```
