// [REQ-CROSS_PANE_VISIBILITY] [IMPL-CROSS_PANE_VISIBILITY_UI]

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CompareFilterThresholdDialog } from "./CompareFilterThresholdDialog";

describe("CompareFilterThresholdDialog", () => {
  it("applies size and time thresholds", () => {
    // [IMPL-CROSS_PANE_VISIBILITY_UI] THRESHOLD_DIALOG: how: Apply passes sizeThreshold and timeThreshold to onApply
    const onApply = vi.fn();
    render(
      <CompareFilterThresholdDialog
        isOpen
        sizeThreshold={null}
        timeThreshold={null}
        onClose={vi.fn()}
        onApply={onApply}
      />,
    );
    fireEvent.change(screen.getByTestId("compare-filter-size-threshold"), {
      target: { value: "2048" },
    });
    fireEvent.change(screen.getByTestId("compare-filter-time-threshold"), {
      target: { value: "2024-06-01T12:00" },
    });
    fireEvent.click(screen.getByTestId("compare-filter-threshold-apply"));
    expect(onApply).toHaveBeenCalledWith(2048, expect.stringMatching(/^2024-06-01T/));
  });
});
