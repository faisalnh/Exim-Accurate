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
  Box,
  ThemeIcon,
  useMantineColorScheme,
  Anchor,
  Divider,
  rem,
} from "@mantine/core";
import {
  IconDownload,
  IconUpload,
  IconShield,
  IconPlugConnected,
  IconArrowRight,
  IconCheck,
  IconSparkles,
  IconRocket,
  IconBrandGithub,
  IconArrowsLeftRight,
  IconDeviceDesktop,
} from "@tabler/icons-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const features = [
  {
    icon: <IconArrowsLeftRight size={28} />,
    title: "Impor & Ekspor massal",
    description:
      "Validasi & unduh template CSV/XLSX, lalu ekspor atau impor batch dengan pratinjau 20 baris sebelum jalan.",
    color: "blue",
    gradient: "linear-gradient(135deg, #228BE6 0%, #37B24D 100%)",
  },
  {
    icon: <IconShield size={28} />,
    title: "Kredensial aman",
    description:
      "OAuth Accurate + HMAC-SHA256 signature dengan rate limit bawaan (8 rps, 8 konkuren).",
    color: "violet",
    gradient: "linear-gradient(135deg, #7950F2 0%, #7048E8 100%)",
  },
  {
    icon: <IconPlugConnected size={28} />,
    title: "Satu alur terpadu",
    description:
      "Pilih modul Inventory Adjustment, lalu pilih ekspor (get data) atau impor (input data).",
    color: "orange",
    gradient: "linear-gradient(135deg, #FD7E14 0%, #F76707 100%)",
  },
  {
    icon: <IconDeviceDesktop size={28} />,
    title: "Kiosk Mode (Self Checkout)",
    description:
      "Mode kios untuk pemindaian mandiri, cocok di gudang/outlet sehingga tim bisa input adjustment tanpa login berulang.",
    color: "teal",
    gradient: "linear-gradient(135deg, #12B886 0%, #0CA678 100%)",
  },
];

const benefits = [
  "Gratis 100%, tanpa biaya tersembunyi",
  "Dashboard responsif dan modern",
  "Notifikasi real-time status job",
  "Mendukung multi-akun Accurate",
  "Validasi data sebelum impor",
  "Export dalam berbagai format",
];

export default function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";
  const currentYear = new Date().getFullYear();

  const primaryCta = () => {
    router.push(session ? "/dashboard" : "/login");
  };

  return (
    <Box
      style={{
        minHeight: "100vh",
        background: isDark
          ? "linear-gradient(180deg, var(--mantine-color-dark-8) 0%, var(--mantine-color-dark-9) 100%)"
          : "linear-gradient(180deg, #FFFFFF 0%, #F8F9FA 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated background elements */}
      <Box
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "100%",
          overflow: "hidden",
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        {/* Gradient orbs */}
        <Box
          style={{
            position: "absolute",
            top: "-20%",
            right: "-10%",
            width: "60%",
            height: "60%",
            borderRadius: "50%",
            background: isDark
              ? "radial-gradient(circle, rgba(34, 139, 230, 0.15) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(34, 139, 230, 0.1) 0%, transparent 70%)",
            filter: "blur(40px)",
            animation: "float 20s ease-in-out infinite",
          }}
        />
        <Box
          style={{
            position: "absolute",
            bottom: "-10%",
            left: "-10%",
            width: "50%",
            height: "50%",
            borderRadius: "50%",
            background: isDark
              ? "radial-gradient(circle, rgba(253, 126, 20, 0.1) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(253, 126, 20, 0.08) 0%, transparent 70%)",
            filter: "blur(40px)",
            animation: "float 25s ease-in-out infinite reverse",
          }}
        />
        <Box
          style={{
            position: "absolute",
            top: "40%",
            left: "30%",
            width: "40%",
            height: "40%",
            borderRadius: "50%",
            background: isDark
              ? "radial-gradient(circle, rgba(121, 80, 242, 0.1) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(121, 80, 242, 0.06) 0%, transparent 70%)",
            filter: "blur(60px)",
            animation: "float 30s ease-in-out infinite",
          }}
        />
      </Box>

      {/* Navigation */}
      <Box
        component="header"
        py="md"
        style={{
          position: "relative",
          zIndex: 10,
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
            <Group gap="xs">
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
                onClick={() => router.push("/pricing")}
              >
                Pricing
              </Button>
              <Button
                variant="subtle"
                size="sm"
                onClick={() => router.push("/integration")}
              >
                Integrasi
              </Button>
              <Button
                variant={session ? "light" : "filled"}
                size="sm"
                onClick={primaryCta}
              >
                {session ? "Dashboard" : "Masuk"}
              </Button>
            </Group>
          </Group>
        </Container>
      </Box>

      {/* Hero Section */}
      <Container
        size="lg"
        py={{ base: 60, md: 100 }}
        style={{ position: "relative", zIndex: 1 }}
      >
        <Stack gap="xl" align="center">
          {/* Badge */}
          <Badge
            size="lg"
            variant="light"
            color="brand"
            leftSection={<IconSparkles size={14} />}
            style={{
              padding: "10px 16px",
              cursor: "default",
            }}
          >
            Gratis 100% · Open Source
          </Badge>

          {/* Heading */}
          <Stack gap="md" align="center" maw={800} ta="center">
            <Title
              order={1}
              fz={{ base: 36, sm: 48, md: 56 }}
              fw={800}
              lh={1.1}
              style={{
                letterSpacing: "-0.02em",
              }}
            >
              Ekspor & Impor{" "}
              <Text
                component="span"
                inherit
                style={{
                  background:
                    "linear-gradient(135deg, #228BE6 0%, #7950F2 50%, #FD7E14 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Inventory Adjustment
              </Text>{" "}
              Accurate
            </Title>

            <Text size="xl" c="dimmed" maw={600} lh={1.6} ta="center">
              Exima mempermudah ekspor dan impor penyesuaian persediaan dalam
              skala besar dengan validasi, pratinjau, dan pengelolaan kredensial
              Accurate yang aman.
            </Text>
          </Stack>

          {/* CTA Buttons */}
          <Group gap="md" mt="md">
            <Button
              size="lg"
              radius="md"
              rightSection={<IconArrowRight size={18} />}
              onClick={primaryCta}
              style={{
                background: "linear-gradient(135deg, #228BE6 0%, #1C7ED6 100%)",
                boxShadow: "0 4px 14px rgba(34, 139, 230, 0.4)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 6px 20px rgba(34, 139, 230, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 4px 14px rgba(34, 139, 230, 0.4)";
              }}
            >
              {session ? "Masuk ke Dashboard" : "Mulai Sekarang"}
            </Button>
            <Button
              size="lg"
              radius="md"
              variant="outline"
              leftSection={<IconBrandGithub size={18} />}
              onClick={() =>
                window.open(
                  "https://github.com/faisalnh/Exim-Accurate",
                  "_blank",
                )
              }
            >
              View on GitHub
            </Button>
          </Group>

          {/* Social Proof */}
          <Group gap="xl" mt="xl" c="dimmed">
            <Group gap="xs">
              <IconCheck size={18} color="var(--mantine-color-green-6)" />
              <Text size="sm">No credit card required</Text>
            </Group>
            <Group gap="xs">
              <IconCheck size={18} color="var(--mantine-color-green-6)" />
              <Text size="sm">Self-hosted</Text>
            </Group>
            <Group gap="xs">
              <IconCheck size={18} color="var(--mantine-color-green-6)" />
              <Text size="sm">Accurate App Market verified</Text>
            </Group>
          </Group>
        </Stack>
      </Container>

      {/* Features Section */}
      <Container
        size="lg"
        py={{ base: 60, md: 80 }}
        style={{ position: "relative", zIndex: 1 }}
      >
        <Stack gap="xl">
          <Stack gap="sm" align="center" ta="center" mb="xl">
            <Badge size="md" variant="light" color="violet">
              Fitur Utama
            </Badge>
            <Title order={2} fz={{ base: 28, md: 36 }}>
              Semua yang Anda butuhkan
            </Title>
            <Text c="dimmed" maw={500}>
              Fitur lengkap untuk mengelola inventory adjustment Accurate dengan
              mudah dan aman.
            </Text>
          </Stack>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
            {features.map((feature, index) => (
              <Card
                key={feature.title}
                padding="xl"
                radius="lg"
                style={{
                  border: isDark
                    ? "1px solid rgba(255, 255, 255, 0.1)"
                    : "1px solid rgba(0, 0, 0, 0.05)",
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.02)"
                    : "rgba(255, 255, 255, 0.8)",
                  backdropFilter: "blur(10px)",
                  transition: "all 0.3s ease",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = isDark
                    ? "0 20px 40px rgba(0, 0, 0, 0.3)"
                    : "0 20px 40px rgba(0, 0, 0, 0.1)";
                  e.currentTarget.style.borderColor = isDark
                    ? "rgba(255, 255, 255, 0.2)"
                    : "rgba(34, 139, 230, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "";
                  e.currentTarget.style.borderColor = isDark
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.05)";
                }}
              >
                <Group align="flex-start" gap="md">
                  <ThemeIcon
                    size={56}
                    radius="xl"
                    variant="light"
                    color={feature.color}
                    style={{
                      backgroundColor: isDark
                        ? `var(--mantine-color-${feature.color}-9)`
                        : `var(--mantine-color-${feature.color}-0)`,
                    }}
                  >
                    {feature.icon}
                  </ThemeIcon>
                  <Stack gap="xs" style={{ flex: 1 }}>
                    <Title order={4} fw={600}>
                      {feature.title}
                    </Title>
                    <Text size="sm" c="dimmed" lh={1.6}>
                      {feature.description}
                    </Text>
                  </Stack>
                </Group>
              </Card>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>

      {/* Benefits Section */}
      <Box
        py={{ base: 60, md: 80 }}
        style={{
          position: "relative",
          zIndex: 1,
          backgroundColor: isDark
            ? "rgba(255, 255, 255, 0.02)"
            : "rgba(0, 0, 0, 0.02)",
        }}
      >
        <Container size="lg">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
            <Stack gap="lg">
              <Badge size="md" variant="light" color="green" w="fit-content">
                Keuntungan
              </Badge>
              <Title order={2} fz={{ base: 28, md: 36 }}>
                Mengapa memilih Exima?
              </Title>
              <Text c="dimmed" lh={1.7}>
                Exima dirancang untuk mempermudah proses ekspor dan impor data
                inventory adjustment dari Accurate Online. Dengan antarmuka yang
                intuitif dan fitur validasi bawaan, Anda dapat mengelola data
                dengan lebih efisien.
              </Text>

              <Stack gap="sm" mt="md">
                {benefits.map((benefit) => (
                  <Group key={benefit} gap="sm">
                    <ThemeIcon
                      size={24}
                      radius="xl"
                      color="green"
                      variant="light"
                    >
                      <IconCheck size={14} />
                    </ThemeIcon>
                    <Text size="sm">{benefit}</Text>
                  </Group>
                ))}
              </Stack>
            </Stack>

            <Box
              style={{
                position: "relative",
                padding: rem(20),
              }}
            >
              {/* Decorative card stack */}
              <Box
                style={{
                  position: "relative",
                  maxWidth: 400,
                  margin: "0 auto",
                }}
              >
                <Card
                  shadow="xl"
                  padding="xl"
                  radius="lg"
                  style={{
                    background: isDark
                      ? "linear-gradient(135deg, rgba(34, 139, 230, 0.1) 0%, rgba(121, 80, 242, 0.1) 100%)"
                      : "linear-gradient(135deg, rgba(34, 139, 230, 0.05) 0%, rgba(121, 80, 242, 0.05) 100%)",
                    border: isDark
                      ? "1px solid rgba(255, 255, 255, 0.1)"
                      : "1px solid rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <Stack gap="md">
                    <Group>
                      <ThemeIcon
                        size={48}
                        radius="md"
                        style={{
                          background:
                            "linear-gradient(135deg, #228BE6 0%, #1C7ED6 100%)",
                        }}
                      >
                        <IconRocket size={24} color="white" />
                      </ThemeIcon>
                      <Stack gap={0}>
                        <Text fw={600}>Quick Start</Text>
                        <Text size="xs" c="dimmed">
                          Self-host via Docker
                        </Text>
                      </Stack>
                    </Group>

                    <Divider />

                    <Stack gap="xs">
                      <Group gap="xs">
                        <Box
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            background:
                              "linear-gradient(135deg, #40C057 0%, #37B24D 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text size="xs" c="white" fw={700}>
                            1
                          </Text>
                        </Box>
                        <Text size="sm">Clone repo & copy .env.example</Text>
                      </Group>
                      <Group gap="xs">
                        <Box
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            background:
                              "linear-gradient(135deg, #40C057 0%, #37B24D 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text size="xs" c="white" fw={700}>
                            2
                          </Text>
                        </Box>
                        <Text size="sm">
                          Isi kredensial Accurate + NextAuth
                        </Text>
                      </Group>
                      <Group gap="xs">
                        <Box
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            background:
                              "linear-gradient(135deg, #40C057 0%, #37B24D 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text size="xs" c="white" fw={700}>
                            3
                          </Text>
                        </Box>
                        <Text size="sm">docker compose up -d --build</Text>
                      </Group>
                    </Stack>
                    <Text size="xs" c="dimmed">
                      Lanjutkan dengan `docker compose exec app npm run
                      db:push`.
                    </Text>
                  </Stack>
                </Card>
              </Box>
            </Box>
          </SimpleGrid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Container
        size="lg"
        py={{ base: 60, md: 80 }}
        style={{ position: "relative", zIndex: 1 }}
      >
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
          <Stack gap="lg" align="center">
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
              Daftar sekarang dan mulai kelola inventory adjustment Accurate
              Anda dengan lebih efisien.
            </Text>
            <Group gap="md" mt="md">
              <Button
                size="lg"
                radius="md"
                color={isDark ? "brand" : "white"}
                variant={isDark ? "filled" : "white"}
                c={isDark ? "white" : "brand"}
                rightSection={<IconArrowRight size={18} />}
                onClick={primaryCta}
                style={{
                  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.2)",
                }}
              >
                {session ? "Buka Dashboard" : "Mulai Gratis"}
              </Button>
              <Button
                size="lg"
                radius="md"
                variant="outline"
                color="white"
                onClick={() => router.push("/terms")}
              >
                Syarat & Ketentuan
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
          position: "relative",
          zIndex: 1,
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
              <Anchor size="sm" c="dimmed" href="/terms">
                Terms
              </Anchor>
              <Anchor size="sm" c="dimmed" href="/pricing">
                Pricing
              </Anchor>
              <Anchor size="sm" c="dimmed" href="/integration">
                Integration
              </Anchor>
            </Group>
          </Group>
        </Container>
      </Box>

      {/* CSS Animation */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(-20px, 20px);
          }
        }
      `}</style>
    </Box>
  );
}
