// [IMPL-MESH_GUI] [REQ-MESH_GUI] [REQ-MESH_PLATFORM]: **Sync start** route — executes approved **sync session**
import { SyncSessionClient } from "../../components/SyncSessionClient";

type Props = { params: Promise<{ meshId: string }> };

export default async function SyncPage({ params }: Props) {
  const { meshId } = await params;
  return <SyncSessionClient meshId={meshId} />;
}
