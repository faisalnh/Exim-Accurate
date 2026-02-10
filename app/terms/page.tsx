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
import { LanguageSelect } from "@/components/ui/LanguageSelect";
import { useLanguage } from "@/lib/language";

export default function TermsPage() {
  const { t } = useLanguage();
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
              <LanguageSelect />
              <ThemeToggle />
              <Button
                variant="subtle"
                size="sm"
                onClick={() => router.push("/terms")}
              >
                {t.common.terms}
              </Button>
              <Button
                variant="filled"
                size="sm"
                onClick={() => router.push("/login")}
              >
                {t.common.login}
              </Button>
            </Group>
          </Group>
        </Container>
      </Box>

      <Container size="md" py={{ base: "xl", md: 60 }}>
        <Stack gap="lg">
          <Badge size="md" variant="light" color="blue" w="fit-content">
            {t.common.terms}
          </Badge>
          <Title order={1}>{t.terms.title}</Title>
          <Text c="dimmed">{t.terms.subtitle}</Text>

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
              {t.terms.list.map((item, index) => (
                <List.Item key={index}>{item}</List.Item>
              ))}
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
              <Text fw={600}>{t.terms.integration.title}</Text>
              <Text c="dimmed">{t.terms.integration.description}</Text>
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
                  {t.terms.footer.copyright.split(".")[0]}
                </Anchor>
                . {t.terms.footer.copyright.split(".")[1]}
              </Text>
            </Group>

            <Group gap="md">
              <Anchor size="sm" c="dimmed" href="/">
                {t.common.home}
              </Anchor>
              <Anchor size="sm" c="dimmed" href="/login">
                {t.common.login}
              </Anchor>
            </Group>
          </Group>
        </Container>
      </Box>
    </Box>
  );
}
