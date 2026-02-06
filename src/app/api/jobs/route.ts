// [IMPL-JOBS_API] [ARCH-APP_ROUTER] [REQ-JOB_TRACKER_CRUD]
// API route for listing and creating positions.
// GET  /api/jobs  – returns all positions with their latest application status
// POST /api/jobs  – creates a new position

import { NextResponse } from "next/server";
import {
  getPositions,
  savePosition,
  getApplications,
} from "../../../lib/jobs.data";
import type { Position, PositionWithStatus } from "../../../lib/jobs.types";

/**
 * GET /api/jobs - List all positions with their latest application status
 * [IMPL-JOBS_API] [REQ-JOB_TRACKER_LIST]
 */
export async function GET() {
  const positions = getPositions();
  const applications = getApplications();
  
  // Combine positions with their latest application
  const positionsWithStatus: PositionWithStatus[] = positions.map((position) => {
    const positionApps = applications
      .filter((app) => app.positionId === position.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const latestApp = positionApps[0];
    
    return {
      ...position,
      latestStatus: latestApp?.status,
      latestStatusDate: latestApp?.date,
      applications: positionApps,
    };
  });
  
  // Sort by posting date descending
  positionsWithStatus.sort((a, b) => 
    new Date(b.postingDate).getTime() - new Date(a.postingDate).getTime()
  );
  
  return NextResponse.json(positionsWithStatus);
}

/**
 * POST /api/jobs - Create a new position
 * [IMPL-JOBS_API] [REQ-JOB_TRACKER_CRUD]
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.postingDate) {
      return NextResponse.json(
        { error: "Title and postingDate are required" },
        { status: 400 }
      );
    }
    
    const now = new Date().toISOString();
    const position: Position = {
      id: body.id || crypto.randomUUID(),
      title: body.title,
      postingDate: body.postingDate,
      urls: body.urls || [],
      description: body.description || "",
      notes: body.notes || "",
      createdAt: body.createdAt || now,
      updatedAt: now,
    };
    
    savePosition(position);
    return NextResponse.json(position, { status: 201 });
  } catch (error) {
    console.error("Error creating position:", error);
    return NextResponse.json(
      { error: "Failed to create position" },
      { status: 500 }
    );
  }
}
