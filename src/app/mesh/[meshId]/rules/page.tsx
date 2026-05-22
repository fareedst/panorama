// [IMPL-MESH_GUI] [IMPL-MESH_POLICY] [REQ-MESH_GUI]: Mesh rules route — **policy** filters and safety flags editor
import { MeshRulesClient } from "../../components/MeshRulesClient";

type Props = { params: Promise<{ meshId: string }> };

export default async function MeshRulesPage({ params }: Props) {
  const { meshId } = await params;
  return <MeshRulesClient meshId={meshId} />;
}
