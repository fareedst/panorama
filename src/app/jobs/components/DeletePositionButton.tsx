"use client";

// [IMPL-JOBS_EDIT_PAGE] [ARCH-JOB_TRACKER_UI] [REQ-JOB_TRACKER_EDIT] [REQ-CONFIG_DRIVEN_APPEARANCE]
// Delete position button. Label and confirm message from config; optional class override.

import { twMerge } from "tailwind-merge";
import { deletePosition } from "../actions";

interface DeletePositionButtonProps {
  positionId: string;
  label?: string;
  confirmMessage?: string;
  /** Optional Tailwind classes (merged with default). */
  className?: string;
}

const defaultButtonClass =
  "px-4 py-2 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition-colors";

export default function DeletePositionButton({
  positionId,
  label = "Delete Position",
  confirmMessage = "Are you sure you want to delete this position?",
  className,
}: DeletePositionButtonProps) {
  const buttonClass = className ? twMerge(defaultButtonClass, className) : defaultButtonClass;

  return (
    <form action={deletePosition.bind(null, positionId)}>
      <button
        type="submit"
        className={buttonClass}
        onClick={(e) => {
          if (!confirm(confirmMessage)) e.preventDefault();
        }}
      >
        {label}
      </button>
    </form>
  );
}
