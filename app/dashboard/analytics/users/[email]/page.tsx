import { AnalyticsEntityPage } from "@/components/analytics/AnalyticsEntityPage";

export default async function AnalyticsUserPage({
  params,
}: {
  params: Promise<{ email: string }>;
}) {
  const { email } = await params;
  return <AnalyticsEntityPage type="user" value={decodeURIComponent(email)} />;
}
