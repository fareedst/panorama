// [IMPL-JOBS_LIST_PAGE] [ARCH-JOB_TRACKER_UI] [REQ-JOB_TRACKER_LIST] [REQ-CONFIG_DRIVEN_APPEARANCE]
// Table component displaying all positions. Copy and status badge classes
// come from config via props (no hard-coded strings or color logic).

import Link from "next/link";
import { twMerge } from "tailwind-merge";
import type { PositionWithStatus } from "../../../lib/jobs.types";
import type { JobsFieldConfig } from "../../../lib/config.types";

interface JobsTableCopy {
  emptyTitle: string;
  emptyLink: string;
  editLink: string;
}

interface JobsTableProps {
  positions: PositionWithStatus[];
  copy: JobsTableCopy;
  statusBadgeClasses: Record<string, string>;
  tableFields: JobsFieldConfig[];
  tableClassName?: string;
  tableHeaderClassName?: string;
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

function formatStatus(status: string | undefined): string {
  if (!status || status === "none") return "-";
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Maps field name to position value for table cell. */
function getCellValue(position: PositionWithStatus, fieldName: string): string | undefined {
  switch (fieldName) {
    case "title":
      return position.title;
    case "postingDate":
      return formatDate(position.postingDate);
    case "applicationStatus":
      return position.latestStatus ? formatStatus(position.latestStatus) : "-";
    case "statusDate":
      return formatDate(position.latestStatusDate);
    default:
      return undefined;
  }
}

const defaultTableClass = "min-w-full divide-y divide-zinc-200 dark:divide-zinc-800";
const defaultTheadClass = "bg-zinc-50 dark:bg-zinc-900";
const defaultThClass = "px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider";

export default function JobsTable({
  positions,
  copy,
  statusBadgeClasses,
  tableFields,
  tableClassName,
  tableHeaderClassName,
}: JobsTableProps) {
  if (positions.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-600 dark:text-zinc-400">
        <p className="text-lg">{copy.emptyTitle}</p>
        <p className="mt-2">
          <Link href="/jobs/new" className="text-blue-600 dark:text-blue-400 hover:underline">
            {copy.emptyLink}
          </Link>
        </p>
      </div>
    );
  }

  const tableClass = twMerge(defaultTableClass, tableClassName ?? "");
  const theadClass = twMerge(defaultTheadClass, tableHeaderClassName ?? "");
  const defaultBadgeClass = statusBadgeClasses["none"] ?? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";

  return (
    <div className="overflow-x-auto">
      <table className={tableClass}>
        <thead className={theadClass}>
          <tr>
            {tableFields.map((field) => (
              <th key={field.name} scope="col" className={defaultThClass}>
                {field.label}
              </th>
            ))}
            <th scope="col" className={`${defaultThClass} text-right`}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-black divide-y divide-zinc-200 dark:divide-zinc-800">
          {positions.map((position) => (
            <tr
              key={position.id}
              className="hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
            >
              {tableFields.map((field) => (
                <td key={field.name} className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                  {field.name === "title" ? (
                    <>
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">
                        {position.title}
                      </div>
                      {position.urls.length > 0 && (
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                          {position.urls[0]}
                        </div>
                      )}
                    </>
                  ) : field.name === "applicationStatus" && position.latestStatus ? (
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        statusBadgeClasses[position.latestStatus] ?? defaultBadgeClass
                      }`}
                    >
                      {formatStatus(position.latestStatus)}
                    </span>
                  ) : (
                    getCellValue(position, field.name) ?? "-"
                  )}
                </td>
              ))}
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <Link
                  href={`/jobs/${position.id}/edit`}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                >
                  {copy.editLink}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
