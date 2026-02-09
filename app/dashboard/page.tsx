"use client";

import { useState, useEffect } from "react";
import {
  Title,
  Text,
  SimpleGrid,
  Stack,
  Group,
  Paper,
  Box,
  useMantineColorScheme,
  Skeleton,
  Badge,
  ThemeIcon,
  Anchor,
  rem,
} from "@mantine/core";
import {
  IconFileExport,
  IconFileImport,
  IconPlugConnected,
  IconCalendarStats,
  IconArrowUpRight,
  IconArrowDownRight,
  IconDatabase,
  IconActivity,
} from "@tabler/icons-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { StatsCard } from "@/components/ui/StatsCard";
import {
  QuickActions,
  defaultQuickActions,
} from "@/components/ui/QuickActions";
import { ActivityCard, ActivityItem } from "@/components/ui/ActivityTimeline";
import { EmptyState } from "@/components/ui/EmptyState";

interface DashboardStats {
  totalExports: number;
  totalImports: number;
  connectedAccounts: number;
  thisMonth: number;
  exportsTrend: number;
  importsTrend: number;
  monthTrend: number;
}

interface WeeklyActivityPoint {
  name: string;
  exports: number;
  imports: number;
}

interface MonthlyTrendPoint {
  name: string;
  total: number;
}

function CustomTooltip({ active, payload, label }: any) {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  if (active && payload && payload.length) {
    return (
      <Paper
        p="sm"
        radius="md"
        shadow="md"
        style={{
          backgroundColor: isDark ? "var(--mantine-color-dark-6)" : "white",
          border: isDark
            ? "1px solid var(--mantine-color-dark-4)"
            : "1px solid var(--mantine-color-gray-2)",
        }}
      >
        <Text size="sm" fw={600} mb={4}>
          {label}
        </Text>
        {payload.map((entry: any, index: number) => (
          <Group key={index} gap="xs">
            <Box
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: entry.color,
              }}
            />
            <Text size="xs" c="dimmed">
              {entry.name}: {entry.value}
            </Text>
          </Group>
        ))}
      </Paper>
    );
  }
  return null;
}

export default function DashboardPage() {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalExports: 0,
    totalImports: 0,
    connectedAccounts: 0,
    thisMonth: 0,
    exportsTrend: 0,
    importsTrend: 0,
    monthTrend: 0,
  });
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [weeklyActivityData, setWeeklyActivityData] = useState<
    WeeklyActivityPoint[]
  >([]);
  const [monthlyTrendData, setMonthlyTrendData] = useState<MonthlyTrendPoint[]>(
    [],
  );
  const [monthTotal, setMonthTotal] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch("/api/dashboard/summary", {
          cache: "no-store",
          credentials: "include",
        });

        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.error ?? "Failed to load dashboard data");
        }

        const data = await response.json();
        setStats(data.stats);
        setWeeklyActivityData(data.weeklyActivityData || []);
        setMonthlyTrendData(data.monthlyTrendData || []);
        setMonthTotal(data.monthTotal || 0);
        setActivities(data.activities || []);
      } catch (error) {
        console.error(error);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const chartGridColor = isDark
    ? "rgba(255, 255, 255, 0.1)"
    : "rgba(0, 0, 0, 0.1)";
  const chartTextColor = isDark ? "#909296" : "#868E96";

  return (
    <Stack gap="lg">
      {/* Page Header */}
      <Group justify="space-between" align="flex-end">
        <Box>
          <Text size="sm" c="dimmed" mb={4}>
            Welcome back 👋
          </Text>
          <Title order={2}>Dashboard</Title>
        </Box>
        <Badge
          size="lg"
          variant="light"
          color="green"
          leftSection={
            <Box
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "var(--mantine-color-green-6)",
              }}
            />
          }
        >
          All systems operational
        </Badge>
      </Group>

      {/* Stats Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        {loading ? (
          <>
            <Skeleton height={140} radius="lg" />
            <Skeleton height={140} radius="lg" />
            <Skeleton height={140} radius="lg" />
            <Skeleton height={140} radius="lg" />
          </>
        ) : (
          <>
            <StatsCard
              title="Total Exports"
              value={stats.totalExports.toLocaleString()}
              description="All time export operations"
              trend={{
                value: stats.exportsTrend,
                label: "vs last month",
              }}
              icon={<IconFileExport size={26} />}
              color="brand"
            />
            <StatsCard
              title="Total Imports"
              value={stats.totalImports.toLocaleString()}
              description="All time import operations"
              trend={{
                value: stats.importsTrend,
                label: "vs last month",
              }}
              icon={<IconFileImport size={26} />}
              color="success"
            />
            <StatsCard
              title="Connected Accounts"
              value={stats.connectedAccounts}
              description="Active Accurate accounts"
              icon={<IconPlugConnected size={26} />}
              color="violet"
            />
            <StatsCard
              title="This Month"
              value={`${stats.thisMonth} jobs`}
              description="Export & import operations"
              trend={{
                value: stats.monthTrend,
                label: "vs last month",
              }}
              icon={<IconCalendarStats size={26} />}
              color="accent"
            />
          </>
        )}
      </SimpleGrid>

      {/* Quick Actions */}
      <Box>
        <Group justify="space-between" align="center" mb="md">
          <Group gap="xs">
            <ThemeIcon size={24} radius="md" variant="light" color="brand">
              <IconActivity size={14} />
            </ThemeIcon>
            <Text fw={600}>Quick Actions</Text>
          </Group>
        </Group>
        <QuickActions actions={defaultQuickActions} />
      </Box>

      {/* Charts and Activity */}
      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
        {/* Weekly Activity Chart */}
        <Paper
          p="md"
          radius="lg"
          shadow="sm"
          style={{
            border: isDark
              ? "1px solid var(--mantine-color-dark-4)"
              : "1px solid var(--mantine-color-gray-2)",
          }}
        >
          <Group justify="space-between" align="center" mb="md">
            <Group gap="xs">
              <ThemeIcon size={24} radius="md" variant="light" color="brand">
                <IconDatabase size={14} />
              </ThemeIcon>
              <Text fw={600}>Weekly Activity</Text>
            </Group>
            <Anchor size="xs" fw={500}>
              View details
            </Anchor>
          </Group>

          {loading ? (
            <Skeleton height={200} radius="md" />
          ) : (
            <Box h={220}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={weeklyActivityData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorExports"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#228BE6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#228BE6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="colorImports"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#40C057" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#40C057" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={chartGridColor}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: chartTextColor }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: chartTextColor }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="exports"
                    name="Exports"
                    stroke="#228BE6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorExports)"
                  />
                  <Area
                    type="monotone"
                    dataKey="imports"
                    name="Imports"
                    stroke="#40C057"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorImports)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          )}

          <Group justify="center" gap="xl" mt="md">
            <Group gap="xs">
              <Box
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 2,
                  backgroundColor: "#228BE6",
                }}
              />
              <Text size="xs" c="dimmed">
                Exports
              </Text>
            </Group>
            <Group gap="xs">
              <Box
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 2,
                  backgroundColor: "#40C057",
                }}
              />
              <Text size="xs" c="dimmed">
                Imports
              </Text>
            </Group>
          </Group>
        </Paper>

        {/* Monthly Trend Chart */}
        <Paper
          p="md"
          radius="lg"
          shadow="sm"
          style={{
            border: isDark
              ? "1px solid var(--mantine-color-dark-4)"
              : "1px solid var(--mantine-color-gray-2)",
          }}
        >
          <Group justify="space-between" align="center" mb="md">
            <Group gap="xs">
              <ThemeIcon size={24} radius="md" variant="light" color="accent">
                <IconCalendarStats size={14} />
              </ThemeIcon>
              <Text fw={600}>Monthly Trend</Text>
            </Group>
            <Badge size="sm" variant="light" color="teal">
              +25% growth
            </Badge>
          </Group>

          {loading ? (
            <Skeleton height={200} radius="md" />
          ) : (
            <Box h={220}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyTrendData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FD7E14" stopOpacity={1} />
                      <stop
                        offset="95%"
                        stopColor="#FF922B"
                        stopOpacity={0.8}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={chartGridColor}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: chartTextColor }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: chartTextColor }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="total"
                    name="Total Operations"
                    fill="url(#colorBar)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          )}

          <Group justify="space-between" mt="md">
            <Text size="xs" c="dimmed">
              Total this month
            </Text>
            <Group gap={4}>
              <IconArrowUpRight size={14} color="#40C057" />
              <Text size="sm" fw={600}>
                {monthTotal} operations
              </Text>
            </Group>
          </Group>
        </Paper>
      </SimpleGrid>

      {/* Recent Activity */}
      <Box>
        {loading ? (
          <Paper p="md" radius="lg" shadow="sm">
            <Skeleton height={24} width={150} mb="md" />
            <Stack gap="md">
              <Skeleton height={60} radius="md" />
              <Skeleton height={60} radius="md" />
              <Skeleton height={60} radius="md" />
            </Stack>
          </Paper>
        ) : activities.length > 0 ? (
          <ActivityCard
            title="Recent Activity"
            activities={activities}
            maxItems={5}
            onViewAll={() => console.log("View all activities")}
          />
        ) : (
          <Paper
            p="xl"
            radius="lg"
            shadow="sm"
            style={{
              border: isDark
                ? "1px solid var(--mantine-color-dark-4)"
                : "1px solid var(--mantine-color-gray-2)",
            }}
          >
            <EmptyState
              variant="no-data"
              title="No activity yet"
              description="Your export and import operations will appear here"
              action={{
                label: "Start Export",
                onClick: () =>
                  (window.location.href =
                    "/dashboard/export/inventory-adjustment"),
              }}
            />
          </Paper>
        )}
      </Box>
    </Stack>
  );
}
