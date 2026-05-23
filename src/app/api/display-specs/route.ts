// [IMPL-DISPLAY_FILTER_API] [REQ-PANE_DISPLAY_FILTER]

import { NextRequest, NextResponse } from "next/server";
import {
  serverCreateDisplaySpec,
  serverDeleteDisplaySpec,
  serverListDisplaySpecs,
  serverMergeDisplaySpecs,
  serverUpdateDisplaySpec,
} from "@/lib/display-spec-store-server";
import type { DisplayFilterSpec } from "@/lib/display-filter.types";
import { logger } from "@/lib/logger";

/** GET /api/display-specs — list all display filter specs */
export async function GET() {
  try {
    const specs = await serverListDisplaySpecs();
    return NextResponse.json({ specs });
  } catch (error) {
    logger.error(["IMPL-DISPLAY_FILTER_API", "REQ-PANE_DISPLAY_FILTER"], "List specs failed", {
      error: String(error),
    });
    return NextResponse.json({ error: "Failed to list display specs" }, { status: 500 });
  }
}

/** POST /api/display-specs — create spec */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await serverCreateDisplaySpec({
      name: body.name,
      description: body.description,
      rules: body.rules ?? [],
    });
    if ("ok" in result && !result.ok) {
      return NextResponse.json({ errors: result.errors }, { status: 400 });
    }
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    logger.error(["IMPL-DISPLAY_FILTER_API"], "Create spec failed", { error: String(error) });
    return NextResponse.json({ error: "Failed to create display spec" }, { status: 500 });
  }
}

/** PATCH /api/display-specs — update by id in body */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const id = body.id as string;
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    const result = await serverUpdateDisplaySpec(id, {
      name: body.name,
      description: body.description,
      rules: body.rules,
    });
    if (!result) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if ("ok" in result && !result.ok) {
      return NextResponse.json({ errors: result.errors }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (error) {
    logger.error(["IMPL-DISPLAY_FILTER_API"], "Update spec failed", { error: String(error) });
    return NextResponse.json({ error: "Failed to update display spec" }, { status: 500 });
  }
}

/** PUT /api/display-specs — merge client catalog (preserves spec ids) */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const specs = (body.specs ?? []) as DisplayFilterSpec[];
    if (!Array.isArray(specs)) {
      return NextResponse.json({ error: "specs array required" }, { status: 400 });
    }
    await serverMergeDisplaySpecs(specs);
    return NextResponse.json({ ok: true, count: specs.length });
  } catch (error) {
    logger.error(["IMPL-DISPLAY_FILTER_API"], "Sync specs failed", { error: String(error) });
    return NextResponse.json({ error: "Failed to sync display specs" }, { status: 500 });
  }
}

/** DELETE /api/display-specs?id= */
export async function DELETE(request: NextRequest) {
  const id =
    request.nextUrl?.searchParams.get("id") ??
    new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  const ok = await serverDeleteDisplaySpec(id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
