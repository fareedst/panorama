// [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]
// Confirmation dialog for destructive operations

"use client";

import { useEffect } from "react";

interface ConfirmDialogProps {
  /** Dialog title */
  title: string;
  /** Dialog message */
  message: string;
  /** Confirm button text (default: "Confirm") */
  confirmText?: string;
  /** Cancel button text (default: "Cancel") */
  cancelText?: string;
  /** Whether this is a destructive action (uses red styling) */
  destructive?: boolean;
  /** Whether dialog is open */
  isOpen: boolean;
  /** Callback when user confirms */
  onConfirm: () => void;
  /** Callback when user cancels or closes */
  onCancel: () => void;
}

/**
 * ConfirmDialog - Modal dialog for confirming operations
 * [IMPL-BULK_OPS] [ARCH-BATCH_OPERATIONS] [REQ-BULK_FILE_OPS]
 */
export default function ConfirmDialog({
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  destructive = false,
  isOpen,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      } else if (e.key === "Enter") {
        e.preventDefault();
        onConfirm();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onConfirm, onCancel]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/70"
        onClick={onCancel}
      />
      
      {/* Dialog */}
      <div className="relative bg-white dark:bg-zinc-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Title */}
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          {title}
        </h2>
        
        {/* Message */}
        <p className="text-zinc-700 dark:text-zinc-300 mb-6 whitespace-pre-line">
          {message}
        </p>
        
        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-md border border-zinc-300 dark:border-zinc-600 
                     text-zinc-700 dark:text-zinc-300 
                     hover:bg-zinc-100 dark:hover:bg-zinc-700 
                     transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              destructive
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
