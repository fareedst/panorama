"use client";

// [IMPL-MESH_GUI] [IMPL-MESH_CRUD] [REQ-MESH_CRUD]: Archive mesh from detail settings

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MeshDetailNav } from "../layout";

export function MeshArchiveClient({ meshId }: { meshId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");

  async function archiveMesh() {
    const res = await fetch(`/api/mesh/${meshId}`, { method: "DELETE" });
    if (res.ok) {
      setMessage("Mesh archived");
      router.push("/mesh");
    }
  }

  return (
    <div data-testid="mesh-archive-settings">
      <MeshDetailNav meshId={meshId} />
      <h1 className="mb-4 text-2xl font-semibold">Archive / delete</h1>
      <button
        type="button"
        onClick={() => void archiveMesh()}
        className="rounded bg-amber-800 px-3 py-2 text-sm"
        data-testid="archive-mesh-btn"
      >
        Archive mesh
      </button>
      {message && <p className="mt-2 text-sm text-green-400">{message}</p>}
    </div>
  );
}
