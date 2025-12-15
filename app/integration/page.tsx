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

export default function IntegrationPage() {
  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Stack gap="sm">
          <Badge size="lg" variant="light">
            Integrasi Accurate
          </Badge>
          <Title order={1}>Cara Exima terhubung ke Accurate</Title>
          <Text c="dimmed">
            Exima memakai OAuth untuk mengambil API Token, menandatangani request dengan
            HMAC-SHA256, dan otomatis menemukan host Accurate untuk setiap token.
          </Text>
        </Stack>

        <Card withBorder shadow="sm" padding="lg">
          <Title order={3} mb="sm">
            Alur OAuth & Token
          </Title>
          <List spacing="xs">
            <List.Item>
              Pengguna klik “Connect Accurate” → diarahkan ke Accurate App Market (client
              ID/secret dari environment).
            </List.Item>
            <List.Item>
              Accurate mengembalikan authorization code ke `ACCURATE_REDIRECT_URI`
              (tunnel: https://exima.mws.web.id/accurate/callback).
            </List.Item>
            <List.Item>
              Exima menukar code menjadi API Token, lalu menyimpannya bersama App Key &
              Signature Secret milik app.
            </List.Item>
          </List>
        </Card>

        <Card withBorder shadow="sm" padding="lg">
          <Title order={3} mb="sm">
            Keamanan & Pembatasan
          </Title>
          <List spacing="xs">
            <List.Item>
              Header HMAC-SHA256 (`X-Api-Timestamp`, `X-Api-Signature`) menggunakan
              Signature Secret.
            </List.Item>
            <List.Item>
              Rate limit bawaan: 8 permintaan/detik dan 8 permintaan konkuren.
            </List.Item>
            <List.Item>
              Host Accurate di-resolve otomatis lewat endpoint api-token dan disimpan
              per kredensial.
            </List.Item>
          </List>
        </Card>

        <Card withBorder shadow="sm" padding="lg">
          <Title order={3} mb="sm">
            Dukungan modul
          </Title>
          <Text c="dimmed">
            Fokus pada Inventory Adjustment: ekspor pratinjau & full data, impor dengan
            validasi (kode item, jenis, tanggal, unit), dan job tracking bawaan.
          </Text>
        </Card>
      </Stack>
    </Container>
  );
}
