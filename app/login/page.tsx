"use client";

import {
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Title,
  Container,
  Stack,
  Alert,
  Box,
  Text,
  Group,
  ThemeIcon,
  Divider,
  Anchor,
  useMantineColorScheme,
  rem,
} from "@mantine/core";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LanguageSelect } from "@/components/ui/LanguageSelect";
import {
  IconAlertCircle,
  IconShield,
  IconPlugConnected,
  IconFileExport,
  IconFileImport,
  IconCheck,
  IconArrowRight,
} from "@tabler/icons-react";

const features = [
  {
    icon: <IconFileExport size={20} />,
    title: "Ekspor Massal",
    description: "Ekspor ke CSV, XLSX, atau JSON",
  },
  {
    icon: <IconFileImport size={20} />,
    title: "Impor Massal",
    description: "Impor dengan validasi otomatis",
  },
  {
    icon: <IconPlugConnected size={20} />,
    title: "Integrasi OAuth",
    description: "Koneksi aman ke Accurate",
  },
  {
    icon: <IconShield size={20} />,
    title: "Keamanan",
    description: "HMAC-SHA256 signature",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email atau password tidak valid");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      style={{
        minHeight: "100vh",
        display: "flex",
        background: isDark
          ? "var(--mantine-color-dark-8)"
          : "var(--mantine-color-gray-0)",
      }}
    >
      {/* Left Side - Branding */}
      <Box
        visibleFrom="md"
        style={{
          flex: 1,
          background:
            "linear-gradient(135deg, #228BE6 0%, #1C7ED6 50%, #1971C2 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: rem(60),
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background decorations */}
        <Box
          style={{
            position: "absolute",
            top: "-20%",
            right: "-20%",
            width: "60%",
            height: "60%",
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.1)",
            filter: "blur(60px)",
          }}
        />
        <Box
          style={{
            position: "absolute",
            bottom: "-10%",
            left: "-10%",
            width: "40%",
            height: "40%",
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.08)",
            filter: "blur(40px)",
          }}
        />

        <Stack gap="xl" style={{ position: "relative", zIndex: 1 }}>
          {/* Logo */}
          <Group gap="sm">
            <Box
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "rgba(255, 255, 255, 0.2)",
                backdropFilter: "blur(10px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: 700,
                fontSize: 24,
              }}
            >
              E
            </Box>
            <Text size="xl" fw={700} c="white">
              Exima
            </Text>
          </Group>

          {/* Tagline */}
          <Stack gap="sm">
            <Title order={2} c="white" fw={700} style={{ fontSize: rem(36) }}>
              Kelola Inventory
              <br />
              Adjustment dengan
              <br />
              Mudah
            </Title>
            <Text c="rgba(255, 255, 255, 0.8)" size="lg" maw={400}>
              Platform ekspor dan impor massal untuk Accurate Online dengan
              validasi, pratinjau, dan keamanan terjamin.
            </Text>
          </Stack>

          {/* Features */}
          <Stack gap="md" mt="xl">
            {features.map((feature) => (
              <Group key={feature.title} gap="md">
                <ThemeIcon
                  size={44}
                  radius="md"
                  variant="light"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.15)",
                    color: "white",
                  }}
                >
                  {feature.icon}
                </ThemeIcon>
                <Stack gap={2}>
                  <Text c="white" fw={600} size="sm">
                    {feature.title}
                  </Text>
                  <Text c="rgba(255, 255, 255, 0.7)" size="xs">
                    {feature.description}
                  </Text>
                </Stack>
              </Group>
            ))}
          </Stack>

          {/* Trust badges */}
          <Group gap="lg" mt="xl">
            <Group gap="xs">
              <IconCheck size={16} color="rgba(255, 255, 255, 0.8)" />
              <Text size="xs" c="rgba(255, 255, 255, 0.8)">
                100% Gratis
              </Text>
            </Group>
            <Group gap="xs">
              <IconCheck size={16} color="rgba(255, 255, 255, 0.8)" />
              <Text size="xs" c="rgba(255, 255, 255, 0.8)">
                Bisa self-host
              </Text>
            </Group>
            <Group gap="xs">
              <IconCheck size={16} color="rgba(255, 255, 255, 0.8)" />
              <Text size="xs" c="rgba(255, 255, 255, 0.8)">
                Sumber Terbuka
              </Text>
            </Group>
          </Group>
        </Stack>
      </Box>

      {/* Right Side - Login Form */}
      <Box
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: rem(24),
        }}
      >
        <Container size={420} w="100%">
          <Stack gap="xl">
            <Group justify="flex-end">
              <LanguageSelect />
            </Group>

            {/* Mobile Logo */}
            <Group gap="sm" hiddenFrom="md" justify="center">
              <Box
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background:
                    "linear-gradient(135deg, #228BE6 0%, #1C7ED6 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: 700,
                  fontSize: 20,
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

            {/* Header */}
            <Stack gap="xs" ta={{ base: "center", md: "left" }}>
              <Title order={2} fw={700}>
                Selamat Datang
              </Title>
              <Text c="dimmed" size="sm">
                Masuk ke akun Anda untuk melanjutkan
              </Text>
            </Stack>

            {/* Form */}
            <Paper
              withBorder
              shadow="md"
              p="xl"
              radius="lg"
              style={{
                backgroundColor: isDark
                  ? "var(--mantine-color-dark-7)"
                  : "white",
                border: isDark
                  ? "1px solid var(--mantine-color-dark-4)"
                  : "1px solid var(--mantine-color-gray-2)",
              }}
            >
              <form onSubmit={handleSubmit}>
                <Stack gap="md">
                  {error && (
                    <Alert
                      icon={<IconAlertCircle size={16} />}
                      title="Login gagal"
                      color="red"
                      variant="light"
                      radius="md"
                    >
                      {error}
                    </Alert>
                  )}

                  <TextInput
                    label="Email"
                    placeholder="nama@email.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.currentTarget.value)}
                    size="md"
                    radius="md"
                    styles={{
                      label: {
                        marginBottom: 6,
                        fontWeight: 500,
                      },
                    }}
                  />

                  <PasswordInput
                    label="Password"
                    placeholder="Masukkan password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.currentTarget.value)}
                    size="md"
                    radius="md"
                    styles={{
                      label: {
                        marginBottom: 6,
                        fontWeight: 500,
                      },
                    }}
                  />

                  <Group justify="flex-end">
                    <Anchor
                      component="button"
                      type="button"
                      c="brand"
                      size="sm"
                      fw={500}
                    >
                      Lupa password?
                    </Anchor>
                  </Group>

                  <Button
                    type="submit"
                    fullWidth
                    loading={loading}
                    size="md"
                    radius="md"
                    rightSection={!loading && <IconArrowRight size={18} />}
                    style={{
                      background:
                        "linear-gradient(135deg, #228BE6 0%, #1C7ED6 100%)",
                      boxShadow: "0 4px 14px rgba(34, 139, 230, 0.3)",
                      transition: "all 0.2s ease",
                    }}
                    styles={{
                      root: {
                        "&:hover": {
                          boxShadow: "0 6px 20px rgba(34, 139, 230, 0.4)",
                        },
                      },
                    }}
                  >
                    {loading ? "Memproses..." : "Masuk"}
                  </Button>
                </Stack>
              </form>
            </Paper>

            {/* Footer */}
            <Stack gap="md" align="center">
              <Divider
                label="atau"
                labelPosition="center"
                w="100%"
                color={isDark ? "dark.4" : "gray.3"}
              />

              <Text size="sm" c="dimmed" ta="center">
                Belum punya akun?{" "}
                <Anchor
                  component="button"
                  type="button"
                  fw={600}
                  onClick={() => router.push("/register")}
                >
                  Daftar di sini
                </Anchor>
              </Text>

              <Group gap="xs" mt="sm">
                <Anchor size="xs" c="dimmed" href="/terms">
                  Syarat & Ketentuan
                </Anchor>
              </Group>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
