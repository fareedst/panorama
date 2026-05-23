// [IMPL-FILE_COLUMN_CONFIG] [REQ-CONFIG_DRIVEN_FILE_MANAGER]

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ColumnOrderDialog } from "./ColumnOrderDialog";
import type { FilesColumnConfig } from "@/lib/config.types";

const mockColumns: FilesColumnConfig[] = [
  { id: "mtime", visible: true },
  { id: "size", visible: true },
  { id: "name", visible: true },
];

describe("ColumnOrderDialog [IMPL-FILE_COLUMN_CONFIG]", () => {
  // [IMPL-FILE_COLUMN_CONFIG] [IMPL-WORKSPACE_VIEW] COLUMN_ORDER_DIALOG — cancel closes without apply
  it("cancel closes without calling onApply", () => {
    const onApply = vi.fn();
    const onClose = vi.fn();
    render(
      <ColumnOrderDialog
        isOpen
        columns={mockColumns}
        onApply={onApply}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByText("Cancel"));
    expect(onApply).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  // [IMPL-FILE_COLUMN_CONFIG] COLUMN_ORDER_DIALOG — Up reorders toward start; first row Up disabled
  it("move up reorders and disables up on first row", () => {
    const onApply = vi.fn();
    const onClose = vi.fn();
    render(
      <ColumnOrderDialog
        isOpen
        columns={mockColumns}
        onApply={onApply}
        onClose={onClose}
      />,
    );
    expect(screen.getByTestId("column-order-up-mtime")).toBeDisabled();
    fireEvent.click(screen.getByTestId("column-order-down-mtime"));
    fireEvent.click(screen.getByTestId("column-order-up-mtime"));
    fireEvent.click(screen.getByTestId("column-order-apply"));
    expect(onApply).toHaveBeenCalledWith([
      { id: "mtime", visible: true },
      { id: "size", visible: true },
      { id: "name", visible: true },
    ]);
  });

  it("reorders columns on apply", () => {
    const onApply = vi.fn();
    const onClose = vi.fn();
    render(
      <ColumnOrderDialog
        isOpen
        columns={mockColumns}
        onApply={onApply}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByTestId("column-order-down-mtime"));
    fireEvent.click(screen.getByTestId("column-order-apply"));
    expect(onApply).toHaveBeenCalledWith([
      { id: "size", visible: true },
      { id: "mtime", visible: true },
      { id: "name", visible: true },
    ]);
    expect(onClose).toHaveBeenCalled();
  });
});
