// [REQ-CROSS_PANE_VISIBILITY] [IMPL-CROSS_PANE_VISIBILITY_UI] [IMPL-CROSS_PANE_VISIBILITY_CATALOG]

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CrossPaneVisibilityManagerDialog } from "./CrossPaneVisibilityManagerDialog";
import { CrossPaneVisibilityStore } from "@/lib/cross-pane-visibility-store";

function mockStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => map.set(k, v),
    removeItem: (k: string) => map.delete(k),
    key: (i: number) => [...map.keys()][i] ?? null,
  };
}

describe("CrossPaneVisibilityManagerDialog [IMPL-CROSS_PANE_VISIBILITY_UI]", () => {
  let store: CrossPaneVisibilityStore;

  beforeEach(() => {
    store = new CrossPaneVisibilityStore(mockStorage());
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  const focusedDraft = {
    toggles: { sharedAll: "include" as const },
    sizeThreshold: null,
    timeThreshold: null,
  };

  // [IMPL-CROSS_PANE_VISIBILITY_UI] MANAGER_DIALOG: how: Save focused draft creates catalog preset
  it("MANAGER_DIALOG SAVE_DRAFT_TO_CATALOG creates preset from focused draft", () => {
    const onSaved = vi.fn();
    render(
      <CrossPaneVisibilityManagerDialog
        isOpen
        onClose={vi.fn()}
        store={store}
        panesUsingPreset={() => 0}
        focusedDraft={focusedDraft}
        onSaved={onSaved}
        onDeleted={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("+ New from focused draft"));
    const nameInput = screen.getAllByRole("textbox")[0];
    fireEvent.change(nameInput, { target: { value: "My filter" } });
    fireEvent.click(screen.getByText("Save"));

    expect(onSaved).toHaveBeenCalledWith(
      expect.objectContaining({ name: "My filter" }),
    );
    expect(store.list()).toHaveLength(1);
  });

  // [IMPL-CROSS_PANE_VISIBILITY_UI] MANAGER_DIALOG: how: Delete removes preset after confirm
  it("MANAGER_DIALOG deletes preset after confirm", () => {
    const created = store.create({ name: "Del me", state: focusedDraft }) as { id: string };
    const onDeleted = vi.fn();
    render(
      <CrossPaneVisibilityManagerDialog
        isOpen
        onClose={vi.fn()}
        store={store}
        panesUsingPreset={() => 0}
        focusedDraft={focusedDraft}
        onSaved={vi.fn()}
        onDeleted={onDeleted}
      />,
    );

    fireEvent.click(screen.getByText("Del me"));
    fireEvent.click(screen.getByText("Delete"));

    expect(onDeleted).toHaveBeenCalledWith(created.id);
    expect(store.list()).toHaveLength(0);
  });
});
