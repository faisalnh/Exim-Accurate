"use client";

import {
  Title,
  Paper,
  Stack,
  Button,
  Select,
  FileInput,
  Table,
  Alert,
  LoadingOverlay,
  Group,
  Text,
  List,
} from "@mantine/core";
import { useState, useEffect } from "react";
import {
  IconAlertCircle,
  IconUpload,
  IconCheck,
  IconFileUpload,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

interface Credential {
  id: string;
  appKey: string;
}

interface ValidatedRow {
  itemCode: string;
  itemName?: string;
  type: string;
  quantity: number;
  unit: string;
  adjustmentDate: string;
  valid: boolean;
  errors: string[];
}

export default function ImportInventoryAdjustmentPage() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [selectedCredential, setSelectedCredential] = useState<string | null>(
    null
  );
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [validatedRows, setValidatedRows] = useState<ValidatedRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
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

  const handleValidate = async () => {
    if (!selectedCredential) {
      setError("Please select a credential");
      return;
    }

    if (!file) {
      setError("Please select a file");
      return;
    }

    setError("");
    setValidating(true);
    setValidatedRows([]);
    setValidationErrors([]);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("credentialId", selectedCredential);

      const response = await fetch("/api/import/inventory-adjustment/validate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Validation failed");
      }

      const result = await response.json();
      setValidatedRows(result.results);
      setValidationErrors(result.errors);

      if (result.valid) {
        notifications.show({
          title: "Validation Successful",
          message: `All ${result.results.length} rows are valid`,
          color: "green",
          icon: <IconCheck size={16} />,
        });
      } else {
        notifications.show({
          title: "Validation Failed",
          message: `Found ${result.errors.length} errors`,
          color: "red",
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setValidating(false);
    }
  };

  const handleImport = async () => {
    if (!selectedCredential || !file) {
      return;
    }

    if (validationErrors.length > 0) {
      setError("Please fix validation errors before importing");
      return;
    }

    setError("");
    setImporting(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("credentialId", selectedCredential);

      const response = await fetch("/api/import/inventory-adjustment", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Import failed");
      }

      const result = await response.json();

      notifications.show({
        title: "Import Successful",
        message: `Successfully imported ${result.successCount} adjustments`,
        color: "green",
        icon: <IconCheck size={16} />,
      });

      // Reset form
      setFile(null);
      setValidatedRows([]);
      setValidationErrors([]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Stack gap="md">
      <Title order={1}>Import Inventory Adjustment</Title>

      <Paper p="md" withBorder>
        <Stack gap="md">
          <Title order={3}>Template Format</Title>
          <Text size="sm" c="dimmed">
            Your CSV/XLSX file must contain the following columns:
          </Text>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Column</Table.Th>
                <Table.Th>Required</Table.Th>
                <Table.Th>Description</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              <Table.Tr>
                <Table.Td>itemCode</Table.Td>
                <Table.Td>Yes</Table.Td>
                <Table.Td>Item code from Accurate</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>type</Table.Td>
                <Table.Td>Yes</Table.Td>
                <Table.Td>Penambahan or Pengurangan</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>quantity</Table.Td>
                <Table.Td>Yes</Table.Td>
                <Table.Td>Positive number</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>unit</Table.Td>
                <Table.Td>Yes</Table.Td>
                <Table.Td>Unit name</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>adjustmentDate</Table.Td>
                <Table.Td>Yes</Table.Td>
                <Table.Td>YYYY-MM-DD format</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>referenceNumber</Table.Td>
                <Table.Td>No</Table.Td>
                <Table.Td>Optional reference</Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </Stack>
      </Paper>

      <Paper p="md" withBorder pos="relative">
        <LoadingOverlay visible={loading} />

        <Stack gap="md">
          <Title order={3}>Import File</Title>

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

          <FileInput
            label="Upload File"
            placeholder="Select CSV or XLSX file"
            accept=".csv,.xlsx"
            value={file}
            onChange={setFile}
            leftSection={<IconFileUpload size={16} />}
            required
          />

          <Group>
            <Button
              onClick={handleValidate}
              disabled={!selectedCredential || !file}
              loading={validating}
            >
              Validate
            </Button>
            <Button
              leftSection={<IconUpload size={16} />}
              onClick={handleImport}
              disabled={
                !selectedCredential ||
                !file ||
                validatedRows.length === 0 ||
                validationErrors.length > 0
              }
              loading={importing}
              color="green"
            >
              Import
            </Button>
          </Group>
        </Stack>
      </Paper>

      {validationErrors.length > 0 && (
        <Paper p="md" withBorder>
          <Alert icon={<IconAlertCircle size={16} />} color="red" title="Validation Errors">
            <List>
              {validationErrors.map((err, idx) => (
                <List.Item key={idx}>{err}</List.Item>
              ))}
            </List>
          </Alert>
        </Paper>
      )}

      {validatedRows.length > 0 && (
        <Paper p="md" withBorder>
          <Title order={3} mb="md">
            Preview ({validatedRows.length} rows)
          </Title>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Item Code</Table.Th>
                <Table.Th>Item Name</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Quantity</Table.Th>
                <Table.Th>Unit</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {validatedRows.map((row, idx) => (
                <Table.Tr
                  key={idx}
                  style={{
                    backgroundColor: row.valid ? undefined : "#ffe0e0",
                  }}
                >
                  <Table.Td>{row.itemCode}</Table.Td>
                  <Table.Td>{row.itemName || "-"}</Table.Td>
                  <Table.Td>{row.type}</Table.Td>
                  <Table.Td>{row.quantity}</Table.Td>
                  <Table.Td>{row.unit}</Table.Td>
                  <Table.Td>{row.adjustmentDate}</Table.Td>
                  <Table.Td>
                    {row.valid ? (
                      <Text c="green">Valid</Text>
                    ) : (
                      <Text c="red">Invalid</Text>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      )}
    </Stack>
  );
}
