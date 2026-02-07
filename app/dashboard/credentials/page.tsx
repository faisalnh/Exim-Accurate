"use client";

import {
  Title,
  Paper,
  Stack,
  Button,
  Table,
  ActionIcon,
  Group,
  Text,
  LoadingOverlay,
  Tooltip,
} from "@mantine/core";
import { useState, useEffect, useRef } from "react";
import { IconTrash, IconCheck, IconKey } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";
import { useSearchParams } from "next/navigation";

interface Credential {
  id: string;
  appKey: string;
  host: string | null;
  createdAt: string;
}

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDeleteId, setLoadingDeleteId] = useState<string | null>(null);
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

  const handleDelete = (id: string) => {
    modals.openConfirmModal({
      title: "Disconnect Account",
      children: (
        <Text size="sm">
          Are you sure you want to disconnect this Accurate account? This action
          cannot be undone.
        </Text>
      ),
      labels: { confirm: "Disconnect", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        setLoadingDeleteId(id);
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
          } else {
            throw new Error("Failed to delete");
          }
        } catch (err) {
          notifications.show({
            title: "Error",
            message: "Failed to delete credential",
            color: "red",
          });
        } finally {
          setLoadingDeleteId(null);
        }
      },
    });
  };

  return (
    <Stack gap="md">
      <Title order={1}>Accurate Credentials</Title>

      <Paper p="md" withBorder>
        <Stack gap="md">
          <Title order={3}>Connect Accurate</Title>
          <Text c="dimmed" size="sm">
            Connect your Accurate account to enable data import and export. Your
            App Key and Signature Secret are configured in environment
            variables.
          </Text>
          <Button
            component="a"
            href="/api/accurate/authorize"
            leftSection={<IconKey size={16} />}
            variant="light"
          >
            Connect Accurate
          </Button>
        </Stack>
      </Paper>

      <Paper p="md" withBorder pos="relative">
        <LoadingOverlay visible={loading} />
        <Title order={3} mb="md">
          Connected Accounts
        </Title>

        {credentials.length === 0 && !loading ? (
          <Text c="dimmed">
            No Accurate accounts connected yet. Click &quot;Connect
            Accurate&quot; to get started.
          </Text>
        ) : (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>App Key</Table.Th>
                <Table.Th>Host</Table.Th>
                <Table.Th>Connected At</Table.Th>
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
                      <Tooltip label="Disconnect account" withArrow>
                        <ActionIcon
                          color="red"
                          onClick={() => handleDelete(cred.id)}
                          loading={loadingDeleteId === cred.id}
                          aria-label="Disconnect account"
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Tooltip>
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
