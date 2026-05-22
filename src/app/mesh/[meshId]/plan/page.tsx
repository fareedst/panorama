// [IMPL-MESH_GUI] [REQ-MESH_GUI] [REQ-MESH_PLATFORM]: **Dry-run plan** and **plan approval** route (execution on Sync Now page)
import { PlanViewClient } from "../../components/PlanViewClient";

type Props = { params: Promise<{ meshId: string }> };

export default async function PlanPage({ params }: Props) {
  const { meshId } = await params;
  return <PlanViewClient meshId={meshId} />;
}
