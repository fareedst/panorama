// [IMPL-CALENDAR_PAGE] [REQ-JOB_TRACKER_CALENDAR]
// Tests for calendar page server component

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import CalendarPage from "./page";

// Mock dependencies
vi.mock("../../../lib/jobs.data", () => ({
  getPositions: vi.fn(() => []),
  getApplications: vi.fn(() => []),
}));

vi.mock("../../../lib/config", () => ({
  getJobsConfig: vi.fn(() => ({
    app: { title: "Job Search Tracker", description: "Track positions" },
    fields: [],
    table: { defaultSort: "postingDate", defaultSortDirection: "desc" },
    copy: {
      calendarTitle: "Calendar View",
      calendarSubtitle: "Positions and applications by date",
      calendarBackToList: "Back to List",
      calendarPrev: "Previous",
      calendarNext: "Next",
      calendarToday: "Today",
      calendarNoItems: "No items",
      calendarPositionLabel: "Position",
      calendarApplicationLabel: "Application",
      calendarDetailClose: "Close",
      calendarDayNames: "Sun,Mon,Tue,Wed,Thu,Fri,Sat",
    },
  })),
  getThemeConfig: vi.fn(() => ({
    colors: { light: {}, dark: {} },
    fonts: { sans: {}, mono: {} },
    spacing: {},
    sizing: {},
    overrides: {},
    jobs: { overrides: {}, statusBadges: {} },
  })),
  getJobsOverride: vi.fn(() => ""),
  getStatusBadgeClass: vi.fn(() => ""),
}));

// Mock CalendarView component
vi.mock("./CalendarView", () => ({
  default: vi.fn(() => <div data-testid="calendar-view">Calendar View Component</div>),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: vi.fn(({ children, href }) => <a href={href}>{children}</a>),
}));

describe("CalendarPage [REQ_JOB_TRACKER_CALENDAR]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders calendar page with title and subtitle", () => {
    render(<CalendarPage />);
    
    expect(screen.getByText("Calendar View")).toBeInTheDocument();
    expect(screen.getByText("Positions and applications by date")).toBeInTheDocument();
  });

  it("renders back to list link", () => {
    render(<CalendarPage />);
    
    const backLink = screen.getByText("← Back to List");
    expect(backLink).toBeInTheDocument();
    expect(backLink.closest("a")).toHaveAttribute("href", "/jobs");
  });

  it("renders CalendarView component", () => {
    render(<CalendarPage />);
    
    expect(screen.getByTestId("calendar-view")).toBeInTheDocument();
  });
});
