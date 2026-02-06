// [IMPL-JOBS_DATA] [ARCH-JOB_TRACKER_STORAGE] [REQ-JOB_TRACKER_DATA]
// TypeScript interfaces defining the shape of job search tracking data.
// Positions and Applications are separate entities following a relational model.

// ---------------------------------------------------------------------------
// Position Entity
// ---------------------------------------------------------------------------

/** Application status values */
export type ApplicationStatus =
  | "none"
  | "interested"
  | "to_apply"
  | "applied"
  | "rejected";

/** Job position record - core job posting information */
export interface Position {
  /** Unique identifier (UUID) */
  id: string;
  /** Date when position was posted (ISO date string: YYYY-MM-DD) */
  postingDate: string;
  /** Array of URLs (job posting, company page, etc.) */
  urls: string[];
  /** Job title */
  title: string;
  /** Job description */
  description: string;
  /** Free-form notes */
  notes: string;
  /** Creation timestamp (ISO datetime string) */
  createdAt: string;
  /** Last update timestamp (ISO datetime string) */
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Application Entity
// ---------------------------------------------------------------------------

/** Application record - tracks application status for a position */
export interface Application {
  /** Unique identifier (UUID) */
  id: string;
  /** Reference to position ID */
  positionId: string;
  /** Application status */
  status: ApplicationStatus;
  /** Date of status change (ISO date string: YYYY-MM-DD) */
  date: string;
  /** Free-form notes */
  notes: string;
  /** Creation timestamp (ISO datetime string) */
  createdAt: string;
  /** Last update timestamp (ISO datetime string) */
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Combined View Types
// ---------------------------------------------------------------------------

/** Position with its latest application status (for table view) */
export interface PositionWithStatus extends Position {
  /** Latest application status, if any */
  latestStatus?: ApplicationStatus;
  /** Date of latest application status */
  latestStatusDate?: string;
  /** All applications for this position */
  applications?: Application[];
}
