// [IMPL-MESH_GUI] [IMPL-MESH_DEPOT] [ARCH-MESH_LAYERED] [REQ-MESH_GUI]: Per-mesh depots route — IMPL-MESH_GUI_depots
import { MeshDepotsClient } from "../../components/MeshDepotsClient";

type Props = { params: Promise<{ meshId: string }> };

export default async function MeshDepotsPage({ params }: Props) {
  const { meshId } = await params;
  return <MeshDepotsClient meshId={meshId} />;
}
