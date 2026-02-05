"use client";

import {
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Group,
  List,
  Stack,
  Text,
  Title,
  useMantineColorScheme,
} from "@mantine/core";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function TermsPage() {
  const router = useRouter();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";
  const currentYear = new Date().getFullYear();

  return (
    <Box
      style={{
        minHeight: "100vh",
        background: isDark
          ? "linear-gradient(180deg, var(--mantine-color-dark-8) 0%, var(--mantine-color-dark-9) 100%)"
          : "linear-gradient(180deg, #FFFFFF 0%, #F8F9FA 100%)",
      }}
    >
      <Box
        component="header"
        py="md"
        style={{
          borderBottom: isDark
            ? "1px solid rgba(255, 255, 255, 0.1)"
            : "1px solid rgba(0, 0, 0, 0.05)",
          backdropFilter: "blur(10px)",
          backgroundColor: isDark
            ? "rgba(26, 27, 30, 0.8)"
            : "rgba(255, 255, 255, 0.8)",
        }}
      >
        <Container size="lg">
          <Group justify="space-between">
            <Group
              gap="xs"
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/")}
            >
              <Box
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background:
                    "linear-gradient(135deg, #228BE6 0%, #1C7ED6 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: 700,
                  fontSize: 18,
                }}
              >
                E
              </Box>
              <Text
                size="xl"
                fw={700}
                style={{
                  background: isDark
                    ? "linear-gradient(135deg, #74C0FC 0%, #A5D8FF 100%)"
                    : "linear-gradient(135deg, #228BE6 0%, #1C7ED6 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Exima
              </Text>
            </Group>

            <Group gap="sm">
              <ThemeToggle />
              <Button
                variant="subtle"
                size="sm"
                onClick={() => router.push("/terms")}
              >
                Terms
              </Button>
              <Button
                variant="filled"
                size="sm"
                onClick={() => router.push("/login")}
              >
                Masuk
              </Button>
            </Group>
          </Group>
        </Container>
      </Box>

      <Container size="md" py={{ base: "xl", md: 60 }}>
        <Stack gap="lg">
          <Badge size="md" variant="light" color="blue" w="fit-content">
            Terms
          </Badge>
          <Title order={1}>Syarat & Ketentuan</Title>
          <Text c="dimmed">
            Dengan menggunakan Exima, Anda menyetujui syarat berikut:
          </Text>

          <Card
            radius="lg"
            padding="xl"
            style={{
              border: isDark
                ? "1px solid rgba(255, 255, 255, 0.08)"
                : "1px solid rgba(0, 0, 0, 0.05)",
              backgroundColor: isDark
                ? "rgba(26, 27, 30, 0.6)"
                : "rgba(255, 255, 255, 0.9)",
            }}
          >
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
                Anda bertanggung jawab atas kebenaran data yang diimpor dan
                rentang data yang diekspor.
              </List.Item>
              <List.Item>
                Jangan membagikan kredensial Anda kepada pihak lain; hapus
                kredensial jika sudah tidak digunakan.
              </List.Item>
              <List.Item>
                Layanan disediakan apa adanya (&quot;as-is&quot;) tanpa jaminan; gunakan
                dengan mempertimbangkan kebijakan internal perusahaan Anda.
              </List.Item>
            </List>
          </Card>

          <Card
            radius="lg"
            padding="xl"
            style={{
              border: isDark
                ? "1px solid rgba(255, 255, 255, 0.08)"
                : "1px solid rgba(0, 0, 0, 0.05)",
              backgroundColor: isDark
                ? "rgba(26, 27, 30, 0.6)"
                : "rgba(255, 255, 255, 0.9)",
            }}
          >
            <Stack gap="sm">
              <Text fw={600}>Integrasi Accurate</Text>
              <Text c="dimmed">
                Integrasi dilakukan melalui OAuth Accurate dan kredensial resmi
                dari Accurate App Market. Untuk Cloud, akses akan direview
                admin. Untuk self-host, Anda mengelola sendiri App Key, Secret,
                dan callback URL sesuai lingkungan Anda.
              </Text>
            </Stack>
          </Card>
        </Stack>
      </Container>

      <Box
        component="footer"
        py="xl"
        style={{
          borderTop: isDark
            ? "1px solid rgba(255, 255, 255, 0.1)"
            : "1px solid rgba(0, 0, 0, 0.05)",
        }}
      >
        <Container size="lg">
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <Box
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background:
                    "linear-gradient(135deg, #228BE6 0%, #1C7ED6 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                E
              </Box>
              <Text size="sm" c="dimmed">
                © {currentYear}{" "}
                <Anchor
                  href="https://madlabs.millenniaws.sch.id/"
                  target="_blank"
                  rel="noreferrer"
                  c="dimmed"
                >
                  MAD Labs by Millennia World School
                </Anchor>
                . All rights reserved.
              </Text>
            </Group>

            <Group gap="md">
              <Anchor size="sm" c="dimmed" href="/">
                Home
              </Anchor>
              <Anchor size="sm" c="dimmed" href="/login">
                Login
              </Anchor>
            </Group>
          </Group>
        </Container>
      </Box>
    </Box>
  );
}
