"use client";

import {
  Badge,
  Card,
  Container,
  List,
  Stack,
  Text,
  Title,
} from "@mantine/core";

export default function PricingPage() {
  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Stack gap="sm">
          <Badge size="lg" color="green" variant="light">
            100% Gratis
          </Badge>
          <Title order={1}>Pricing</Title>
          <Text c="dimmed">
            Exima tidak memungut biaya. Semua fitur ekspor/impor penyesuaian
            persediaan tersedia gratis.
          </Text>
        </Stack>

        <Card withBorder shadow="sm" padding="lg">
          <Title order={3} mb="sm">
            Termasuk
          </Title>
          <List spacing="sm">
            <List.Item>Ekspor massal CSV/XLSX/JSON + pratinjau 20 baris</List.Item>
            <List.Item>Impor massal dengan validasi item, tipe, tanggal, unit</List.Item>
            <List.Item>OAuth Accurate + manajemen kredensial per pengguna</List.Item>
            <List.Item>Rate limiting bawaan dan notifikasi UI</List.Item>
            <List.Item>Dashboard responsif berbasis Mantine UI</List.Item>
          </List>
        </Card>

        <Card withBorder shadow="sm" padding="lg">
          <Title order={3} mb="sm">
            Yang perlu disiapkan
          </Title>
          <List spacing="sm">
            <List.Item>Akun Accurate Online aktif</List.Item>
            <List.Item>App Key & Signature Secret dari Accurate App Market</List.Item>
            <List.Item>API Token (via OAuth callback) atau input manual</List.Item>
            <List.Item>Database Postgres untuk menyimpan kredensial & job</List.Item>
          </List>
        </Card>
      </Stack>
    </Container>
  );
}
