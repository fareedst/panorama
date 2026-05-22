// [IMPL-MESH_GUI] [REQ-MESH_MONITORING] [REQ-MESH_GUI]: Session history route — lists **sync sessions** for a mesh
import { MeshHistoryClient } from "../../components/MeshHistoryClient";

type Props = { params: Promise<{ meshId: string }> };

export default async function MeshHistoryPage({ params }: Props) {
  const { meshId } = await params;
  return <MeshHistoryClient meshId={meshId} />;
}
