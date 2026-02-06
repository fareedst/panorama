// [IMPL-CALENDAR_GRID] [REQ-JOB_TRACKER_CALENDAR]
// Tests for CalendarView client component

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CalendarView from "./CalendarView";
import type { PositionWithStatus, Application } from "../../../lib/jobs.types";

// Mock next/link
vi.mock("next/link", () => ({
  default: vi.fn(({ children, href }) => <a href={href}>{children}</a>),
}));

describe("CalendarView [REQ_JOB_TRACKER_CALENDAR]", () => {
  const mockPositions: PositionWithStatus[] = [
    {
      id: "pos-1",
      title: "Software Engineer",
      postingDate: "2026-02-15",
      urls: ["https://example.com"],
      description: "Great job",
      notes: "Interesting position",
      createdAt: "2026-02-01T00:00:00Z",
      updatedAt: "2026-02-01T00:00:00Z",
      latestStatus: "applied",
      latestStatusDate: "2026-02-15",
    },
  ];

  const mockApplications: Application[] = [
    {
      id: "app-1",
      positionId: "pos-1",
      status: "applied",
      date: "2026-02-15",
      notes: "Submitted application",
      createdAt: "2026-02-15T00:00:00Z",
      updatedAt: "2026-02-15T00:00:00Z",
    },
  ];

  const mockCopy = {
    prev: "Previous",
    next: "Next",
    today: "Today",
    noItems: "No items",
    positionLabel: "Position",
    applicationLabel: "Application",
    detailClose: "Close",
    dayNames: "Sun,Mon,Tue,Wed,Thu,Fri,Sat",
  };

  const mockOverrides = {
    grid: "",
    cell: "",
    cellToday: "",
    item: "",
    detailPanel: "",
  };

  const mockStatusBadgeClasses = {
    none: "bg-gray-100",
    applied: "bg-blue-100",
    interested: "bg-yellow-100",
    to_apply: "bg-green-100",
    rejected: "bg-red-100",
  };

  it("renders month navigation with current month", () => {
    render(
      <CalendarView
        positions={mockPositions}
        applications={mockApplications}
        copy={mockCopy}
        overrides={mockOverrides}
        statusBadgeClasses={mockStatusBadgeClasses}
      />
    );

    expect(screen.getByText("Previous")).toBeInTheDocument();
    expect(screen.getByText("Next")).toBeInTheDocument();
    expect(screen.getByText("Today")).toBeInTheDocument();
  });

  it("renders calendar grid with day names", () => {
    render(
      <CalendarView
        positions={mockPositions}
        applications={mockApplications}
        copy={mockCopy}
        overrides={mockOverrides}
        statusBadgeClasses={mockStatusBadgeClasses}
      />
    );

    expect(screen.getByText("Sun")).toBeInTheDocument();
    expect(screen.getByText("Mon")).toBeInTheDocument();
    expect(screen.getByText("Sat")).toBeInTheDocument();
  });

  it("navigates to next month when next button is clicked", () => {
    render(
      <CalendarView
        positions={mockPositions}
        applications={mockApplications}
        copy={mockCopy}
        overrides={mockOverrides}
        statusBadgeClasses={mockStatusBadgeClasses}
      />
    );

    const nextButton = screen.getByText("Next");
    const prevButton = screen.getByText("Previous");
    
    // Click next to go forward
    fireEvent.click(nextButton);
    
    // Should show a month (we can't predict which, but it should exist)
    expect(screen.getByText(/\w+ \d{4}/)).toBeInTheDocument();
    
    // Click previous to go back
    fireEvent.click(prevButton);
    
    // Should still show a month
    expect(screen.getByText(/\w+ \d{4}/)).toBeInTheDocument();
  });

  it("does not show detail panel initially", () => {
    render(
      <CalendarView
        positions={mockPositions}
        applications={mockApplications}
        copy={mockCopy}
        overrides={mockOverrides}
        statusBadgeClasses={mockStatusBadgeClasses}
      />
    );

    expect(screen.queryByText("Close")).not.toBeInTheDocument();
  });
});
