// [IMPL-MESH_GUI] [REQ-MESH_PLATFORM]: Mesh detail page

import { MeshDetailClient } from "../components/MeshDetailClient";

type Props = { params: Promise<{ meshId: string }> };

export default async function MeshDetailPage({ params }: Props) {
  const { meshId } = await params;
  return <MeshDetailClient meshId={meshId} />;
}
