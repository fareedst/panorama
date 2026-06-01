"use client";

// [IMPL-WORKSPACE_MESH_BRIDGE] [ARCH-WORKSPACE_MESH_BRIDGE] [REQ-WORKSPACE_MESH_BRIDGE]: FILES_STARTUP_MESH_GATE — validate localStorage startup mesh and redirect to /files?meshId=

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  clearFilesStartupMeshId,
  getFilesStartupMeshId,
} from "@/lib/files-startup-mesh";

type GatePhase = "checking" | "ready";

export function FilesStartupMeshGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const meshIdFromUrl = searchParams.get("meshId");
  const [phase, setPhase] = useState<GatePhase>(() => {
    if (meshIdFromUrl) {
      return "ready";
    }
    if (!getFilesStartupMeshId()) {
      return "ready";
    }
    return "checking";
  });

  useEffect(() => {
    if (meshIdFromUrl) {
      return;
    }

    const pref = getFilesStartupMeshId();
    if (!pref) {
      return;
    }

    const startupMeshId = pref;
    let cancelled = false;

    async function validateAndRedirect() {
      try {
        const res = await fetch(`/api/mesh/${encodeURIComponent(startupMeshId)}`);
        if (cancelled) {
          return;
        }
        if (res.ok) {
          console.debug("DEBUG: files startup mesh redirect", startupMeshId);
          router.replace(`/files?meshId=${encodeURIComponent(startupMeshId)}`);
          return;
        }
        console.debug("DEBUG: files startup mesh invalid; clearing preference", startupMeshId);
        clearFilesStartupMeshId();
        setPhase("ready");
      } catch {
        if (!cancelled) {
          console.debug("DEBUG: files startup mesh validation failed; clearing preference", startupMeshId);
          clearFilesStartupMeshId();
          setPhase("ready");
        }
      }
    }

    void validateAndRedirect();

    return () => {
      cancelled = true;
    };
  }, [meshIdFromUrl, router]);

  if (meshIdFromUrl || phase === "ready") {
    return <>{children}</>;
  }

  return (
    <div
      className="flex min-h-[12rem] items-center justify-center text-sm text-zinc-500"
      data-testid="files-startup-mesh-pending"
      aria-live="polite"
    >
      Restoring workspace…
    </div>
  );
}
