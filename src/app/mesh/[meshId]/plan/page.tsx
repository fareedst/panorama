import { PlanViewClient } from "../../components/PlanViewClient";

type Props = { params: Promise<{ meshId: string }> };

export default async function PlanPage({ params }: Props) {
  const { meshId } = await params;
  return <PlanViewClient meshId={meshId} />;
}
