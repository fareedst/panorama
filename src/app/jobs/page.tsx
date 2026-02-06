// [IMPL-JOBS_LIST_PAGE] [ARCH-JOB_TRACKER_UI] [REQ-JOB_TRACKER_LIST] [REQ-CONFIG_DRIVEN_APPEARANCE]
// Main jobs page displaying a table of all positions. Layout, copy, and classes
// are driven by config/jobs.yaml and config/theme.yaml.

import Link from "next/link";
import { twMerge } from "tailwind-merge";
import { getPositions, getApplications } from "../../lib/jobs.data";
import { getJobsConfig, getThemeConfig, getJobsOverride, getStatusBadgeClass } from "../../lib/config";
import type { PositionWithStatus } from "../../lib/jobs.types";
import JobsTable from "./components/JobsTable";

/**
 * Combines positions with their latest application status for table display.
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

// [IMPL-JOBS_LIST_PAGE] [REQ-CONFIG_DRIVEN_APPEARANCE]
// Build status badge class map from theme for use in table (server-only).
function buildStatusBadgeClasses(): Record<string, string> {
  const theme = getThemeConfig();
  const statuses = ["none", "interested", "to_apply", "applied", "rejected"];
  const map: Record<string, string> = {};
  for (const s of statuses) {
    map[s] = getStatusBadgeClass(theme, s);
  }
  return map;
}

export default function JobsPage() {
  const jobsConfig = getJobsConfig();
  const theme = getThemeConfig();
  const positionsWithStatuses = combinePositionsWithStatuses();
  const sortedPositions = [...positionsWithStatuses].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  const copy = jobsConfig.copy ?? {};
  const listTitle = copy.listTitle ?? jobsConfig.app.title;
  const listSubtitle = copy.listSubtitle ?? jobsConfig.app.description;
  const addNewButton = copy.addNewButton ?? "Add New Position";
  const emptyTitle = copy.emptyTitle ?? "No positions found.";
  const emptyLink = copy.emptyLink ?? "Create your first position";
  const editLink = copy.editLink ?? "Edit";
  const calendarViewButton = copy.calendarViewButton ?? "Calendar View"; // [REQ-JOB_TRACKER_CALENDAR]

  const jo = theme.jobs?.overrides;
  const pageContainerClass = twMerge(
    "min-h-screen bg-zinc-50 dark:bg-black py-8 px-4 sm:px-6 lg:px-8",
    getJobsOverride(jo, "pageContainer"),
  );
  const innerClass = twMerge("max-w-7xl mx-auto", "");
  const headerTitleClass = "text-3xl font-bold text-zinc-900 dark:text-zinc-100";
  const headerSubtitleClass = "mt-2 text-sm text-zinc-600 dark:text-zinc-400";
  const primaryButtonClass = twMerge(
    "inline-flex items-center justify-center rounded-full bg-foreground px-5 h-12 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium",
    getJobsOverride(jo, "primaryButton"),
  );
  const cardClass = twMerge(
    "bg-white dark:bg-black rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden",
    getJobsOverride(jo, "card"),
  );

  const statusBadgeClasses = buildStatusBadgeClasses();
  const tableFields = jobsConfig.fields.filter((f) => f.showInTable);

  return (
    <div className={pageContainerClass}>
      <div className={innerClass}>
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className={headerTitleClass}>{listTitle}</h1>
            <p className={headerSubtitleClass}>{listSubtitle}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/jobs/calendar" className={twMerge(
              "inline-flex items-center justify-center rounded-full bg-white dark:bg-zinc-900 px-5 h-12 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800 font-medium",
              getJobsOverride(jo, "secondaryButton"),
            )}>
              {calendarViewButton}
            </Link>
            <Link href="/jobs/new" className={primaryButtonClass}>
              {addNewButton}
            </Link>
          </div>
        </div>
        <div className={cardClass}>
          <JobsTable
            positions={sortedPositions}
            copy={{ emptyTitle, emptyLink, editLink }}
            statusBadgeClasses={statusBadgeClasses}
            tableFields={tableFields}
            tableClassName={getJobsOverride(jo, "table")}
            tableHeaderClassName={getJobsOverride(jo, "tableHeader")}
          />
        </div>
      </div>
    </div>
  );
}
