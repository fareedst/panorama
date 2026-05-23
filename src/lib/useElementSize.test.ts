// [IMPL-LAYOUT_CALCULATOR] [IMPL-TOOLBAR_COMPONENT] [REQ-MULTI_PANE_LAYOUT] [REQ-TOOLBAR_SYSTEM]: useElementSize hook tests

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useElementSize } from "./useElementSize";

describe("[IMPL-LAYOUT_CALCULATOR] [REQ-MULTI_PANE_LAYOUT] useElementSize", () => {
  let resizeCallback: (() => void) | null = null;
  const observe = vi.fn();
  const disconnect = vi.fn();

  beforeEach(() => {
    resizeCallback = null;
    observe.mockClear();
    disconnect.mockClear();

    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 800,
    });

    vi.stubGlobal(
      "ResizeObserver",
      class MockResizeObserver {
        constructor(callback: ResizeObserverCallback) {
          resizeCallback = () => {
            callback(
              [{ contentRect: { width: 900, height: 500 } } as ResizeObserverEntry],
              this as unknown as ResizeObserver,
            );
          };
        }
        observe = observe;
        disconnect = disconnect;
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // [IMPL-LAYOUT_CALCULATOR] WORKSPACE_AREA_MEASUREMENT: non-zero clientWidth/clientHeight
  it("returns measured client dimensions when non-zero", () => {
    const element = document.createElement("div");
    Object.defineProperty(element, "clientWidth", { value: 900, configurable: true });
    Object.defineProperty(element, "clientHeight", { value: 500, configurable: true });

    const ref = { current: element };
    const { result } = renderHook(() => useElementSize(ref));

    expect(result.current).toEqual({ width: 900, height: 500 });
    expect(observe).toHaveBeenCalledWith(element);
  });

  // [IMPL-LAYOUT_CALCULATOR] WORKSPACE_AREA_MEASUREMENT: jsdom zero-dimension fallback
  it("falls back to viewport minus chrome when client dimensions are zero", () => {
    const element = document.createElement("div");
    Object.defineProperty(element, "clientWidth", { value: 0, configurable: true });
    Object.defineProperty(element, "clientHeight", { value: 0, configurable: true });

    const ref = { current: element };
    const { result } = renderHook(() => useElementSize(ref));

    expect(result.current).toEqual({ width: 1000, height: 680 });
  });

  // [IMPL-LAYOUT_CALCULATOR] WORKSPACE_AREA_MEASUREMENT: observer callback updates size
  it("updates when ResizeObserver fires", () => {
    const element = document.createElement("div");
    Object.defineProperty(element, "clientWidth", {
      get: () => 900,
      configurable: true,
    });
    Object.defineProperty(element, "clientHeight", {
      get: () => 500,
      configurable: true,
    });

    const ref = { current: element };
    const { result } = renderHook(() => useElementSize(ref));

    act(() => {
      Object.defineProperty(element, "clientWidth", { value: 800, configurable: true });
      Object.defineProperty(element, "clientHeight", { value: 400, configurable: true });
      resizeCallback?.();
    });

    expect(result.current).toEqual({ width: 800, height: 400 });
  });

  // [IMPL-TOOLBAR_COMPONENT] [REQ-TOOLBAR_SYSTEM]: remeasure when toolbarExpanded deps change
  it("re-attaches observer when deps change", () => {
    const element = document.createElement("div");
    Object.defineProperty(element, "clientWidth", { value: 900, configurable: true });
    Object.defineProperty(element, "clientHeight", { value: 500, configurable: true });
    const ref = { current: element };

    const { rerender } = renderHook(({ dep }: { dep: boolean }) => useElementSize(ref, [dep]), {
      initialProps: { dep: true },
    });

    expect(disconnect).not.toHaveBeenCalled();

    rerender({ dep: false });

    expect(disconnect).toHaveBeenCalled();
  });
});
