"use client";

import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Group,
  List,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Accordion,
  Anchor,
  useMantineColorScheme,
  rem,
} from "@mantine/core";
import {
  IconCheck,
  IconX,
  IconSparkles,
  IconRocket,
  IconShield,
  IconClock,
  IconUsers,
  IconCloud,
  IconCode,
  IconHeadset,
  IconArrowRight,
  IconBrandGithub,
  IconFileExport,
  IconFileImport,
  IconPlugConnected,
  IconBell,
  IconDeviceDesktop,
  IconDatabase,
  IconKey,
  IconServer,
  IconQuestionMark,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const includedFeatures = [
  {
    icon: <IconFileExport size={20} />,
    title: "Ekspor Massal",
    description: "CSV, XLSX, JSON dengan pratinjau 20 baris",
  },
  {
    icon: <IconFileImport size={20} />,
    title: "Impor Massal",
    description: "Validasi item, tipe, tanggal, dan unit otomatis",
  },
  {
    icon: <IconPlugConnected size={20} />,
    title: "OAuth Integration",
    description: "Koneksi aman ke Accurate Online",
  },
  {
    icon: <IconShield size={20} />,
    title: "HMAC-SHA256",
    description: "Signature keamanan untuk setiap request",
  },
  {
    icon: <IconBell size={20} />,
    title: "Notifikasi Real-time",
    description: "Status job dan error handling",
  },
  {
    icon: <IconDeviceDesktop size={20} />,
    title: "Dashboard Responsif",
    description: "UI modern berbasis Mantine",
  },
  {
    icon: <IconUsers size={20} />,
    title: "Multi-akun",
    description: "Kelola beberapa akun Accurate",
  },
  {
    icon: <IconClock size={20} />,
    title: "Rate Limiting",
    description: "8 req/detik, 8 konkuren bawaan",
  },
];

const requirements = [
  {
    icon: <IconCloud size={20} />,
    title: "Akun Accurate Online",
    description: "Akun aktif dengan akses API",
  },
  {
    icon: <IconKey size={20} />,
    title: "App Key & Secret",
    description: "Dari Accurate App Market",
  },
  {
    icon: <IconDatabase size={20} />,
    title: "Database PostgreSQL",
    description: "Untuk menyimpan kredensial & job",
  },
  {
    icon: <IconServer size={20} />,
    title: "Server/Hosting",
    description: "Node.js 18+ environment",
  },
];

const comparisonData = [
  { feature: "Ekspor ke CSV/XLSX/JSON", free: true, others: "Berbayar" },
  { feature: "Impor dengan validasi", free: true, others: "Berbayar" },
  { feature: "OAuth Integration", free: true, others: "Berbayar" },
  { feature: "Multi-akun Accurate", free: true, others: "Terbatas" },
  { feature: "Rate Limiting bawaan", free: true, others: "Manual" },
  { feature: "Self-hosted", free: true, others: "Cloud only" },
  { feature: "Open Source", free: true, others: false },
  { feature: "Kustomisasi penuh", free: true, others: false },
];

const faqs = [
  {
    question: "Apakah benar-benar gratis?",
    answer:
      "Ya, Exima 100% gratis dan open source. Anda hanya perlu menyediakan server sendiri untuk hosting dan database PostgreSQL. Tidak ada biaya langganan atau biaya tersembunyi.",
  },
  {
    question: "Bagaimana cara memulai?",
    answer:
      "Clone repository dari GitHub, setup environment variables (App Key, Secret dari Accurate App Market), jalankan database migration, dan deploy ke server Anda. Dokumentasi lengkap tersedia di README.",
  },
  {
    question: "Apakah data saya aman?",
    answer:
      "Karena self-hosted, semua data tersimpan di server Anda sendiri. Exima menggunakan HMAC-SHA256 untuk menandatangani setiap request ke Accurate API, dan OAuth untuk autentikasi yang aman.",
  },
  {
    question: "Modul apa saja yang didukung?",
    answer:
      "Saat ini fokus pada Inventory Adjustment (Penyesuaian Persediaan). Kami berencana menambahkan modul lain seperti Sales Invoice, Purchase Order, dan lainnya di masa depan.",
  },
  {
    question: "Bagaimana jika saya butuh bantuan?",
    answer:
      "Anda bisa membuka issue di GitHub repository kami. Komunitas dan maintainer akan membantu menjawab pertanyaan Anda. Untuk kebutuhan enterprise, hubungi kami untuk diskusi lebih lanjut.",
  },
  {
    question: "Apakah bisa digunakan untuk banyak perusahaan?",
    answer:
      "Ya, Exima mendukung multi-akun Accurate dalam satu instalasi. Setiap pengguna bisa menghubungkan beberapa akun Accurate sesuai kebutuhan.",
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Box
      style={{
        minHeight: "100vh",
        background: isDark
          ? "linear-gradient(180deg, var(--mantine-color-dark-8) 0%, var(--mantine-color-dark-9) 100%)"
          : "linear-gradient(180deg, #FFFFFF 0%, #F8F9FA 100%)",
      }}
    >
      {/* Navigation */}
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
                onClick={() => router.push("/integration")}
              >
                Integrasi
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

      {/* Hero Section */}
      <Container size="lg" py={{ base: 60, md: 80 }}>
        <Stack gap="xl" align="center">
          <Badge
            size="lg"
            variant="light"
            color="green"
            leftSection={<IconSparkles size={14} />}
            style={{ padding: "10px 16px" }}
          >
            100% Gratis · Open Source
          </Badge>

          <Stack gap="md" align="center" maw={700} ta="center">
            <Title
              order={1}
              fz={{ base: 36, sm: 48, md: 56 }}
              fw={800}
              lh={1.1}
              style={{ letterSpacing: "-0.02em" }}
            >
              Pricing{" "}
              <Text
                component="span"
                inherit
                style={{
                  background:
                    "linear-gradient(135deg, #40C057 0%, #37B24D 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Sederhana
              </Text>
            </Title>

            <Text size="xl" c="dimmed" maw={600} lh={1.6}>
              Tidak ada biaya tersembunyi. Tidak ada langganan bulanan. Exima
              sepenuhnya gratis untuk digunakan.
            </Text>
          </Stack>
        </Stack>
      </Container>

      {/* Pricing Card */}
      <Container size="lg" pb={{ base: 60, md: 80 }}>
        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl">
          {/* Free Plan Card */}
          <Card
            padding="xl"
            radius="xl"
            style={{
              background: isDark
                ? "linear-gradient(135deg, rgba(64, 192, 87, 0.1) 0%, rgba(32, 201, 151, 0.1) 100%)"
                : "linear-gradient(135deg, rgba(64, 192, 87, 0.05) 0%, rgba(32, 201, 151, 0.05) 100%)",
              border: isDark
                ? "2px solid var(--mantine-color-green-8)"
                : "2px solid var(--mantine-color-green-4)",
              position: "relative",
              overflow: "visible",
            }}
          >
            {/* Popular Badge */}
            <Badge
              size="lg"
              color="green"
              variant="filled"
              style={{
                position: "absolute",
                top: -12,
                right: 24,
              }}
            >
              Satu-satunya Plan
            </Badge>

            <Stack gap="lg">
              <Box>
                <Text size="lg" fw={600} mb={4}>
                  Free Forever
                </Text>
                <Group gap="xs" align="baseline">
                  <Text
                    fz={56}
                    fw={800}
                    lh={1}
                    style={{
                      background:
                        "linear-gradient(135deg, #40C057 0%, #12B886 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    Rp 0
                  </Text>
                  <Text c="dimmed" size="lg">
                    / selamanya
                  </Text>
                </Group>
                <Text size="sm" c="dimmed" mt="xs">
                  Self-hosted, tanpa batasan penggunaan
                </Text>
              </Box>

              <Divider />

              <Stack gap="sm">
                <Text fw={600} size="sm">
                  Semua fitur termasuk:
                </Text>
                {includedFeatures.map((feature) => (
                  <Group key={feature.title} gap="sm" wrap="nowrap">
                    <ThemeIcon
                      size={32}
                      radius="md"
                      variant="light"
                      color="green"
                    >
                      {feature.icon}
                    </ThemeIcon>
                    <Box>
                      <Text size="sm" fw={500}>
                        {feature.title}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {feature.description}
                      </Text>
                    </Box>
                  </Group>
                ))}
              </Stack>

              <Button
                size="lg"
                color="green"
                fullWidth
                rightSection={<IconArrowRight size={18} />}
                onClick={() => router.push("/login")}
                style={{
                  boxShadow: "0 4px 14px rgba(64, 192, 87, 0.4)",
                }}
              >
                Mulai Sekarang
              </Button>
            </Stack>
          </Card>

          {/* Requirements Card */}
          <Card
            padding="xl"
            radius="xl"
            style={{
              background: isDark
                ? "rgba(255, 255, 255, 0.02)"
                : "rgba(0, 0, 0, 0.02)",
              border: isDark
                ? "1px solid var(--mantine-color-dark-4)"
                : "1px solid var(--mantine-color-gray-3)",
            }}
          >
            <Stack gap="lg">
              <Box>
                <Group gap="sm" mb="xs">
                  <ThemeIcon size={40} radius="md" variant="light" color="blue">
                    <IconServer size={22} />
                  </ThemeIcon>
                  <Box>
                    <Text size="lg" fw={600}>
                      Yang Perlu Disiapkan
                    </Text>
                    <Text size="sm" c="dimmed">
                      Kebutuhan untuk menjalankan Exima
                    </Text>
                  </Box>
                </Group>
              </Box>

              <Stack gap="md">
                {requirements.map((req, index) => (
                  <Paper
                    key={req.title}
                    p="md"
                    radius="lg"
                    style={{
                      backgroundColor: isDark
                        ? "rgba(255, 255, 255, 0.03)"
                        : "rgba(0, 0, 0, 0.02)",
                      border: isDark
                        ? "1px solid var(--mantine-color-dark-4)"
                        : "1px solid var(--mantine-color-gray-2)",
                    }}
                  >
                    <Group gap="md" wrap="nowrap">
                      <ThemeIcon
                        size={44}
                        radius="md"
                        variant="light"
                        color="blue"
                      >
                        {req.icon}
                      </ThemeIcon>
                      <Box style={{ flex: 1 }}>
                        <Text size="sm" fw={600}>
                          {req.title}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {req.description}
                        </Text>
                      </Box>
                      <Badge size="sm" variant="light" color="gray">
                        {index + 1}
                      </Badge>
                    </Group>
                  </Paper>
                ))}
              </Stack>

              <Divider />

              <Button
                variant="light"
                fullWidth
                leftSection={<IconBrandGithub size={18} />}
                onClick={() =>
                  window.open("https://github.com/yourusername/exima", "_blank")
                }
              >
                Lihat di GitHub
              </Button>

              <Text size="xs" c="dimmed" ta="center">
                Dokumentasi lengkap tersedia di repository
              </Text>
            </Stack>
          </Card>
        </SimpleGrid>
      </Container>

      {/* Comparison Section */}
      <Box
        py={{ base: 60, md: 80 }}
        style={{
          backgroundColor: isDark
            ? "rgba(255, 255, 255, 0.02)"
            : "rgba(0, 0, 0, 0.02)",
        }}
      >
        <Container size="lg">
          <Stack gap="xl">
            <Stack gap="sm" align="center" ta="center">
              <Badge size="md" variant="light" color="violet">
                Perbandingan
              </Badge>
              <Title order={2} fz={{ base: 28, md: 36 }}>
                Exima vs Solusi Lain
              </Title>
              <Text c="dimmed" maw={500}>
                Lihat bagaimana Exima dibandingkan dengan solusi berbayar
                lainnya
              </Text>
            </Stack>

            <Paper
              radius="xl"
              style={{
                overflow: "hidden",
                border: isDark
                  ? "1px solid var(--mantine-color-dark-4)"
                  : "1px solid var(--mantine-color-gray-2)",
              }}
            >
              <Box style={{ overflowX: "auto" }}>
                <Box style={{ minWidth: 500 }}>
                  {/* Header */}
                  <Group
                    p="lg"
                    style={{
                      backgroundColor: isDark
                        ? "var(--mantine-color-dark-6)"
                        : "var(--mantine-color-gray-0)",
                      borderBottom: isDark
                        ? "1px solid var(--mantine-color-dark-4)"
                        : "1px solid var(--mantine-color-gray-2)",
                    }}
                  >
                    <Text fw={600} style={{ flex: 2 }}>
                      Fitur
                    </Text>
                    <Box style={{ flex: 1, textAlign: "center" }}>
                      <Badge size="lg" color="green" variant="filled">
                        Exima
                      </Badge>
                    </Box>
                    <Box style={{ flex: 1, textAlign: "center" }}>
                      <Text fw={500} c="dimmed">
                        Solusi Lain
                      </Text>
                    </Box>
                  </Group>

                  {/* Rows */}
                  {comparisonData.map((item, index) => (
                    <Group
                      key={item.feature}
                      p="lg"
                      style={{
                        borderBottom:
                          index < comparisonData.length - 1
                            ? isDark
                              ? "1px solid var(--mantine-color-dark-5)"
                              : "1px solid var(--mantine-color-gray-1)"
                            : "none",
                      }}
                    >
                      <Text style={{ flex: 2 }}>{item.feature}</Text>
                      <Box style={{ flex: 1, textAlign: "center" }}>
                        {item.free === true ? (
                          <ThemeIcon
                            size={28}
                            radius="xl"
                            color="green"
                            variant="light"
                          >
                            <IconCheck size={16} />
                          </ThemeIcon>
                        ) : (
                          <Text size="sm" c="dimmed">
                            {item.free}
                          </Text>
                        )}
                      </Box>
                      <Box style={{ flex: 1, textAlign: "center" }}>
                        {item.others === true ? (
                          <ThemeIcon
                            size={28}
                            radius="xl"
                            color="green"
                            variant="light"
                          >
                            <IconCheck size={16} />
                          </ThemeIcon>
                        ) : item.others === false ? (
                          <ThemeIcon
                            size={28}
                            radius="xl"
                            color="red"
                            variant="light"
                          >
                            <IconX size={16} />
                          </ThemeIcon>
                        ) : (
                          <Text size="sm" c="dimmed">
                            {item.others}
                          </Text>
                        )}
                      </Box>
                    </Group>
                  ))}
                </Box>
              </Box>
            </Paper>
          </Stack>
        </Container>
      </Box>

      {/* FAQ Section */}
      <Container size="md" py={{ base: 60, md: 80 }}>
        <Stack gap="xl">
          <Stack gap="sm" align="center" ta="center">
            <Badge size="md" variant="light" color="orange">
              FAQ
            </Badge>
            <Title order={2} fz={{ base: 28, md: 36 }}>
              Pertanyaan Umum
            </Title>
            <Text c="dimmed" maw={500}>
              Jawaban untuk pertanyaan yang sering diajukan
            </Text>
          </Stack>

          <Accordion
            variant="separated"
            radius="lg"
            styles={{
              item: {
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.02)"
                  : "rgba(0, 0, 0, 0.02)",
                border: isDark
                  ? "1px solid var(--mantine-color-dark-4)"
                  : "1px solid var(--mantine-color-gray-2)",
              },
              control: {
                padding: rem(20),
              },
              content: {
                padding: rem(20),
                paddingTop: 0,
              },
            }}
          >
            {faqs.map((faq, index) => (
              <Accordion.Item key={index} value={`faq-${index}`}>
                <Accordion.Control>
                  <Group gap="sm">
                    <ThemeIcon
                      size={28}
                      radius="md"
                      variant="light"
                      color="orange"
                    >
                      <IconQuestionMark size={16} />
                    </ThemeIcon>
                    <Text fw={600}>{faq.question}</Text>
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  <Text c="dimmed" size="sm" lh={1.7} pl={44}>
                    {faq.answer}
                  </Text>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </Stack>
      </Container>

      {/* CTA Section */}
      <Container size="lg" pb={{ base: 60, md: 80 }}>
        <Card
          padding="xl"
          radius="xl"
          style={{
            background: isDark
              ? "linear-gradient(135deg, rgba(34, 139, 230, 0.15) 0%, rgba(121, 80, 242, 0.15) 100%)"
              : "linear-gradient(135deg, #228BE6 0%, #7950F2 100%)",
            border: "none",
            textAlign: "center",
          }}
        >
          <Stack gap="lg" align="center" py="lg">
            <ThemeIcon
              size={64}
              radius="xl"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                color: "white",
              }}
            >
              <IconRocket size={32} />
            </ThemeIcon>

            <Title
              order={2}
              c={isDark ? "white" : "white"}
              fz={{ base: 24, md: 32 }}
            >
              Siap untuk memulai?
            </Title>
            <Text
              c={isDark ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.9)"}
              maw={500}
            >
              Deploy Exima ke server Anda dan mulai kelola inventory adjustment
              Accurate dengan lebih efisien. Gratis selamanya.
            </Text>

            <Group gap="md" mt="md">
              <Button
                size="lg"
                radius="md"
                color={isDark ? "brand" : "white"}
                variant={isDark ? "filled" : "white"}
                c={isDark ? "white" : "brand"}
                rightSection={<IconArrowRight size={18} />}
                onClick={() => router.push("/login")}
              >
                Mulai Sekarang
              </Button>
              <Button
                size="lg"
                radius="md"
                variant="outline"
                color="white"
                leftSection={<IconBrandGithub size={18} />}
                onClick={() =>
                  window.open("https://github.com/yourusername/exima", "_blank")
                }
              >
                GitHub
              </Button>
            </Group>
          </Stack>
        </Card>
      </Container>

      {/* Footer */}
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
                © 2024 Exima. All rights reserved.
              </Text>
            </Group>

            <Group gap="md">
              <Anchor size="sm" c="dimmed" href="/terms">
                Terms
              </Anchor>
              <Anchor size="sm" c="dimmed" href="/integration">
                Integration
              </Anchor>
              <Anchor size="sm" c="dimmed" href="/">
                Home
              </Anchor>
            </Group>
          </Group>
        </Container>
      </Box>
    </Box>
  );
}
