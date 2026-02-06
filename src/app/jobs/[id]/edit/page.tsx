// [IMPL-JOBS_EDIT_PAGE] [ARCH-JOB_TRACKER_UI] [REQ-JOB_TRACKER_EDIT] [REQ-CONFIG_DRIVEN_APPEARANCE]
// Page for editing a position. Copy, layout, and status badge classes from config.

import { notFound } from "next/navigation";
import Link from "next/link";
import { twMerge } from "tailwind-merge";
import {
  getPositionById,
  getApplicationsByPositionId,
} from "../../../../lib/jobs.data";
import { getJobsConfig, getThemeConfig, getJobsOverride, getStatusBadgeClass } from "../../../../lib/config";
import PositionForm from "../../components/PositionForm";
import ApplicationForm from "../../components/ApplicationForm";
import DeletePositionButton from "../../components/DeletePositionButton";

interface EditPositionPageProps {
  params: Promise<{ id: string }>;
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatStatus(status: string): string {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default async function EditPositionPage({ params }: EditPositionPageProps) {
  const { id } = await params;
  const position = getPositionById(id);
  if (!position) notFound();

  const applications = getApplicationsByPositionId(id);
  const sortedApplications = [...applications].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const jobsConfig = getJobsConfig();
  const theme = getThemeConfig();
  const copy = jobsConfig.copy ?? {};
  const editPageTitle = copy.editPageTitle ?? "Edit Position";
  const backToList = copy.backToList ?? "Back to List";
  const positionDetails = copy.positionDetails ?? "Position Details";
  const applicationsHeading = copy.applications ?? "Applications";
  const statusBadgeClasses: Record<string, string> = {};
  for (const s of ["none", "interested", "to_apply", "applied", "rejected"]) {
    statusBadgeClasses[s] = getStatusBadgeClass(theme, s);
  }

  const jo = theme.jobs?.overrides;
  const pageContainerClass = twMerge(
    "min-h-screen bg-zinc-50 dark:bg-black py-8 px-4 sm:px-6 lg:px-8",
    getJobsOverride(jo, "pageContainer"),
  );
  const cardClass = twMerge(
    "bg-white dark:bg-black rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-6",
    getJobsOverride(jo, "card"),
  );
  const secondaryButtonClass = twMerge(
    "px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-full font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors",
    getJobsOverride(jo, "secondaryButton"),
  );

  const statusOptions =
    jobsConfig.fields.find((f) => f.name === "applicationStatus")?.options ?? [];

  return (
    <div className={pageContainerClass}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              {editPageTitle}
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{position.title}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/jobs" className={secondaryButtonClass}>
              {backToList}
            </Link>
            <DeletePositionButton
              positionId={id}
              label={copy.deleteButton ?? "Delete Position"}
              confirmMessage={copy.deleteConfirm ?? "Are you sure you want to delete this position?"}
              className={getJobsOverride(jo, "dangerButton")}
            />
          </div>
        </div>

        <div className={`mb-8 ${cardClass}`}>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            {positionDetails}
          </h2>
          <PositionForm position={position} positionId={id} copy={copy} />
        </div>

        <div className={cardClass}>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            {applicationsHeading}
          </h2>

          {sortedApplications.length > 0 && (
            <div className="mb-6 space-y-4">
              {sortedApplications.map((app) => (
                <div
                  key={app.id}
                  className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusBadgeClasses[app.status] ?? statusBadgeClasses["none"]}`}
                      >
                        {formatStatus(app.status)}
                      </span>
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        {formatDate(app.date)}
                      </span>
                    </div>
                  </div>
                  {app.notes && (
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-2">{app.notes}</p>
                  )}
                  <div className="mt-3">
                    <ApplicationForm
                      positionId={id}
                      application={app}
                      copy={copy}
                      statusOptions={statusOptions}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
            <ApplicationForm positionId={id} copy={copy} statusOptions={statusOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
