"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Stack,
  Title,
  Text,
  Card,
  Group,
  ThemeIcon,
  SimpleGrid,
  Center,
  Loader,
  Box,
  Badge,
  rem,
} from "@mantine/core";
import {
  IconBuildingStore,
  IconArrowRight,
  IconScan,
  IconShoppingCart,
  IconUserCheck,
} from "@tabler/icons-react";

interface Credential {
  id: string;
  appKey: string;
  host: string | null;
}

export default function KioskHomePage() {
  const router = useRouter();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCredentials = useCallback(async () => {
    try {
      const response = await fetch("/api/credentials");
      if (response.ok) {
        const data = await response.json();
        setCredentials(data);

        // Auto-redirect if only one credential
        if (data.length === 1) {
          router.push(`/kiosk/${data[0].id}`);
        }
      }
    } catch (err) {
      console.error("Failed to fetch credentials", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  if (loading) {
    return (
      <Center style={{ flex: 1, minHeight: "100vh" }}>
        <Stack align="center" gap="xl">
          <Box
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "rgba(59, 130, 246, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "pulse 2s infinite",
            }}
          >
            <Loader size="lg" color="blue" />
          </Box>
          <Stack align="center" gap="xs">
            <Text c="white" size="xl" fw={600}>
              Loading Kiosk
            </Text>
            <Text c="rgba(255,255,255,0.6)" size="sm">
              Please wait...
            </Text>
          </Stack>
        </Stack>
      </Center>
    );
  }

  if (credentials.length === 0) {
    return (
      <Center style={{ flex: 1, minHeight: "100vh" }}>
        <Box
          p="xl"
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(20px)",
            borderRadius: rem(24),
            border: "1px solid rgba(255, 255, 255, 0.1)",
            maxWidth: 500,
            width: "90%",
            textAlign: "center",
          }}
        >
          <Stack align="center" gap="xl" p="xl">
            <ThemeIcon
              size={100}
              radius="xl"
              variant="gradient"
              gradient={{ from: "red.6", to: "red.8", deg: 135 }}
            >
              <IconBuildingStore size={50} />
            </ThemeIcon>
            <Stack gap="sm">
              <Title order={2} c="white">
                No Accounts Available
              </Title>
              <Text c="rgba(255,255,255,0.6)" size="lg">
                Please configure an Accurate account in the dashboard first
                before using the kiosk.
              </Text>
            </Stack>
          </Stack>
        </Box>
      </Center>
    );
  }

  const features = [
    {
      icon: <IconScan size={20} />,
      title: "Scan ID Card",
      description: "Start by scanning your employee badge",
    },
    {
      icon: <IconShoppingCart size={20} />,
      title: "Scan Products",
      description: "Items are automatically added to cart",
    },
    {
      icon: <IconUserCheck size={20} />,
      title: "Confirm & Checkout",
      description: "Review and complete your transaction",
    },
  ];

  return (
    <Box
      p={{ base: "md", sm: "xl" }}
      style={{ flex: 1, display: "flex", flexDirection: "column" }}
    >
      {/* Header */}
      <Stack align="center" gap="xl" py="xl">
        {/* Logo */}
        <Group gap="sm">
          <Box
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background:
                "linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%)",
              backdropFilter: "blur(10px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <IconBuildingStore size={28} color="white" />
          </Box>
          <Stack gap={0}>
            <Text
              size="xl"
              fw={700}
              style={{
                background: "linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Self Checkout
            </Text>
            <Text size="xs" c="rgba(255,255,255,0.5)" fw={500}>
              Inventory Management
            </Text>
          </Stack>
        </Group>

        {/* Tagline */}
        <Stack align="center" gap="md" maw={600} ta="center">
          <Title
            order={1}
            c="white"
            fw={800}
            style={{ fontSize: rem(40), lineHeight: 1.2 }}
          >
            Fast & Easy
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Self-Service Checkout
            </span>
          </Title>
          <Text c="rgba(255,255,255,0.6)" size="lg">
            Select an account below to start your checkout session
          </Text>
        </Stack>

        {/* Features */}
        <Group gap="xl" mt="md" justify="center" wrap="wrap">
          {features.map((feature, idx) => (
            <Group key={idx} gap="sm" style={{ opacity: 0.8 }}>
              <ThemeIcon
                size={36}
                radius="md"
                variant="light"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  color: "white",
                }}
              >
                {feature.icon}
              </ThemeIcon>
              <Stack gap={0}>
                <Text c="white" fw={600} size="sm">
                  {feature.title}
                </Text>
                <Text c="rgba(255,255,255,0.5)" size="xs">
                  {feature.description}
                </Text>
              </Stack>
            </Group>
          ))}
        </Group>
      </Stack>

      {/* Account Cards */}
      <Box style={{ flex: 1, display: "flex", alignItems: "center" }}>
        <SimpleGrid
          cols={{ base: 1, sm: 2, md: 3 }}
          spacing="lg"
          style={{ width: "100%", maxWidth: 1000, margin: "0 auto" }}
        >
          {credentials.map((cred, index) => (
            <Card
              key={cred.id}
              shadow="xl"
              padding="xl"
              radius="xl"
              style={{
                cursor: "pointer",
                transition: "all 0.3s ease",
                background: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                animationDelay: `${index * 100}ms`,
              }}
              onClick={() => router.push(`/kiosk/${cred.id}`)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform =
                  "translateY(-8px) scale(1.02)";
                e.currentTarget.style.boxShadow =
                  "0 25px 50px rgba(0, 0, 0, 0.3)";
                e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.5)";
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow = "";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
              }}
            >
              <Stack gap="md">
                <Group justify="space-between" align="flex-start">
                  <ThemeIcon
                    size={52}
                    radius="xl"
                    variant="gradient"
                    gradient={{ from: "blue.5", to: "violet.5", deg: 135 }}
                  >
                    <IconBuildingStore size={26} />
                  </ThemeIcon>
                  <Badge
                    variant="light"
                    color="green"
                    size="sm"
                    style={{
                      background: "rgba(34, 197, 94, 0.15)",
                      color: "#4ade80",
                    }}
                  >
                    Active
                  </Badge>
                </Group>

                <Stack gap="xs">
                  <Text c="white" fw={700} size="lg">
                    {cred.appKey}
                  </Text>
                  <Text c="rgba(255,255,255,0.5)" size="sm">
                    {cred.host || "Not configured"}
                  </Text>
                </Stack>

                <Group
                  gap="xs"
                  style={{
                    marginTop: "auto",
                    color: "rgba(255, 255, 255, 0.6)",
                  }}
                >
                  <Text size="sm" fw={500}>
                    Start Session
                  </Text>
                  <IconArrowRight size={16} />
                </Group>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      </Box>

      {/* Footer */}
      <Group justify="center" py="lg">
        <Text c="rgba(255,255,255,0.4)" size="xs">
          Powered by{" "}
          <span style={{ fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>
            Exima
          </span>{" "}
          • Accurate Integration
        </Text>
      </Group>

      {/* Animation styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
                    @keyframes pulse {
                        0%, 100% { opacity: 1; transform: scale(1); }
                        50% { opacity: 0.8; transform: scale(1.05); }
                    }
                `,
        }}
      />
    </Box>
  );
}
