// [IMPL-JOBS_EDIT_PAGE] [ARCH-JOB_TRACKER_UI] [REQ-JOB_TRACKER_EDIT] [REQ-CONFIG_DRIVEN_APPEARANCE]
// Page for creating a new position. Layout and copy from config.

import { twMerge } from "tailwind-merge";
import { getJobsConfig, getThemeConfig, getJobsOverride } from "../../../lib/config";
import PositionForm from "../components/PositionForm";

export default function NewPositionPage() {
  const jobsConfig = getJobsConfig();
  const theme = getThemeConfig();
  const copy = jobsConfig.copy ?? {};
  const title = copy.newPageTitle ?? "Add New Position";
  const subtitle = copy.newPageSubtitle ?? "Enter details about a new job position";
  const positionDetails = copy.positionDetails ?? "Position Details";

  const jo = theme.jobs?.overrides;
  const pageContainerClass = twMerge(
    "min-h-screen bg-zinc-50 dark:bg-black py-8 px-4 sm:px-6 lg:px-8",
    getJobsOverride(jo, "pageContainer"),
  );
  const cardClass = twMerge(
    "bg-white dark:bg-black rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-6",
    getJobsOverride(jo, "card"),
  );

  return (
    <div className={pageContainerClass}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{title}</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{subtitle}</p>
        </div>
        <div className={cardClass}>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            {positionDetails}
          </h2>
          <PositionForm copy={copy} />
        </div>
      </div>
    </div>
  );
}
