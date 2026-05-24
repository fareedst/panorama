// [IMPL-PANE_MANAGEMENT] [REQ-MULTI_PANE_LAYOUT] Unit tests for pane reorder helpers

import { describe, it, expect } from "vitest";
import {
  swapArrayAt,
  rotateArray,
  moveArrayAt,
  reorderArrayByIndices,
  remapFocusIndexAfterSwap,
  remapFocusIndexAfterRotate,
  remapFocusIndexAfterMove,
  neighborIndexNext,
  neighborIndexPrev,
} from "./pane-order";

describe("pane-order [IMPL-PANE_MANAGEMENT] [REQ-MULTI_PANE_LAYOUT]", () => {
  describe("swapArrayAt", () => {
    it("exchanges two elements", () => {
      expect(swapArrayAt(["a", "b", "c"], 0, 2)).toEqual(["c", "b", "a"]);
    });

    it("returns same array reference when indices equal", () => {
      const arr = ["a", "b"];
      expect(swapArrayAt(arr, 1, 1)).toBe(arr);
    });
  });

  describe("rotateArray", () => {
    it("rotates forward", () => {
      expect(rotateArray(["a", "b", "c"], "forward")).toEqual(["b", "c", "a"]);
    });

    it("rotates backward", () => {
      expect(rotateArray(["a", "b", "c"], "backward")).toEqual(["c", "a", "b"]);
    });

    it("leaves single element unchanged", () => {
      expect(rotateArray(["a"], "forward")).toEqual(["a"]);
    });
  });

  describe("moveArrayAt", () => {
    it("moves element to new position", () => {
      expect(moveArrayAt(["a", "b", "c", "d"], 3, 0)).toEqual(["d", "a", "b", "c"]);
      expect(moveArrayAt(["a", "b", "c", "d"], 0, 3)).toEqual(["b", "c", "d", "a"]);
    });
  });

  describe("reorderArrayByIndices", () => {
    it("reorders by index permutation", () => {
      expect(reorderArrayByIndices(["a", "b", "c"], [2, 0, 1])).toEqual(["c", "a", "b"]);
    });
  });

  describe("remapFocusIndexAfterSwap", () => {
    it("swaps focus when on swapped indices", () => {
      expect(remapFocusIndexAfterSwap(0, 0, 2)).toBe(2);
      expect(remapFocusIndexAfterSwap(2, 0, 2)).toBe(0);
      expect(remapFocusIndexAfterSwap(1, 0, 2)).toBe(1);
    });
  });

  describe("remapFocusIndexAfterRotate", () => {
    it("tracks focus content on forward rotate", () => {
      expect(remapFocusIndexAfterRotate(0, 3, "forward")).toBe(2);
      expect(remapFocusIndexAfterRotate(1, 3, "forward")).toBe(0);
      expect(remapFocusIndexAfterRotate(2, 3, "forward")).toBe(1);
    });

    it("tracks focus content on backward rotate", () => {
      expect(remapFocusIndexAfterRotate(0, 3, "backward")).toBe(1);
      expect(remapFocusIndexAfterRotate(2, 3, "backward")).toBe(0);
    });
  });

  describe("remapFocusIndexAfterMove", () => {
    it("tracks focus when moved pane was focused", () => {
      expect(remapFocusIndexAfterMove(3, 3, 0)).toBe(0);
    });

    it("shifts focus when another pane moves across focus", () => {
      expect(remapFocusIndexAfterMove(1, 3, 0)).toBe(2);
      expect(remapFocusIndexAfterMove(1, 0, 3)).toBe(0);
    });
  });

  describe("neighborIndexNext / neighborIndexPrev", () => {
    it("wraps at boundaries", () => {
      expect(neighborIndexNext(0, 3)).toBe(1);
      expect(neighborIndexNext(2, 3)).toBe(0);
      expect(neighborIndexPrev(0, 3)).toBe(2);
      expect(neighborIndexPrev(1, 3)).toBe(0);
    });
  });
});
