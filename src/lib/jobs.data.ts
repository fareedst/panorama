// [IMPL-JOBS_DATA] [ARCH-JOB_TRACKER_STORAGE] [REQ-JOB_TRACKER_DATA]
// Data access layer for job search tracking. Reads and writes YAML files
// following the same pattern as the config loader. Server-only module.

import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import type { Position, Application } from "./jobs.types";

// ---------------------------------------------------------------------------
// File paths
// ---------------------------------------------------------------------------

const POSITIONS_FILE = "data/positions.yaml";
const APPLICATIONS_FILE = "data/applications.yaml";

// ---------------------------------------------------------------------------
// YAML file reader
// ---------------------------------------------------------------------------

/**
 * Reads and parses a YAML file. Returns an empty array if the file
 * does not exist (so we can start with empty data).
 */
// [IMPL-JOBS_DATA] File reader with graceful fallback
function readYamlArray<T>(filePath: string): T[] {
  try {
    const absolutePath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(absolutePath)) {
      return [];
    }
    const raw = fs.readFileSync(absolutePath, "utf-8");
    const parsed = yaml.load(raw);
    if (Array.isArray(parsed)) {
      return parsed as T[];
    }
    return [];
  } catch {
    // File doesn't exist or is unreadable – return empty array
    return [];
  }
}

/**
 * Writes data to a YAML file. Creates directory if it doesn't exist.
 */
// [IMPL-JOBS_DATA] File writer with directory creation
function writeYamlArray<T>(filePath: string, data: T[]): void {
  const absolutePath = path.resolve(process.cwd(), filePath);
  const dir = path.dirname(absolutePath);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const yamlContent = yaml.dump(data, {
    indent: 2,
    lineWidth: -1, // No line wrapping
    sortKeys: false,
  });
  
  fs.writeFileSync(absolutePath, yamlContent, "utf-8");
}

// ---------------------------------------------------------------------------
// Module-level cache
// ---------------------------------------------------------------------------

let _positionsCache: Position[] | null = null;
let _applicationsCache: Application[] | null = null;

// ---------------------------------------------------------------------------
// Public API - Positions
// ---------------------------------------------------------------------------

/**
 * Returns all positions from data/positions.yaml.
 * Result is cached at module level.
 *
 * [IMPL-JOBS_DATA] [ARCH-JOB_TRACKER_STORAGE] [REQ-JOB_TRACKER_DATA]
 */
export function getPositions(): Position[] {
  if (_positionsCache) return _positionsCache;
  _positionsCache = readYamlArray<Position>(POSITIONS_FILE);
  return _positionsCache;
}

/**
 * Saves a position to data/positions.yaml.
 * Updates cache and writes to file.
 *
 * [IMPL-JOBS_DATA] [ARCH-JOB_TRACKER_STORAGE] [REQ-JOB_TRACKER_DATA]
 */
export function savePosition(position: Position): void {
  const positions = getPositions();
  const index = positions.findIndex((p) => p.id === position.id);
  
  if (index >= 0) {
    // Update existing
    positions[index] = position;
  } else {
    // Add new
    positions.push(position);
  }
  
  writeYamlArray(POSITIONS_FILE, positions);
  _positionsCache = positions;
}

/**
 * Deletes a position by ID.
 * Also deletes all related applications.
 *
 * [IMPL-JOBS_DATA] [ARCH-JOB_TRACKER_STORAGE] [REQ-JOB_TRACKER_DATA]
 */
export function deletePosition(id: string): void {
  const positions = getPositions().filter((p) => p.id !== id);
  writeYamlArray(POSITIONS_FILE, positions);
  _positionsCache = positions;
  
  // Delete related applications
  const applications = getApplications().filter((a) => a.positionId !== id);
  writeYamlArray(APPLICATIONS_FILE, applications);
  _applicationsCache = applications;
}

/**
 * Gets a single position by ID.
 *
 * [IMPL-JOBS_DATA] [ARCH-JOB_TRACKER_STORAGE] [REQ-JOB_TRACKER_DATA]
 */
export function getPositionById(id: string): Position | undefined {
  return getPositions().find((p) => p.id === id);
}

// ---------------------------------------------------------------------------
// Public API - Applications
// ---------------------------------------------------------------------------

/**
 * Returns all applications from data/applications.yaml.
 * Result is cached at module level.
 *
 * [IMPL-JOBS_DATA] [ARCH-JOB_TRACKER_STORAGE] [REQ-JOB_TRACKER_DATA]
 */
export function getApplications(): Application[] {
  if (_applicationsCache) return _applicationsCache;
  _applicationsCache = readYamlArray<Application>(APPLICATIONS_FILE);
  return _applicationsCache;
}

/**
 * Gets applications for a specific position.
 *
 * [IMPL-JOBS_DATA] [ARCH-JOB_TRACKER_STORAGE] [REQ-JOB_TRACKER_DATA]
 */
export function getApplicationsByPositionId(
  positionId: string,
): Application[] {
  return getApplications().filter((a) => a.positionId === positionId);
}

/**
 * Saves an application to data/applications.yaml.
 * Updates cache and writes to file.
 *
 * [IMPL-JOBS_DATA] [ARCH-JOB_TRACKER_STORAGE] [REQ-JOB_TRACKER_DATA]
 */
export function saveApplication(application: Application): void {
  const applications = getApplications();
  const index = applications.findIndex((a) => a.id === application.id);
  
  if (index >= 0) {
    // Update existing
    applications[index] = application;
  } else {
    // Add new
    applications.push(application);
  }
  
  writeYamlArray(APPLICATIONS_FILE, applications);
  _applicationsCache = applications;
}

/**
 * Deletes an application by ID.
 *
 * [IMPL-JOBS_DATA] [ARCH-JOB_TRACKER_STORAGE] [REQ-JOB_TRACKER_DATA]
 */
export function deleteApplication(id: string): void {
  const applications = getApplications().filter((a) => a.id !== id);
  writeYamlArray(APPLICATIONS_FILE, applications);
  _applicationsCache = applications;
}

/**
 * Gets a single application by ID.
 *
 * [IMPL-JOBS_DATA] [ARCH-JOB_TRACKER_STORAGE] [REQ-JOB_TRACKER_DATA]
 */
export function getApplicationById(id: string): Application | undefined {
  return getApplications().find((a) => a.id === id);
}

// ---------------------------------------------------------------------------
// Cache management (for testing)
// ---------------------------------------------------------------------------

/** @internal Reset cached data – used only in tests */
export function _resetJobsCache(): void {
  _positionsCache = null;
  _applicationsCache = null;
}
