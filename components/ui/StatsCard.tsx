"use client";

import {
  Paper,
  Group,
  Text,
  ThemeIcon,
  Stack,
  useMantineColorScheme,
  Box,
  rem,
} from "@mantine/core";
import { IconTrendingUp, IconTrendingDown, IconMinus } from "@tabler/icons-react";
import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    label?: string;
  };
  icon: ReactNode;
  color?: "brand" | "accent" | "success" | "danger" | "violet" | "cyan" | "grape" | "teal";
  compact?: boolean;
}

const colorGradients: Record<string, { light: string; dark: string }> = {
  brand: {
    light: "linear-gradient(135deg, #E7F5FF 0%, #D0EBFF 100%)",
    dark: "linear-gradient(135deg, rgba(34, 139, 230, 0.15) 0%, rgba(28, 126, 214, 0.1) 100%)",
  },
  accent: {
    light: "linear-gradient(135deg, #FFF4E6 0%, #FFE8CC 100%)",
    dark: "linear-gradient(135deg, rgba(255, 146, 43, 0.15) 0%, rgba(253, 126, 20, 0.1) 100%)",
  },
  success: {
    light: "linear-gradient(135deg, #EBFBEE 0%, #D3F9D8 100%)",
    dark: "linear-gradient(135deg, rgba(81, 207, 102, 0.15) 0%, rgba(64, 192, 87, 0.1) 100%)",
  },
  danger: {
    light: "linear-gradient(135deg, #FFF5F5 0%, #FFE3E3 100%)",
    dark: "linear-gradient(135deg, rgba(255, 107, 107, 0.15) 0%, rgba(250, 82, 82, 0.1) 100%)",
  },
  violet: {
    light: "linear-gradient(135deg, #F3F0FF 0%, #E5DBFF 100%)",
    dark: "linear-gradient(135deg, rgba(132, 94, 247, 0.15) 0%, rgba(121, 80, 242, 0.1) 100%)",
  },
  cyan: {
    light: "linear-gradient(135deg, #E3FAFC 0%, #C5F6FA 100%)",
    dark: "linear-gradient(135deg, rgba(34, 184, 207, 0.15) 0%, rgba(21, 170, 191, 0.1) 100%)",
  },
  grape: {
    light: "linear-gradient(135deg, #F8F0FC 0%, #F3D9FA 100%)",
    dark: "linear-gradient(135deg, rgba(190, 75, 219, 0.15) 0%, rgba(174, 62, 201, 0.1) 100%)",
  },
  teal: {
    light: "linear-gradient(135deg, #E6FCF5 0%, #C3FAE8 100%)",
    dark: "linear-gradient(135deg, rgba(32, 201, 151, 0.15) 0%, rgba(18, 184, 134, 0.1) 100%)",
  },
};

const iconColors: Record<string, string> = {
  brand: "#228BE6",
  accent: "#FD7E14",
  success: "#40C057",
  danger: "#FA5252",
  violet: "#7950F2",
  cyan: "#15AABF",
  grape: "#BE4BDB",
  teal: "#12B886",
};

export function StatsCard({
  title,
  value,
  description,
  trend,
  icon,
  color = "brand",
  compact = false,
}: StatsCardProps) {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  const gradient = colorGradients[color] || colorGradients.brand;
  const iconColor = iconColors[color] || iconColors.brand;

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return <IconTrendingUp size={16} />;
    if (trend.value < 0) return <IconTrendingDown size={16} />;
    return <IconMinus size={16} />;
  };

  const getTrendColor = () => {
    if (!trend) return "dimmed";
    if (trend.value > 0) return "teal";
    if (trend.value < 0) return "red";
    return "dimmed";
  };

  return (
    <Paper
      p={compact ? "md" : "lg"}
      radius="lg"
      style={{
        background: isDark ? gradient.dark : gradient.light,
        border: isDark
          ? `1px solid rgba(255, 255, 255, 0.1)`
          : `1px solid rgba(0, 0, 0, 0.05)`,
        transition: "all 0.2s ease",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = isDark
          ? "0 8px 32px rgba(0, 0, 0, 0.3)"
          : "0 8px 32px rgba(0, 0, 0, 0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "";
      }}
    >
      <Group justify="space-between" align="center">
        <Stack gap={2}>
          <Text size="xs" c="dimmed" fw={600} tt="uppercase" lts={0.5}>
            {title}
          </Text>
          <Text size={compact ? "xl" : "2rem"} fw={700} lh={1.2} style={{ fontSize: compact ? rem(24) : rem(32) }}>
            {value}
          </Text>
          {description && (
            <Text size="xs" c="dimmed">
              {description}
            </Text>
          )}
          {trend && (
            <Group gap={4} mt={4}>
              <Box c={getTrendColor()}>{getTrendIcon()}</Box>
              <Text size="sm" c={getTrendColor()} fw={500}>
                {trend.value > 0 ? "+" : ""}
                {trend.value}%
              </Text>
              {trend.label && (
                <Text size="xs" c="dimmed">
                  {trend.label}
                </Text>
              )}
            </Group>
          )}
        </Stack>
        <ThemeIcon
          size={compact ? 44 : 52}
          radius="xl"
          variant="light"
          style={{
            backgroundColor: isDark
              ? `${iconColor}20`
              : `${iconColor}15`,
            color: iconColor,
          }}
        >
          {icon}
        </ThemeIcon>
      </Group>
    </Paper>
  );
}
