// [TEST-SET_BASE_DIRECTORY] [IMPL-WORKSPACE_VIEW] [REQ-DIRECTORY_NAVIGATION] [REQ-MULTI_PANE_LAYOUT]

import { describe, it, expect } from "vitest";
import {
  allowsLinkedPropagationForSetBaseTarget,
  buildSinglePaneWorkspaceUrl,
  isSetBaseDirectorySwapTarget,
  isSetBaseDirectoryTargetMultiPaneOnly,
  isSetBaseDirectoryTargetRequiresPaneManagement,
  resolveSetBaseDirectoryPaneTargets,
  resolveSetBaseDirectorySwapPair,
} from "./set-base-directory";

describe("[TEST-SET_BASE_DIRECTORY] set-base-directory", () => {
  describe("resolveSetBaseDirectoryPaneTargets", () => {
    it("returns initiating index for thisPane", () => {
      expect(resolveSetBaseDirectoryPaneTargets("thisPane", 1, 3)).toEqual([1]);
    });

    it("returns all indices for allPanes", () => {
      expect(resolveSetBaseDirectoryPaneTargets("allPanes", 0, 3)).toEqual([
        0, 1, 2,
      ]);
    });

    it("returns other panes for otherPanes", () => {
      expect(resolveSetBaseDirectoryPaneTargets("otherPanes", 1, 3)).toEqual([
        0, 2,
      ]);
    });

    it("returns empty for otherPanes when single pane", () => {
      expect(resolveSetBaseDirectoryPaneTargets("otherPanes", 0, 1)).toEqual(
        [],
      );
    });

    it("returns next neighbor for nextPane", () => {
      expect(resolveSetBaseDirectoryPaneTargets("nextPane", 0, 3)).toEqual([1]);
      expect(resolveSetBaseDirectoryPaneTargets("nextPane", 2, 3)).toEqual([0]);
    });

    it("returns prior neighbor for priorPane", () => {
      expect(resolveSetBaseDirectoryPaneTargets("priorPane", 0, 3)).toEqual([
        2,
      ]);
    });

    it("returns empty for newWorkspace", () => {
      expect(
        resolveSetBaseDirectoryPaneTargets("newWorkspace", 0, 3),
      ).toEqual([]);
    });

    it("returns empty for newPane", () => {
      expect(resolveSetBaseDirectoryPaneTargets("newPane", 0, 3)).toEqual([]);
    });
  });

  describe("resolveSetBaseDirectorySwapPair", () => {
    it("returns null for non-swap targets", () => {
      expect(resolveSetBaseDirectorySwapPair("nextPane", 0, 2)).toBeNull();
    });

    it("returns initiating and next neighbor for nextPaneSwap", () => {
      expect(resolveSetBaseDirectorySwapPair("nextPaneSwap", 0, 3)).toEqual([
        0, 1,
      ]);
    });

    it("returns initiating and prior neighbor for priorPaneSwap", () => {
      expect(resolveSetBaseDirectorySwapPair("priorPaneSwap", 0, 3)).toEqual([
        0, 2,
      ]);
    });

    it("returns null when single pane", () => {
      expect(resolveSetBaseDirectorySwapPair("nextPaneSwap", 0, 1)).toBeNull();
    });
  });

  describe("allowsLinkedPropagationForSetBaseTarget", () => {
    it("allows linked only for thisPane", () => {
      expect(allowsLinkedPropagationForSetBaseTarget("thisPane")).toBe(true);
      expect(allowsLinkedPropagationForSetBaseTarget("allPanes")).toBe(false);
    });
  });

  describe("buildSinglePaneWorkspaceUrl", () => {
    it("builds panes=1 and pane0 query", () => {
      expect(buildSinglePaneWorkspaceUrl("/tmp/foo")).toBe(
        "/files?panes=1&pane0=%2Ftmp%2Ffoo",
      );
    });
  });

  describe("target classification helpers", () => {
    it("identifies multi-pane-only targets", () => {
      expect(isSetBaseDirectoryTargetMultiPaneOnly("otherPanes")).toBe(true);
      expect(isSetBaseDirectoryTargetMultiPaneOnly("thisPane")).toBe(false);
    });

    it("identifies swap targets", () => {
      expect(isSetBaseDirectorySwapTarget("nextPaneSwap")).toBe(true);
      expect(isSetBaseDirectorySwapTarget("nextPane")).toBe(false);
    });

    it("identifies pane-management-required targets", () => {
      expect(isSetBaseDirectoryTargetRequiresPaneManagement("newPane")).toBe(
        true,
      );
      expect(isSetBaseDirectoryTargetRequiresPaneManagement("nextPaneSwap")).toBe(
        true,
      );
      expect(isSetBaseDirectoryTargetRequiresPaneManagement("thisPane")).toBe(
        false,
      );
    });
  });
});
