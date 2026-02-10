"use client";

import {
  Timeline,
  Text,
  Paper,
  Group,
  Badge,
  ThemeIcon,
  Stack,
  useMantineColorScheme,
  Box,
  Anchor,
} from "@mantine/core";
import {
  IconFileExport,
  IconFileImport,
  IconPlugConnected,
  IconPlugConnectedX,
  IconCheck,
  IconX,
  IconClock,
  IconAlertTriangle,
  IconRefresh,
} from "@tabler/icons-react";
import { ReactNode } from "react";
import { useLanguage } from "@/lib/language";

export type ActivityType =
  | "export"
  | "import"
  | "connect"
  | "disconnect"
  | "error"
  | "success"
  | "pending"
  | "warning";

export type ActivityStatus = "success" | "error" | "pending" | "warning";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  timestamp: Date | string;
  status?: ActivityStatus;
  metadata?: {
    count?: number;
    link?: string;
    linkText?: string;
  };
}

interface ActivityTimelineProps {
  activities: ActivityItem[];
  maxItems?: number;
  showViewAll?: boolean;
  onViewAll?: () => void;
  emptyMessage?: string;
}

const typeConfig: Record<
  ActivityType,
  { icon: ReactNode; color: string; label: string }
> = {
  export: {
    icon: <IconFileExport size={16} />,
    color: "blue",
    label: "Ekspor",
  },
  import: {
    icon: <IconFileImport size={16} />,
    color: "green",
    label: "Impor",
  },
  connect: {
    icon: <IconPlugConnected size={16} />,
    color: "violet",
    label: "Terhubung",
  },
  disconnect: {
    icon: <IconPlugConnectedX size={16} />,
    color: "gray",
    label: "Terputus",
  },
  error: {
    icon: <IconX size={16} />,
    color: "red",
    label: "Kesalahan",
  },
  success: {
    icon: <IconCheck size={16} />,
    color: "teal",
    label: "Berhasil",
  },
  pending: {
    icon: <IconClock size={16} />,
    color: "yellow",
    label: "Menunggu",
  },
  warning: {
    icon: <IconAlertTriangle size={16} />,
    color: "orange",
    label: "Peringatan",
  },
};

function formatRelativeTime(
  date: Date | string,
  language: "id" | "en",
): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return language === "id" ? "Baru saja" : "Just now";
  } else if (diffMinutes < 60) {
    return language === "id" ? `${diffMinutes}m lalu` : `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return language === "id" ? `${diffHours}j lalu` : `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return language === "id" ? `${diffDays}h lalu` : `${diffDays}d ago`;
  } else {
    return then.toLocaleDateString();
  }
}

export function ActivityTimeline({
  activities,
  maxItems = 5,
  showViewAll = true,
  onViewAll,
  emptyMessage,
}: ActivityTimelineProps) {
  const { language } = useLanguage();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";
  const localizedTypeConfig = {
    ...typeConfig,
    export: {
      ...typeConfig.export,
      label: language === "id" ? "Ekspor" : "Export",
    },
    import: {
      ...typeConfig.import,
      label: language === "id" ? "Impor" : "Import",
    },
    connect: {
      ...typeConfig.connect,
      label: language === "id" ? "Terhubung" : "Connected",
    },
    disconnect: {
      ...typeConfig.disconnect,
      label: language === "id" ? "Terputus" : "Disconnected",
    },
    error: {
      ...typeConfig.error,
      label: language === "id" ? "Kesalahan" : "Error",
    },
    success: {
      ...typeConfig.success,
      label: language === "id" ? "Berhasil" : "Success",
    },
    pending: {
      ...typeConfig.pending,
      label: language === "id" ? "Menunggu" : "Pending",
    },
    warning: {
      ...typeConfig.warning,
      label: language === "id" ? "Peringatan" : "Warning",
    },
  };
  const localizedStatusConfig = {
    success: { color: "green", label: language === "id" ? "Selesai" : "Done" },
    error: { color: "red", label: language === "id" ? "Gagal" : "Failed" },
    pending: {
      color: "yellow",
      label: language === "id" ? "Berjalan" : "Running",
    },
    warning: {
      color: "orange",
      label: language === "id" ? "Peringatan" : "Warning",
    },
  };

  const displayedActivities = activities.slice(0, maxItems);

  if (activities.length === 0) {
    return (
      <Box
        py="xl"
        style={{
          textAlign: "center",
        }}
      >
        <ThemeIcon size={48} radius="xl" variant="light" color="gray" mb="md">
          <IconClock size={24} />
        </ThemeIcon>
        <Text c="dimmed">
          {emptyMessage ||
            (language === "id"
              ? "Tidak ada aktivitas terbaru"
              : "No recent activity")}
        </Text>
      </Box>
    );
  }

  return (
    <Stack gap="md">
      <Timeline
        active={displayedActivities.length}
        bulletSize={32}
        lineWidth={2}
        color="brand"
      >
        {displayedActivities.map((activity, index) => {
          const config = localizedTypeConfig[activity.type];
          const statusInfo = activity.status
            ? localizedStatusConfig[activity.status]
            : null;

          return (
            <Timeline.Item
              key={activity.id}
              bullet={
                <ThemeIcon
                  size={32}
                  radius="xl"
                  color={config.color}
                  variant={index === 0 ? "filled" : "light"}
                >
                  {config.icon}
                </ThemeIcon>
              }
              title={
                <Group gap="xs" align="center">
                  <Text fw={600} size="sm">
                    {activity.title}
                  </Text>
                  {statusInfo && (
                    <Badge
                      size="xs"
                      color={statusInfo.color}
                      variant="light"
                      radius="sm"
                    >
                      {statusInfo.label}
                    </Badge>
                  )}
                </Group>
              }
            >
              <Stack gap={4}>
                {activity.description && (
                  <Text c="dimmed" size="sm">
                    {activity.description}
                  </Text>
                )}
                <Group gap="xs" align="center">
                  <Text size="xs" c="dimmed">
                    {formatRelativeTime(activity.timestamp, language)}
                  </Text>
                  {activity.metadata?.count !== undefined && (
                    <>
                      <Text size="xs" c="dimmed">
                        •
                      </Text>
                      <Text size="xs" c="dimmed">
                        {activity.metadata.count}{" "}
                        {language === "id" ? "item" : "item"}
                      </Text>
                    </>
                  )}
                  {activity.metadata?.link && (
                    <>
                      <Text size="xs" c="dimmed">
                        •
                      </Text>
                      <Anchor href={activity.metadata.link} size="xs" fw={500}>
                        {activity.metadata.linkText ||
                          (language === "id" ? "Lihat detail" : "View detail")}
                      </Anchor>
                    </>
                  )}
                </Group>
              </Stack>
            </Timeline.Item>
          );
        })}
      </Timeline>

      {showViewAll && activities.length > maxItems && onViewAll && (
        <Box style={{ textAlign: "center" }}>
          <Anchor
            component="button"
            type="button"
            size="sm"
            fw={500}
            onClick={onViewAll}
          >
            {language === "id"
              ? `Lihat semua ${activities.length} aktivitas`
              : `View all ${activities.length} activities`}
          </Anchor>
        </Box>
      )}
    </Stack>
  );
}

// Compact version for sidebars or smaller spaces
interface CompactActivityListProps {
  activities: ActivityItem[];
  maxItems?: number;
}

export function CompactActivityList({
  activities,
  maxItems = 5,
}: CompactActivityListProps) {
  const { language } = useLanguage();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  const displayedActivities = activities.slice(0, maxItems);

  if (activities.length === 0) {
    return (
      <Text c="dimmed" size="sm" ta="center" py="md">
        {language === "id"
          ? "Tidak ada aktivitas terbaru"
          : "No recent activity"}
      </Text>
    );
  }

  return (
    <Stack gap="xs">
      {displayedActivities.map((activity) => {
        const config = {
          ...typeConfig[activity.type],
          label:
            language === "id"
              ? typeConfig[activity.type].label
              : {
                  export: "Export",
                  import: "Import",
                  connect: "Connected",
                  disconnect: "Disconnected",
                  error: "Error",
                  success: "Success",
                  pending: "Pending",
                  warning: "Warning",
                }[activity.type] || typeConfig[activity.type].label,
        };

        return (
          <Group
            key={activity.id}
            gap="sm"
            p="xs"
            style={{
              borderRadius: 8,
              transition: "background-color 0.15s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDark
                ? "rgba(255, 255, 255, 0.05)"
                : "rgba(0, 0, 0, 0.03)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <ThemeIcon
              size={28}
              radius="xl"
              color={config.color}
              variant="light"
            >
              {config.icon}
            </ThemeIcon>
            <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
              <Text size="sm" fw={500} truncate>
                {activity.title}
              </Text>
              <Text size="xs" c="dimmed">
                {formatRelativeTime(activity.timestamp, language)}
              </Text>
            </Stack>
          </Group>
        );
      })}
    </Stack>
  );
}

// Activity card for dashboard widgets
interface ActivityCardProps {
  title?: string;
  activities: ActivityItem[];
  maxItems?: number;
  onViewAll?: () => void;
  compact?: boolean;
}

export function ActivityCard({
  title,
  activities,
  maxItems = 5,
  onViewAll,
  compact = false,
}: ActivityCardProps) {
  const { language } = useLanguage();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";
  const resolvedTitle =
    title || (language === "id" ? "Aktivitas Terbaru" : "Recent Activity");

  return (
    <Paper
      p="md"
      radius="lg"
      shadow="sm"
      style={{
        border: isDark
          ? "1px solid rgba(255, 255, 255, 0.1)"
          : "1px solid rgba(0, 0, 0, 0.05)",
      }}
    >
      <Group justify="space-between" mb="md">
        <Group gap="xs" align="center">
          <ThemeIcon size={24} radius="md" variant="light" color="brand">
            <IconRefresh size={14} />
          </ThemeIcon>
          <Text fw={600}>{resolvedTitle}</Text>
        </Group>
        {onViewAll && activities.length > 0 && (
          <Anchor
            component="button"
            type="button"
            size="xs"
            fw={500}
            onClick={onViewAll}
          >
            {language === "id" ? "Lihat semua" : "View all"}
          </Anchor>
        )}
      </Group>

      {compact ? (
        <CompactActivityList activities={activities} maxItems={maxItems} />
      ) : (
        <ActivityTimeline
          activities={activities}
          maxItems={maxItems}
          showViewAll={false}
        />
      )}
    </Paper>
  );
}
