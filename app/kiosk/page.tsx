"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Stack, Title, Text, Card, Group, ThemeIcon, SimpleGrid, Center, Loader, Box } from "@mantine/core";
import { IconBuildingStore, IconArrowRight } from "@tabler/icons-react";

interface Credential {
    id: string;
    appKey: string;
    host: string | null;
}

export default function KioskHomePage() {
    const router = useRouter();
    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCredentials();
    }, []);

    const fetchCredentials = async () => {
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
    };

    if (loading) {
        return (
            <Center style={{ flex: 1 }}>
                <Stack align="center" gap="md">
                    <Loader size="xl" color="blue" />
                    <Text c="white" size="xl">Loading...</Text>
                </Stack>
            </Center>
        );
    }

    if (credentials.length === 0) {
        return (
            <Center style={{ flex: 1 }}>
                <Stack align="center" gap="md">
                    <ThemeIcon size={100} radius="xl" color="red" variant="light">
                        <IconBuildingStore size={50} />
                    </ThemeIcon>
                    <Title c="white" order={2}>No Accounts Available</Title>
                    <Text c="dimmed" size="lg">Please configure an Accurate account first.</Text>
                </Stack>
            </Center>
        );
    }

    return (
        <Box p="xl" style={{ flex: 1 }}>
            <Stack gap="xl" align="center" justify="center" style={{ minHeight: "100%" }}>
                <Stack align="center" gap="md">
                    <ThemeIcon size={80} radius="xl" color="blue" variant="light">
                        <IconBuildingStore size={40} />
                    </ThemeIcon>
                    <Title c="white" order={1} ta="center">Self Checkout Station</Title>
                    <Text c="dimmed" size="xl" ta="center">Select an account to start</Text>
                </Stack>

                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg" style={{ maxWidth: 900 }}>
                    {credentials.map((cred) => (
                        <Card
                            key={cred.id}
                            shadow="xl"
                            padding="xl"
                            radius="lg"
                            style={{
                                cursor: "pointer",
                                transition: "transform 0.2s, box-shadow 0.2s",
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.1)",
                            }}
                            onClick={() => router.push(`/kiosk/${cred.id}`)}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "scale(1.02)";
                                e.currentTarget.style.boxShadow = "0 10px 40px rgba(0,0,0,0.3)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "scale(1)";
                                e.currentTarget.style.boxShadow = "";
                            }}
                        >
                            <Group justify="space-between" align="center">
                                <Stack gap="xs">
                                    <Text c="white" fw={600} size="lg">{cred.appKey}</Text>
                                    <Text c="dimmed" size="sm">{cred.host || "Not configured"}</Text>
                                </Stack>
                                <ThemeIcon size="lg" radius="xl" color="blue" variant="light">
                                    <IconArrowRight size={20} />
                                </ThemeIcon>
                            </Group>
                        </Card>
                    ))}
                </SimpleGrid>
            </Stack>
        </Box>
    );
}
