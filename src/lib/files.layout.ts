// [IMPL-LAYOUT_CALCULATOR] [ARCH-LAYOUT_ALGORITHMS] [REQ-MULTI_PANE_LAYOUT]
// Multi-pane layout calculation algorithms ported from Goful

/**
 * Layout types supported
 * [IMPL-LAYOUT_CALCULATOR] [ARCH-LAYOUT_ALGORITHMS] [REQ-MULTI_PANE_LAYOUT]
 */
export type LayoutType = "Tile" | "OneRow" | "OneColumn" | "Fullscreen";

/**
 * Pane bounds in pixels
 * [IMPL-LAYOUT_CALCULATOR] [ARCH-LAYOUT_ALGORITHMS] [REQ-MULTI_PANE_LAYOUT]
 */
export interface PaneBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Calculate pane bounds for a given layout type
 * [IMPL-LAYOUT_CALCULATOR] [ARCH-LAYOUT_ALGORITHMS] [REQ-MULTI_PANE_LAYOUT]
 * 
 * Ported from Goful's workspace layout algorithms
 * 
 * @param containerWidth - Container width in pixels
 * @param containerHeight - Container height in pixels
 * @param numPanes - Number of panes (2-4)
 * @param layoutType - Layout algorithm to use
 * @returns Array of pane bounds
 */
export function calculateLayout(
  containerWidth: number,
  containerHeight: number,
  numPanes: number,
  layoutType: LayoutType
): PaneBounds[] {
  // Validate inputs
  if (numPanes < 1) {
    return [];
  }
  
  if (containerWidth <= 0 || containerHeight <= 0) {
    return Array(numPanes).fill({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    });
  }
  
  switch (layoutType) {
    case "Tile":
      return calculateTileLayout(containerWidth, containerHeight, numPanes);
    case "OneRow":
      return calculateOneRowLayout(containerWidth, containerHeight, numPanes);
    case "OneColumn":
      return calculateOneColumnLayout(containerWidth, containerHeight, numPanes);
    case "Fullscreen":
      return calculateFullscreenLayout(containerWidth, containerHeight, numPanes);
    default:
      return calculateTileLayout(containerWidth, containerHeight, numPanes);
  }
}

/**
 * Tile layout: First pane left 50%, others stacked vertically right 50%
 * [IMPL-LAYOUT_CALCULATOR] [ARCH-LAYOUT_ALGORITHMS] [REQ-MULTI_PANE_LAYOUT]
 * 
 * Ported from Goful's layoutTile
 * 
 * @param width - Container width
 * @param height - Container height
 * @param numPanes - Number of panes
 * @returns Array of pane bounds
 */
function calculateTileLayout(
  width: number,
  height: number,
  numPanes: number
): PaneBounds[] {
  if (numPanes === 1) {
    return [{ x: 0, y: 0, width, height }];
  }
  
  const halfWidth = Math.floor(width / 2);
  const rightWidth = width - halfWidth;
  const bounds: PaneBounds[] = [];
  
  // First pane: left half
  bounds.push({
    x: 0,
    y: 0,
    width: halfWidth,
    height,
  });
  
  // Remaining panes: stacked vertically in right half
  const rightPanes = numPanes - 1;
  const paneHeight = Math.floor(height / rightPanes);
  
  for (let i = 0; i < rightPanes; i++) {
    const isLast = i === rightPanes - 1;
    const y = i * paneHeight;
    const h = isLast ? height - y : paneHeight;
    
    bounds.push({
      x: halfWidth,
      y,
      width: rightWidth,
      height: h,
    });
  }
  
  return bounds;
}

/**
 * OneRow layout: All panes horizontal, equal widths
 * [IMPL-LAYOUT_CALCULATOR] [ARCH-LAYOUT_ALGORITHMS] [REQ-MULTI_PANE_LAYOUT]
 * 
 * Ported from Goful's layoutOneLine
 * 
 * @param width - Container width
 * @param height - Container height
 * @param numPanes - Number of panes
 * @returns Array of pane bounds
 */
function calculateOneRowLayout(
  width: number,
  height: number,
  numPanes: number
): PaneBounds[] {
  if (numPanes === 1) {
    return [{ x: 0, y: 0, width, height }];
  }
  
  const paneWidth = Math.floor(width / numPanes);
  const bounds: PaneBounds[] = [];
  
  for (let i = 0; i < numPanes; i++) {
    const isLast = i === numPanes - 1;
    const x = i * paneWidth;
    const w = isLast ? width - x : paneWidth;
    
    bounds.push({
      x,
      y: 0,
      width: w,
      height,
    });
  }
  
  return bounds;
}

/**
 * OneColumn layout: All panes vertical, equal heights
 * [IMPL-LAYOUT_CALCULATOR] [ARCH-LAYOUT_ALGORITHMS] [REQ-MULTI_PANE_LAYOUT]
 * 
 * Ported from Goful's layoutOneColumn
 * 
 * @param width - Container width
 * @param height - Container height
 * @param numPanes - Number of panes
 * @returns Array of pane bounds
 */
function calculateOneColumnLayout(
  width: number,
  height: number,
  numPanes: number
): PaneBounds[] {
  if (numPanes === 1) {
    return [{ x: 0, y: 0, width, height }];
  }
  
  const paneHeight = Math.floor(height / numPanes);
  const bounds: PaneBounds[] = [];
  
  for (let i = 0; i < numPanes; i++) {
    const isLast = i === numPanes - 1;
    const y = i * paneHeight;
    const h = isLast ? height - y : paneHeight;
    
    bounds.push({
      x: 0,
      y,
      width,
      height: h,
    });
  }
  
  return bounds;
}

/**
 * Fullscreen layout: All panes overlap at (0,0) with full dimensions
 * [IMPL-LAYOUT_CALCULATOR] [ARCH-LAYOUT_ALGORITHMS] [REQ-MULTI_PANE_LAYOUT]
 * 
 * Ported from Goful's layoutFullscreen
 * Only the focused pane is rendered in this layout
 * 
 * @param width - Container width
 * @param height - Container height
 * @param numPanes - Number of panes
 * @returns Array of pane bounds (all identical)
 */
function calculateFullscreenLayout(
  width: number,
  height: number,
  numPanes: number
): PaneBounds[] {
  const bounds = { x: 0, y: 0, width, height };
  return Array(numPanes).fill(bounds);
}

/**
 * Get the total area covered by panes (for validation)
 * [IMPL-LAYOUT_CALCULATOR] [ARCH-LAYOUT_ALGORITHMS] [REQ-MULTI_PANE_LAYOUT]
 * 
 * @param bounds - Array of pane bounds
 * @returns Total area in pixels
 */
export function getTotalArea(bounds: PaneBounds[]): number {
  return bounds.reduce((sum, b) => sum + b.width * b.height, 0);
}

/**
 * Check if two pane bounds overlap
 * [IMPL-LAYOUT_CALCULATOR] [ARCH-LAYOUT_ALGORITHMS] [REQ-MULTI_PANE_LAYOUT]
 * 
 * @param a - First pane bounds
 * @param b - Second pane bounds
 * @returns True if panes overlap
 */
export function doOverlap(a: PaneBounds, b: PaneBounds): boolean {
  // No overlap if one is to the left of the other
  if (a.x + a.width <= b.x || b.x + b.width <= a.x) {
    return false;
  }
  
  // No overlap if one is above the other
  if (a.y + a.height <= b.y || b.y + b.height <= a.y) {
    return false;
  }
  
  return true;
}
