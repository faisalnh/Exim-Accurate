import { AnalyticsEntityPage } from "@/components/analytics/AnalyticsEntityPage";

export default async function AnalyticsItemPage({
  params,
}: {
  params: Promise<{ itemCode: string }>;
}) {
  const { itemCode } = await params;
  return <AnalyticsEntityPage type="item" value={decodeURIComponent(itemCode)} />;
}
