// [IMPL-MESH_GUI] [REQ-MESH_PLATFORM]: **Topology** projection route
import { TopologyGraphClient } from "../../components/TopologyGraphClient";

type Props = { params: Promise<{ meshId: string }> };

export default async function TopologyPage({ params }: Props) {
  const { meshId } = await params;
  return <TopologyGraphClient meshId={meshId} />;
}
