import { Title, Text, Paper, Stack } from "@mantine/core";

export default function DashboardPage() {
  return (
    <Stack gap="md">
      <Title order={1}>Dashboard</Title>
      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Text size="lg" fw={500}>
            Welcome to Exima
          </Text>
          <Text c="dimmed">Export/Import Manager for Accurate Online</Text>
          <Text mt="md">Use the navigation menu to access:</Text>
          <Text component="ul">
            <li>
              Inventory Adjustment &rarr; Export (get data to CSV/XLSX/JSON)
            </li>
            <li>
              Inventory Adjustment &rarr; Import (input data from templates)
            </li>
            <li>Manage your Accurate API credentials</li>
          </Text>
        </Stack>
      </Paper>
    </Stack>
  );
}
