// [IMPL-MESH_GUI] [IMPL-MESH_SCHEDULE] [REQ-MESH_SCHEDULE]: Schedule UI component tests

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MeshScheduleClient } from "./MeshScheduleClient";

describe("MeshScheduleClient [IMPL-MESH_SCHEDULE]", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url.includes("/schedule") && init?.method === "PATCH") {
          return new Response(
            JSON.stringify({
              schedule: { enabled: true, mode: "interval", intervalMinutes: 30 },
            }),
          );
        }
        return new Response(
          JSON.stringify({ schedule: { enabled: false, mode: "disabled", runCount: 0 } }),
        );
      }),
    );
  });

  it("schedule_can_be_enabled_from_gui", async () => {
    const user = userEvent.setup();
    render(<MeshScheduleClient meshId="m1" />);
    await waitFor(() => screen.getByTestId("schedule-enable-btn"));
    await user.click(screen.getByTestId("schedule-enable-btn"));
    await waitFor(() => {
      expect(screen.getByTestId("schedule-message")).toHaveTextContent("enabled");
    });
  });

  it("schedule_disable_btn_visible", async () => {
    render(<MeshScheduleClient meshId="m1" />);
    await waitFor(() => {
      expect(screen.getByTestId("schedule-disable-btn")).toBeVisible();
    });
  });
});
