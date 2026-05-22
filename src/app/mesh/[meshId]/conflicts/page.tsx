// [IMPL-MESH_GUI] [REQ-MESH_PLATFORM]: **Conflicts** list route
import { ConflictsClient } from "../../components/ConflictsClient";

type Props = { params: Promise<{ meshId: string }> };

export default async function ConflictsPage({ params }: Props) {
  const { meshId } = await params;
  return <ConflictsClient meshId={meshId} />;
}
