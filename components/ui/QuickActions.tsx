"use client";

import {
  SimpleGrid,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Group,
  useMantineColorScheme,
  Box,
  Badge,
  UnstyledButton,
} from "@mantine/core";
import {
  IconFileExport,
  IconFileImport,
  IconPlugConnected,
  IconScan,
  IconSettings,
  IconChartBar,
  IconArrowRight,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";

export interface QuickAction {
  id: string;
  title: string;
  description?: string;
  icon: ReactNode;
  href?: string;
  onClick?: () => void;
  color?: "brand" | "accent" | "success" | "danger" | "violet" | "cyan" | "teal" | "grape";
  badge?: string;
  disabled?: boolean;
}

interface QuickActionsProps {
  actions?: QuickAction[];
  columns?: { base: number; sm?: number; md?: number; lg?: number };
}

const colorMap: Record<string, { bg: string; bgDark: string; icon: string }> = {
  brand: {
    bg: "linear-gradient(135deg, #E7F5FF 0%, #D0EBFF 100%)",
    bgDark: "linear-gradient(135deg, rgba(34, 139, 230, 0.15) 0%, rgba(28, 126, 214, 0.1) 100%)",
    icon: "#228BE6",
  },
  accent: {
    bg: "linear-gradient(135deg, #FFF4E6 0%, #FFE8CC 100%)",
    bgDark: "linear-gradient(135deg, rgba(255, 146, 43, 0.15) 0%, rgba(253, 126, 20, 0.1) 100%)",
    icon: "#FD7E14",
  },
  success: {
    bg: "linear-gradient(135deg, #EBFBEE 0%, #D3F9D8 100%)",
    bgDark: "linear-gradient(135deg, rgba(81, 207, 102, 0.15) 0%, rgba(64, 192, 87, 0.1) 100%)",
    icon: "#40C057",
  },
  danger: {
    bg: "linear-gradient(135deg, #FFF5F5 0%, #FFE3E3 100%)",
    bgDark: "linear-gradient(135deg, rgba(255, 107, 107, 0.15) 0%, rgba(250, 82, 82, 0.1) 100%)",
    icon: "#FA5252",
  },
  violet: {
    bg: "linear-gradient(135deg, #F3F0FF 0%, #E5DBFF 100%)",
    bgDark: "linear-gradient(135deg, rgba(132, 94, 247, 0.15) 0%, rgba(121, 80, 242, 0.1) 100%)",
    icon: "#7950F2",
  },
  cyan: {
    bg: "linear-gradient(135deg, #E3FAFC 0%, #C5F6FA 100%)",
    bgDark: "linear-gradient(135deg, rgba(34, 184, 207, 0.15) 0%, rgba(21, 170, 191, 0.1) 100%)",
    icon: "#15AABF",
  },
  teal: {
    bg: "linear-gradient(135deg, #E6FCF5 0%, #C3FAE8 100%)",
    bgDark: "linear-gradient(135deg, rgba(32, 201, 151, 0.15) 0%, rgba(18, 184, 134, 0.1) 100%)",
    icon: "#12B886",
  },
  grape: {
    bg: "linear-gradient(135deg, #F8F0FC 0%, #F3D9FA 100%)",
    bgDark: "linear-gradient(135deg, rgba(190, 75, 219, 0.15) 0%, rgba(174, 62, 201, 0.1) 100%)",
    icon: "#BE4BDB",
  },
};

// Default quick actions for the dashboard
export const defaultQuickActions: QuickAction[] = [
  {
    id: "export",
    title: "New Export",
    description: "Export inventory adjustments to CSV, XLSX, or JSON",
    icon: <IconFileExport size={24} />,
    href: "/dashboard/export/inventory-adjustment",
    color: "brand",
  },
  {
    id: "import",
    title: "New Import",
    description: "Import inventory adjustments from your files",
    icon: <IconFileImport size={24} />,
    href: "/dashboard/import/inventory-adjustment",
    color: "success",
  },
  {
    id: "self-checkout",
    title: "Self Checkout",
    description: "Scan items for quick inventory checkout",
    icon: <IconScan size={24} />,
    href: "/dashboard/self-checkout",
    color: "accent",
  },
  {
    id: "credentials",
    title: "Manage Accounts",
    description: "Connect or manage Accurate accounts",
    icon: <IconPlugConnected size={24} />,
    href: "/dashboard/credentials",
    color: "violet",
  },
];

interface QuickActionTileProps {
  action: QuickAction;
}

function QuickActionTile({ action }: QuickActionTileProps) {
  const router = useRouter();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  const colors = colorMap[action.color || "brand"];

  const handleClick = () => {
    if (action.disabled) return;
    if (action.onClick) {
      action.onClick();
    } else if (action.href) {
      router.push(action.href);
    }
  };

  return (
    <UnstyledButton
      onClick={handleClick}
      disabled={action.disabled}
      style={{
        width: "100%",
        opacity: action.disabled ? 0.6 : 1,
        cursor: action.disabled ? "not-allowed" : "pointer",
      }}
    >
      <Paper
        p="lg"
        radius="lg"
        style={{
          background: isDark ? colors.bgDark : colors.bg,
          border: isDark
            ? "1px solid rgba(255, 255, 255, 0.1)"
            : "1px solid rgba(0, 0, 0, 0.05)",
          transition: "all 0.2s ease",
          height: "100%",
        }}
        onMouseEnter={(e) => {
          if (!action.disabled) {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.boxShadow = isDark
              ? "0 12px 40px rgba(0, 0, 0, 0.3)"
              : "0 12px 40px rgba(0, 0, 0, 0.1)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "";
        }}
      >
        <Stack gap="md">
          <Group justify="space-between" align="flex-start">
            <ThemeIcon
              size={48}
              radius="xl"
              variant="light"
              style={{
                backgroundColor: isDark ? `${colors.icon}25` : `${colors.icon}20`,
                color: colors.icon,
              }}
            >
              {action.icon}
            </ThemeIcon>
            {action.badge && (
              <Badge
                size="sm"
                variant="light"
                color={action.color || "brand"}
                radius="sm"
              >
                {action.badge}
              </Badge>
            )}
          </Group>

          <Stack gap={4}>
            <Group gap="xs" align="center">
              <Text fw={600} size="lg">
                {action.title}
              </Text>
              <Box
                style={{
                  transition: "transform 0.2s ease",
                  color: colors.icon,
                }}
                className="action-arrow"
              >
                <IconArrowRight size={18} />
              </Box>
            </Group>
            {action.description && (
              <Text size="sm" c="dimmed" lineClamp={2}>
                {action.description}
              </Text>
            )}
          </Stack>
        </Stack>
      </Paper>
    </UnstyledButton>
  );
}

export function QuickActions({
  actions = defaultQuickActions,
  columns = { base: 1, sm: 2, lg: 4 },
}: QuickActionsProps) {
  return (
    <SimpleGrid cols={columns} spacing="md">
      {actions.map((action) => (
        <QuickActionTile key={action.id} action={action} />
      ))}
    </SimpleGrid>
  );
}

// Compact version for sidebar or smaller spaces
interface CompactQuickActionsProps {
  actions?: QuickAction[];
}

export function CompactQuickActions({
  actions = defaultQuickActions,
}: CompactQuickActionsProps) {
  const router = useRouter();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Stack gap="xs">
      {actions.map((action) => {
        const colors = colorMap[action.color || "brand"];

        const handleClick = () => {
          if (action.disabled) return;
          if (action.onClick) {
            action.onClick();
          } else if (action.href) {
            router.push(action.href);
          }
        };

        return (
          <UnstyledButton
            key={action.id}
            onClick={handleClick}
            disabled={action.disabled}
            style={{
              width: "100%",
              opacity: action.disabled ? 0.6 : 1,
              cursor: action.disabled ? "not-allowed" : "pointer",
            }}
          >
            <Group
              gap="sm"
              p="sm"
              style={{
                borderRadius: 8,
                transition: "all 0.15s ease",
                background: "transparent",
              }}
              onMouseEnter={(e) => {
                if (!action.disabled) {
                  e.currentTarget.style.background = isDark
                    ? "rgba(255, 255, 255, 0.05)"
                    : "rgba(0, 0, 0, 0.03)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <ThemeIcon
                size={36}
                radius="md"
                variant="light"
                style={{
                  backgroundColor: isDark ? `${colors.icon}20` : `${colors.icon}15`,
                  color: colors.icon,
                }}
              >
                {action.icon}
              </ThemeIcon>
              <Stack gap={0} style={{ flex: 1 }}>
                <Text size="sm" fw={600}>
                  {action.title}
                </Text>
                {action.description && (
                  <Text size="xs" c="dimmed" lineClamp={1}>
                    {action.description}
                  </Text>
                )}
              </Stack>
              <IconArrowRight size={16} color={isDark ? "#909296" : "#868E96"} />
            </Group>
          </UnstyledButton>
        );
      })}
    </Stack>
  );
}
