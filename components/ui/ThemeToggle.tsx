"use client";

import {
  ActionIcon,
  useMantineColorScheme,
  useComputedColorScheme,
  Tooltip,
  Group,
  SegmentedControl,
  Paper,
  Text,
  Box,
  Menu,
} from "@mantine/core";
import {
  IconSun,
  IconMoon,
  IconDeviceDesktop,
  IconPalette,
} from "@tabler/icons-react";

// Simple icon toggle button
export function ThemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("light", {
    getInitialValueInEffect: true,
  });

  const isDark = computedColorScheme === "dark";

  return (
    <Tooltip label={isDark ? "Light mode" : "Dark mode"} position="bottom">
      <ActionIcon
        onClick={() => setColorScheme(isDark ? "light" : "dark")}
        variant="subtle"
        size="lg"
        radius="md"
        aria-label="Toggle color scheme"
        style={{
          transition: "all 0.2s ease",
        }}
      >
        {isDark ? <IconSun size={20} /> : <IconMoon size={20} />}
      </ActionIcon>
    </Tooltip>
  );
}

// Segmented control for more explicit selection
interface ThemeSegmentedControlProps {
  size?: "xs" | "sm" | "md";
  fullWidth?: boolean;
}

export function ThemeSegmentedControl({
  size = "sm",
  fullWidth = false,
}: ThemeSegmentedControlProps) {
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  return (
    <SegmentedControl
      size={size}
      fullWidth={fullWidth}
      value={colorScheme}
      onChange={(value) => setColorScheme(value as "light" | "dark" | "auto")}
      data={[
        {
          value: "light",
          label: (
            <Group gap={6} wrap="nowrap">
              <IconSun size={16} />
              <span>Light</span>
            </Group>
          ),
        },
        {
          value: "dark",
          label: (
            <Group gap={6} wrap="nowrap">
              <IconMoon size={16} />
              <span>Dark</span>
            </Group>
          ),
        },
        {
          value: "auto",
          label: (
            <Group gap={6} wrap="nowrap">
              <IconDeviceDesktop size={16} />
              <span>Auto</span>
            </Group>
          ),
        },
      ]}
    />
  );
}

// Dropdown menu for theme selection
export function ThemeMenu() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("light", {
    getInitialValueInEffect: true,
  });

  const isDark = computedColorScheme === "dark";

  const getIcon = () => {
    if (colorScheme === "auto") return <IconDeviceDesktop size={20} />;
    return isDark ? <IconMoon size={20} /> : <IconSun size={20} />;
  };

  return (
    <Menu position="bottom-end" withArrow shadow="md">
      <Menu.Target>
        <Tooltip label="Change theme" position="bottom">
          <ActionIcon
            variant="subtle"
            size="lg"
            radius="md"
            aria-label="Open theme menu"
          >
            {getIcon()}
          </ActionIcon>
        </Tooltip>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Appearance</Menu.Label>
        <Menu.Item
          leftSection={<IconSun size={16} />}
          onClick={() => setColorScheme("light")}
          rightSection={
            colorScheme === "light" && (
              <Box
                w={8}
                h={8}
                style={{
                  borderRadius: "50%",
                  backgroundColor: "var(--mantine-color-brand-6)",
                }}
              />
            )
          }
        >
          Light
        </Menu.Item>
        <Menu.Item
          leftSection={<IconMoon size={16} />}
          onClick={() => setColorScheme("dark")}
          rightSection={
            colorScheme === "dark" && (
              <Box
                w={8}
                h={8}
                style={{
                  borderRadius: "50%",
                  backgroundColor: "var(--mantine-color-brand-6)",
                }}
              />
            )
          }
        >
          Dark
        </Menu.Item>
        <Menu.Item
          leftSection={<IconDeviceDesktop size={16} />}
          onClick={() => setColorScheme("auto")}
          rightSection={
            colorScheme === "auto" && (
              <Box
                w={8}
                h={8}
                style={{
                  borderRadius: "50%",
                  backgroundColor: "var(--mantine-color-brand-6)",
                }}
              />
            )
          }
        >
          System
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

// Card-based theme selector for settings pages
export function ThemeCard() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("light", {
    getInitialValueInEffect: true,
  });
  const isDark = computedColorScheme === "dark";

  const options = [
    {
      value: "light" as const,
      icon: <IconSun size={24} />,
      label: "Light",
      description: "Always use light mode",
    },
    {
      value: "dark" as const,
      icon: <IconMoon size={24} />,
      label: "Dark",
      description: "Always use dark mode",
    },
    {
      value: "auto" as const,
      icon: <IconDeviceDesktop size={24} />,
      label: "System",
      description: "Follow system preference",
    },
  ];

  return (
    <Paper p="md" radius="lg" withBorder>
      <Group gap="xs" mb="md">
        <IconPalette size={20} />
        <Text fw={600}>Theme</Text>
      </Group>

      <Group gap="sm">
        {options.map((option) => {
          const isSelected = colorScheme === option.value;

          return (
            <Paper
              key={option.value}
              p="md"
              radius="md"
              withBorder
              style={{
                cursor: "pointer",
                flex: 1,
                minWidth: 100,
                borderColor: isSelected
                  ? "var(--mantine-color-brand-6)"
                  : undefined,
                borderWidth: isSelected ? 2 : 1,
                backgroundColor: isSelected
                  ? isDark
                    ? "rgba(34, 139, 230, 0.1)"
                    : "rgba(34, 139, 230, 0.05)"
                  : undefined,
                transition: "all 0.15s ease",
              }}
              onClick={() => setColorScheme(option.value)}
            >
              <Box
                c={isSelected ? "brand" : "dimmed"}
                mb="xs"
                style={{ textAlign: "center" }}
              >
                {option.icon}
              </Box>
              <Text
                size="sm"
                fw={isSelected ? 600 : 500}
                ta="center"
                c={isSelected ? "brand" : undefined}
              >
                {option.label}
              </Text>
              <Text size="xs" c="dimmed" ta="center" mt={4}>
                {option.description}
              </Text>
            </Paper>
          );
        })}
      </Group>
    </Paper>
  );
}
