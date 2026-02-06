// [IMPL-JOBS_API] [ARCH-APP_ROUTER] [REQ-JOB_TRACKER_CRUD]
// API route for reading, updating, and deleting a single position.
// GET    /api/jobs/[id]  – returns a single position with applications
// PUT    /api/jobs/[id]  – updates a position
// DELETE /api/jobs/[id]  – deletes a position and its applications

import { NextResponse } from "next/server";
import {
  getPositionById,
  savePosition,
  deletePosition,
  getApplicationsByPositionId,
} from "../../../../lib/jobs.data";
import type { Position, PositionWithStatus } from "../../../../lib/jobs.types";

/**
 * GET /api/jobs/[id] - Get a single position with its applications
 * [IMPL-JOBS_API] [REQ-JOB_TRACKER_LIST]
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const position = getPositionById(id);
  
  if (!position) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  
  const applications = getApplicationsByPositionId(id);
  const latestApp = applications
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  
  const positionWithStatus: PositionWithStatus = {
    ...position,
    latestStatus: latestApp?.status,
    latestStatusDate: latestApp?.date,
    applications,
  };
  
  return NextResponse.json(positionWithStatus);
}

/**
 * PUT /api/jobs/[id] - Update a position
 * [IMPL-JOBS_API] [REQ-JOB_TRACKER_CRUD]
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const existingPosition = getPositionById(id);
  
  if (!existingPosition) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  
  try {
    const body = await request.json();
    
    const updatedPosition: Position = {
      ...existingPosition,
      title: body.title ?? existingPosition.title,
      postingDate: body.postingDate ?? existingPosition.postingDate,
      urls: body.urls ?? existingPosition.urls,
      description: body.description ?? existingPosition.description,
      notes: body.notes ?? existingPosition.notes,
      updatedAt: new Date().toISOString(),
    };
    
    savePosition(updatedPosition);
    return NextResponse.json(updatedPosition);
  } catch (error) {
    console.error("Error updating position:", error);
    return NextResponse.json(
      { error: "Failed to update position" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/jobs/[id] - Delete a position and its applications
 * [IMPL-JOBS_API] [REQ-JOB_TRACKER_CRUD]
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const position = getPositionById(id);
  
  if (!position) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  
  try {
    deletePosition(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting position:", error);
    return NextResponse.json(
      { error: "Failed to delete position" },
      { status: 500 }
    );
  }
}
