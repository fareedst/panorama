// [IMPL-CONFIG_DRIVEN_APPEARANCE] [IMPL-FILES_CONFIG_COMPLETE] [ARCH-CONFIG_DRIVEN_UI] [REQ-CONFIG_DRIVEN_APPEARANCE] [REQ-FILES_CONFIG_COMPLETE]: Client-safe file type icon resolver — pattern matching without server-only config loader

import type { FileTypeConfig } from "./config.types";

export type FileTypesMap = Record<string, FileTypeConfig>;

/** Default file type icons — mirrors config/theme.yaml files.fileTypes */
export const DEFAULT_FILE_TYPES: FileTypesMap = {
  file: {
    icon: "📄",
    iconClass: "text-gray-500 dark:text-gray-400",
  },
  directory: {
    icon: "📁",
    iconClass: "text-blue-500 dark:text-blue-400",
  },
  image: {
    icon: "🖼️",
    iconClass: "text-green-500 dark:text-green-400",
    patterns: [
      "*.bmp",
      "*.gif",
      "*.heic",
      "*.ico",
      "*.jpeg",
      "*.jpg",
      "*.png",
      "*.svg",
      "*.tif",
      "*.tiff",
      "*.webp",
    ],
  },
  code: {
    icon: "💻",
    iconClass: "text-purple-500 dark:text-purple-400",
    patterns: [
      "*.bash",
      "*.bat",
      "*.c",
      "*.cmd",
      "*.cpp",
      "*.css",
      "*.dart",
      "*.go",
      "*.h",
      "*.htm",
      "*.html",
      "*.java",
      "*.js",
      "*.jsx",
      "*.kt",
      "*.less",
      "*.lua",
      "*.php",
      "*.ps1",
      "*.py",
      "*.rb",
      "*.rs",
      "*.sass",
      "*.scss",
      "*.sh",
      "*.sql",
      "*.svelte",
      "*.swift",
      "*.ts",
      "*.tsx",
      "*.vue",
      "*.zsh",
    ],
  },
  archive: {
    icon: "📦",
    iconClass: "text-orange-500 dark:text-orange-400",
    patterns: [
      "*.7z",
      "*.bz2",
      "*.gz",
      "*.rar",
      "*.tar",
      "*.tgz",
      "*.xz",
      "*.zip",
    ],
  },
  document: {
    icon: "📝",
    iconClass: "text-blue-600 dark:text-blue-300",
    patterns: ["*.doc", "*.docx", "*.md", "*.pdf", "*.rtf", "*.txt"],
  },
  spreadsheet: {
    icon: "📊",
    iconClass: "text-green-600 dark:text-green-300",
    patterns: ["*.csv", "*.xls", "*.xlsx"],
  },
  video: {
    icon: "🎬",
    iconClass: "text-red-500 dark:text-red-400",
    patterns: ["*.avi", "*.mkv", "*.mov", "*.mp4", "*.webm"],
  },
  audio: {
    icon: "🎵",
    iconClass: "text-pink-500 dark:text-pink-400",
    patterns: ["*.flac", "*.m4a", "*.mp3", "*.ogg", "*.wav"],
  },
  config: {
    icon: "⚙️",
    iconClass: "text-gray-600 dark:text-gray-300",
    patterns: [
      ".env",
      ".env.*",
      "*.conf",
      "*.env",
      "*.ini",
      "*.json",
      "*.toml",
      "*.yaml",
      "*.yml",
      "Dockerfile",
      "GNUmakefile",
      "Makefile",
      "docker-compose.yaml",
      "docker-compose.yml",
    ],
  },
};

const FALLBACK_FILE = DEFAULT_FILE_TYPES.file;
const FALLBACK_DIRECTORY = DEFAULT_FILE_TYPES.directory;

// [IMPL-FILES_CONFIG_COMPLETE] [ARCH-CONFIG_DRIVEN_UI] [REQ-FILES_CONFIG_COMPLETE] [REQ-CONFIG_DRIVEN_APPEARANCE]: how: directories always use fileTypes.directory; iterate types skipping directory/file keys; glob pattern to case-insensitive regex; first match wins; fallback fileTypes.file or generic defaults
/**
 * Returns the file type configuration for a given filename.
 * Matches against file type patterns in theme.files.fileTypes.
 */
export function resolveFileTypeConfig(
  fileTypes: FileTypesMap | undefined,
  filename: string,
  isDirectory: boolean,
): { icon: string; iconClass: string } {
  if (isDirectory) {
    return fileTypes?.directory ?? FALLBACK_DIRECTORY;
  }

  if (!fileTypes) return FALLBACK_FILE;

  for (const [typeName, typeConfig] of Object.entries(fileTypes)) {
    if (typeName === "directory" || typeName === "file") continue;
    if (!typeConfig.patterns || typeConfig.patterns.length === 0) continue;

    for (const pattern of typeConfig.patterns) {
      const regex = pattern.replace(/\./g, "\\.").replace(/\*/g, ".*");
      if (new RegExp(`^${regex}$`, "i").test(filename)) {
        return {
          icon: typeConfig.icon,
          iconClass: typeConfig.iconClass,
        };
      }
    }
  }

  return fileTypes.file ?? FALLBACK_FILE;
}
