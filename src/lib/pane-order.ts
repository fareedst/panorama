// [IMPL-PANE_MANAGEMENT] [ARCH-PANE_LIFECYCLE] [REQ-MULTI_PANE_LAYOUT]
// Pure helpers for reordering panes[] while preserving pane state objects

export type RotateDirection = "forward" | "backward";

// [IMPL-PANE_MANAGEMENT] [REQ-MULTI_PANE_LAYOUT]: array swap and rotate without mutating pane state objects

/** Exchange two elements; returns new array. */
export function swapArrayAt<T>(arr: T[], i: number, j: number): T[] {
  if (i === j || i < 0 || j < 0 || i >= arr.length || j >= arr.length) {
    return arr;
  }
  const copy = [...arr];
  [copy[i], copy[j]] = [copy[j], copy[i]];
  return copy;
}

/** Rotate one slot: forward moves index 0→last; backward moves last→0. */
export function rotateArray<T>(arr: T[], direction: RotateDirection): T[] {
  if (arr.length <= 1) {
    return arr;
  }
  const copy = [...arr];
  if (direction === "forward") {
    const first = copy.shift();
    if (first !== undefined) copy.push(first);
  } else {
    const last = copy.pop();
    if (last !== undefined) copy.unshift(last);
  }
  return copy;
}

/** Move element from `from` to `to` index (insert semantics). */
export function moveArrayAt<T>(arr: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) {
    return arr;
  }
  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

/** Reorder array so result[i] = arr[order[i]]. */
export function reorderArrayByIndices<T>(arr: T[], order: number[]): T[] {
  if (order.length !== arr.length) {
    return arr;
  }
  return order.map((idx) => arr[idx]);
}

// [IMPL-PANE_MANAGEMENT] [REQ-MULTI_PANE_LAYOUT]: focusIndex follows pane content after reorder

/** Focus follows pane content after swap(i,j). */
export function remapFocusIndexAfterSwap(focus: number, i: number, j: number): number {
  if (focus === i) return j;
  if (focus === j) return i;
  return focus;
}

/** Focus follows pane content after rotate (forward: slot i content moves to (i-1+n)%n). */
export function remapFocusIndexAfterRotate(
  focus: number,
  length: number,
  direction: RotateDirection,
): number {
  if (length <= 1) return focus;
  if (direction === "forward") {
    return (focus - 1 + length) % length;
  }
  return (focus + 1) % length;
}

/** Focus follows pane content after move(from, to). */
export function remapFocusIndexAfterMove(focus: number, from: number, to: number): number {
  if (focus === from) return to;
  if (from < focus && to >= focus) return focus - 1;
  if (from > focus && to <= focus) return focus + 1;
  return focus;
}

// [IMPL-PANE_MANAGEMENT] [REQ-MULTI_PANE_LAYOUT]: wrapped neighbor indices for SwapFocusedNeighbor

export function neighborIndexNext(index: number, length: number): number {
  return (index + 1) % length;
}

export function neighborIndexPrev(index: number, length: number): number {
  return (index - 1 + length) % length;
}
