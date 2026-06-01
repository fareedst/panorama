// [IMPL-MESH_GUI] [REQ-MESH_PLATFORM]: Mesh list page

import { getFilesConfig } from "@/lib/config";
import { MeshListClient } from "./components/MeshListClient";

export default function MeshListPage() {
  const workspaceMeshCopy = getFilesConfig().copy?.workspaceMesh;
  return <MeshListClient workspaceMeshCopy={workspaceMeshCopy} />;
}
