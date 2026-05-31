// [IMPL-CONFIG_DRIVEN_APPEARANCE] [ARCH-CONFIG_DRIVEN_APPEARANCE] [REQ-CONFIG_DRIVEN_APPEARANCE]: Theme-driven file row icon from files.fileTypes

import {
  resolveFileTypeConfig,
  type FileTypesMap,
} from "@/lib/file-type-config";

export interface FileTypeIconProps {
  fileTypes: FileTypesMap;
  filename: string;
  isDirectory: boolean;
  className?: string;
}

export function FileTypeIcon({
  fileTypes,
  filename,
  isDirectory,
  className = "",
}: FileTypeIconProps) {
  const { icon, iconClass } = resolveFileTypeConfig(
    fileTypes,
    filename,
    isDirectory,
  );

  return (
    <span
      data-testid="file-type-icon"
      aria-hidden
      className={`${iconClass} ${className}`.trim()}
    >
      {icon}
    </span>
  );
}
