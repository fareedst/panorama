// [IMPL-FILE_PREVIEW] [ARCH-PREVIEW_SYSTEM] [REQ-FILE_PREVIEW]
// Preview Panel - displays file content preview (text, image, archive)

"use client";

import { useEffect, useState } from "react";

/**
 * Preview content types
 * [IMPL-FILE_PREVIEW] [REQ-FILE_PREVIEW]
 */
export type PreviewType = "text" | "image" | "archive" | "binary";

/**
 * Text preview response
 * [IMPL-FILE_PREVIEW] [REQ-FILE_PREVIEW]
 */
export interface TextPreview {
  type: "text";
  content: string;
  truncated: boolean;
  originalSize: number;
}

/**
 * Image preview response
 * [IMPL-FILE_PREVIEW] [REQ-FILE_PREVIEW]
 */
export interface ImagePreview {
  type: "image";
  name: string;
  path: string;
  size: number;
  extension: string;
  url: string;
}

/**
 * Archive preview response
 * [IMPL-FILE_PREVIEW] [REQ-FILE_PREVIEW]
 */
export interface ArchivePreview {
  type: "archive";
  name: string;
  path: string;
  size: number;
  extension: string;
  message: string;
}

/**
 * Preview response union type
 * [IMPL-FILE_PREVIEW] [REQ-FILE_PREVIEW]
 */
export type PreviewResponse = TextPreview | ImagePreview | ArchivePreview;

/**
 * PreviewPanel component props
 * [IMPL-FILE_PREVIEW] [REQ-FILE_PREVIEW]
 */
export interface PreviewPanelProps {
  filePath: string | null;
  onClose: () => void;
}

/**
 * PreviewPanel - displays file content preview
 * [IMPL-FILE_PREVIEW] [ARCH-PREVIEW_SYSTEM] [REQ-FILE_PREVIEW]
 * 
 * Fetches and displays file preview for:
 * - Text files (up to 100KB)
 * - Image files (thumbnail)
 * - Archive files (stub - contents listing not yet implemented)
 */
export function PreviewPanel({ filePath, onClose }: PreviewPanelProps) {
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!filePath) {
      setPreview(null);
      setError(null);
      return;
    }
    
    async function fetchPreview() {
      if (!filePath) return; // Type guard
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/files/preview?path=${encodeURIComponent(filePath)}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch preview");
        }
        
        const data = await response.json();
        setPreview(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
    
    fetchPreview();
  }, [filePath]);
  
  if (!filePath) {
    return null;
  }
  
  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 border-l border-gray-300 dark:border-gray-700 overflow-y-auto shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-300 dark:border-gray-700">
        <h2 className="text-lg font-bold">File Preview</h2>
        <button
          onClick={onClose}
          className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded"
        >
          Close (Q)
        </button>
      </div>
      
      {/* Content */}
      <div className="p-4">
        {loading && (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">Loading preview...</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-3 rounded">
            <p className="font-bold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {preview && !loading && !error && (
          <>
            {preview.type === "text" && (
              <div>
                {preview.truncated && (
                  <div className="mb-3 p-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded text-sm">
                    <p>
                      <strong>Note:</strong> File truncated to 100KB. 
                      Original size: {(preview.originalSize / 1024).toFixed(1)} KB
                    </p>
                  </div>
                )}
                
                <div className="bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-auto">
                  <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                    {preview.content}
                  </pre>
                </div>
              </div>
            )}
            
            {preview.type === "image" && (
              <div>
                <div className="mb-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Name:</strong> {preview.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Size:</strong> {(preview.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                
                <div className="border border-gray-300 dark:border-gray-700 rounded p-2 bg-gray-50 dark:bg-gray-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview.url}
                    alt={preview.name}
                    className="max-w-full h-auto"
                  />
                </div>
                
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  Image preview displayed. Click to view full size in external app.
                </p>
              </div>
            )}
            
            {preview.type === "archive" && (
              <div>
                <div className="mb-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Name:</strong> {preview.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Size:</strong> {(preview.size / 1024).toFixed(1)} KB
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Type:</strong> Archive {preview.extension}
                  </p>
                </div>
                
                <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 p-3 rounded">
                  <p className="text-sm">{preview.message}</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
