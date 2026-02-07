// [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]
// Progress dialog for bulk operations

"use client";

import type { OperationResult } from "@/lib/files.types";

interface ProgressDialogProps {
  /** Dialog title */
  title: string;
  /** Total number of files */
  total: number;
  /** Number of files completed */
  completed: number;
  /** Current file being processed */
  currentFile: string;
  /** Array of errors encountered */
  errors: Array<{ file: string; error: string }>;
  /** Whether operation is complete */
  isComplete: boolean;
  /** Operation result (only set when complete) */
  result?: OperationResult;
  /** Whether dialog is open */
  isOpen: boolean;
  /** Callback when user closes (only available when complete) */
  onClose?: () => void;
}

/**
 * ProgressDialog - Shows progress for bulk operations
 * [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]
 */
export default function ProgressDialog({
  title,
  total,
  completed,
  currentFile,
  errors,
  isComplete,
  result,
  isOpen,
  onClose,
}: ProgressDialogProps) {
  if (!isOpen) return null;
  
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70" />
      
      {/* Dialog */}
      <div className="relative bg-white dark:bg-zinc-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Title */}
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          {title}
        </h2>
        
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            <span>{completed} / {total} files</span>
            <span>{percentage}%</span>
          </div>
          <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
        
        {/* Current file */}
        {!isComplete && currentFile && (
          <div className="mb-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
              Processing:
            </p>
            <p className="text-sm font-mono text-zinc-900 dark:text-zinc-100 truncate">
              {currentFile}
            </p>
          </div>
        )}
        
        {/* Errors */}
        {errors && errors.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm font-semibold text-red-900 dark:text-red-200 mb-2">
              {errors.length} error{errors.length > 1 ? "s" : ""} occurred:
            </p>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {errors.map((err, idx) => (
                <p key={idx} className="text-xs font-mono text-red-800 dark:text-red-300">
                  {err.file}: {err.error}
                </p>
              ))}
            </div>
          </div>
        )}
        
        {/* Result summary (when complete) */}
        {isComplete && result && (
          <div className="mb-4 p-3 bg-zinc-100 dark:bg-zinc-700 rounded-md">
            <p className="text-sm text-zinc-900 dark:text-zinc-100">
              <span className="font-semibold text-green-600 dark:text-green-400">
                {result.successCount} successful
              </span>
              {result.errorCount > 0 && (
                <>
                  {", "}
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    {result.errorCount} failed
                  </span>
                </>
              )}
            </p>
          </div>
        )}
        
        {/* Close button (only when complete) */}
        {isComplete && onClose && (
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 
                       text-white font-medium transition-colors"
            >
              Close
            </button>
          </div>
        )}
        
        {/* In-progress indicator */}
        {!isComplete && (
          <div className="flex items-center justify-center pt-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
            <span className="ml-3 text-sm text-zinc-600 dark:text-zinc-400">
              Operation in progress...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
