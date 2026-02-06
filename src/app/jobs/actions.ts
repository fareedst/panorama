"use server";

// [IMPL-JOBS_ACTIONS] [ARCH-JOB_TRACKER_UI] [REQ-JOB_TRACKER_CRUD]
// Server Actions for CRUD operations on positions and applications.
// Server Actions enable form submissions and mutations without API routes.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  getPositionById,
  savePosition,
  deletePosition as deletePositionData,
  saveApplication,
  deleteApplication as deleteApplicationData,
  getApplicationById,
} from "../../lib/jobs.data";
import type { Position, Application, ApplicationStatus } from "../../lib/jobs.types";

// ---------------------------------------------------------------------------
// Position Actions
// ---------------------------------------------------------------------------

/**
 * Creates a new position from form data.
 *
 * [IMPL-JOBS_ACTIONS] [ARCH-JOB_TRACKER_UI] [REQ-JOB_TRACKER_CRUD]
 */
export async function createPosition(formData: FormData): Promise<void> {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  
  const urls: string[] = [];
  const urlInputs = formData.getAll("urls[]");
  for (const url of urlInputs) {
    const urlStr = url.toString().trim();
    if (urlStr) {
      urls.push(urlStr);
    }
  }
  
  const position: Position = {
    id,
    title: formData.get("title")?.toString() || "",
    postingDate: formData.get("postingDate")?.toString() || "",
    urls,
    description: formData.get("description")?.toString() || "",
    notes: formData.get("notes")?.toString() || "",
    createdAt: now,
    updatedAt: now,
  };
  
  // Validation
  if (!position.title.trim()) {
    throw new Error("Title is required");
  }
  
  savePosition(position);
  revalidatePath("/jobs");
  redirect("/jobs");
}

/**
 * Updates an existing position from form data.
 *
 * [IMPL-JOBS_ACTIONS] [ARCH-JOB_TRACKER_UI] [REQ-JOB_TRACKER_CRUD]
 */
export async function updatePosition(
  id: string,
  formData: FormData,
): Promise<void> {
  const existing = getPositionById(id);
  if (!existing) {
    throw new Error("Position not found");
  }
  
  const urls: string[] = [];
  const urlInputs = formData.getAll("urls[]");
  for (const url of urlInputs) {
    const urlStr = url.toString().trim();
    if (urlStr) {
      urls.push(urlStr);
    }
  }
  
  const position: Position = {
    ...existing,
    title: formData.get("title")?.toString() || "",
    postingDate: formData.get("postingDate")?.toString() || "",
    urls,
    description: formData.get("description")?.toString() || "",
    notes: formData.get("notes")?.toString() || "",
    updatedAt: new Date().toISOString(),
  };
  
  // Validation
  if (!position.title.trim()) {
    throw new Error("Title is required");
  }
  
  savePosition(position);
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${id}/edit`);
}

/**
 * Deletes a position and all its applications.
 *
 * [IMPL-JOBS_ACTIONS] [ARCH-JOB_TRACKER_UI] [REQ-JOB_TRACKER_CRUD]
 */
export async function deletePosition(id: string): Promise<void> {
  deletePositionData(id);
  revalidatePath("/jobs");
  redirect("/jobs");
}

// ---------------------------------------------------------------------------
// Application Actions
// ---------------------------------------------------------------------------

/**
 * Creates a new application for a position.
 *
 * [IMPL-JOBS_ACTIONS] [ARCH-JOB_TRACKER_UI] [REQ-JOB_TRACKER_CRUD]
 */
export async function createApplication(
  positionId: string,
  formData: FormData,
): Promise<void> {
  const position = getPositionById(positionId);
  if (!position) {
    throw new Error("Position not found");
  }
  
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  
  const application: Application = {
    id,
    positionId,
    status: (formData.get("status")?.toString() || "none") as ApplicationStatus,
    date: formData.get("date")?.toString() || new Date().toISOString().split("T")[0],
    notes: formData.get("notes")?.toString() || "",
    createdAt: now,
    updatedAt: now,
  };
  
  saveApplication(application);
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${positionId}/edit`);
}

/**
 * Updates an existing application.
 *
 * [IMPL-JOBS_ACTIONS] [ARCH-JOB_TRACKER_UI] [REQ-JOB_TRACKER_CRUD]
 */
export async function updateApplication(
  id: string,
  formData: FormData,
): Promise<void> {
  const existing = getApplicationById(id);
  if (!existing) {
    throw new Error("Application not found");
  }
  
  const application: Application = {
    ...existing,
    status: (formData.get("status")?.toString() || "none") as ApplicationStatus,
    date: formData.get("date")?.toString() || new Date().toISOString().split("T")[0],
    notes: formData.get("notes")?.toString() || "",
    updatedAt: new Date().toISOString(),
  };
  
  saveApplication(application);
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${existing.positionId}/edit`);
}

/**
 * Deletes an application.
 *
 * [IMPL-JOBS_ACTIONS] [ARCH-JOB_TRACKER_UI] [REQ-JOB_TRACKER_CRUD]
 */
export async function deleteApplication(id: string): Promise<void> {
  const application = getApplicationById(id);
  if (!application) {
    throw new Error("Application not found");
  }
  
  const positionId = application.positionId;
  deleteApplicationData(id);
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${positionId}/edit`);
}
