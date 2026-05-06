"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  Group,
  Paper,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { IconChartBar, IconRefresh, IconSearch } from "@tabler/icons-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatsCard } from "@/components/ui/StatsCard";

type AnalyticsMode = "overview" | "peminjaman" | "pengambilan" | "resources";

const titles: Record<
  AnalyticsMode,
  { title: string; subtitle: string; endpoint: string }
> = {
  overview: {
    title: "Analytics Overview",
    subtitle:
      "Ringkasan peminjaman, pengambilan self-checkout, resource, dan pengguna teratas.",
    endpoint: "/api/analytics/overview",
  },
  peminjaman: {
    title: "Peminjaman Analytics",
    subtitle:
      "Analisis sesi pinjam, booking, return, overdue, dan resource yang sering dipinjam.",
    endpoint: "/api/analytics/peminjaman",
  },
  pengambilan: {
    title: "Pengambilan Analytics",
    subtitle:
      "Analisis self-checkout, staf, item, status, dan kegagalan transaksi.",
    endpoint: "/api/analytics/pengambilan",
  },
  resources: {
    title: "Resource Usage Analytics",
    subtitle: "Analisis pemakaian resource lintas peminjaman dan pengambilan.",
    endpoint: "/api/analytics/resources",
  },
};

function dateValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatValue(value: unknown) {
  if (value === null || value === undefined) return "-";
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return new Date(value).toLocaleString("id-ID");
  }
  return String(value);
}

function DataTable({ rows }: { rows: Record<string, unknown>[] }) {
  const columns = rows.length ? Object.keys(rows[0]).slice(0, 10) : [];

  if (!rows.length) {
    return (
      <EmptyState
        title="Belum ada data"
        description="Ubah filter atau pilih rentang tanggal lain."
      />
    );
  }

  return (
    <Table.ScrollContainer minWidth={900}>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            {columns.map((column) => (
              <Table.Th key={column}>{column}</Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((row, index) => (
            <Table.Tr key={index}>
              {columns.map((column) => (
                <Table.Td key={column}>{formatValue(row[column])}</Table.Td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

function ChartCard({
  title,
  data,
  bars,
}: {
  title: string;
  data: Record<string, unknown>[];
  bars: string[];
}) {
  return (
    <Paper p="md" radius="lg" withBorder>
      <Text fw={600} mb="md">
        {title}
      </Text>
      {data.length ? (
        <Box h={280}>
          <ResponsiveContainer width="100%" height="100%">
            {bars.length > 1 ? (
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                {bars.map((bar, index) => (
                  <Area
                    key={bar}
                    type="monotone"
                    dataKey={bar}
                    stackId="1"
                    stroke={index === 0 ? "#228be6" : "#40c057"}
                    fill={index === 0 ? "#228be6" : "#40c057"}
                  />
                ))}
              </AreaChart>
            ) : (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey={bars[0]} fill="#228be6" radius={[6, 6, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </Box>
      ) : (
        <EmptyState
          title="Chart kosong"
          description="Belum ada data untuk rentang filter ini."
        />
      )}
    </Paper>
  );
}

export function AnalyticsPage({ mode }: { mode: AnalyticsMode }) {
  const config = titles[mode];
  const now = new Date();
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    new Date(now.getFullYear(), now.getMonth(), 1),
    new Date(now.getFullYear(), now.getMonth() + 1, 0),
  ]);
  const [groupBy, setGroupBy] = useState<string | null>("day");
  const [status, setStatus] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [itemCode, setItemCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (dateRange[0]) params.set("startDate", dateValue(dateRange[0]));
    if (dateRange[1]) params.set("endDate", dateValue(dateRange[1]));
    if (groupBy) params.set("groupBy", groupBy);
    if (status) params.set("status", status);
    if (email) params.set("email", email);
    if (itemCode) params.set("itemCode", itemCode);
    return params.toString();
  }, [dateRange, email, groupBy, itemCode, status]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${config.endpoint}?${queryString}`, {
        cache: "no-store",
        credentials: "include",
      });
      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload?.error || "Gagal memuat analytics");
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat analytics");
    } finally {
      setLoading(false);
    }
  }, [config.endpoint, queryString]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const cards = useMemo(() => {
    if (!data) return [];
    if (mode === "overview") {
      return [
        ["Sesi Peminjaman", data.peminjamanSummary?.sessions || 0],
        ["Qty Dipinjam", data.peminjamanSummary?.quantity || 0],
        ["Sesi Pengambilan", data.pengambilanSummary?.sessions || 0],
        ["Resource Unik", data.resourceSummary?.uniqueResources || 0],
      ];
    }
    if (mode === "peminjaman") {
      return [
        ["Total Sesi", data.summary?.totalSessions || 0],
        ["Aktif", data.summary?.active || 0],
        ["Overdue", data.summary?.overdue || 0],
        ["Qty Dipinjam", data.summary?.totalQuantity || 0],
      ];
    }
    if (mode === "pengambilan") {
      return [
        ["Total Sesi", data.summary?.totalSessions || 0],
        ["Selesai", data.summary?.completed || 0],
        ["Gagal", data.summary?.failed || 0],
        ["Qty Diambil", data.summary?.totalQuantity || 0],
      ];
    }
    return [
      ["Resource Unik", data.summary?.uniqueResources || 0],
      ["Qty Dipinjam", data.summary?.totalBorrowed || 0],
      ["Qty Dikembalikan", data.summary?.totalReturned || 0],
      ["Qty Diambil", data.summary?.totalCheckedOut || 0],
    ];
  }, [data, mode]);

  const mainTrend =
    mode === "overview"
      ? data?.trends || []
      : data?.trend || data?.borrowedVsReturned || [];
  const chartBars =
    mode === "overview"
      ? ["peminjaman", "pengambilan"]
      : mode === "peminjaman"
        ? ["borrow", "booking", "return"]
        : mode === "resources"
          ? ["borrowed", "returned"]
          : ["checkouts"];
  const details = data?.details?.data || [];

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <Box>
          <Group gap="xs">
            <Title order={2}>{config.title}</Title>
            <Badge variant="light">MVP</Badge>
          </Group>
          <Text c="dimmed" mt={4}>
            {config.subtitle}
          </Text>
        </Box>
        <Button
          leftSection={<IconRefresh size={16} />}
          variant="light"
          onClick={loadData}
          loading={loading}
        >
          Refresh
        </Button>
      </Group>

      <Card withBorder radius="lg" p="md">
        <SimpleGrid cols={{ base: 1, sm: 2, md: 5 }}>
          <DatePickerInput
            type="range"
            label="Rentang tanggal"
            value={dateRange}
            onChange={setDateRange}
            clearable={false}
          />
          <Select
            label="Group by"
            value={groupBy}
            onChange={setGroupBy}
            data={["day", "week", "month"]}
          />
          <Select
            label="Status"
            value={status}
            onChange={setStatus}
            clearable
            data={[
              "active",
              "partial",
              "returned",
              "completed",
              "pending",
              "failed",
            ]}
          />
          <TextInput
            label="Email"
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
            leftSection={<IconSearch size={16} />}
          />
          <TextInput
            label="Item code"
            value={itemCode}
            onChange={(event) => setItemCode(event.currentTarget.value)}
          />
        </SimpleGrid>
        <Text size="xs" c="dimmed" mt="sm">
          Department analytics sengaja tidak ditampilkan untuk MVP.
        </Text>
      </Card>

      {error && (
        <Paper p="md" radius="lg" withBorder>
          <Text c="red">{error}</Text>
        </Paper>
      )}

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} height={112} radius="lg" />
            ))
          : cards.map(([label, value]) => (
              <StatsCard
                key={label}
                title={String(label)}
                value={String(value)}
                icon={<IconChartBar size={22} />}
                color="brand"
              />
            ))}
      </SimpleGrid>

      {!loading && (
        <ChartCard title="Trend" data={mainTrend} bars={chartBars} />
      )}

      {!loading && (
        <SimpleGrid cols={{ base: 1, md: 2 }}>
          <Paper p="md" radius="lg" withBorder>
            <Text fw={600} mb="md">
              Top Resources
            </Text>
            <DataTable
              rows={(
                data?.topResources ||
                data?.topItems ||
                data?.topBorrowed ||
                []
              ).slice(0, 8)}
            />
          </Paper>
          <Paper p="md" radius="lg" withBorder>
            <Text fw={600} mb="md">
              Top Users / Staff
            </Text>
            <DataTable
              rows={(
                data?.topUsers ||
                data?.topBorrowers ||
                data?.topStaff ||
                data?.topCheckedOut ||
                []
              ).slice(0, 8)}
            />
          </Paper>
        </SimpleGrid>
      )}

      {!loading && (
        <Paper p="md" radius="lg" withBorder>
          <Group justify="space-between" mb="md">
            <Text fw={600}>Detail Drill-down</Text>
            <Badge variant="light">
              {data?.details?.total || details.length} records
            </Badge>
          </Group>
          <DataTable rows={details} />
        </Paper>
      )}
    </Stack>
  );
}
