"use client";

import {
  Title,
  Paper,
  Stack,
  Button,
  Select,
  Table,
  Alert,
  Group,
  Text,
  Box,
  Badge,
  ThemeIcon,
  SimpleGrid,
  Checkbox,
  ScrollArea,
  List,
  useMantineColorScheme,
  Transition,
  Progress,
  Divider,
  rem,
} from "@mantine/core";
import { useState, useEffect } from "react";
import {
  IconAlertCircle,
  IconUpload,
  IconCheck,
  IconFileImport,
  IconPlugConnected,
  IconArrowRight,
  IconArrowLeft,
  IconFileCheck,
  IconFileX,
  IconSettings,
  IconX,
  IconDownload,
  IconInfoCircle,
  IconListCheck,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { Stepper, StepperCard, type Step } from "@/components/ui";
import { FileDropzone } from "@/components/ui/FileDropzone";
import { EmptyState } from "@/components/ui/EmptyState";

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
  referenceNumber?: string;
  warehouse?: string;
  description?: string;
  valid: boolean;
  errors: string[];
}

const steps: Step[] = [
  {
    id: "select-account",
    title: "Select Account",
    description: "Choose Accurate account",
  },
  {
    id: "upload",
    title: "Upload File",
    description: "Upload CSV or Excel",
  },
  {
    id: "validate",
    title: "Validate & Import",
    description: "Review and confirm",
  },
];

const templateColumns = [
  { name: "itemCode", required: true, description: "Item code from Accurate" },
  {
    name: "type",
    required: true,
    description: "Penambahan or Pengurangan",
  },
  { name: "quantity", required: true, description: "Positive number" },
  { name: "unit", required: true, description: "Unit name" },
  { name: "adjustmentDate", required: true, description: "YYYY-MM-DD format" },
  {
    name: "referenceNumber",
    required: false,
    description: "Optional reference (Adjustment No)",
  },
  { name: "warehouse", required: false, description: "Warehouse name" },
  {
    name: "description",
    required: false,
    description: "Adjustment description",
  },
];

export default function ImportInventoryAdjustmentPage() {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  const [activeStep, setActiveStep] = useState(0);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [selectedCredential, setSelectedCredential] = useState<string | null>(
    null,
  );
  const [loadingCredentials, setLoadingCredentials] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [validatedRows, setValidatedRows] = useState<ValidatedRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [useAutoNumbering, setUseAutoNumbering] = useState(true);
  const [importResults, setImportResults] = useState<{
    successCount: number;
    failedCount: number;
    errors: string[];
  } | null>(null);

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    setLoadingCredentials(true);
    try {
      const response = await fetch("/api/credentials");
      if (response.ok) {
        const data = await response.json();
        setCredentials(data);
        if (data.length === 1) {
          setSelectedCredential(data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch credentials", err);
    } finally {
      setLoadingCredentials(false);
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
    setImportResults(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("credentialId", selectedCredential);

      const response = await fetch(
        "/api/import/inventory-adjustment/validate",
        {
          method: "POST",
          body: formData,
        },
      );

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
          message: `All ${result.results.length} rows are valid and ready to import`,
          color: "green",
          icon: <IconCheck size={16} />,
        });
      } else {
        notifications.show({
          title: "Validation Issues Found",
          message: `Found ${result.errors.length} errors that need to be fixed`,
          color: "orange",
          icon: <IconAlertCircle size={16} />,
        });
      }
    } catch (err: any) {
      setError(err.message);
      notifications.show({
        title: "Validation Failed",
        message: err.message,
        color: "red",
        icon: <IconX size={16} />,
      });
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
      formData.append("useAutoNumbering", String(useAutoNumbering));

      const response = await fetch("/api/import/inventory-adjustment", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Import failed");
      }

      const result = await response.json();
      setImportResults(result);

      if (result.success && result.failedCount === 0) {
        notifications.show({
          title: "Import Successful",
          message: `Successfully imported all ${result.successCount} adjustments to Accurate`,
          color: "green",
          icon: <IconCheck size={16} />,
          autoClose: 5000,
        });
      } else if (result.successCount > 0) {
        notifications.show({
          title: "Import Partially Successful",
          message: `Imported ${result.successCount} adjustments, but ${result.failedCount} failed.`,
          color: "orange",
          icon: <IconAlertCircle size={16} />,
          autoClose: 5000,
        });
      } else {
        notifications.show({
          title: "Import Failed",
          message: `Failed to import adjustments. ${result.failedCount} errors found.`,
          color: "red",
          icon: <IconX size={16} />,
        });
      }
    } catch (err: any) {
      setError(err.message);
      notifications.show({
        title: "Import Failed",
        message: err.message,
        color: "red",
        icon: <IconX size={16} />,
      });
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setValidatedRows([]);
    setValidationErrors([]);
    setImportResults(null);
    setError("");
    setActiveStep(1);
  };

  const canProceedToStep2 = selectedCredential !== null;
  const canProceedToStep3 = file !== null;
  const validRowsCount = validatedRows.filter((r) => r.valid).length;
  const invalidRowsCount = validatedRows.filter((r) => !r.valid).length;
  const isValidationComplete = validatedRows.length > 0;
  const canImport =
    isValidationComplete && validationErrors.length === 0 && validRowsCount > 0;

  const handleNext = () => {
    if (activeStep === 1 && canProceedToStep3) {
      handleValidate();
    }
    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const selectedCredentialData = credentials.find(
    (c) => c.id === selectedCredential,
  );

  return (
    <Stack gap="lg">
      {/* Page Header */}
      <Group justify="space-between" align="flex-start">
        <Box>
          <Group gap="sm" mb={4}>
            <ThemeIcon size={32} radius="md" variant="light" color="green">
              <IconFileImport size={18} />
            </ThemeIcon>
            <Title order={2}>Import Inventory Adjustment</Title>
          </Group>
          <Text c="dimmed" size="sm">
            Import inventory adjustment data from CSV or Excel files
          </Text>
        </Box>
        <Badge size="lg" variant="light" color="green">
          Step {activeStep + 1} of {steps.length}
        </Badge>
      </Group>

      {/* Stepper */}
      <Paper
        p="md"
        radius="lg"
        style={{
          border: isDark
            ? "1px solid var(--mantine-color-dark-4)"
            : "1px solid var(--mantine-color-gray-2)",
        }}
      >
        <Stepper
          steps={steps}
          activeStep={activeStep}
          onStepClick={setActiveStep}
          allowClickNavigation
          size="md"
        />
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          color="red"
          variant="light"
          radius="md"
          withCloseButton
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}

      {/* Step Content */}
      <Box>
        {/* Step 1: Select Account */}
        <Transition mounted={activeStep === 0} transition="fade" duration={200}>
          {(styles) => (
            <Box style={styles}>
              <StepperCard
                title="Select Accurate Account"
                description="Choose which account to import data to"
              >
                {loadingCredentials ? (
                  <Stack gap="md" py="xl" align="center">
                    <Text c="dimmed">Loading accounts...</Text>
                  </Stack>
                ) : credentials.length === 0 ? (
                  <EmptyState
                    variant="no-credentials"
                    title="No accounts connected"
                    description="Connect your Accurate account first to import data"
                    action={{
                      label: "Connect Account",
                      onClick: () =>
                        (window.location.href = "/dashboard/credentials"),
                    }}
                  />
                ) : (
                  <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                    {credentials.map((cred) => {
                      const isSelected = selectedCredential === cred.id;
                      return (
                        <Paper
                          key={cred.id}
                          p="lg"
                          radius="lg"
                          withBorder
                          style={{
                            cursor: "pointer",
                            borderColor: isSelected
                              ? "var(--mantine-color-green-6)"
                              : isDark
                                ? "var(--mantine-color-dark-4)"
                                : "var(--mantine-color-gray-3)",
                            borderWidth: isSelected ? 2 : 1,
                            backgroundColor: isSelected
                              ? isDark
                                ? "rgba(64, 192, 87, 0.1)"
                                : "rgba(64, 192, 87, 0.05)"
                              : undefined,
                            transition: "all 0.2s ease",
                          }}
                          onClick={() => setSelectedCredential(cred.id)}
                        >
                          <Group justify="space-between" mb="sm">
                            <ThemeIcon
                              size={40}
                              radius="md"
                              variant="light"
                              color={isSelected ? "green" : "gray"}
                            >
                              <IconPlugConnected size={20} />
                            </ThemeIcon>
                            {isSelected && (
                              <ThemeIcon
                                size={24}
                                radius="xl"
                                color="green"
                                variant="filled"
                              >
                                <IconCheck size={14} />
                              </ThemeIcon>
                            )}
                          </Group>
                          <Text fw={600} size="sm">
                            {cred.appKey}
                          </Text>
                          <Text size="xs" c="dimmed" mt={4}>
                            Click to select
                          </Text>
                        </Paper>
                      );
                    })}
                  </SimpleGrid>
                )}
              </StepperCard>
            </Box>
          )}
        </Transition>

        {/* Step 2: Upload File */}
        <Transition mounted={activeStep === 1} transition="fade" duration={200}>
          {(styles) => (
            <Box style={styles}>
              <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
                {/* Upload Card */}
                <StepperCard
                  title="Upload File"
                  description="Select your CSV or Excel file"
                >
                  <Stack gap="lg">
                    <FileDropzone
                      onFileSelect={setFile}
                      onFileRemove={() => setFile(null)}
                      accept=".csv,.xlsx"
                      maxSize={10 * 1024 * 1024}
                      value={file}
                      title="Drop your file here or click to browse"
                      description="Supports CSV and Excel (XLSX) files"
                    />

                    <Divider />

                    <Box>
                      <Group gap="sm" mb="sm">
                        <ThemeIcon size={24} radius="md" variant="light">
                          <IconSettings size={14} />
                        </ThemeIcon>
                        <Text size="sm" fw={600}>
                          Import Options
                        </Text>
                      </Group>

                      <Checkbox
                        label="Use Automatic Numbering"
                        description="If checked, Accurate will generate the adjustment number automatically"
                        checked={useAutoNumbering}
                        onChange={(event) =>
                          setUseAutoNumbering(event.currentTarget.checked)
                        }
                        styles={{
                          body: { alignItems: "flex-start" },
                          label: { fontWeight: 500 },
                        }}
                      />
                    </Box>
                  </Stack>
                </StepperCard>

                {/* Template Info Card */}
                <StepperCard
                  title="Template Format"
                  description="Required columns for your import file"
                >
                  <Stack gap="md">
                    <Alert
                      variant="light"
                      color="blue"
                      radius="md"
                      icon={<IconInfoCircle size={16} />}
                    >
                      <Text size="sm">
                        Your file must contain the required columns listed
                        below. Column names should match exactly.
                      </Text>
                    </Alert>

                    <ScrollArea h={280}>
                      <Stack gap="xs">
                        {templateColumns.map((col) => (
                          <Paper
                            key={col.name}
                            p="sm"
                            radius="md"
                            withBorder
                            style={{
                              borderColor: col.required
                                ? isDark
                                  ? "var(--mantine-color-dark-4)"
                                  : "var(--mantine-color-gray-3)"
                                : isDark
                                  ? "var(--mantine-color-dark-5)"
                                  : "var(--mantine-color-gray-2)",
                            }}
                          >
                            <Group justify="space-between" wrap="nowrap">
                              <Group gap="sm" wrap="nowrap">
                                <Badge
                                  size="xs"
                                  variant={col.required ? "filled" : "light"}
                                  color={col.required ? "blue" : "gray"}
                                >
                                  {col.required ? "Required" : "Optional"}
                                </Badge>
                                <Text size="sm" fw={600} ff="monospace">
                                  {col.name}
                                </Text>
                              </Group>
                            </Group>
                            <Text size="xs" c="dimmed" mt={4}>
                              {col.description}
                            </Text>
                          </Paper>
                        ))}
                      </Stack>
                    </ScrollArea>

                    <Button
                      variant="light"
                      leftSection={<IconDownload size={16} />}
                      fullWidth
                      onClick={() => {
                        // Download template logic here
                        const headers = templateColumns
                          .map((c) => c.name)
                          .join(",");
                        const blob = new Blob([headers + "\n"], {
                          type: "text/csv",
                        });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "inventory_adjustment_template.csv";
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      Download Template
                    </Button>
                  </Stack>
                </StepperCard>
              </SimpleGrid>
            </Box>
          )}
        </Transition>

        {/* Step 3: Validate & Import */}
        <Transition mounted={activeStep === 2} transition="fade" duration={200}>
          {(styles) => (
            <Box style={styles}>
              <Stack gap="lg">
                {/* Summary Card */}
                <Paper
                  p="lg"
                  radius="lg"
                  style={{
                    background: isDark
                      ? "linear-gradient(135deg, rgba(64, 192, 87, 0.1) 0%, rgba(32, 201, 151, 0.1) 100%)"
                      : "linear-gradient(135deg, rgba(64, 192, 87, 0.05) 0%, rgba(32, 201, 151, 0.05) 100%)",
                    border: isDark
                      ? "1px solid var(--mantine-color-dark-4)"
                      : "1px solid var(--mantine-color-gray-2)",
                  }}
                >
                  <Group justify="space-between" align="flex-start" wrap="wrap">
                    <Stack gap="md">
                      <Text size="lg" fw={600}>
                        Import Summary
                      </Text>
                      <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="lg">
                        <Group gap="sm">
                          <ThemeIcon
                            size={36}
                            radius="md"
                            variant="light"
                            color="violet"
                          >
                            <IconPlugConnected size={18} />
                          </ThemeIcon>
                          <Box>
                            <Text size="xs" c="dimmed">
                              Account
                            </Text>
                            <Text size="sm" fw={600}>
                              {selectedCredentialData?.appKey || "-"}
                            </Text>
                          </Box>
                        </Group>

                        <Group gap="sm">
                          <ThemeIcon
                            size={36}
                            radius="md"
                            variant="light"
                            color="blue"
                          >
                            <IconFileImport size={18} />
                          </ThemeIcon>
                          <Box>
                            <Text size="xs" c="dimmed">
                              File
                            </Text>
                            <Text size="sm" fw={600} lineClamp={1}>
                              {file?.name || "-"}
                            </Text>
                          </Box>
                        </Group>

                        <Group gap="sm">
                          <ThemeIcon
                            size={36}
                            radius="md"
                            variant="light"
                            color="green"
                          >
                            <IconFileCheck size={18} />
                          </ThemeIcon>
                          <Box>
                            <Text size="xs" c="dimmed">
                              Valid Rows
                            </Text>
                            <Text size="sm" fw={600} c="green">
                              {validRowsCount}
                            </Text>
                          </Box>
                        </Group>

                        <Group gap="sm">
                          <ThemeIcon
                            size={36}
                            radius="md"
                            variant="light"
                            color="red"
                          >
                            <IconFileX size={18} />
                          </ThemeIcon>
                          <Box>
                            <Text size="xs" c="dimmed">
                              Invalid Rows
                            </Text>
                            <Text size="sm" fw={600} c="red">
                              {invalidRowsCount}
                            </Text>
                          </Box>
                        </Group>
                      </SimpleGrid>
                    </Stack>

                    <Group gap="sm">
                      <Button
                        variant="light"
                        onClick={handleValidate}
                        loading={validating}
                        leftSection={<IconListCheck size={16} />}
                      >
                        Re-validate
                      </Button>
                      <Button
                        size="lg"
                        leftSection={<IconUpload size={20} />}
                        onClick={handleImport}
                        loading={importing}
                        disabled={!canImport}
                        color="green"
                        style={{
                          boxShadow: canImport
                            ? "0 4px 14px rgba(64, 192, 87, 0.4)"
                            : undefined,
                        }}
                      >
                        Import to Accurate
                      </Button>
                    </Group>
                  </Group>
                </Paper>

                {/* Import Results */}
                {importResults && (
                  <Alert
                    variant="light"
                    color={
                      importResults.failedCount === 0
                        ? "green"
                        : importResults.successCount > 0
                          ? "orange"
                          : "red"
                    }
                    radius="md"
                    icon={
                      importResults.failedCount === 0 ? (
                        <IconCheck size={20} />
                      ) : (
                        <IconAlertCircle size={20} />
                      )
                    }
                    title={
                      importResults.failedCount === 0
                        ? "Import Completed Successfully"
                        : importResults.successCount > 0
                          ? "Import Partially Completed"
                          : "Import Failed"
                    }
                  >
                    <Stack gap="sm">
                      <Text size="sm">
                        Successfully imported:{" "}
                        <strong>{importResults.successCount}</strong> | Failed:{" "}
                        <strong>{importResults.failedCount}</strong>
                      </Text>

                      {importResults.errors.length > 0 && (
                        <List size="sm" spacing="xs">
                          {importResults.errors.slice(0, 5).map((err, idx) => (
                            <List.Item key={idx}>{err}</List.Item>
                          ))}
                          {importResults.errors.length > 5 && (
                            <List.Item>
                              ...and {importResults.errors.length - 5} more
                              errors
                            </List.Item>
                          )}
                        </List>
                      )}

                      <Button
                        variant="light"
                        size="xs"
                        onClick={handleReset}
                        w="fit-content"
                      >
                        Import Another File
                      </Button>
                    </Stack>
                  </Alert>
                )}

                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                  <Alert
                    icon={<IconAlertCircle size={16} />}
                    color="red"
                    variant="light"
                    radius="md"
                    title={`${validationErrors.length} Validation Errors`}
                  >
                    <List size="sm" spacing="xs">
                      {validationErrors.slice(0, 10).map((err, idx) => (
                        <List.Item key={idx}>{err}</List.Item>
                      ))}
                      {validationErrors.length > 10 && (
                        <List.Item>
                          ...and {validationErrors.length - 10} more errors
                        </List.Item>
                      )}
                    </List>
                  </Alert>
                )}

                {/* Validation Preview */}
                <StepperCard
                  title="Data Preview"
                  description={
                    isValidationComplete
                      ? `${validatedRows.length} rows loaded • ${validRowsCount} valid • ${invalidRowsCount} invalid`
                      : "Validation results will appear here"
                  }
                >
                  {validating ? (
                    <Stack gap="md" py="xl" align="center">
                      <Text c="dimmed">Validating your file...</Text>
                      <Progress value={100} size="sm" animated w={200} />
                    </Stack>
                  ) : !isValidationComplete ? (
                    <EmptyState
                      variant="no-data"
                      title="No validation results"
                      description="Click 'Re-validate' to check your file"
                      size="sm"
                    />
                  ) : (
                    <ScrollArea>
                      <Table
                        striped
                        highlightOnHover
                        withTableBorder
                        withColumnBorders
                        styles={{
                          th: {
                            backgroundColor: isDark
                              ? "var(--mantine-color-dark-6)"
                              : "var(--mantine-color-gray-0)",
                          },
                        }}
                      >
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th w={80}>Status</Table.Th>
                            <Table.Th>Item Code</Table.Th>
                            <Table.Th>Item Name</Table.Th>
                            <Table.Th>Type</Table.Th>
                            <Table.Th>Quantity</Table.Th>
                            <Table.Th>Unit</Table.Th>
                            <Table.Th>Date</Table.Th>
                            <Table.Th>Warehouse</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {validatedRows.map((row, idx) => (
                            <Table.Tr
                              key={idx}
                              style={{
                                backgroundColor: row.valid
                                  ? undefined
                                  : isDark
                                    ? "rgba(250, 82, 82, 0.1)"
                                    : "rgba(250, 82, 82, 0.05)",
                              }}
                            >
                              <Table.Td>
                                {row.valid ? (
                                  <Badge
                                    size="sm"
                                    variant="light"
                                    color="green"
                                    leftSection={<IconCheck size={10} />}
                                  >
                                    Valid
                                  </Badge>
                                ) : (
                                  <Badge
                                    size="sm"
                                    variant="light"
                                    color="red"
                                    leftSection={<IconX size={10} />}
                                  >
                                    Invalid
                                  </Badge>
                                )}
                              </Table.Td>
                              <Table.Td>
                                <Badge size="sm" variant="light" color="gray">
                                  {row.itemCode}
                                </Badge>
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm" lineClamp={1}>
                                  {row.itemName || "-"}
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                <Badge
                                  size="sm"
                                  variant="light"
                                  color={
                                    row.type === "Penambahan" ? "green" : "red"
                                  }
                                >
                                  {row.type}
                                </Badge>
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm" fw={500}>
                                  {row.quantity}
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm">{row.unit}</Text>
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm">{row.adjustmentDate}</Text>
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm" c="dimmed">
                                  {row.warehouse || "-"}
                                </Text>
                              </Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    </ScrollArea>
                  )}
                </StepperCard>
              </Stack>
            </Box>
          )}
        </Transition>
      </Box>

      {/* Navigation */}
      <Paper
        p="md"
        radius="lg"
        style={{
          border: isDark
            ? "1px solid var(--mantine-color-dark-4)"
            : "1px solid var(--mantine-color-gray-2)",
        }}
      >
        <Group justify="space-between">
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={handleBack}
            disabled={activeStep === 0}
          >
            Back
          </Button>

          <Group gap="sm">
            {activeStep === 2 ? (
              <Button
                leftSection={<IconUpload size={16} />}
                onClick={handleImport}
                loading={importing}
                disabled={!canImport}
                color="green"
              >
                Import Now
              </Button>
            ) : (
              <Button
                rightSection={<IconArrowRight size={16} />}
                onClick={handleNext}
                loading={activeStep === 1 && validating}
                disabled={
                  (activeStep === 0 && !canProceedToStep2) ||
                  (activeStep === 1 && !canProceedToStep3)
                }
              >
                {activeStep === 1 ? "Validate & Continue" : "Continue"}
              </Button>
            )}
          </Group>
        </Group>
      </Paper>
    </Stack>
  );
}
