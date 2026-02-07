// [IMPL-FILE_PREVIEW] [ARCH-PREVIEW_SYSTEM] [REQ-FILE_PREVIEW]
// Info Panel - displays detailed file metadata

"use client";

import { useEffect, useState } from "react";

/**
 * File info metadata interface
 * [IMPL-FILE_PREVIEW] [REQ-FILE_PREVIEW]
 */
export interface FileInfo {
  name: string;
  path: string;
  directory: string;
  extension: string;
  isDirectory: boolean;
  isFile: boolean;
  isSymbolicLink: boolean;
  size: number;
  sizeFormatted: string;
  created: string;
  modified: string;
  accessed: string;
  mode: string;
  uid: number;
  gid: number;
  blocks?: number | null;
  blksize?: number | null;
}

/**
 * InfoPanel component props
 * [IMPL-FILE_PREVIEW] [REQ-FILE_PREVIEW]
 */
export interface InfoPanelProps {
  filePath: string | null;
  onClose: () => void;
}

/**
 * InfoPanel - displays detailed file metadata
 * [IMPL-FILE_PREVIEW] [ARCH-PREVIEW_SYSTEM] [REQ-FILE_PREVIEW]
 * 
 * Fetches and displays detailed file information including:
 * - Name, path, directory
 * - Size, timestamps
 * - Permissions, owner
 * - File type indicators
 */
export function InfoPanel({ filePath, onClose }: InfoPanelProps) {
  const [info, setInfo] = useState<FileInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!filePath) {
      setInfo(null);
      setError(null);
      return;
    }
    
    async function fetchInfo() {
      if (!filePath) return; // Type guard
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/files/info?path=${encodeURIComponent(filePath)}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch file info");
        }
        
        const data = await response.json();
        setInfo(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
    
    fetchInfo();
  }, [filePath]);
  
  if (!filePath) {
    return null;
  }
  
  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-800 border-l border-gray-300 dark:border-gray-700 overflow-y-auto shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-300 dark:border-gray-700">
        <h2 className="text-lg font-bold">File Info</h2>
        <button
          onClick={onClose}
          className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded"
        >
          Close (I)
        </button>
      </div>
      
      {/* Content */}
      <div className="p-4">
        {loading && (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-3 rounded">
            <p className="font-bold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {info && !loading && !error && (
          <div className="space-y-4">
            {/* File name */}
            <div>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Name</h3>
              <p className="font-mono text-sm break-all">{info.name}</p>
            </div>
            
            {/* File type */}
            <div>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Type</h3>
              <p className="text-sm">
                {info.isDirectory && "Directory"}
                {info.isFile && "File"}
                {info.isSymbolicLink && " (Symbolic Link)"}
              </p>
            </div>
            
            {/* Extension */}
            {info.extension !== "(none)" && (
              <div>
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Extension</h3>
                <p className="font-mono text-sm">{info.extension}</p>
              </div>
            )}
            
            {/* Size */}
            <div>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Size</h3>
              <p className="text-sm">{info.sizeFormatted} ({info.size.toLocaleString()} bytes)</p>
            </div>
            
            {/* Path */}
            <div>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Path</h3>
              <p className="font-mono text-xs break-all text-gray-700 dark:text-gray-300">{info.path}</p>
            </div>
            
            {/* Directory */}
            <div>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Directory</h3>
              <p className="font-mono text-xs break-all text-gray-700 dark:text-gray-300">{info.directory}</p>
            </div>
            
            {/* Timestamps */}
            <div>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Modified</h3>
              <p className="text-sm">{new Date(info.modified).toLocaleString()}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Created</h3>
              <p className="text-sm">{new Date(info.created).toLocaleString()}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Accessed</h3>
              <p className="text-sm">{new Date(info.accessed).toLocaleString()}</p>
            </div>
            
            {/* Permissions */}
            <div>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Permissions</h3>
              <p className="font-mono text-sm">{info.mode}</p>
            </div>
            
            {/* Owner */}
            <div>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Owner</h3>
              <p className="text-sm">UID: {info.uid}, GID: {info.gid}</p>
            </div>
            
            {/* Blocks (if available) */}
            {info.blocks !== null && info.blocks !== undefined && (
              <div>
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Disk Usage</h3>
                <p className="text-sm">{info.blocks} blocks (block size: {info.blksize})</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
