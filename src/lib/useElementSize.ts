// [IMPL-LAYOUT_CALCULATOR] [IMPL-TOOLBAR_COMPONENT] [ARCH-LAYOUT_ALGORITHMS] [REQ-MULTI_PANE_LAYOUT] [REQ-TOOLBAR_SYSTEM]: Measure element client dimensions for pane layout

import { useEffect, useState, type RefObject } from "react";

export interface ElementSize {
  width: number;
  height: number;
}

/** Fallback when jsdom reports 0 (no real flex layout). Matches legacy header+footer reserve. */
const JSDOM_FALLBACK_CHROME_HEIGHT = 120;

// [IMPL-LAYOUT_CALCULATOR] WORKSPACE_AREA_MEASUREMENT: read client box or jsdom viewport fallback
function readElementSize(element: HTMLElement | null): ElementSize {
  if (!element) {
    return { width: 0, height: 0 };
  }

  const width = element.clientWidth;
  const height = element.clientHeight;

  if (width > 0 && height > 0) {
    return { width, height };
  }

  // jsdom / pre-layout fallback for tests and first paint
  return {
    width: width > 0 ? width : window.innerWidth,
    height: height > 0 ? height : window.innerHeight - JSDOM_FALLBACK_CHROME_HEIGHT,
  };
}

// [IMPL-LAYOUT_CALCULATOR] [IMPL-TOOLBAR_COMPONENT] WORKSPACE_AREA_MEASUREMENT: ResizeObserver + deps remeasure on toolbar display change
/**
 * Track an element's client width/height via ResizeObserver.
 * Re-measures when deps change (e.g. toolbar expanded/compact toggle).
 */
export function useElementSize(
  ref: RefObject<HTMLElement | null>,
  deps: readonly unknown[] = [],
): ElementSize {
  const [size, setSize] = useState<ElementSize>(() => readElementSize(ref.current));

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const updateSize = () => {
      setSize(readElementSize(element));
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    window.addEventListener("resize", updateSize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateSize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller passes explicit re-measure triggers
  }, [ref, ...deps]);

  return size;
}
