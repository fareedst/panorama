// [IMPL-EXTERNAL_LINKS] [REQ-NAVIGATION_LINKS] [REQ-WORKSPACE_MESH_BRIDGE]: New-tab link security and accessibility

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NewTabLink } from "./NewTabLink";

describe("NewTabLink [IMPL-EXTERNAL_LINKS] [REQ-NAVIGATION_LINKS]", () => {
  it("applies target blank rel noopener noreferrer and new-tab disclosure", () => {
    // [IMPL-EXTERNAL_LINKS] [ARCH-APP_ROUTER] [REQ-NAVIGATION_LINKS] [REQ-WORKSPACE_MESH_BRIDGE]
    // how: Reusable Next.js Link opens target in new tab with rel noopener noreferrer, prefetch off, and screen-reader disclosure.
    render(
      <NewTabLink href="/files?meshId=m1" data-testid="test-new-tab-link">
        Open in File Manager
      </NewTabLink>,
    );
    const link = screen.getByTestId("test-new-tab-link");
    expect(link).toHaveAttribute("href", "/files?meshId=m1");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAttribute(
      "aria-label",
      "Open in File Manager (opens in new tab)",
    );
    expect(screen.getByText("(opens in new tab)", { selector: ".sr-only" })).toBeInTheDocument();
  });

  it("uses explicit ariaLabel when children are not plain text", () => {
    // [IMPL-EXTERNAL_LINKS] [ARCH-APP_ROUTER] [REQ-NAVIGATION_LINKS] [REQ-WORKSPACE_MESH_BRIDGE]
    // how: When children are not plain text, caller supplies ariaLabel for accessible new-tab disclosure.
    render(
      <NewTabLink
        href="/mesh"
        ariaLabel="Mesh Sync (opens in new tab)"
        data-testid="custom-label-link"
      >
        <span>Mesh Sync</span>
      </NewTabLink>,
    );
    expect(screen.getByTestId("custom-label-link")).toHaveAttribute(
      "aria-label",
      "Mesh Sync (opens in new tab)",
    );
  });
});
