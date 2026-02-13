"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Stack,
    Title,
    Text,
    Group,
    ThemeIcon,
    Center,
    Box,
    Badge,
    rem,
    Transition,
    TextInput,
    Button,
    Table,
    ActionIcon,
    Loader,
    NumberInput,
    Checkbox,
    Paper,
    Divider,
    ScrollArea,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
    IconClipboardList,
    IconScan,
    IconArrowLeft,
    IconCheck,
    IconAlertTriangle,
    IconPackage,
    IconUserCheck,
    IconRefresh,
    IconPlus,
    IconMinus,
    IconTrash,
} from "@tabler/icons-react";
import { PersistentScanner } from "@/components/PersistentScanner";
import { LanguageSelect } from "@/components/ui/LanguageSelect";
import { useLanguage } from "@/lib/language";

type Step = "identify" | "choice" | "borrow-scan" | "return-select" | "confirm";

interface CartItem {
    itemCode: string;
    itemName: string;
    quantity: number;
}

interface ActiveItem {
    sessionId: string;
    borrowingItemId: string;
    itemCode: string;
    itemName: string;
    quantity: number;
    returnedQty: number;
    unreturned: number;
    borrowedAt: string;
}

export default function PeminjamanKioskPage() {
    const { language } = useLanguage();
    const params = useParams();
    const router = useRouter();
    const credentialId = params.credentialId as string;

    // State
    const [currentStep, setCurrentStep] = useState<Step>("identify");
    const [useScanner, setUseScanner] = useState(true);
    const [borrowerEmail, setBorrowerEmail] = useState("");
    const [borrowerName, setBorrowerName] = useState("");
    const [borrowerDept, setBorrowerDept] = useState("");

    // Borrow flow
    const [cart, setCart] = useState<CartItem[]>([]);
    const [lookingUp, setLookingUp] = useState(false);

    // Return flow
    const [activeItems, setActiveItems] = useState<ActiveItem[]>([]);
    const [selectedReturns, setSelectedReturns] = useState<
        Record<string, number>
    >({});

    // Submitting
    const [submitting, setSubmitting] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [mode, setMode] = useState<"borrow" | "return" | null>(null);

    // Refs
    const badgeInputRef = useRef<HTMLInputElement>(null);
    const itemInputRef = useRef<HTMLInputElement>(null);

    // Auto-focus for scanner mode
    useEffect(() => {
        if (!useScanner) return;
        const timer = setTimeout(() => {
            if (currentStep === "identify" && badgeInputRef.current) {
                badgeInputRef.current.focus();
            } else if (currentStep === "borrow-scan" && itemInputRef.current) {
                itemInputRef.current.focus();
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [useScanner, currentStep]);

    // Re-focus after lookup
    useEffect(() => {
        if (!lookingUp && currentStep === "borrow-scan" && useScanner) {
            setTimeout(() => itemInputRef.current?.focus(), 100);
        }
    }, [lookingUp, currentStep, useScanner]);

    // Parse staff info from email
    const parseStaffInfo = useCallback((email: string) => {
        const localPart = email.split("@")[0];
        const parts = localPart.split(".");
        const capitalize = (s: string) =>
            s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

        if (parts.length >= 3) {
            const dept = capitalize(parts[parts.length - 1]);
            const name = parts
                .slice(0, -1)
                .map(capitalize)
                .join(" ");
            return { name, department: dept };
        } else if (parts.length === 2) {
            return { name: parts.map(capitalize).join(" "), department: "" };
        }
        return { name: capitalize(parts[0]), department: "" };
    }, []);

    // Handle badge scan (Step 1)
    const handleBadgeScan = useCallback(
        async (scannedValue: string) => {
            const email = scannedValue.trim().toLowerCase();
            if (!email) return;

            setBorrowerEmail(email);
            const { name, department } = parseStaffInfo(email);
            setBorrowerName(name);
            setBorrowerDept(department);

            notifications.show({
                title: language === "id" ? "ID Terdeteksi" : "ID Detected",
                message: `${name}${department ? ` | ${department}` : ""}`,
                color: "green",
                icon: <IconUserCheck size={18} />,
            });

            // Check for unreturned items
            try {
                const res = await fetch(
                    `/api/peminjaman/check-borrower?email=${encodeURIComponent(email)}&credentialId=${credentialId}`
                );
                const data = await res.json();

                if (data.hasActiveLoans) {
                    setActiveItems(data.activeItems);
                    setCurrentStep("choice");
                } else {
                    setMode("borrow");
                    setCurrentStep("borrow-scan");
                }
            } catch {
                // If check fails, default to borrow
                setMode("borrow");
                setCurrentStep("borrow-scan");
            }
        },
        [credentialId, language, parseStaffInfo]
    );

    // Handle item scan for borrow flow
    const handleItemScan = useCallback(
        async (code: string) => {
            const trimmed = code.trim();
            if (!trimmed || lookingUp) return;

            // Check if already in cart
            const existing = cart.find((i) => i.itemCode === trimmed);
            if (existing) {
                setCart((prev) =>
                    prev.map((i) =>
                        i.itemCode === trimmed
                            ? { ...i, quantity: i.quantity + 1 }
                            : i
                    )
                );
                notifications.show({
                    message: `${existing.itemName} +1`,
                    color: "blue",
                });
                return;
            }

            setLookingUp(true);
            try {
                const res = await fetch(
                    `/api/self-checkout/lookup?code=${encodeURIComponent(trimmed)}&credentialId=${credentialId}`
                );

                if (!res.ok) {
                    const err = await res.json();
                    notifications.show({
                        title: language === "id" ? "Tidak Ditemukan" : "Not Found",
                        message: err.error || trimmed,
                        color: "red",
                    });
                    return;
                }

                const item = await res.json();
                setCart((prev) => [
                    ...prev,
                    {
                        itemCode: item.itemCode,
                        itemName: item.itemName,
                        quantity: 1,
                    },
                ]);
                notifications.show({
                    message: `${item.itemName} ${language === "id" ? "ditambahkan" : "added"}`,
                    color: "green",
                });
            } catch {
                notifications.show({
                    title: language === "id" ? "Gagal" : "Failed",
                    message: language === "id" ? "Gagal mencari barang" : "Failed to lookup item",
                    color: "red",
                });
            } finally {
                setLookingUp(false);
            }
        },
        [cart, credentialId, language, lookingUp]
    );

    // Handle camera scan
    const handleCameraScan = useCallback(
        (result: string) => {
            if (currentStep === "identify") {
                handleBadgeScan(result);
            } else if (currentStep === "borrow-scan") {
                handleItemScan(result);
            }
        },
        [currentStep, handleBadgeScan, handleItemScan]
    );

    // Toggle return item selection
    const toggleReturnItem = (borrowingItemId: string, maxQty: number) => {
        setSelectedReturns((prev) => {
            if (prev[borrowingItemId]) {
                const { [borrowingItemId]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [borrowingItemId]: maxQty };
        });
    };

    // Submit borrow
    const handleSubmitBorrow = useCallback(async () => {
        if (cart.length === 0) return;
        setSubmitting(true);

        try {
            const res = await fetch("/api/peminjaman/borrow", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    credentialId,
                    borrowerEmail,
                    items: cart,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed");
            }

            setCompleted(true);
            setCurrentStep("confirm");
            notifications.show({
                title: language === "id" ? "Peminjaman Berhasil" : "Borrow Successful",
                message:
                    language === "id"
                        ? `${cart.length} barang dipinjam`
                        : `${cart.length} items borrowed`,
                color: "green",
                icon: <IconCheck size={18} />,
            });
        } catch (err: any) {
            notifications.show({
                title: language === "id" ? "Gagal" : "Failed",
                message: err.message,
                color: "red",
            });
        } finally {
            setSubmitting(false);
        }
    }, [cart, credentialId, borrowerEmail, language]);

    // Submit return
    const handleSubmitReturn = useCallback(async () => {
        const items = Object.entries(selectedReturns).map(([id, qty]) => ({
            borrowingItemId: id,
            returnQty: qty,
        }));

        if (items.length === 0) return;
        setSubmitting(true);

        try {
            const res = await fetch("/api/peminjaman/return", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed");
            }

            setCompleted(true);
            setCurrentStep("confirm");
            notifications.show({
                title:
                    language === "id" ? "Pengembalian Berhasil" : "Return Successful",
                message:
                    language === "id"
                        ? `${items.length} barang dikembalikan`
                        : `${items.length} items returned`,
                color: "green",
                icon: <IconCheck size={18} />,
            });
        } catch (err: any) {
            notifications.show({
                title: language === "id" ? "Gagal" : "Failed",
                message: err.message,
                color: "red",
            });
        } finally {
            setSubmitting(false);
        }
    }, [selectedReturns, language]);

    // New session
    const handleNewSession = () => {
        setBorrowerEmail("");
        setBorrowerName("");
        setBorrowerDept("");
        setCart([]);
        setActiveItems([]);
        setSelectedReturns({});
        setCompleted(false);
        setMode(null);
        setCurrentStep("identify");
    };

    const totalCartItems = useMemo(
        () => cart.reduce((sum, i) => sum + i.quantity, 0),
        [cart]
    );

    const totalReturnItems = useMemo(
        () => Object.values(selectedReturns).reduce((sum, qty) => sum + qty, 0),
        [selectedReturns]
    );

    // Render header
    const renderHeader = () => (
        <Group
            justify="space-between"
            p="md"
            style={{
                borderBottom: "1px solid rgba(148, 163, 184, 0.15)",
                position: "relative",
                zIndex: 10,
            }}
        >
            <Group gap="sm">
                <ActionIcon
                    variant="subtle"
                    size="lg"
                    onClick={() => {
                        if (currentStep === "identify") {
                            router.push("/kiosk");
                        } else if (currentStep === "choice") {
                            handleNewSession();
                        } else if (
                            currentStep === "borrow-scan" ||
                            currentStep === "return-select"
                        ) {
                            if (activeItems.length > 0) {
                                setCurrentStep("choice");
                            } else {
                                handleNewSession();
                            }
                        }
                    }}
                    style={{ color: "rgba(255,255,255,0.7)" }}
                >
                    <IconArrowLeft size={20} />
                </ActionIcon>
                <ThemeIcon
                    size={40}
                    radius="xl"
                    variant="gradient"
                    gradient={{ from: "violet.5", to: "grape.7", deg: 135 }}
                    style={{ boxShadow: "0 0 15px rgba(167, 139, 250, 0.35)" }}
                >
                    <IconClipboardList size={20} />
                </ThemeIcon>
                <Stack gap={0}>
                    <Text c="white" fw={700} size="lg">
                        {language === "id" ? "Peminjaman" : "Borrowing"}
                    </Text>
                    {borrowerName && (
                        <Text c="rgba(255,255,255,0.6)" size="xs">
                            {borrowerName}
                            {borrowerDept ? ` • ${borrowerDept}` : ""}
                        </Text>
                    )}
                </Stack>
            </Group>
            <Group gap="sm">
                <Button
                    variant={useScanner ? "filled" : "light"}
                    size="xs"
                    onClick={() => setUseScanner(!useScanner)}
                    leftSection={<IconScan size={14} />}
                    style={{
                        backgroundColor: useScanner
                            ? "rgba(167, 139, 250, 0.3)"
                            : "transparent",
                        border: "1px solid rgba(167, 139, 250, 0.4)",
                        color: "white",
                    }}
                >
                    {useScanner
                        ? language === "id"
                            ? "Scanner"
                            : "Scanner"
                        : language === "id"
                            ? "Kamera"
                            : "Camera"}
                </Button>
                <LanguageSelect size="xs" />
            </Group>
        </Group>
    );

    return (
        <Box
            style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                minHeight: "100vh",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Background */}
            <Box
                style={{
                    position: "fixed",
                    inset: 0,
                    background:
                        "radial-gradient(ellipse at top, rgba(139, 92, 246, 0.15) 0%, rgba(15, 23, 42, 0.97) 50%)",
                    zIndex: 0,
                }}
            />

            <Box
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    zIndex: 1,
                }}
            >
                {renderHeader()}

                {/* Step 1: Identify */}
                <Transition mounted={currentStep === "identify"} transition="fade">
                    {(styles) => (
                        <Center style={{ ...styles, flex: 1, padding: rem(24) }}>
                            <Stack align="center" gap="xl" maw={500}>
                                <ThemeIcon
                                    size={120}
                                    radius="xl"
                                    variant="gradient"
                                    gradient={{ from: "violet.5", to: "grape.7", deg: 135 }}
                                    style={{
                                        boxShadow: "0 0 40px rgba(167, 139, 250, 0.45)",
                                    }}
                                >
                                    <IconUserCheck size={60} />
                                </ThemeIcon>

                                <Stack align="center" gap="sm">
                                    <Title order={2} c="white" ta="center">
                                        {language === "id"
                                            ? "Scan Kartu Identitas"
                                            : "Scan Your ID Card"}
                                    </Title>
                                    <Text c="rgba(255,255,255,0.6)" size="lg" ta="center">
                                        {language === "id"
                                            ? "Pindai badge / kartu ID untuk memulai peminjaman atau pengembalian"
                                            : "Scan your badge / ID card to start borrowing or returning"}
                                    </Text>
                                </Stack>

                                {useScanner ? (
                                    <TextInput
                                        ref={badgeInputRef}
                                        placeholder={
                                            language === "id"
                                                ? "Scan badge atau masukkan email..."
                                                : "Scan badge or enter email..."
                                        }
                                        size="xl"
                                        w="100%"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                handleBadgeScan(e.currentTarget.value);
                                                e.currentTarget.value = "";
                                            }
                                        }}
                                        styles={{
                                            input: {
                                                textAlign: "center",
                                                fontSize: rem(20),
                                                backgroundColor: "rgba(15, 23, 42, 0.8)",
                                                border: "2px solid rgba(167, 139, 250, 0.4)",
                                                color: "white",
                                                height: rem(64),
                                                borderRadius: rem(16),
                                                "&:focus": {
                                                    borderColor: "rgba(167, 139, 250, 0.8)",
                                                },
                                            },
                                        }}
                                    />
                                ) : (
                                    <Box
                                        w="100%"
                                        style={{
                                            borderRadius: rem(16),
                                            overflow: "hidden",
                                            border: "2px solid rgba(167, 139, 250, 0.4)",
                                        }}
                                    >
                                        <PersistentScanner onScan={handleCameraScan} />
                                    </Box>
                                )}
                            </Stack>
                        </Center>
                    )}
                </Transition>

                {/* Step 2: Choice (has unreturned items) */}
                <Transition mounted={currentStep === "choice"} transition="fade">
                    {(styles) => (
                        <Center style={{ ...styles, flex: 1, padding: rem(24) }}>
                            <Stack align="center" gap="xl" maw={600}>
                                <ThemeIcon
                                    size={100}
                                    radius="xl"
                                    variant="gradient"
                                    gradient={{ from: "orange.5", to: "red.6", deg: 135 }}
                                    style={{
                                        boxShadow: "0 0 30px rgba(251, 146, 60, 0.45)",
                                    }}
                                >
                                    <IconAlertTriangle size={50} />
                                </ThemeIcon>

                                <Stack align="center" gap="sm">
                                    <Title order={2} c="white" ta="center">
                                        {language === "id"
                                            ? `Hai ${borrowerName}!`
                                            : `Hi ${borrowerName}!`}
                                    </Title>
                                    <Text c="rgba(255,255,255,0.6)" size="lg" ta="center">
                                        {language === "id"
                                            ? `Kamu masih memiliki ${activeItems.length} barang yang belum dikembalikan.`
                                            : `You still have ${activeItems.length} unreturned items.`}
                                    </Text>
                                </Stack>

                                {/* Unreturned items preview */}
                                <Box
                                    w="100%"
                                    p="md"
                                    style={{
                                        background: "rgba(15, 23, 42, 0.6)",
                                        border: "1px solid rgba(251, 146, 60, 0.3)",
                                        borderRadius: rem(12),
                                    }}
                                >
                                    <ScrollArea mah={200}>
                                        <Stack gap="xs">
                                            {activeItems.map((item) => (
                                                <Group
                                                    key={item.borrowingItemId}
                                                    justify="space-between"
                                                >
                                                    <Group gap="sm">
                                                        <IconPackage
                                                            size={16}
                                                            style={{ color: "rgba(251, 146, 60, 0.8)" }}
                                                        />
                                                        <Text c="white" size="sm">
                                                            {item.itemName}
                                                        </Text>
                                                    </Group>
                                                    <Badge
                                                        color="orange"
                                                        variant="light"
                                                        size="sm"
                                                    >
                                                        {item.unreturned}x
                                                    </Badge>
                                                </Group>
                                            ))}
                                        </Stack>
                                    </ScrollArea>
                                </Box>

                                {/* Action buttons */}
                                <Group gap="lg" w="100%">
                                    <Button
                                        flex={1}
                                        size="xl"
                                        variant="gradient"
                                        gradient={{ from: "orange.5", to: "red.6", deg: 135 }}
                                        leftSection={<IconRefresh size={22} />}
                                        onClick={() => {
                                            setMode("return");
                                            // Pre-select all items
                                            const allSelected: Record<string, number> = {};
                                            activeItems.forEach((item) => {
                                                allSelected[item.borrowingItemId] = item.unreturned;
                                            });
                                            setSelectedReturns(allSelected);
                                            setCurrentStep("return-select");
                                        }}
                                        style={{
                                            height: rem(64),
                                            borderRadius: rem(16),
                                            boxShadow: "0 0 20px rgba(251, 146, 60, 0.35)",
                                        }}
                                    >
                                        {language === "id"
                                            ? "Kembalikan Barang"
                                            : "Return Items"}
                                    </Button>
                                    <Button
                                        flex={1}
                                        size="xl"
                                        variant="gradient"
                                        gradient={{ from: "violet.5", to: "grape.7", deg: 135 }}
                                        leftSection={<IconPlus size={22} />}
                                        onClick={() => {
                                            setMode("borrow");
                                            setCurrentStep("borrow-scan");
                                        }}
                                        style={{
                                            height: rem(64),
                                            borderRadius: rem(16),
                                            boxShadow: "0 0 20px rgba(167, 139, 250, 0.35)",
                                        }}
                                    >
                                        {language === "id"
                                            ? "Pinjam Lagi"
                                            : "Borrow More"}
                                    </Button>
                                </Group>
                            </Stack>
                        </Center>
                    )}
                </Transition>

                {/* Step 3a: Borrow - Scan Items */}
                <Transition
                    mounted={currentStep === "borrow-scan"}
                    transition="fade"
                >
                    {(styles) => (
                        <Box
                            style={{
                                ...styles,
                                flex: 1,
                                display: "flex",
                                gap: rem(16),
                                padding: rem(16),
                            }}
                        >
                            {/* Left: Scanner */}
                            <Box
                                style={{
                                    flex: 1,
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: rem(16),
                                }}
                            >
                                {!useScanner && (
                                    <Box
                                        style={{
                                            flex: 1,
                                            borderRadius: rem(16),
                                            overflow: "hidden",
                                            border: "2px solid rgba(167, 139, 250, 0.3)",
                                        }}
                                    >
                                        <PersistentScanner onScan={handleCameraScan} />
                                    </Box>
                                )}

                                {useScanner && (
                                    <Center style={{ flex: 1 }}>
                                        <Stack align="center" gap="lg" w="100%" maw={600}>
                                            <ThemeIcon
                                                size={80}
                                                radius="xl"
                                                variant="gradient"
                                                gradient={{
                                                    from: "violet.5",
                                                    to: "grape.7",
                                                    deg: 135,
                                                }}
                                                style={{
                                                    boxShadow:
                                                        "0 0 30px rgba(167, 139, 250, 0.35)",
                                                }}
                                            >
                                                <IconScan size={36} />
                                            </ThemeIcon>
                                            <Text c="white" fw={600} size="lg" ta="center">
                                                {language === "id"
                                                    ? "Scan Barcode Barang"
                                                    : "Scan Item Barcode"}
                                            </Text>
                                            <TextInput
                                                ref={itemInputRef}
                                                placeholder={
                                                    language === "id"
                                                        ? "Scan barcode barang..."
                                                        : "Scan item barcode..."
                                                }
                                                size="lg"
                                                w="100%"
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        handleItemScan(e.currentTarget.value);
                                                        e.currentTarget.value = "";
                                                    }
                                                }}
                                                rightSection={
                                                    lookingUp ? <Loader size="xs" /> : null
                                                }
                                                styles={{
                                                    input: {
                                                        textAlign: "center",
                                                        backgroundColor: "rgba(15, 23, 42, 0.8)",
                                                        border:
                                                            "2px solid rgba(167, 139, 250, 0.4)",
                                                        color: "white",
                                                        borderRadius: rem(12),
                                                    },
                                                }}
                                            />
                                        </Stack>
                                    </Center>
                                )}
                            </Box>

                            {/* Right: Cart */}
                            <Box
                                style={{
                                    width: 480,
                                    display: "flex",
                                    flexDirection: "column",
                                    background: "rgba(15, 23, 42, 0.6)",
                                    backdropFilter: "blur(24px)",
                                    borderRadius: rem(16),
                                    border: "1px solid rgba(148, 163, 184, 0.15)",
                                    overflow: "hidden",
                                }}
                            >
                                <Box
                                    p="md"
                                    style={{
                                        borderBottom: "1px solid rgba(148, 163, 184, 0.15)",
                                    }}
                                >
                                    <Group justify="space-between">
                                        <Text c="white" fw={700} size="lg">
                                            {language === "id"
                                                ? "Barang Pinjaman"
                                                : "Borrowed Items"}
                                        </Text>
                                        <Badge color="violet" variant="light" size="lg">
                                            {totalCartItems}
                                        </Badge>
                                    </Group>
                                </Box>

                                <ScrollArea style={{ flex: 1 }} p="md">
                                    {cart.length === 0 ? (
                                        <Center style={{ height: 200 }}>
                                            <Stack align="center" gap="sm">
                                                <IconPackage
                                                    size={40}
                                                    style={{ color: "rgba(255,255,255,0.3)" }}
                                                />
                                                <Text c="rgba(255,255,255,0.5)" size="sm" ta="center">
                                                    {language === "id"
                                                        ? "Scan barang untuk menambahkan"
                                                        : "Scan items to add"}
                                                </Text>
                                            </Stack>
                                        </Center>
                                    ) : (
                                        <Stack gap="sm">
                                            {cart.map((item) => (
                                                <Group
                                                    key={item.itemCode}
                                                    p="sm"
                                                    style={{
                                                        background: "rgba(167, 139, 250, 0.08)",
                                                        borderRadius: rem(10),
                                                        border: "1px solid rgba(167, 139, 250, 0.15)",
                                                    }}
                                                    justify="space-between"
                                                >
                                                    <Stack gap={2} style={{ flex: 1 }}>
                                                        <Text c="white" size="sm" fw={600}>
                                                            {item.itemName}
                                                        </Text>
                                                        <Text c="rgba(255,255,255,0.5)" size="xs">
                                                            {item.itemCode}
                                                        </Text>
                                                    </Stack>
                                                    <Group gap="xs">
                                                        <ActionIcon
                                                            size="sm"
                                                            variant="subtle"
                                                            onClick={() =>
                                                                setCart((prev) =>
                                                                    prev
                                                                        .map((i) =>
                                                                            i.itemCode === item.itemCode
                                                                                ? {
                                                                                    ...i,
                                                                                    quantity: i.quantity - 1,
                                                                                }
                                                                                : i
                                                                        )
                                                                        .filter((i) => i.quantity > 0)
                                                                )
                                                            }
                                                            style={{ color: "rgba(255,255,255,0.6)" }}
                                                        >
                                                            <IconMinus size={14} />
                                                        </ActionIcon>
                                                        <Text c="white" fw={700} size="sm" w={20} ta="center">
                                                            {item.quantity}
                                                        </Text>
                                                        <ActionIcon
                                                            size="sm"
                                                            variant="subtle"
                                                            onClick={() =>
                                                                setCart((prev) =>
                                                                    prev.map((i) =>
                                                                        i.itemCode === item.itemCode
                                                                            ? {
                                                                                ...i,
                                                                                quantity: i.quantity + 1,
                                                                            }
                                                                            : i
                                                                    )
                                                                )
                                                            }
                                                            style={{ color: "rgba(255,255,255,0.6)" }}
                                                        >
                                                            <IconPlus size={14} />
                                                        </ActionIcon>
                                                        <ActionIcon
                                                            size="sm"
                                                            variant="subtle"
                                                            color="red"
                                                            onClick={() =>
                                                                setCart((prev) =>
                                                                    prev.filter(
                                                                        (i) => i.itemCode !== item.itemCode
                                                                    )
                                                                )
                                                            }
                                                        >
                                                            <IconTrash size={14} />
                                                        </ActionIcon>
                                                    </Group>
                                                </Group>
                                            ))}
                                        </Stack>
                                    )}
                                </ScrollArea>

                                <Box
                                    p="md"
                                    style={{
                                        borderTop: "1px solid rgba(148, 163, 184, 0.15)",
                                    }}
                                >
                                    <Button
                                        fullWidth
                                        size="lg"
                                        variant="gradient"
                                        gradient={{ from: "violet.5", to: "grape.7", deg: 135 }}
                                        disabled={cart.length === 0 || submitting}
                                        loading={submitting}
                                        onClick={handleSubmitBorrow}
                                        style={{ borderRadius: rem(12) }}
                                    >
                                        {language === "id"
                                            ? `Pinjam ${totalCartItems} Barang`
                                            : `Borrow ${totalCartItems} Items`}
                                    </Button>
                                </Box>
                            </Box>
                        </Box>
                    )}
                </Transition>

                {/* Step 3b: Return - Select Items */}
                <Transition
                    mounted={currentStep === "return-select"}
                    transition="fade"
                >
                    {(styles) => (
                        <Center style={{ ...styles, flex: 1, padding: rem(24) }}>
                            <Box
                                w="100%"
                                maw={600}
                                style={{
                                    background: "rgba(15, 23, 42, 0.6)",
                                    backdropFilter: "blur(24px)",
                                    borderRadius: rem(16),
                                    border: "1px solid rgba(148, 163, 184, 0.15)",
                                    overflow: "hidden",
                                }}
                            >
                                <Box
                                    p="lg"
                                    style={{
                                        borderBottom: "1px solid rgba(148, 163, 184, 0.15)",
                                    }}
                                >
                                    <Group justify="space-between">
                                        <Stack gap={2}>
                                            <Text c="white" fw={700} size="lg">
                                                {language === "id"
                                                    ? "Pilih Barang untuk Dikembalikan"
                                                    : "Select Items to Return"}
                                            </Text>
                                            <Text c="rgba(255,255,255,0.6)" size="sm">
                                                {language === "id"
                                                    ? "Centang barang yang ingin dikembalikan"
                                                    : "Check items you want to return"}
                                            </Text>
                                        </Stack>
                                        <Badge color="orange" variant="light" size="lg">
                                            {totalReturnItems}
                                        </Badge>
                                    </Group>
                                </Box>

                                <ScrollArea mah={400} p="md">
                                    <Stack gap="sm">
                                        {activeItems.map((item) => {
                                            const isSelected = !!selectedReturns[item.borrowingItemId];
                                            return (
                                                <Group
                                                    key={item.borrowingItemId}
                                                    p="sm"
                                                    style={{
                                                        background: isSelected
                                                            ? "rgba(251, 146, 60, 0.12)"
                                                            : "rgba(255,255,255,0.04)",
                                                        borderRadius: rem(10),
                                                        border: isSelected
                                                            ? "1px solid rgba(251, 146, 60, 0.4)"
                                                            : "1px solid rgba(148, 163, 184, 0.12)",
                                                        cursor: "pointer",
                                                        transition: "all 0.2s ease",
                                                    }}
                                                    onClick={() =>
                                                        toggleReturnItem(
                                                            item.borrowingItemId,
                                                            item.unreturned
                                                        )
                                                    }
                                                >
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onChange={() =>
                                                            toggleReturnItem(
                                                                item.borrowingItemId,
                                                                item.unreturned
                                                            )
                                                        }
                                                        color="orange"
                                                        styles={{
                                                            input: {
                                                                backgroundColor: "rgba(15, 23, 42, 0.6)",
                                                                borderColor: "rgba(148, 163, 184, 0.3)",
                                                            },
                                                        }}
                                                    />
                                                    <Stack gap={2} style={{ flex: 1 }}>
                                                        <Text c="white" size="sm" fw={600}>
                                                            {item.itemName}
                                                        </Text>
                                                        <Text c="rgba(255,255,255,0.5)" size="xs">
                                                            {item.itemCode} •{" "}
                                                            {language === "id" ? "Dipinjam" : "Borrowed"}:{" "}
                                                            {new Date(item.borrowedAt).toLocaleDateString()}
                                                        </Text>
                                                    </Stack>
                                                    <Badge
                                                        color={isSelected ? "orange" : "gray"}
                                                        variant="light"
                                                        size="lg"
                                                    >
                                                        {item.unreturned}x
                                                    </Badge>
                                                </Group>
                                            );
                                        })}
                                    </Stack>
                                </ScrollArea>

                                <Box
                                    p="md"
                                    style={{
                                        borderTop: "1px solid rgba(148, 163, 184, 0.15)",
                                    }}
                                >
                                    <Button
                                        fullWidth
                                        size="lg"
                                        variant="gradient"
                                        gradient={{ from: "orange.5", to: "red.6", deg: 135 }}
                                        disabled={totalReturnItems === 0 || submitting}
                                        loading={submitting}
                                        onClick={handleSubmitReturn}
                                        style={{ borderRadius: rem(12) }}
                                    >
                                        {language === "id"
                                            ? `Kembalikan ${totalReturnItems} Barang`
                                            : `Return ${totalReturnItems} Items`}
                                    </Button>
                                </Box>
                            </Box>
                        </Center>
                    )}
                </Transition>

                {/* Step 4: Confirm / Success */}
                <Transition mounted={currentStep === "confirm"} transition="fade">
                    {(styles) => (
                        <Center style={{ ...styles, flex: 1 }}>
                            <Stack align="center" gap="xl" maw={500}>
                                <ThemeIcon
                                    size={120}
                                    radius="xl"
                                    variant="gradient"
                                    gradient={{ from: "green.5", to: "teal.6", deg: 135 }}
                                    style={{
                                        boxShadow: "0 0 40px rgba(16, 185, 129, 0.45)",
                                    }}
                                >
                                    <IconCheck size={60} />
                                </ThemeIcon>

                                <Stack align="center" gap="sm">
                                    <Title order={2} c="white" ta="center">
                                        {mode === "borrow"
                                            ? language === "id"
                                                ? "Peminjaman Berhasil! ✨"
                                                : "Borrow Successful! ✨"
                                            : language === "id"
                                                ? "Pengembalian Berhasil! ✨"
                                                : "Return Successful! ✨"}
                                    </Title>
                                    <Text c="rgba(255,255,255,0.6)" size="lg" ta="center">
                                        {borrowerName}
                                        {borrowerDept ? ` | ${borrowerDept}` : ""}
                                    </Text>
                                </Stack>

                                <Button
                                    size="xl"
                                    variant="gradient"
                                    gradient={{ from: "violet.5", to: "grape.7", deg: 135 }}
                                    onClick={handleNewSession}
                                    leftSection={<IconRefresh size={22} />}
                                    style={{
                                        height: rem(64),
                                        borderRadius: rem(16),
                                        paddingInline: rem(40),
                                        boxShadow: "0 0 25px rgba(167, 139, 250, 0.35)",
                                    }}
                                >
                                    {language === "id" ? "Sesi Baru" : "New Session"}
                                </Button>
                            </Stack>
                        </Center>
                    )}
                </Transition>
            </Box>
        </Box>
    );
}
