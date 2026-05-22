// [IMPL-MESH_GUI] [REQ-MESH_SCHEDULE] [REQ-MESH_GUI]: Per-mesh **schedule** route
import { MeshScheduleClient } from "../../components/MeshScheduleClient";

type Props = { params: Promise<{ meshId: string }> };

export default async function MeshSchedulePage({ params }: Props) {
  const { meshId } = await params;
  return <MeshScheduleClient meshId={meshId} />;
}
