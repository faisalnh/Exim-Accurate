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
import { useSearchParams } from "next/navigation";
import { EmptyState } from "@/components/ui/EmptyState";

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
        title: "Terhubung",
        message: "Token API Accurate berhasil disimpan dari OAuth",
        color: "green",
        icon: <IconCheck size={16} />,
      });
      fetchCredentials();
    } else if (status === "error") {
      notifications.show({
        title: "Kesalahan OAuth",
        message: message || "Gagal terhubung ke Accurate",
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

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus kredensial ini?")) {
      return;
    }

    setLoadingDeleteId(id);
    try {
      const response = await fetch(`/api/credentials?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        notifications.show({
          title: "Berhasil",
          message: "Kredensial dihapus",
          color: "green",
          icon: <IconCheck size={16} />,
        });
        fetchCredentials();
      }
    } catch (err) {
      notifications.show({
        title: "Gagal",
        message: "Gagal menghapus kredensial",
        color: "red",
      });
    } finally {
      setLoadingDeleteId(null);
    }
  };

  return (
    <Stack gap="md">
      <Title order={1}>Kredensial Accurate</Title>

      <Paper p="md" withBorder>
        <Stack gap="md">
          <Title order={3}>Hubungkan Accurate</Title>
          <Text c="dimmed" size="sm">
            Hubungkan akun Accurate Anda untuk mengaktifkan ekspor dan impor
            data. App Key dan Signature Secret diatur melalui variabel
            lingkungan.
          </Text>
          <Button
            component="a"
            href="/api/accurate/authorize"
            leftSection={<IconKey size={16} />}
            variant="light"
          >
            Hubungkan Accurate
          </Button>
        </Stack>
      </Paper>

      <Paper p="md" withBorder pos="relative">
        <LoadingOverlay visible={loading} />
        <Title order={3} mb="md">
          Akun Terhubung
        </Title>

        {credentials.length === 0 && !loading ? (
          <EmptyState
            variant="no-credentials"
            title="Belum ada akun terhubung"
            description="Hubungkan akun Accurate untuk memulai."
            action={{
              label: "Hubungkan Accurate",
              onClick: () => (window.location.href = "/api/accurate/authorize"),
            }}
          />
        ) : (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>App Key</Table.Th>
                <Table.Th>Host</Table.Th>
                <Table.Th>Waktu Terhubung</Table.Th>
                <Table.Th>Aksi</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {credentials.map((cred) => (
                <Table.Tr key={cred.id}>
                  <Table.Td>{cred.appKey}</Table.Td>
                  <Table.Td>{cred.host || "Belum terdeteksi"}</Table.Td>
                  <Table.Td>
                    {new Date(cred.createdAt).toLocaleDateString()}
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Tooltip label="Putuskan akun" withArrow>
                        <ActionIcon
                          color="red"
                          onClick={() => handleDelete(cred.id)}
                          loading={loadingDeleteId === cred.id}
                          aria-label="Putuskan akun"
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
