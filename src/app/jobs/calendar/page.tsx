// [IMPL-CALENDAR_PAGE] [ARCH-CALENDAR_VIEW] [REQ-JOB_TRACKER_CALENDAR] [REQ-CONFIG_DRIVEN_APPEARANCE]
// Calendar view page displaying positions and applications on a single-month grid.
// Server component loads data and config, renders page shell, passes data to CalendarView client component.

import Link from "next/link";
import { twMerge } from "tailwind-merge";
import { getPositions, getApplications } from "../../../lib/jobs.data";
import { getJobsConfig, getThemeConfig, getJobsOverride, getStatusBadgeClass } from "../../../lib/config";
import type { PositionWithStatus } from "../../../lib/jobs.types";
import CalendarView from "./CalendarView";

/**
 * Combines positions with their latest application status for calendar display.
 * [IMPL-CALENDAR_PAGE] [REQ-JOB_TRACKER_CALENDAR]
 */
function combinePositionsWithStatuses(): PositionWithStatus[] {
  const positions = getPositions();
  const applications = getApplications();

  const applicationsByPosition = new Map<string, typeof applications>();
  for (const app of applications) {
    if (!applicationsByPosition.has(app.positionId)) {
      applicationsByPosition.set(app.positionId, []);
    }
    applicationsByPosition.get(app.positionId)!.push(app);
  }

  for (const [, apps] of applicationsByPosition.entries()) {
    apps.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  return positions.map((position) => {
    const positionApps = applicationsByPosition.get(position.id) || [];
    const latestApp = positionApps[0];
    return {
      ...position,
      latestStatus: latestApp?.status,
      latestStatusDate: latestApp?.date,
      applications: positionApps,
    };
  });
}

/**
 * Build status badge class map from theme for calendar items.
 * [IMPL-CALENDAR_PAGE] [REQ-CONFIG_DRIVEN_APPEARANCE]
 */
function buildStatusBadgeClasses(): Record<string, string> {
  const theme = getThemeConfig();
  const statuses = ["none", "interested", "to_apply", "applied", "rejected"];
  const map: Record<string, string> = {};
  for (const s of statuses) {
    map[s] = getStatusBadgeClass(theme, s);
  }
  return map;
}

// [IMPL-CALENDAR_PAGE] [ARCH-CALENDAR_VIEW] [REQ-JOB_TRACKER_CALENDAR]
// Calendar page server component
export default function CalendarPage() {
  const jobsConfig = getJobsConfig();
  const theme = getThemeConfig();
  const positionsWithStatuses = combinePositionsWithStatuses();
  const applications = getApplications();
  const statusBadgeClasses = buildStatusBadgeClasses();

  const copy = jobsConfig.copy ?? {};
  const calendarTitle = copy.calendarTitle ?? "Calendar View";
  const calendarSubtitle = copy.calendarSubtitle ?? "Positions and applications by date";
  const calendarBackToList = copy.calendarBackToList ?? "Back to List";

  const jo = theme.jobs?.overrides;
  const pageContainerClass = twMerge(
    "min-h-screen bg-zinc-50 dark:bg-black py-8 px-4 sm:px-6 lg:px-8",
    getJobsOverride(jo, "pageContainer"),
  );
  const innerClass = twMerge("max-w-7xl mx-auto", "");
  const headerClass = "mb-8 flex flex-col gap-4";
  const titleClass = "text-3xl font-bold text-zinc-900 dark:text-zinc-100";
  const subtitleClass = "text-sm text-zinc-600 dark:text-zinc-400";
  const backLinkClass = "text-blue-600 dark:text-blue-400 hover:underline text-sm";

  // Extract calendar-specific copy for CalendarView
  const calendarCopy = {
    prev: copy.calendarPrev ?? "Previous",
    next: copy.calendarNext ?? "Next",
    today: copy.calendarToday ?? "Today",
    noItems: copy.calendarNoItems ?? "No items for this day",
    positionLabel: copy.calendarPositionLabel ?? "Position",
    applicationLabel: copy.calendarApplicationLabel ?? "Application",
    detailClose: copy.calendarDetailClose ?? "Close",
    dayNames: copy.calendarDayNames ?? "Sun,Mon,Tue,Wed,Thu,Fri,Sat",
  };

  // Extract calendar-specific overrides for CalendarView
  const calendarOverrides = {
    grid: getJobsOverride(jo, "calendarGrid"),
    cell: getJobsOverride(jo, "calendarCell"),
    cellToday: getJobsOverride(jo, "calendarCellToday"),
    item: getJobsOverride(jo, "calendarItem"),
    detailPanel: getJobsOverride(jo, "calendarDetailPanel"),
  };

  return (
    <div className={pageContainerClass}>
      <div className={innerClass}>
        <div className={headerClass}>
          <Link href="/jobs" className={backLinkClass}>
            ← {calendarBackToList}
          </Link>
          <div>
            <h1 className={titleClass}>{calendarTitle}</h1>
            <p className={subtitleClass}>{calendarSubtitle}</p>
          </div>
        </div>
        <CalendarView
          positions={positionsWithStatuses}
          applications={applications}
          copy={calendarCopy}
          overrides={calendarOverrides}
          statusBadgeClasses={statusBadgeClasses}
        />
      </div>
    </div>
  );
}
