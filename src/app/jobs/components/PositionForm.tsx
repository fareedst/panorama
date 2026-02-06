"use client";

// [IMPL-JOBS_EDIT_PAGE] [ARCH-JOB_TRACKER_UI] [REQ-JOB_TRACKER_EDIT] [REQ-CONFIG_DRIVEN_APPEARANCE]
// Form component for creating/editing positions. Copy from config when provided.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Position } from "../../../lib/jobs.types";
import type { JobsCopyConfig } from "../../../lib/config.types";
import { createPosition, updatePosition } from "../actions";

interface PositionFormProps {
  position?: Position;
  positionId?: string;
  /** Copy from config/jobs.yaml (optional). */
  copy?: Partial<JobsCopyConfig>;
}

// [IMPL-JOBS_EDIT_PAGE] [ARCH-JOB_TRACKER_UI] [REQ-JOB_TRACKER_EDIT]
// Form component with all position fields including dynamic URL list.
export default function PositionForm({
  position,
  positionId,
  copy: copyProp,
}: PositionFormProps) {
  const copy = copyProp ?? {};
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [urls, setUrls] = useState<string[]>(
    position?.urls && position.urls.length > 0 ? position.urls : [""],
  );

  const handleSubmit = async (formData: FormData) => {
    // Add all URLs to form data
    urls.forEach((url) => {
      if (url.trim()) {
        formData.append("urls[]", url.trim());
      }
    });

    startTransition(async () => {
      try {
        if (positionId && position) {
          await updatePosition(positionId, formData);
        } else {
          await createPosition(formData);
        }
      } catch (error) {
        console.error("Error saving position:", error);
        alert(error instanceof Error ? error.message : "Failed to save position");
      }
    });
  };

  const addUrlField = () => {
    setUrls([...urls, ""]);
  };

  const removeUrlField = (index: number) => {
    if (urls.length > 1) {
      setUrls(urls.filter((_, i) => i !== index));
    }
  };

  const updateUrl = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  return (
    <form action={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2"
        >
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          required
          defaultValue={position?.title || ""}
          className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., Senior Software Engineer"
        />
      </div>

      {/* Posting Date */}
      <div>
        <label
          htmlFor="postingDate"
          className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2"
        >
          Posting Date
        </label>
        <input
          type="date"
          id="postingDate"
          name="postingDate"
          defaultValue={position?.postingDate || ""}
          className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* URLs */}
      <div>
        <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
          URLs
        </label>
        <div className="space-y-2">
          {urls.map((url, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => updateUrl(index, e.target.value)}
                className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/job-posting"
              />
              {urls.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeUrlField(index)}
                  className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                {copy.remove ?? "Remove"}
              </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addUrlField}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {copy.addUrl ?? "+ Add URL"}
          </button>
        </div>
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={6}
          defaultValue={position?.description || ""}
          className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
          placeholder="Job description..."
        />
      </div>

      {/* Notes */}
      <div>
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2"
        >
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          defaultValue={position?.notes || ""}
          className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
          placeholder="Additional notes..."
        />
      </div>

      {/* Form Actions */}
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2 bg-foreground text-background rounded-full font-medium hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending
            ? (copy.saving ?? "Saving...")
            : positionId
              ? (copy.updatePosition ?? "Update Position")
              : (copy.createPosition ?? "Create Position")}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border border-zinc-300 dark:border-zinc-700 rounded-full font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
        >
          {copy.cancel ?? "Cancel"}
        </button>
      </div>
    </form>
  );
}
