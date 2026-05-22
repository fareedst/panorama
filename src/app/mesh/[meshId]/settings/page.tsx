// [IMPL-MESH_GUI] [IMPL-MESH_CRUD] [REQ-MESH_CRUD]: Mesh settings / **archive mesh** route
import { MeshArchiveClient } from "../../components/MeshArchiveClient";

type Props = { params: Promise<{ meshId: string }> };

export default async function MeshDetailSettingsPage({ params }: Props) {
  const { meshId } = await params;
  return <MeshArchiveClient meshId={meshId} />;
}
