// [IMPL-MESH_GUI] [REQ-MESH_GUI] [REQ-MESH_PLATFORM]: Mesh hub route — Policies overview; per-mesh **policy** editing on mesh Rules page
export default function GlobalPoliciesPage() {
  return (
    <div data-testid="global-policies-page">
      <h1 className="mb-4 text-2xl font-semibold">Policies</h1>
      <p className="text-sm text-zinc-400">
        Per-mesh delete, conflict, and verification policies are edited on each mesh Rules page.
      </p>
    </div>
  );
}
