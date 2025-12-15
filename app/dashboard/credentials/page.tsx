"use client";

import {
  Title,
  Paper,
  Stack,
  TextInput,
  PasswordInput,
  Button,
  Alert,
  Table,
  ActionIcon,
  Group,
  Text,
  LoadingOverlay,
  Divider,
} from "@mantine/core";
import { useState, useEffect, useRef } from "react";
import { IconAlertCircle, IconTrash, IconCheck } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useSearchParams } from "next/navigation";
import { IconKey } from "@tabler/icons-react";

interface Credential {
  id: string;
  appKey: string;
  host: string | null;
  createdAt: string;
}

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [appKey, setAppKey] = useState("");
  const [signatureSecret, setSignatureSecret] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const handledStatus = useRef<string | null>(null);

  useEffect(() => {
    const status = searchParams.get("status");
    const message = searchParams.get("message");
    const signature = `${status}|${message}`;

    if (!status || handledStatus.current === signature) {
      return;
    }

    handledStatus.current = signature;

    if (status === "connected") {
      notifications.show({
        title: "Connected",
        message: "Accurate API token saved from OAuth",
        color: "green",
        icon: <IconCheck size={16} />,
      });
      fetchCredentials();
    } else if (status === "error") {
      notifications.show({
        title: "OAuth Error",
        message: message || "Failed to connect Accurate",
        color: "red",
      });
    }
  }, [searchParams]);

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
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const response = await fetch("/api/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appKey, signatureSecret, apiToken }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save credentials");
      }

      notifications.show({
        title: "Success",
        message: "Credentials saved successfully",
        color: "green",
        icon: <IconCheck size={16} />,
      });

      setAppKey("");
      setSignatureSecret("");
      setApiToken("");
      fetchCredentials();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this credential?")) {
      return;
    }

    try {
      const response = await fetch(`/api/credentials?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        notifications.show({
          title: "Success",
          message: "Credential deleted",
          color: "green",
          icon: <IconCheck size={16} />,
        });
        fetchCredentials();
      }
    } catch (err) {
      notifications.show({
        title: "Error",
        message: "Failed to delete credential",
        color: "red",
      });
    }
  };

  return (
    <Stack gap="md">
      <Title order={1}>Accurate Credentials</Title>

      <Paper p="md" withBorder>
        <Stack gap="md">
          <Title order={3}>Connect via Accurate OAuth</Title>
          <Text c="dimmed" size="sm">
            Use the Accurate app you published to fetch the API token directly.
            App Key and Signature Secret are read from environment variables,
            the token will be auto-saved to your account.
          </Text>
          <Button
            component="a"
            href="/api/accurate/authorize"
            leftSection={<IconKey size={16} />}
            variant="light"
          >
            Connect Accurate
          </Button>
          <Divider />
        </Stack>

        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <Title order={3}>Add New Credentials</Title>

            {error && (
              <Alert icon={<IconAlertCircle size={16} />} color="red">
                {error}
              </Alert>
            )}

            <TextInput
              label="App Key"
              placeholder="Your Accurate app key"
              required
              value={appKey}
              onChange={(e) => setAppKey(e.currentTarget.value)}
            />

            <PasswordInput
              label="Signature Secret"
              placeholder="Your signature secret"
              required
              value={signatureSecret}
              onChange={(e) => setSignatureSecret(e.currentTarget.value)}
            />

            <PasswordInput
              label="API Token"
              placeholder="Your API token"
              required
              value={apiToken}
              onChange={(e) => setApiToken(e.currentTarget.value)}
            />

            <Button type="submit" loading={saving}>
              Save Credentials
            </Button>
          </Stack>
        </form>
      </Paper>

      <Paper p="md" withBorder pos="relative">
        <LoadingOverlay visible={loading} />
        <Title order={3} mb="md">
          Saved Credentials
        </Title>

        {credentials.length === 0 && !loading ? (
          <Text c="dimmed">No credentials saved yet</Text>
        ) : (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>App Key</Table.Th>
                <Table.Th>Host</Table.Th>
                <Table.Th>Created At</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {credentials.map((cred) => (
                <Table.Tr key={cred.id}>
                  <Table.Td>{cred.appKey}</Table.Td>
                  <Table.Td>{cred.host || "Not resolved"}</Table.Td>
                  <Table.Td>
                    {new Date(cred.createdAt).toLocaleDateString()}
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                        color="red"
                        onClick={() => handleDelete(cred.id)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Paper>
    </Stack>
  );
}
