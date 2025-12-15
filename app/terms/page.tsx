"use client";

import { Container, List, Stack, Text, Title } from "@mantine/core";

export default function TermsPage() {
  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Title order={1}>Syarat & Ketentuan</Title>
        <Text c="dimmed">
          Dengan menggunakan Exima, Anda menyetujui syarat berikut:
        </Text>
        <List spacing="sm">
          <List.Item>
            Akses ke Accurate Online membutuhkan kredensial resmi (App Key,
            Signature Secret, API Token) dari akun Anda.
          </List.Item>
          <List.Item>
            Exima hanya mengakses data yang diperlukan untuk ekspor/impor
            penyesuaian persediaan.
          </List.Item>
          <List.Item>
            Anda bertanggung jawab atas kebenaran data yang diimpor dan rentang
            data yang diekspor.
          </List.Item>
          <List.Item>
            Jangan membagikan kredensial Anda kepada pihak lain; hapus kredensial
            jika sudah tidak digunakan.
          </List.Item>
          <List.Item>
            Layanan disediakan apa adanya (“as-is”) tanpa jaminan; gunakan dengan
            mempertimbangkan kebijakan internal perusahaan Anda.
          </List.Item>
        </List>
      </Stack>
    </Container>
  );
}
