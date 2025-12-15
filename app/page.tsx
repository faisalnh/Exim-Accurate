"use client";

import {
  Badge,
  Button,
  Card,
  Container,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {
  IconDownload,
  IconUpload,
  IconShield,
  IconPlugConnected,
} from "@tabler/icons-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const features = [
  {
    icon: <IconDownload size={28} />,
    title: "Ekspor massal",
    description:
      "Unduh penyesuaian persediaan ke CSV, XLSX, atau JSON dengan pratinjau 20 baris.",
  },
  {
    icon: <IconUpload size={28} />,
    title: "Impor massal",
    description:
      "Validasi template CSV/XLSX (kode item, tanggal, unit, jenis) lalu impor batch.",
  },
  {
    icon: <IconShield size={28} />,
    title: "Kredensial aman",
    description:
      "OAuth Accurate + HMAC-SHA256 signature dengan rate limit bawaan (8 rps, 8 konkuren).",
  },
  {
    icon: <IconPlugConnected size={28} />,
    title: "Satu alur terpadu",
    description:
      "Pilih modul Inventory Adjustment, lalu pilih ekspor (get data) atau impor (input data).",
  },
];

export default function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();

  const primaryCta = () => {
    router.push(session ? "/dashboard" : "/login");
  };

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Stack gap="md" align="flex-start">
          <Badge size="lg" variant="light">
            Exima · Gratis 100%
          </Badge>
          <Title order={1}>
            Ekspor & impor massal Inventory Adjustment Accurate
          </Title>
          <Text size="lg" c="dimmed">
            Exima mempermudah ekspor dan impor penyesuaian persediaan dalam
            skala besar dengan validasi, pratinjau, dan pengelolaan kredensial
            Accurate yang aman.
          </Text>
          <Group>
            <Button size="md" onClick={primaryCta}>
              {session ? "Masuk ke Dashboard" : "Mulai Sekarang"}
            </Button>
            <Button
              size="md"
              variant="outline"
              onClick={() => router.push("/pricing")}
            >
              Lihat Pricing
            </Button>
            <Button
              size="md"
              variant="outline"
              onClick={() => router.push("/integration")}
            >
              Integrasi Accurate
            </Button>
            <Button
              size="md"
              variant="subtle"
              onClick={() => router.push("/terms")}
            >
              Syarat & Ketentuan
            </Button>
          </Group>
          <Text size="sm" c="dimmed">
            Sudah menerbitkan app di Accurate App Market? Sambungkan via OAuth,
            lalu ekspor/impor.
          </Text>
        </Stack>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
          {features.map((feature) => (
            <Card
              key={feature.title}
              shadow="sm"
              padding="lg"
              radius="md"
              withBorder
            >
              <Group gap="sm" mb="sm">
                {feature.icon}
                <Title order={4}>{feature.title}</Title>
              </Group>
              <Text c="dimmed">{feature.description}</Text>
            </Card>
          ))}
        </SimpleGrid>
      </Stack>
    </Container>
  );
}
