import { SyncSessionClient } from "../../components/SyncSessionClient";

type Props = { params: Promise<{ meshId: string }> };

export default async function SyncPage({ params }: Props) {
  const { meshId } = await params;
  return <SyncSessionClient meshId={meshId} />;
}
