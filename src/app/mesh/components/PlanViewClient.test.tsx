// [REQ-MESH_GUI] [IMPL-MESH_GUI]: Plan view component tests — phase 20

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlanViewClient } from "./PlanViewClient";

describe("PlanViewClient [IMPL-MESH_GUI]", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url.includes("/plan") && init?.method === "POST") {
          return new Response(
            JSON.stringify({
              changeSet: {
                operations: [
                  {
                    id: "op1",
                    kind: "copy",
                    sourcePath: "/a.txt",
                    riskLevel: "low",
                  },
                  {
                    id: "op2",
                    kind: "delete",
                    sourcePath: "/b.txt",
                    riskLevel: "high",
                  },
                ],
              },
            }),
          );
        }
        if (url.includes("/sessions")) {
          return new Response(JSON.stringify({ session: { id: "s1", state: "completed" } }));
        }
        return new Response(
          JSON.stringify({
            mesh: {
              depots: [
                { id: "d1", name: "Src" },
                { id: "d2", name: "Dst" },
              ],
              links: [{ sourceDepotId: "d1", targetDepotId: "d2" }],
            },
          }),
        );
      }),
    );
  });

  it("plan_view_displays_copy_operations", async () => {
    const user = userEvent.setup();
    render(<PlanViewClient meshId="m1" />);
    await waitFor(() => screen.getByTestId("generate-plan-btn"));
    await user.click(screen.getByTestId("generate-plan-btn"));
    await waitFor(() => {
      expect(screen.getByTestId("change-set-table")).toHaveTextContent("copy");
    });
  });

  it("destructive_operations_show_warning", async () => {
    const user = userEvent.setup();
    render(<PlanViewClient meshId="m1" />);
    await user.click(screen.getByTestId("generate-plan-btn"));
    await waitFor(() => {
      expect(screen.getByTestId("destructive-warning")).toBeVisible();
    });
  });

  it("user_can_filter_operations_by_type", async () => {
    const user = userEvent.setup();
    render(<PlanViewClient meshId="m1" />);
    await user.click(screen.getByTestId("generate-plan-btn"));
    await waitFor(() => screen.getByTestId("operation-filter"));
    await user.selectOptions(screen.getByTestId("operation-filter"), "copy");
    expect(screen.getByTestId("change-set-table")).toHaveTextContent("copy");
    expect(screen.getByTestId("change-set-table")).not.toHaveTextContent("delete");
  });

  it("user_can_discard_plan", async () => {
    const user = userEvent.setup();
    render(<PlanViewClient meshId="m1" />);
    await user.click(screen.getByTestId("generate-plan-btn"));
    await waitFor(() => screen.getByTestId("discard-plan-btn"));
    await user.click(screen.getByTestId("discard-plan-btn"));
    expect(screen.queryByTestId("approve-plan-btn")).not.toBeInTheDocument();
  });
});
