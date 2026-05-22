// [IMPL-MESH_GUI] [REQ-MESH_IMPORT_EXPORT] [REQ-MESH_GUI]: Mesh export route — thin server wrapper for MeshExportClient
import { MeshExportClient } from "../../components/MeshExportClient";

type Props = { params: Promise<{ meshId: string }> };

export default async function MeshExportPage({ params }: Props) {
  const { meshId } = await params;
  return <MeshExportClient meshId={meshId} />;
}
