// [IMPL-LAYOUT_CALCULATOR] [ARCH-LAYOUT_ALGORITHMS] [REQ-MULTI_PANE_LAYOUT]
// Tests for multi-pane layout algorithms

import { describe, it, expect } from "vitest";
import {
  calculateLayout,
  getTotalArea,
  doOverlap,
  type LayoutType,
  type PaneBounds,
} from "./files.layout";

describe("calculateLayout [REQ_MULTI_PANE_LAYOUT]", () => {
  const containerWidth = 1000;
  const containerHeight = 600;
  
  describe("Tile layout", () => {
    it("should layout 1 pane as fullscreen", () => {
      const bounds = calculateLayout(containerWidth, containerHeight, 1, "Tile");
      
      expect(bounds).toHaveLength(1);
      expect(bounds[0]).toEqual({
        x: 0,
        y: 0,
        width: containerWidth,
        height: containerHeight,
      });
    });
    
    it("should layout 2 panes: left 50%, right 50%", () => {
      const bounds = calculateLayout(containerWidth, containerHeight, 2, "Tile");
      
      expect(bounds).toHaveLength(2);
      
      // First pane: left half
      expect(bounds[0].x).toBe(0);
      expect(bounds[0].y).toBe(0);
      expect(bounds[0].width).toBe(500);
      expect(bounds[0].height).toBe(containerHeight);
      
      // Second pane: right half
      expect(bounds[1].x).toBe(500);
      expect(bounds[1].y).toBe(0);
      expect(bounds[1].width).toBe(500);
      expect(bounds[1].height).toBe(containerHeight);
    });
    
    it("should layout 3 panes: left 50%, right 50% split vertically", () => {
      const bounds = calculateLayout(containerWidth, containerHeight, 3, "Tile");
      
      expect(bounds).toHaveLength(3);
      
      // First pane: left half
      expect(bounds[0].x).toBe(0);
      expect(bounds[0].width).toBe(500);
      expect(bounds[0].height).toBe(containerHeight);
      
      // Second pane: top right quarter
      expect(bounds[1].x).toBe(500);
      expect(bounds[1].y).toBe(0);
      expect(bounds[1].width).toBe(500);
      expect(bounds[1].height).toBe(300);
      
      // Third pane: bottom right quarter
      expect(bounds[2].x).toBe(500);
      expect(bounds[2].y).toBe(300);
      expect(bounds[2].width).toBe(500);
      expect(bounds[2].height).toBe(300);
    });
    
    it("should layout 4 panes: left 50%, right 50% split into 3", () => {
      const bounds = calculateLayout(containerWidth, containerHeight, 4, "Tile");
      
      expect(bounds).toHaveLength(4);
      
      // First pane: left half
      expect(bounds[0].x).toBe(0);
      expect(bounds[0].width).toBe(500);
      expect(bounds[0].height).toBe(containerHeight);
      
      // Right half split into 3 panes
      expect(bounds[1].x).toBe(500);
      expect(bounds[2].x).toBe(500);
      expect(bounds[3].x).toBe(500);
      
      // Verify right panes stack vertically
      expect(bounds[1].y).toBe(0);
      expect(bounds[2].y).toBe(200);
      expect(bounds[3].y).toBe(400);
    });
    
    it("should not overlap panes", () => {
      const bounds = calculateLayout(containerWidth, containerHeight, 4, "Tile");
      
      // Check each pair of panes
      for (let i = 0; i < bounds.length; i++) {
        for (let j = i + 1; j < bounds.length; j++) {
          expect(doOverlap(bounds[i], bounds[j])).toBe(false);
        }
      }
    });
  });
  
  describe("OneRow layout", () => {
    it("should layout 1 pane as fullscreen", () => {
      const bounds = calculateLayout(containerWidth, containerHeight, 1, "OneRow");
      
      expect(bounds).toHaveLength(1);
      expect(bounds[0]).toEqual({
        x: 0,
        y: 0,
        width: containerWidth,
        height: containerHeight,
      });
    });
    
    it("should layout 2 panes horizontally with equal widths", () => {
      const bounds = calculateLayout(containerWidth, containerHeight, 2, "OneRow");
      
      expect(bounds).toHaveLength(2);
      
      // Both panes should have full height
      expect(bounds[0].height).toBe(containerHeight);
      expect(bounds[1].height).toBe(containerHeight);
      
      // Both panes should start at y=0
      expect(bounds[0].y).toBe(0);
      expect(bounds[1].y).toBe(0);
      
      // Panes should split width equally
      expect(bounds[0].x).toBe(0);
      expect(bounds[0].width).toBe(500);
      expect(bounds[1].x).toBe(500);
      expect(bounds[1].width).toBe(500);
    });
    
    it("should layout 3 panes horizontally", () => {
      const bounds = calculateLayout(containerWidth, containerHeight, 3, "OneRow");
      
      expect(bounds).toHaveLength(3);
      
      // All panes should have full height
      bounds.forEach((b) => {
        expect(b.height).toBe(containerHeight);
        expect(b.y).toBe(0);
      });
      
      // Panes should be side by side
      expect(bounds[0].x).toBe(0);
      expect(bounds[1].x).toBe(333);
      expect(bounds[2].x).toBe(666);
    });
    
    it("should not overlap panes", () => {
      const bounds = calculateLayout(containerWidth, containerHeight, 4, "OneRow");
      
      for (let i = 0; i < bounds.length; i++) {
        for (let j = i + 1; j < bounds.length; j++) {
          expect(doOverlap(bounds[i], bounds[j])).toBe(false);
        }
      }
    });
  });
  
  describe("OneColumn layout", () => {
    it("should layout 1 pane as fullscreen", () => {
      const bounds = calculateLayout(containerWidth, containerHeight, 1, "OneColumn");
      
      expect(bounds).toHaveLength(1);
      expect(bounds[0]).toEqual({
        x: 0,
        y: 0,
        width: containerWidth,
        height: containerHeight,
      });
    });
    
    it("should layout 2 panes vertically with equal heights", () => {
      const bounds = calculateLayout(containerWidth, containerHeight, 2, "OneColumn");
      
      expect(bounds).toHaveLength(2);
      
      // Both panes should have full width
      expect(bounds[0].width).toBe(containerWidth);
      expect(bounds[1].width).toBe(containerWidth);
      
      // Both panes should start at x=0
      expect(bounds[0].x).toBe(0);
      expect(bounds[1].x).toBe(0);
      
      // Panes should split height equally
      expect(bounds[0].y).toBe(0);
      expect(bounds[0].height).toBe(300);
      expect(bounds[1].y).toBe(300);
      expect(bounds[1].height).toBe(300);
    });
    
    it("should layout 3 panes vertically", () => {
      const bounds = calculateLayout(containerWidth, containerHeight, 3, "OneColumn");
      
      expect(bounds).toHaveLength(3);
      
      // All panes should have full width
      bounds.forEach((b) => {
        expect(b.width).toBe(containerWidth);
        expect(b.x).toBe(0);
      });
      
      // Panes should be stacked vertically
      expect(bounds[0].y).toBe(0);
      expect(bounds[1].y).toBe(200);
      expect(bounds[2].y).toBe(400);
    });
    
    it("should not overlap panes", () => {
      const bounds = calculateLayout(containerWidth, containerHeight, 4, "OneColumn");
      
      for (let i = 0; i < bounds.length; i++) {
        for (let j = i + 1; j < bounds.length; j++) {
          expect(doOverlap(bounds[i], bounds[j])).toBe(false);
        }
      }
    });
  });
  
  describe("Fullscreen layout", () => {
    it("should layout all panes at (0,0) with full dimensions", () => {
      const bounds = calculateLayout(containerWidth, containerHeight, 3, "Fullscreen");
      
      expect(bounds).toHaveLength(3);
      
      // All panes should have same bounds
      bounds.forEach((b) => {
        expect(b).toEqual({
          x: 0,
          y: 0,
          width: containerWidth,
          height: containerHeight,
        });
      });
    });
    
    it("should overlap all panes (by design)", () => {
      const bounds = calculateLayout(containerWidth, containerHeight, 3, "Fullscreen");
      
      // Check that panes DO overlap in fullscreen mode
      expect(doOverlap(bounds[0], bounds[1])).toBe(true);
      expect(doOverlap(bounds[1], bounds[2])).toBe(true);
      expect(doOverlap(bounds[0], bounds[2])).toBe(true);
    });
  });
  
  describe("Edge cases", () => {
    it("should handle zero panes", () => {
      const bounds = calculateLayout(containerWidth, containerHeight, 0, "Tile");
      expect(bounds).toEqual([]);
    });
    
    it("should handle zero dimensions", () => {
      const bounds = calculateLayout(0, 0, 2, "Tile");
      
      expect(bounds).toHaveLength(2);
      bounds.forEach((b) => {
        expect(b.width).toBe(0);
        expect(b.height).toBe(0);
      });
    });
    
    it("should handle negative dimensions", () => {
      const bounds = calculateLayout(-100, -100, 2, "Tile");
      
      expect(bounds).toHaveLength(2);
      bounds.forEach((b) => {
        expect(b.width).toBe(0);
        expect(b.height).toBe(0);
      });
    });
  });
});

describe("getTotalArea [REQ_MULTI_PANE_LAYOUT]", () => {
  it("should calculate total area", () => {
    const bounds: PaneBounds[] = [
      { x: 0, y: 0, width: 100, height: 100 },
      { x: 100, y: 0, width: 100, height: 100 },
    ];
    
    expect(getTotalArea(bounds)).toBe(20000);
  });
  
  it("should return 0 for empty array", () => {
    expect(getTotalArea([])).toBe(0);
  });
});

describe("doOverlap [REQ_MULTI_PANE_LAYOUT]", () => {
  it("should detect overlapping panes", () => {
    const a: PaneBounds = { x: 0, y: 0, width: 100, height: 100 };
    const b: PaneBounds = { x: 50, y: 50, width: 100, height: 100 };
    
    expect(doOverlap(a, b)).toBe(true);
  });
  
  it("should detect non-overlapping panes (side by side)", () => {
    const a: PaneBounds = { x: 0, y: 0, width: 100, height: 100 };
    const b: PaneBounds = { x: 100, y: 0, width: 100, height: 100 };
    
    expect(doOverlap(a, b)).toBe(false);
  });
  
  it("should detect non-overlapping panes (stacked)", () => {
    const a: PaneBounds = { x: 0, y: 0, width: 100, height: 100 };
    const b: PaneBounds = { x: 0, y: 100, width: 100, height: 100 };
    
    expect(doOverlap(a, b)).toBe(false);
  });
  
  it("should detect non-overlapping panes (diagonal)", () => {
    const a: PaneBounds = { x: 0, y: 0, width: 100, height: 100 };
    const b: PaneBounds = { x: 200, y: 200, width: 100, height: 100 };
    
    expect(doOverlap(a, b)).toBe(false);
  });
  
  it("should detect overlapping at edges", () => {
    const a: PaneBounds = { x: 0, y: 0, width: 100, height: 100 };
    const b: PaneBounds = { x: 99, y: 0, width: 100, height: 100 };
    
    expect(doOverlap(a, b)).toBe(true);
  });
  
  it("should detect non-overlapping at exact boundaries", () => {
    const a: PaneBounds = { x: 0, y: 0, width: 100, height: 100 };
    const b: PaneBounds = { x: 100, y: 0, width: 100, height: 100 };
    
    expect(doOverlap(a, b)).toBe(false);
  });
});

describe("Layout invariants [REQ_MULTI_PANE_LAYOUT]", () => {
  const layouts: LayoutType[] = ["Tile", "OneRow", "OneColumn"];
  const containerWidth = 800;
  const containerHeight = 600;
  
  layouts.forEach((layout) => {
    describe(`${layout} layout invariants`, () => {
      [2, 3, 4].forEach((numPanes) => {
        it(`should produce correct number of panes (${numPanes})`, () => {
          const bounds = calculateLayout(
            containerWidth,
            containerHeight,
            numPanes,
            layout
          );
          expect(bounds).toHaveLength(numPanes);
        });
        
        it(`should keep panes within container (${numPanes})`, () => {
          const bounds = calculateLayout(
            containerWidth,
            containerHeight,
            numPanes,
            layout
          );
          
          bounds.forEach((b) => {
            expect(b.x).toBeGreaterThanOrEqual(0);
            expect(b.y).toBeGreaterThanOrEqual(0);
            expect(b.x + b.width).toBeLessThanOrEqual(containerWidth);
            expect(b.y + b.height).toBeLessThanOrEqual(containerHeight);
          });
        });
        
        it(`should not have negative dimensions (${numPanes})`, () => {
          const bounds = calculateLayout(
            containerWidth,
            containerHeight,
            numPanes,
            layout
          );
          
          bounds.forEach((b) => {
            expect(b.width).toBeGreaterThanOrEqual(0);
            expect(b.height).toBeGreaterThanOrEqual(0);
          });
        });
        
        it(`should not overlap (${numPanes})`, () => {
          const bounds = calculateLayout(
            containerWidth,
            containerHeight,
            numPanes,
            layout
          );
          
          for (let i = 0; i < bounds.length; i++) {
            for (let j = i + 1; j < bounds.length; j++) {
              expect(doOverlap(bounds[i], bounds[j])).toBe(false);
            }
          }
        });
      });
    });
  });
});
