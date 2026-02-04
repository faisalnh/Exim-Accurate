"use client";

import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Timeline,
  Code,
  Anchor,
  Tabs,
  useMantineColorScheme,
  rem,
  CopyButton,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import {
  IconArrowRight,
  IconBrandGithub,
  IconCheck,
  IconShield,
  IconLock,
  IconKey,
  IconPlugConnected,
  IconCloud,
  IconServer,
  IconRefresh,
  IconClock,
  IconCode,
  IconApi,
  IconFingerprint,
  IconNetwork,
  IconDatabase,
  IconArrowsExchange,
  IconCopy,
  IconExternalLink,
  IconBrandOauth,
  IconFileCode,
  IconTerminal2,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const oauthSteps = [
  {
    title: "User clicks Connect",
    description:
      "Pengguna mengklik tombol 'Connect Accurate' di halaman kredensial",
    icon: <IconPlugConnected size={18} />,
    color: "blue",
  },
  {
    title: "Redirect to Accurate",
    description:
      "Diarahkan ke Accurate App Market dengan client_id dari environment",
    icon: <IconExternalLink size={18} />,
    color: "violet",
  },
  {
    title: "User Authorizes",
    description: "Pengguna login dan mengizinkan akses aplikasi ke akun mereka",
    icon: <IconCheck size={18} />,
    color: "green",
  },
  {
    title: "Callback with Code",
    description: "Accurate mengembalikan authorization code ke callback URL",
    icon: <IconArrowsExchange size={18} />,
    color: "orange",
  },
  {
    title: "Exchange for Token",
    description: "Exima menukar code menjadi access token dan refresh token",
    icon: <IconKey size={18} />,
    color: "cyan",
  },
  {
    title: "Store Credentials",
    description: "Token disimpan terenkripsi di database untuk penggunaan API",
    icon: <IconDatabase size={18} />,
    color: "teal",
  },
];

const securityFeatures = [
  {
    icon: <IconFingerprint size={24} />,
    title: "HMAC-SHA256 Signature",
    description:
      "Setiap request ke Accurate API ditandatangani dengan HMAC-SHA256 menggunakan Signature Secret",
    color: "blue",
  },
  {
    icon: <IconClock size={24} />,
    title: "Timestamp Validation",
    description:
      "Header X-Api-Timestamp mencegah replay attack dengan validasi waktu request",
    color: "violet",
  },
  {
    icon: <IconRefresh size={24} />,
    title: "Auto Token Refresh",
    description:
      "Token yang kedaluwarsa otomatis di-refresh tanpa intervensi pengguna",
    color: "green",
  },
  {
    icon: <IconLock size={24} />,
    title: "Encrypted Storage",
    description:
      "Kredensial dan token disimpan terenkripsi di database PostgreSQL",
    color: "orange",
  },
  {
    icon: <IconNetwork size={24} />,
    title: "Rate Limiting",
    description:
      "Pembatasan 8 request/detik dan 8 request konkuren untuk menghindari throttling",
    color: "cyan",
  },
  {
    icon: <IconServer size={24} />,
    title: "Host Resolution",
    description:
      "Host API Accurate di-resolve otomatis berdasarkan region akun pengguna",
    color: "teal",
  },
];

const codeExamples = {
  signature: `// Generate HMAC-SHA256 Signature
const crypto = require('crypto');

function generateSignature(timestamp, secretKey) {
  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(timestamp);
  return hmac.digest('hex');
}

const timestamp = Date.now().toString();
const signature = generateSignature(timestamp, SIGNATURE_SECRET);

// Headers for API request
const headers = {
  'Authorization': \`Bearer \${accessToken}\`,
  'X-Api-Timestamp': timestamp,
  'X-Api-Signature': signature,
};`,
  oauth: `// OAuth Authorization URL
const authUrl = new URL('https://account.accurate.id/oauth/authorize');
authUrl.searchParams.set('client_id', CLIENT_ID);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
authUrl.searchParams.set('scope', 'item_view item_save');

// Redirect user to authUrl
window.location.href = authUrl.toString();`,
  token: `// Exchange authorization code for token
const response = await fetch('https://account.accurate.id/oauth/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: authorizationCode,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
  }),
});

const { access_token, refresh_token } = await response.json();`,
  api: `// Make authenticated API request
const timestamp = Date.now().toString();
const signature = generateSignature(timestamp, SIGNATURE_SECRET);

const response = await fetch(\`\${hostUrl}/accurate/api/inventory-adjustment/list.do\`, {
  method: 'GET',
  headers: {
    'Authorization': \`Bearer \${accessToken}\`,
    'X-Api-Timestamp': timestamp,
    'X-Api-Signature': signature,
  },
});

const data = await response.json();`,
};

const supportedModules = [
  {
    name: "Inventory Adjustment",
    status: "active",
    description: "Penyesuaian persediaan - ekspor dan impor",
  },
  {
    name: "Item",
    status: "read-only",
    description: "Lookup dan validasi data barang",
  },
  {
    name: "Warehouse",
    status: "read-only",
    description: "Lookup data gudang",
  },
  {
    name: "Sales Invoice",
    status: "planned",
    description: "Faktur penjualan - coming soon",
  },
  {
    name: "Purchase Order",
    status: "planned",
    description: "Order pembelian - coming soon",
  },
];

export default function IntegrationPage() {
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
                onClick={() => router.push("/pricing")}
              >
                Pricing
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
            color="violet"
            leftSection={<IconApi size={14} />}
            style={{ padding: "10px 16px" }}
          >
            API Integration
          </Badge>

          <Stack gap="md" align="center" maw={700} ta="center">
            <Title
              order={1}
              fz={{ base: 36, sm: 48, md: 56 }}
              fw={800}
              lh={1.1}
              style={{ letterSpacing: "-0.02em" }}
            >
              Integrasi{" "}
              <Text
                component="span"
                inherit
                style={{
                  background:
                    "linear-gradient(135deg, #7950F2 0%, #845EF7 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Accurate
              </Text>
            </Title>

            <Text size="xl" c="dimmed" maw={600} lh={1.6}>
              Pelajari cara Exima terhubung ke Accurate Online menggunakan OAuth
              2.0, HMAC-SHA256 signature, dan best practices keamanan API.
            </Text>
          </Stack>
        </Stack>
      </Container>

      {/* OAuth Flow Section */}
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
              <Badge size="md" variant="light" color="blue">
                OAuth 2.0 Flow
              </Badge>
              <Title order={2} fz={{ base: 28, md: 36 }}>
                Alur Autentikasi
              </Title>
              <Text c="dimmed" maw={500}>
                Bagaimana Exima mendapatkan akses ke akun Accurate Anda dengan
                aman
              </Text>
            </Stack>

            <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl">
              {/* Flow Diagram */}
              <Paper
                p="xl"
                radius="lg"
                style={{
                  border: isDark
                    ? "1px solid var(--mantine-color-dark-4)"
                    : "1px solid var(--mantine-color-gray-2)",
                }}
              >
                <Timeline active={5} bulletSize={36} lineWidth={3}>
                  {oauthSteps.map((step, index) => (
                    <Timeline.Item
                      key={index}
                      bullet={
                        <ThemeIcon
                          size={36}
                          radius="xl"
                          color={step.color}
                          variant="filled"
                        >
                          {step.icon}
                        </ThemeIcon>
                      }
                      title={
                        <Text fw={600} size="sm">
                          {step.title}
                        </Text>
                      }
                    >
                      <Text c="dimmed" size="sm" mt={4}>
                        {step.description}
                      </Text>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </Paper>

              {/* Visual Flow Card */}
              <Stack gap="md">
                <Card
                  padding="lg"
                  radius="lg"
                  style={{
                    background: isDark
                      ? "linear-gradient(135deg, rgba(34, 139, 230, 0.1) 0%, rgba(121, 80, 242, 0.1) 100%)"
                      : "linear-gradient(135deg, rgba(34, 139, 230, 0.05) 0%, rgba(121, 80, 242, 0.05) 100%)",
                    border: isDark
                      ? "1px solid var(--mantine-color-dark-4)"
                      : "1px solid var(--mantine-color-gray-2)",
                  }}
                >
                  <Stack gap="md">
                    <Group gap="sm">
                      <ThemeIcon size={40} radius="md" variant="light">
                        <IconBrandOauth size={22} />
                      </ThemeIcon>
                      <Box>
                        <Text fw={600}>OAuth 2.0 Authorization</Text>
                        <Text size="xs" c="dimmed">
                          Standard industry authentication
                        </Text>
                      </Box>
                    </Group>

                    <Divider />

                    <SimpleGrid cols={3} spacing="md">
                      <Paper
                        p="md"
                        radius="md"
                        ta="center"
                        style={{
                          backgroundColor: isDark
                            ? "rgba(255, 255, 255, 0.05)"
                            : "rgba(0, 0, 0, 0.03)",
                        }}
                      >
                        <ThemeIcon
                          size={32}
                          radius="md"
                          variant="light"
                          color="blue"
                          mx="auto"
                          mb="xs"
                        >
                          <IconPlugConnected size={18} />
                        </ThemeIcon>
                        <Text size="xs" fw={600}>
                          Exima
                        </Text>
                      </Paper>

                      <Stack gap={4} align="center" justify="center">
                        <IconArrowsExchange
                          size={24}
                          color="var(--mantine-color-dimmed)"
                        />
                        <Text size="xs" c="dimmed">
                          OAuth
                        </Text>
                      </Stack>

                      <Paper
                        p="md"
                        radius="md"
                        ta="center"
                        style={{
                          backgroundColor: isDark
                            ? "rgba(255, 255, 255, 0.05)"
                            : "rgba(0, 0, 0, 0.03)",
                        }}
                      >
                        <ThemeIcon
                          size={32}
                          radius="md"
                          variant="light"
                          color="violet"
                          mx="auto"
                          mb="xs"
                        >
                          <IconCloud size={18} />
                        </ThemeIcon>
                        <Text size="xs" fw={600}>
                          Accurate
                        </Text>
                      </Paper>
                    </SimpleGrid>
                  </Stack>
                </Card>

                <Paper
                  p="lg"
                  radius="lg"
                  style={{
                    border: isDark
                      ? "1px solid var(--mantine-color-dark-4)"
                      : "1px solid var(--mantine-color-gray-2)",
                  }}
                >
                  <Group gap="sm" mb="md">
                    <ThemeIcon
                      size={28}
                      radius="md"
                      variant="light"
                      color="green"
                    >
                      <IconCheck size={16} />
                    </ThemeIcon>
                    <Text fw={600}>Environment Variables</Text>
                  </Group>

                  <Code
                    block
                    style={{
                      backgroundColor: isDark
                        ? "var(--mantine-color-dark-7)"
                        : "var(--mantine-color-gray-0)",
                    }}
                  >
                    {`ACCURATE_CLIENT_ID=your_client_id
ACCURATE_CLIENT_SECRET=your_client_secret
ACCURATE_REDIRECT_URI=https://your-domain.com/accurate/callback
ACCURATE_SIGNATURE_SECRET=your_signature_secret`}
                  </Code>
                </Paper>
              </Stack>
            </SimpleGrid>
          </Stack>
        </Container>
      </Box>

      {/* Security Features */}
      <Container size="lg" py={{ base: 60, md: 80 }}>
        <Stack gap="xl">
          <Stack gap="sm" align="center" ta="center">
            <Badge size="md" variant="light" color="green">
              Security
            </Badge>
            <Title order={2} fz={{ base: 28, md: 36 }}>
              Keamanan & Pembatasan
            </Title>
            <Text c="dimmed" maw={500}>
              Fitur keamanan bawaan untuk melindungi data dan akses API Anda
            </Text>
          </Stack>

          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
            {securityFeatures.map((feature) => (
              <Card
                key={feature.title}
                padding="lg"
                radius="lg"
                style={{
                  border: isDark
                    ? "1px solid var(--mantine-color-dark-4)"
                    : "1px solid var(--mantine-color-gray-2)",
                  transition: "all 0.2s ease",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = isDark
                    ? "0 12px 40px rgba(0, 0, 0, 0.3)"
                    : "0 12px 40px rgba(0, 0, 0, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "";
                }}
              >
                <ThemeIcon
                  size={48}
                  radius="md"
                  variant="light"
                  color={feature.color}
                  mb="md"
                >
                  {feature.icon}
                </ThemeIcon>
                <Text fw={600} mb={4}>
                  {feature.title}
                </Text>
                <Text size="sm" c="dimmed" lh={1.6}>
                  {feature.description}
                </Text>
              </Card>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>

      {/* Code Examples */}
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
              <Badge size="md" variant="light" color="cyan">
                Code Examples
              </Badge>
              <Title order={2} fz={{ base: 28, md: 36 }}>
                Contoh Implementasi
              </Title>
              <Text c="dimmed" maw={500}>
                Contoh kode untuk integrasi dengan Accurate API
              </Text>
            </Stack>

            <Tabs
              defaultValue="signature"
              variant="pills"
              radius="lg"
              styles={{
                tab: {
                  padding: `${rem(12)} ${rem(20)}`,
                  fontWeight: 600,
                },
              }}
            >
              <Tabs.List justify="center" mb="xl">
                <Tabs.Tab
                  value="signature"
                  leftSection={<IconFingerprint size={16} />}
                >
                  Signature
                </Tabs.Tab>
                <Tabs.Tab
                  value="oauth"
                  leftSection={<IconBrandOauth size={16} />}
                >
                  OAuth
                </Tabs.Tab>
                <Tabs.Tab value="token" leftSection={<IconKey size={16} />}>
                  Token
                </Tabs.Tab>
                <Tabs.Tab value="api" leftSection={<IconApi size={16} />}>
                  API Call
                </Tabs.Tab>
              </Tabs.List>

              {Object.entries(codeExamples).map(([key, code]) => (
                <Tabs.Panel key={key} value={key}>
                  <Paper
                    p="md"
                    radius="lg"
                    style={{
                      border: isDark
                        ? "1px solid var(--mantine-color-dark-4)"
                        : "1px solid var(--mantine-color-gray-2)",
                      position: "relative",
                    }}
                  >
                    <Group justify="space-between" mb="md">
                      <Group gap="xs">
                        <ThemeIcon
                          size={24}
                          radius="md"
                          variant="light"
                          color="cyan"
                        >
                          <IconTerminal2 size={14} />
                        </ThemeIcon>
                        <Text size="sm" fw={600}>
                          {key === "signature" &&
                            "Generate HMAC-SHA256 Signature"}
                          {key === "oauth" && "OAuth Authorization"}
                          {key === "token" && "Token Exchange"}
                          {key === "api" && "Authenticated API Request"}
                        </Text>
                      </Group>
                      <CopyButton value={code}>
                        {({ copied, copy }) => (
                          <Tooltip label={copied ? "Copied!" : "Copy code"}>
                            <ActionIcon
                              color={copied ? "green" : "gray"}
                              variant="subtle"
                              onClick={copy}
                            >
                              {copied ? (
                                <IconCheck size={16} />
                              ) : (
                                <IconCopy size={16} />
                              )}
                            </ActionIcon>
                          </Tooltip>
                        )}
                      </CopyButton>
                    </Group>

                    <Code
                      block
                      style={{
                        backgroundColor: isDark
                          ? "var(--mantine-color-dark-7)"
                          : "var(--mantine-color-gray-0)",
                        fontSize: rem(13),
                        lineHeight: 1.6,
                      }}
                    >
                      {code}
                    </Code>
                  </Paper>
                </Tabs.Panel>
              ))}
            </Tabs>
          </Stack>
        </Container>
      </Box>

      {/* Supported Modules */}
      <Container size="lg" py={{ base: 60, md: 80 }}>
        <Stack gap="xl">
          <Stack gap="sm" align="center" ta="center">
            <Badge size="md" variant="light" color="orange">
              Modules
            </Badge>
            <Title order={2} fz={{ base: 28, md: 36 }}>
              Modul yang Didukung
            </Title>
            <Text c="dimmed" maw={500}>
              Daftar modul Accurate yang terintegrasi dengan Exima
            </Text>
          </Stack>

          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {supportedModules.map((module) => (
              <Paper
                key={module.name}
                p="lg"
                radius="lg"
                style={{
                  border: isDark
                    ? "1px solid var(--mantine-color-dark-4)"
                    : "1px solid var(--mantine-color-gray-2)",
                }}
              >
                <Group justify="space-between" mb="sm">
                  <Text fw={600}>{module.name}</Text>
                  <Badge
                    size="sm"
                    variant="light"
                    color={
                      module.status === "active"
                        ? "green"
                        : module.status === "read-only"
                          ? "blue"
                          : "gray"
                    }
                  >
                    {module.status === "active"
                      ? "Active"
                      : module.status === "read-only"
                        ? "Read Only"
                        : "Planned"}
                  </Badge>
                </Group>
                <Text size="sm" c="dimmed">
                  {module.description}
                </Text>
              </Paper>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>

      {/* CTA Section */}
      <Container size="lg" pb={{ base: 60, md: 80 }}>
        <Card
          padding="xl"
          radius="xl"
          style={{
            background: isDark
              ? "linear-gradient(135deg, rgba(121, 80, 242, 0.15) 0%, rgba(34, 139, 230, 0.15) 100%)"
              : "linear-gradient(135deg, #7950F2 0%, #228BE6 100%)",
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
              <IconCode size={32} />
            </ThemeIcon>

            <Title
              order={2}
              c={isDark ? "white" : "white"}
              fz={{ base: 24, md: 32 }}
            >
              Mulai Integrasi Sekarang
            </Title>
            <Text
              c={isDark ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.9)"}
              maw={500}
            >
              Clone repository, setup environment variables, dan mulai
              ekspor/impor inventory adjustment dari Accurate.
            </Text>

            <Group gap="md" mt="md">
              <Button
                size="lg"
                radius="md"
                color={isDark ? "brand" : "white"}
                variant={isDark ? "filled" : "white"}
                c={isDark ? "white" : "violet"}
                rightSection={<IconArrowRight size={18} />}
                onClick={() => router.push("/dashboard/credentials")}
              >
                Connect Accurate
              </Button>
              <Button
                size="lg"
                radius="md"
                variant="outline"
                color="white"
                leftSection={<IconBrandGithub size={18} />}
                onClick={() =>
                  window.open(
                    "https://github.com/faisalnh/Exim-Accurate",
                    "_blank",
                  )
                }
              >
                View Docs
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
