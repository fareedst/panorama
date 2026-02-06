"use client";

// [IMPL-JOBS_EDIT_PAGE] [ARCH-JOB_TRACKER_UI] [REQ-JOB_TRACKER_EDIT] [REQ-CONFIG_DRIVEN_APPEARANCE]
// Form component for creating/editing applications. Copy and status options from config when provided.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Application, ApplicationStatus } from "../../../lib/jobs.types";
import type { JobsCopyConfig } from "../../../lib/config.types";
import type { JobsFieldOption } from "../../../lib/config.types";
import { createApplication, updateApplication, deleteApplication } from "../actions";

const DEFAULT_STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: "none", label: "None" },
  { value: "interested", label: "Interested" },
  { value: "to_apply", label: "To Apply" },
  { value: "applied", label: "Applied" },
  { value: "rejected", label: "Rejected" },
];

interface ApplicationFormProps {
  positionId: string;
  application?: Application;
  onSuccess?: () => void;
  /** Copy from config/jobs.yaml (optional). */
  copy?: Partial<JobsCopyConfig>;
  /** Status select options from config (optional). */
  statusOptions?: JobsFieldOption[];
}

// [IMPL-JOBS_EDIT_PAGE] [ARCH-JOB_TRACKER_UI] [REQ-JOB_TRACKER_EDIT]
// Form component for managing application status with date and notes.
export default function ApplicationForm({
  positionId,
  application,
  onSuccess,
  copy: copyProp,
  statusOptions: statusOptionsProp,
}: ApplicationFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const copy = copyProp ?? {};
  const statusOptions = statusOptionsProp?.length
    ? statusOptionsProp.map((o) => ({ value: o.value as ApplicationStatus, label: o.label }))
    : DEFAULT_STATUS_OPTIONS;

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      try {
        if (application) {
          await updateApplication(application.id, formData);
        } else {
          await createApplication(positionId, formData);
        }
        router.refresh();
        onSuccess?.();
      } catch (error) {
        console.error("Error saving application:", error);
        alert(
          error instanceof Error ? error.message : "Failed to save application",
        );
      }
    });
  };

  const handleDelete = async () => {
    if (!application) return;
    
    startTransition(async () => {
      try {
        await deleteApplication(application.id);
        router.refresh();
        onSuccess?.();
      } catch (error) {
        console.error("Error deleting application:", error);
        alert(
          error instanceof Error ? error.message : "Failed to delete application",
        );
      }
    });
  };

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 space-y-4">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        {application ? (copy.editApplication ?? "Edit Application") : (copy.addApplication ?? "Add Application")}
      </h3>
      
      <form action={handleSubmit} className="space-y-4">
        {/* Status */}
        <div>
          <label
            htmlFor={`status-${application?.id || "new"}`}
            className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2"
          >
            Status
          </label>
          <select
            id={`status-${application?.id || "new"}`}
            name="status"
            defaultValue={application?.status || "none"}
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div>
          <label
            htmlFor={`date-${application?.id || "new"}`}
            className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2"
          >
            Date
          </label>
          <input
            type="date"
            id={`date-${application?.id || "new"}`}
            name="date"
            defaultValue={
              application?.date || new Date().toISOString().split("T")[0]
            }
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Notes */}
        <div>
          <label
            htmlFor={`notes-${application?.id || "new"}`}
            className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2"
          >
            Notes
          </label>
          <textarea
            id={`notes-${application?.id || "new"}`}
            name="notes"
            rows={3}
            defaultValue={application?.notes || ""}
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            placeholder="Application notes..."
          />
        </div>

        {/* Form Actions */}
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 bg-foreground text-background rounded-full text-sm font-medium hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (copy.saving ?? "Saving...") : application ? (copy.updateButton ?? "Update") : (copy.addButton ?? "Add")}
          </button>
          {application && (
            <>
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-full text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Delete
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isPending}
                    className="px-4 py-2 bg-red-600 text-white rounded-full text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    Confirm Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-full text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                  >
                    {copy.cancel ?? "Cancel"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </form>
    </div>
  );
}
