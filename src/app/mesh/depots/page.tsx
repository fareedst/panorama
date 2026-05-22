// [IMPL-MESH_GUI] [REQ-MESH_GUI]: Global depots overview (links to meshes)

export default function GlobalDepotsPage() {
  return (
    <div data-testid="global-depots-page">
      <h1 className="mb-4 text-2xl font-semibold">Depots</h1>
      <p className="text-sm text-zinc-400">
        Depots are managed per mesh. Open a mesh overview to add local, remote, or virtual
        depots.
      </p>
    </div>
  );
}
