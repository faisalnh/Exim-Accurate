"use client";

import {
  Title,
  Paper,
  Stack,
  Button,
  Select,
  Table,
  Alert,
  LoadingOverlay,
  Group,
  Text,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useState, useEffect } from "react";
import { IconAlertCircle, IconDownload } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import dayjs from "dayjs";

interface Credential {
  id: string;
  appKey: string;
}

interface PreviewRecord {
  adjustmentNumber: string;
  date: string;
  itemName: string;
  itemCode: string;
  type: string;
  quantity: number;
  unit: string;
  warehouse?: string;
  description?: string;
}

export default function ExportInventoryAdjustmentPage() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [selectedCredential, setSelectedCredential] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    null,
    null,
  ]);
  const [format, setFormat] = useState<string>("csv");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewRecord[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      const response = await fetch("/api/credentials");
      if (response.ok) {
        const data = await response.json();
        setCredentials(data);
      }
    } catch (err) {
      console.error("Failed to fetch credentials", err);
    }
  };

  const handleExport = async () => {
    if (!selectedCredential) {
      setError("Please select a credential");
      return;
    }

    if (!dateRange[0] || !dateRange[1]) {
      setError("Please select a date range");
      return;
    }

    setError("");
    setLoading(true);
    setPreview([]);

    try {
      const response = await fetch("/api/export/inventory-adjustment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credentialId: selectedCredential,
          startDate: dayjs(dateRange[0]).format("YYYY-MM-DD"),
          endDate: dayjs(dateRange[1]).format("YYYY-MM-DD"),
          format,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Export failed");
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `export.${format}`;

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      notifications.show({
        title: "Success",
        message: "Export completed successfully",
        color: "green",
      });

      // Fetch preview (first 20 rows)
      fetchPreview();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPreview = async () => {
    if (!selectedCredential || !dateRange[0] || !dateRange[1]) return;

    try {
      const response = await fetch(
        `/api/export/inventory-adjustment/preview?` +
        new URLSearchParams({
          credentialId: selectedCredential,
          startDate: dayjs(dateRange[0]).format("YYYY-MM-DD"),
          endDate: dayjs(dateRange[1]).format("YYYY-MM-DD"),
        })
      );

      if (response.ok) {
        const data = await response.json();
        setPreview(data.preview);
      }
    } catch (err) {
      console.error("Failed to fetch preview", err);
    }
  };

  return (
    <Stack gap="md">
      <Title order={1}>Export Inventory Adjustment</Title>

      <Paper p="md" withBorder pos="relative">
        <LoadingOverlay visible={loading} />

        <Stack gap="md">
          <Title order={3}>Export Settings</Title>

          {error && (
            <Alert icon={<IconAlertCircle size={16} />} color="red">
              {error}
            </Alert>
          )}

          <Select
            label="Accurate Credentials"
            placeholder="Select credentials"
            data={credentials.map((c) => ({ value: c.id, label: c.appKey }))}
            value={selectedCredential}
            onChange={setSelectedCredential}
            required
          />

          <DatePickerInput
            type="range"
            label="Date Range"
            placeholder="Pick date range"
            value={dateRange}
            onChange={setDateRange}
            required
          />

          <Select
            label="Export Format"
            data={[
              { value: "csv", label: "CSV" },
              { value: "xlsx", label: "Excel (XLSX)" },
              { value: "json", label: "JSON" },
            ]}
            value={format}
            onChange={(val) => setFormat(val || "csv")}
          />

          <Group>
            <Button
              leftSection={<IconDownload size={16} />}
              onClick={handleExport}
              disabled={!selectedCredential || !dateRange[0] || !dateRange[1]}
            >
              Export
            </Button>
            <Button variant="outline" onClick={fetchPreview}>
              Preview (20 rows)
            </Button>
          </Group>
        </Stack>
      </Paper>

      {preview.length > 0 && (
        <Paper p="md" withBorder>
          <Title order={3} mb="md">
            Preview (showing {preview.length} rows)
          </Title>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Adjustment #</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th>Item Name</Table.Th>
                <Table.Th>Item Code</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Quantity</Table.Th>
                <Table.Th>Unit</Table.Th>
                <Table.Th>Warehouse</Table.Th>
                <Table.Th>Description</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {preview.map((record, idx) => (
                <Table.Tr key={idx}>
                  <Table.Td>{record.adjustmentNumber}</Table.Td>
                  <Table.Td>{record.date}</Table.Td>
                  <Table.Td>{record.itemName}</Table.Td>
                  <Table.Td>{record.itemCode}</Table.Td>
                  <Table.Td>{record.type}</Table.Td>
                  <Table.Td>{record.quantity}</Table.Td>
                  <Table.Td>{record.unit}</Table.Td>
                  <Table.Td>{record.warehouse || "-"}</Table.Td>
                  <Table.Td>{record.description || "-"}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      )}
    </Stack>
  );
}
