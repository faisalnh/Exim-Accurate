"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Stack,
    Title,
    Text,
    Card,
    Group,
    ThemeIcon,
    Button,
    TextInput,
    NumberInput,
    Table,
    ActionIcon,
    Center,
    Loader,
    Box,
    Stepper,
    Badge,
    Divider,
    Paper,
    ScrollArea,
} from "@mantine/core";
import {
    IconArrowLeft,
    IconArrowRight,
    IconCheck,
    IconTrash,
    IconPackage,
    IconUser,
    IconShoppingCart,
    IconX,
    IconScan,
    IconHome,
    IconBarcode,
    IconCamera,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { PersistentScanner } from "@/components/PersistentScanner";

interface CartItem {
    itemCode: string;
    itemName: string;
    quantity: number;
}

export default function KioskCheckoutPage() {
    const params = useParams();
    const router = useRouter();
    const credentialId = params.credentialId as string;

    // Step management
    const [currentStep, setCurrentStep] = useState(0);

    // Scanner mode (disable camera, use external scanner)
    const [useScanner, setUseScanner] = useState(false);

    // Refs for auto-focus
    const itemInputRef = useRef<HTMLInputElement>(null);
    const staffInputRef = useRef<HTMLInputElement>(null);

    // Cart state
    const [cart, setCart] = useState<CartItem[]>([]);
    const [pendingItem, setPendingItem] = useState<{ code: string; name: string } | null>(null);
    const [pendingQuantity, setPendingQuantity] = useState(1);
    const [lookingUp, setLookingUp] = useState(false);
    const [lastScannedCode, setLastScannedCode] = useState("");

    // Staff state
    const [staffEmail, setStaffEmail] = useState("");
    const [staffInfo, setStaffInfo] = useState<{ name: string; dept: string } | null>(null);

    // Submit state
    const [submitting, setSubmitting] = useState(false);

    // Auto-focus effect for scanner mode
    useEffect(() => {
        if (!useScanner) return;

        const focusActiveInput = () => {
            if (currentStep === 0 && itemInputRef.current) {
                itemInputRef.current.focus();
            } else if (currentStep === 1 && staffInputRef.current) {
                staffInputRef.current.focus();
            }
        };

        // Focus immediately
        focusActiveInput();

        // Re-focus when clicking outside or on blur
        const handleFocusOut = (e: FocusEvent) => {
            // Allow clicks on buttons and number inputs
            const target = e.relatedTarget as HTMLElement | null;
            if (target && (target.tagName === "BUTTON" || target.tagName === "INPUT")) {
                return;
            }
            setTimeout(focusActiveInput, 100);
        };

        document.addEventListener("focusout", handleFocusOut);
        return () => document.removeEventListener("focusout", handleFocusOut);
    }, [useScanner, currentStep]);

    // Handle item scan from camera
    const handleItemScan = useCallback(async (code: string) => {
        if (lookingUp || currentStep !== 0) return;

        setLastScannedCode(code);
        setLookingUp(true);

        try {
            const response = await fetch(
                `/api/self-checkout/lookup?code=${encodeURIComponent(code)}&credentialId=${credentialId}`
            );

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Item not found");
            }

            const item = await response.json();
            setPendingItem({ code: item.itemCode, name: item.itemName });
            setPendingQuantity(1);

            notifications.show({
                title: "Item Found",
                message: item.itemName,
                color: "green",
                icon: <IconPackage size={16} />,
                autoClose: 2000,
            });
        } catch (err: any) {
            notifications.show({
                title: "Item Not Found",
                message: err.message,
                color: "red",
                autoClose: 3000,
            });
        } finally {
            setLookingUp(false);
        }
    }, [credentialId, lookingUp, currentStep]);

    // Handle staff badge scan
    const handleBadgeScan = useCallback((email: string) => {
        if (currentStep !== 1) return;

        const trimmedEmail = email.trim().toLowerCase();
        if (!trimmedEmail.includes("@")) return;

        setStaffEmail(trimmedEmail);
        parseStaffInfo(trimmedEmail);

        notifications.show({
            title: "Badge Scanned",
            message: trimmedEmail,
            color: "green",
            icon: <IconUser size={16} />,
            autoClose: 2000,
        });
    }, [currentStep]);

    // Parse staff info from email
    const parseStaffInfo = (email: string) => {
        if (!email || !email.includes("@")) {
            setStaffInfo(null);
            return;
        }

        const localPart = email.split("@")[0];
        const parts = localPart.split(".");
        const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

        if (parts.length >= 3) {
            const department = capitalize(parts[parts.length - 1]);
            const nameParts = parts.slice(0, -1).map(capitalize);
            setStaffInfo({ name: nameParts.join(" "), dept: department });
        } else if (parts.length === 2) {
            setStaffInfo({ name: parts.map(capitalize).join(" "), dept: "" });
        } else {
            setStaffInfo({ name: capitalize(parts[0]), dept: "" });
        }
    };

    // Add pending item to cart
    const addToCart = () => {
        if (!pendingItem || pendingQuantity <= 0) return;

        const existingIndex = cart.findIndex((item) => item.itemCode === pendingItem.code);

        if (existingIndex >= 0) {
            const newCart = [...cart];
            newCart[existingIndex].quantity += pendingQuantity;
            setCart(newCart);
        } else {
            setCart([
                ...cart,
                {
                    itemCode: pendingItem.code,
                    itemName: pendingItem.name,
                    quantity: pendingQuantity,
                },
            ]);
        }

        setPendingItem(null);
        setPendingQuantity(1);
    };

    // Remove item from cart
    const removeFromCart = (index: number) => {
        const newCart = [...cart];
        newCart.splice(index, 1);
        setCart(newCart);
    };

    // Update quantity
    const updateQuantity = (index: number, qty: number) => {
        if (qty <= 0) {
            removeFromCart(index);
            return;
        }
        const newCart = [...cart];
        newCart[index].quantity = qty;
        setCart(newCart);
    };

    // Submit checkout
    const handleSubmit = async () => {
        if (cart.length === 0 || !staffEmail) return;

        setSubmitting(true);

        try {
            const response = await fetch("/api/self-checkout/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    credentialId,
                    staffEmail,
                    items: cart,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Checkout failed");
            }

            const result = await response.json();

            notifications.show({
                title: "✅ Checkout Complete!",
                message: `Adjustment #${result.adjustmentNumber || result.adjustmentId} created successfully`,
                color: "green",
                autoClose: 5000,
            });

            // Reset and go back to step 0
            setCart([]);
            setStaffEmail("");
            setStaffInfo(null);
            setCurrentStep(0);
        } catch (err: any) {
            notifications.show({
                title: "Checkout Failed",
                message: err.message,
                color: "red",
            });
        } finally {
            setSubmitting(false);
        }
    };

    // Cancel and return home
    const handleCancel = () => {
        setCart([]);
        setStaffEmail("");
        setStaffInfo(null);
        setPendingItem(null);
        setCurrentStep(0);
        router.push("/kiosk");
    };

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const canProceedToStep1 = cart.length > 0;
    const canProceedToStep2 = staffEmail.includes("@");

    return (
        <Box p="md" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {/* Header */}
            <Group justify="space-between" mb="md">
                <Group gap="md">
                    <ActionIcon
                        size="xl"
                        variant="light"
                        color="gray"
                        onClick={handleCancel}
                    >
                        <IconHome size={24} />
                    </ActionIcon>
                    <Title order={2} c="white">Self Checkout</Title>
                </Group>
                <Group gap="md">
                    <Button
                        variant={useScanner ? "filled" : "light"}
                        color={useScanner ? "green" : "gray"}
                        leftSection={useScanner ? <IconBarcode size={18} /> : <IconCamera size={18} />}
                        onClick={() => setUseScanner(!useScanner)}
                    >
                        {useScanner ? "Scanner Mode" : "Camera Mode"}
                    </Button>
                    {cart.length > 0 && (
                        <Badge size="xl" color="blue" leftSection={<IconShoppingCart size={16} />}>
                            {totalItems} item{totalItems !== 1 ? "s" : ""}
                        </Badge>
                    )}
                </Group>
            </Group>

            {/* Stepper */}
            <Stepper
                active={currentStep}
                color="blue"
                size="lg"
                mb="md"
                styles={{
                    stepLabel: { color: "white" },
                    stepDescription: { color: "rgba(255,255,255,0.6)" },
                }}
            >
                <Stepper.Step label="Scan Items" description="Add items to cart" icon={<IconScan size={20} />} />
                <Stepper.Step label="Identify" description="Scan your badge" icon={<IconUser size={20} />} />
                <Stepper.Step label="Confirm" description="Complete checkout" icon={<IconCheck size={20} />} />
            </Stepper>

            {/* Main content area */}
            <Box style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                {/* Step 0: Scan Items */}
                {currentStep === 0 && (
                    <Group grow align="stretch" style={{ flex: 1 }} gap="md">
                        {/* Left: Scanner + Input */}
                        <Stack gap="md" style={{ flex: 1 }}>
                            <Paper p="sm" radius="lg" style={{ background: "rgba(255,255,255,0.05)" }}>
                                <Stack gap="sm">
                                    <Text c="white" fw={600} size="md">
                                        {useScanner ? "Scan with External Scanner" : "Scan Barcode"}
                                    </Text>
                                    {!useScanner && (
                                        <PersistentScanner
                                            onScan={handleItemScan}
                                            scannerHeight={200}
                                            disabled={lookingUp}
                                        />
                                    )}

                                    <Group gap="xs">
                                        <TextInput
                                            ref={itemInputRef}
                                            placeholder={useScanner ? "Scan item barcode..." : "Or type item code..."}
                                            value={lastScannedCode}
                                            onChange={(e) => setLastScannedCode(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && lastScannedCode.trim()) {
                                                    handleItemScan(lastScannedCode.trim());
                                                }
                                            }}
                                            style={{ flex: 1 }}
                                            size="lg"
                                            disabled={lookingUp}
                                            autoFocus={useScanner}
                                        />
                                        {lookingUp && <Loader size="sm" />}
                                    </Group>
                                </Stack>
                            </Paper>

                            {/* Pending item card */}
                            {pendingItem && (
                                <Paper p="md" radius="lg" style={{ background: "rgba(0,255,100,0.1)", border: "2px solid rgba(0,255,100,0.3)" }}>
                                    <Group justify="space-between" align="center">
                                        <Stack gap={4}>
                                            <Text c="white" fw={700} size="xl">{pendingItem.name}</Text>
                                            <Text c="dimmed">{pendingItem.code}</Text>
                                        </Stack>
                                        <Group gap="md">
                                            <NumberInput
                                                value={pendingQuantity}
                                                onChange={(val) => setPendingQuantity(typeof val === "number" ? val : 1)}
                                                min={1}
                                                max={999}
                                                w={100}
                                                size="lg"
                                                styles={{ input: { textAlign: "center", fontWeight: 700 } }}
                                            />
                                            <Button
                                                size="lg"
                                                color="green"
                                                leftSection={<IconCheck size={20} />}
                                                onClick={addToCart}
                                            >
                                                Add
                                            </Button>
                                            <ActionIcon
                                                size="xl"
                                                color="red"
                                                variant="light"
                                                onClick={() => setPendingItem(null)}
                                            >
                                                <IconX size={24} />
                                            </ActionIcon>
                                        </Group>
                                    </Group>
                                </Paper>
                            )}
                        </Stack>

                        {/* Right: Cart */}
                        <Paper p="md" radius="lg" style={{ background: "rgba(255,255,255,0.05)", flex: 1, display: "flex", flexDirection: "column" }}>
                            <Text c="white" fw={600} size="lg" mb="md">
                                Cart ({cart.length} item{cart.length !== 1 ? "s" : ""})
                            </Text>
                            <ScrollArea style={{ flex: 1 }}>
                                {cart.length === 0 ? (
                                    <Center h={200}>
                                        <Stack align="center" gap="xs">
                                            <IconShoppingCart size={50} color="gray" />
                                            <Text c="dimmed">Scan items to add to cart</Text>
                                        </Stack>
                                    </Center>
                                ) : (
                                    <Stack gap="xs">
                                        {cart.map((item, idx) => (
                                            <Paper key={idx} p="sm" radius="md" style={{ background: "rgba(255,255,255,0.05)" }}>
                                                <Group justify="space-between" align="center">
                                                    <Stack gap={2} style={{ flex: 1 }}>
                                                        <Text c="white" fw={500} lineClamp={1}>{item.itemName}</Text>
                                                        <Text c="dimmed" size="xs">{item.itemCode}</Text>
                                                    </Stack>
                                                    <Group gap="xs">
                                                        <NumberInput
                                                            value={item.quantity}
                                                            onChange={(val) => updateQuantity(idx, typeof val === "number" ? val : 0)}
                                                            min={1}
                                                            max={999}
                                                            w={80}
                                                            size="sm"
                                                            styles={{ input: { textAlign: "center" } }}
                                                        />
                                                        <ActionIcon color="red" variant="light" onClick={() => removeFromCart(idx)}>
                                                            <IconTrash size={18} />
                                                        </ActionIcon>
                                                    </Group>
                                                </Group>
                                            </Paper>
                                        ))}
                                    </Stack>
                                )}
                            </ScrollArea>
                        </Paper>
                    </Group>
                )}

                {/* Step 1: Identify */}
                {currentStep === 1 && (
                    <Center style={{ flex: 1 }}>
                        <Paper p="lg" radius="lg" style={{ background: "rgba(255,255,255,0.05)", maxWidth: 500, width: "100%" }}>
                            <Stack gap="md" align="center">
                                <ThemeIcon size={64} radius="xl" color="blue" variant="light">
                                    <IconUser size={32} />
                                </ThemeIcon>
                                <Title order={2} c="white" ta="center">Identify Yourself</Title>

                                {!useScanner && (
                                    <PersistentScanner
                                        onScan={handleBadgeScan}
                                        scannerHeight={200}
                                    />
                                )}

                                <TextInput
                                    ref={staffInputRef}
                                    placeholder={useScanner ? "Scan your badge..." : "Or type your email..."}
                                    value={staffEmail}
                                    onChange={(e) => {
                                        setStaffEmail(e.target.value);
                                        parseStaffInfo(e.target.value);
                                    }}
                                    size="lg"
                                    w="100%"
                                    leftSection={<IconUser size={20} />}
                                    autoFocus={useScanner}
                                />

                                {staffInfo && (
                                    <Paper p="sm" radius="md" w="100%" style={{ background: "rgba(0,255,100,0.1)" }}>
                                        <Group gap="sm">
                                            <ThemeIcon size="md" color="green" radius="xl">
                                                <IconCheck size={16} />
                                            </ThemeIcon>
                                            <Stack gap={0}>
                                                <Text c="white" fw={600} size="sm">{staffInfo.name}</Text>
                                                {staffInfo.dept && <Text c="dimmed" size="xs">Department: {staffInfo.dept}</Text>}
                                            </Stack>
                                        </Group>
                                    </Paper>
                                )}
                            </Stack>
                        </Paper>
                    </Center>
                )}


                {/* Step 2: Confirm */}
                {currentStep === 2 && (
                    <Center style={{ flex: 1 }}>
                        <Paper p="xl" radius="lg" style={{ background: "rgba(255,255,255,0.05)", maxWidth: 700, width: "100%" }}>
                            <Stack gap="lg">
                                <Title order={2} c="white" ta="center">Confirm Checkout</Title>

                                <Divider color="rgba(255,255,255,0.1)" />

                                {/* Staff info */}
                                <Group>
                                    <ThemeIcon size="xl" color="blue" radius="xl">
                                        <IconUser size={24} />
                                    </ThemeIcon>
                                    <Stack gap={2}>
                                        <Text c="white" fw={600}>{staffInfo?.name || staffEmail}</Text>
                                        {staffInfo?.dept && <Text c="dimmed" size="sm">Department: {staffInfo.dept}</Text>}
                                        <Text c="dimmed" size="sm">{staffEmail}</Text>
                                    </Stack>
                                </Group>

                                <Divider color="rgba(255,255,255,0.1)" />

                                {/* Items summary */}
                                <Stack gap="xs">
                                    <Text c="white" fw={600}>Items ({totalItems} total)</Text>
                                    {cart.map((item, idx) => (
                                        <Group key={idx} justify="space-between">
                                            <Text c="dimmed">{item.itemName}</Text>
                                            <Badge color="blue">x{item.quantity}</Badge>
                                        </Group>
                                    ))}
                                </Stack>

                                <Divider color="rgba(255,255,255,0.1)" />

                                <Button
                                    size="xl"
                                    color="green"
                                    fullWidth
                                    leftSection={<IconCheck size={24} />}
                                    onClick={handleSubmit}
                                    loading={submitting}
                                    h={60}
                                    styles={{ label: { fontSize: 20 } }}
                                >
                                    Complete Checkout
                                </Button>
                            </Stack>
                        </Paper>
                    </Center>
                )}
            </Box>

            {/* Navigation buttons */}
            <Group justify="space-between" mt="md">
                <Button
                    size="lg"
                    variant="light"
                    color="red"
                    leftSection={<IconX size={20} />}
                    onClick={handleCancel}
                >
                    Cancel
                </Button>

                <Group gap="md">
                    {currentStep > 0 && (
                        <Button
                            size="lg"
                            variant="light"
                            leftSection={<IconArrowLeft size={20} />}
                            onClick={() => setCurrentStep((s) => s - 1)}
                            disabled={submitting}
                        >
                            Back
                        </Button>
                    )}
                    {currentStep < 2 && (
                        <Button
                            size="lg"
                            rightSection={<IconArrowRight size={20} />}
                            onClick={() => setCurrentStep((s) => s + 1)}
                            disabled={currentStep === 0 ? !canProceedToStep1 : !canProceedToStep2}
                        >
                            Next
                        </Button>
                    )}
                </Group>
            </Group>
        </Box>
    );
}
