// [IMPL-MESH_GUI] [REQ-MESH_GUI] [REQ-MESH_PLATFORM]: Mesh hub route — Sync landing (plan approval and sync start happen on each mesh’s Plan / Sync Now pages)
export default function GlobalSyncPage() {
  return (
    <div data-testid="global-sync-page">
      <h1 className="mb-4 text-2xl font-semibold">Sync</h1>
      <p className="text-sm text-zinc-400">
        Start a sync session from a mesh: open the mesh, generate a plan, approve it, then use
        Sync Now.
      </p>
    </div>
  );
}
