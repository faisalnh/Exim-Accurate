"use client";

import {
    Title,
    Paper,
    Stack,
    Button,
    Select,
    TextInput,
    Table,
    Alert,
    LoadingOverlay,
    Group,
    Text,
    NumberInput,
    ActionIcon,
    Badge,
    Card,
    Center,
    ThemeIcon,
    Divider,
    Modal,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useState, useEffect, useRef, useCallback } from "react";
import { CameraScanner } from "@/components/CameraScanner";
import Link from "next/link";
import {
    IconAlertCircle,
    IconCheck,
    IconScan,
    IconTrash,
    IconUser,
    IconPackage,
    IconShoppingCart,
    IconCamera,
    IconExternalLink,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { EmptyState } from "@/components/ui/EmptyState";


interface Credential {
    id: string;
    appKey: string;
}

interface CartItem {
    itemCode: string;
    itemName: string;
    quantity: number;
}

export default function SelfCheckoutPage() {
    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [selectedCredential, setSelectedCredential] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Camera Scanner state
    const [cameraModalOpened, { open: openCameraModal, close: closeCameraModal }] = useDisclosure(false);
    const [scanTarget, setScanTarget] = useState<"item" | "staff" | null>(null);

    // Item scanning
    const [itemScanInput, setItemScanInput] = useState("");
    const [lookingUpItem, setLookingUpItem] = useState(false);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [pendingItem, setPendingItem] = useState<{ code: string; name: string } | null>(null);
    const [pendingQuantity, setPendingQuantity] = useState<number>(1);

    // Staff badge scanning
    const [staffEmail, setStaffEmail] = useState("");
    const [staffInfo, setStaffInfo] = useState<{ name: string; dept: string } | null>(null);

    // Error handling
    const [error, setError] = useState("");
    const [itemError, setItemError] = useState("");

    // Refs for auto-focus
    const itemInputRef = useRef<HTMLInputElement>(null);
    const staffInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchCredentials();
    }, []);

    // Auto-focus item input when credential is selected
    useEffect(() => {
        if (selectedCredential && itemInputRef.current) {
            itemInputRef.current.focus();
        }
    }, [selectedCredential]);

    const fetchCredentials = async () => {
        try {
            const response = await fetch("/api/credentials");
            if (response.ok) {
                const data = await response.json();
                setCredentials(data);
                // Auto-select if only one credential
                if (data.length === 1) {
                    setSelectedCredential(data[0].id);
                }
            }
        } catch (err) {
            console.error("Failed to fetch credentials", err);
        } finally {
            setLoading(false);
        }
    };

    // Handle item scan (triggered on Enter or blur)
    const handleItemScan = useCallback(async () => {
        const code = itemScanInput.trim();
        if (!code || !selectedCredential) return;

        setItemError("");
        setLookingUpItem(true);
        setPendingItem(null);

        try {
            const response = await fetch(
                `/api/self-checkout/lookup?code=${encodeURIComponent(code)}&credentialId=${selectedCredential}`
            );

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Item not found");
            }

            const item = await response.json();
            setPendingItem({ code: item.itemCode, name: item.itemName });
            setPendingQuantity(1);
            setItemScanInput("");

            notifications.show({
                title: "Item Found",
                message: `${item.itemName} (${item.itemCode})`,
                color: "blue",
                icon: <IconPackage size={16} />,
            });
        } catch (err: any) {
            setItemError(err.message);
            notifications.show({
                title: "Item Not Found",
                message: err.message,
                color: "red",
            });
        } finally {
            setLookingUpItem(false);
            // Refocus input for next scan
            itemInputRef.current?.focus();
        }
    }, [itemScanInput, selectedCredential]);

    // Handle scan success from camera
    const handleCameraScanSuccess = (decodedText: string) => {
        if (scanTarget === "item") {
            setItemScanInput(decodedText);
            closeCameraModal();
            // Automatically trigger lookup
            setTimeout(() => {
                const code = decodedText.trim();
                if (code && selectedCredential) {
                    performLookup(code);
                }
            }, 100);
        } else if (scanTarget === "staff") {
            setStaffEmail(decodedText);
            parseStaffInfo(decodedText);
            closeCameraModal();
        }
    };

    const performLookup = async (code: string) => {
        setItemError("");
        setLookingUpItem(true);
        setPendingItem(null);

        try {
            const response = await fetch(
                `/api/self-checkout/lookup?code=${encodeURIComponent(code)}&credentialId=${selectedCredential}`
            );

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Item not found");
            }

            const item = await response.json();
            setPendingItem({ code: item.itemCode, name: item.itemName });
            setPendingQuantity(1);
            setItemScanInput("");

            notifications.show({
                title: "Item Found",
                message: `${item.itemName} (${item.itemCode})`,
                color: "blue",
                icon: <IconPackage size={16} />,
            });
        } catch (err: any) {
            setItemError(err.message);
            notifications.show({
                title: "Item Not Found",
                message: err.message,
                color: "red",
            });
        } finally {
            setLookingUpItem(false);
            itemInputRef.current?.focus();
        }
    };

    // Add pending item to cart
    const addToCart = () => {
        if (!pendingItem || pendingQuantity <= 0) return;

        // Check if item already in cart
        const existingIndex = cart.findIndex((item) => item.itemCode === pendingItem.code);

        if (existingIndex >= 0) {
            // Update quantity
            const newCart = [...cart];
            newCart[existingIndex].quantity += pendingQuantity;
            setCart(newCart);
        } else {
            // Add new item
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
        itemInputRef.current?.focus();

        notifications.show({
            title: "Added to Cart",
            message: `${pendingItem.name} x${pendingQuantity}`,
            color: "green",
            icon: <IconCheck size={16} />,
        });
    };

    // Remove item from cart
    const removeFromCart = (index: number) => {
        const newCart = [...cart];
        newCart.splice(index, 1);
        setCart(newCart);
    };

    // Update quantity in cart
    const updateCartQuantity = (index: number, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(index);
            return;
        }
        const newCart = [...cart];
        newCart[index].quantity = quantity;
        setCart(newCart);
    };

    // Parse staff info from email (for display)
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

    // Handle staff badge scan
    const handleStaffScan = () => {
        const email = staffEmail.trim().toLowerCase();
        if (email && email.includes("@")) {
            parseStaffInfo(email);
        }
        // Move focus to submit button or back to item scanner
        if (cart.length > 0) {
            // Ready to submit
        } else {
            itemInputRef.current?.focus();
        }
    };

    // Submit checkout
    const handleSubmit = async () => {
        if (!selectedCredential || !staffEmail || cart.length === 0) {
            setError("Please scan items and staff badge before submitting");
            return;
        }

        setError("");
        setSubmitting(true);

        try {
            const response = await fetch("/api/self-checkout/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    credentialId: selectedCredential,
                    staffEmail: staffEmail.trim().toLowerCase(),
                    items: cart.map((item) => ({
                        itemCode: item.itemCode,
                        itemName: item.itemName,
                        quantity: item.quantity,
                    })),
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Checkout failed");
            }

            const result = await response.json();

            notifications.show({
                title: "Checkout Successful!",
                message: `Created adjustment #${result.adjustmentNumber || result.adjustmentId} for ${cart.length} item(s)`,
                color: "green",
                icon: <IconCheck size={16} />,
                autoClose: 5000,
            });

            // Reset form
            setCart([]);
            setStaffEmail("");
            setStaffInfo(null);
            setPendingItem(null);
            itemInputRef.current?.focus();
        } catch (err: any) {
            setError(err.message);
            notifications.show({
                title: "Checkout Failed",
                message: err.message,
                color: "red",
            });
        } finally {
            setSubmitting(false);
        }
    };

    // Calculate total items
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    // Check if ready to submit
    const canSubmit = cart.length > 0 && staffEmail.includes("@") && selectedCredential;

    return (
        <Stack gap="md">
            <Group justify="space-between" align="center">
                <Group gap="md">
                    <Title order={1}>Self Checkout</Title>
                    <Button
                        component={Link}
                        href="/kiosk"
                        variant="light"
                        color="blue"
                        leftSection={<IconExternalLink size={18} />}
                        size="sm"
                    >
                        Switch to Kiosk Mode
                    </Button>
                </Group>
                {cart.length > 0 && (
                    <Badge size="xl" variant="filled" color="blue" leftSection={<IconShoppingCart size={16} />}>
                        {totalItems} item{totalItems !== 1 ? "s" : ""} in cart
                    </Badge>
                )}
            </Group>


            <Modal
                opened={cameraModalOpened}
                onClose={closeCameraModal}
                title={`Scanning ${scanTarget === "item" ? "Item Barcode" : "Staff Badge"}`}
                size="lg"
            >
                <CameraScanner
                    onScanSuccess={handleCameraScanSuccess}
                    qrbox={scanTarget === "staff" ? 250 : { width: 300, height: 150 }}
                />
            </Modal>

            <Paper p="md" withBorder pos="relative">
                <LoadingOverlay visible={loading || submitting} />

                {credentials.length === 0 && !loading ? (
                    <EmptyState
                        variant="no-credentials"
                        title="No accounts connected"
                        description="Connect your Accurate account to start using Self Checkout."
                        action={{
                            label: "Connect Accurate",
                            onClick: () => (window.location.href = "/dashboard/credentials"),
                        }}
                    />
                ) : (
                    <Stack gap="md">
                        {error && (
                            <Alert icon={<IconAlertCircle size={16} />} color="red" withCloseButton onClose={() => setError("")}>
                                {error}
                            </Alert>
                        )}

                        {/* Credential Selection */}
                        <Select
                            label="Accurate Account"
                            placeholder="Select account"
                            data={credentials.map((c) => ({ value: c.id, label: c.appKey }))}
                            value={selectedCredential}
                            onChange={setSelectedCredential}
                            required
                            size="lg"
                        />

                        <Divider label="Scan Items" labelPosition="center" />

                    {/* Item Scanner */}
                    <Group align="flex-end" grow>
                        <TextInput
                            ref={itemInputRef}
                            label="Scan Item Barcode"
                            placeholder="Scan or type item code, then press Enter"
                            value={itemScanInput}
                            onChange={(e) => setItemScanInput(e.currentTarget.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleItemScan();
                                }
                            }}
                            onBlur={() => {
                                if (itemScanInput.trim()) {
                                    handleItemScan();
                                }
                            }}
                            leftSection={<IconScan size={20} />}
                            size="lg"
                            disabled={!selectedCredential || lookingUpItem}
                            error={itemError}
                            autoFocus
                        />
                        <Button
                            size="lg"
                            variant="outline"
                            leftSection={<IconCamera size={20} />}
                            onClick={() => {
                                setScanTarget("item");
                                openCameraModal();
                            }}
                            disabled={!selectedCredential}
                        >
                            Camera
                        </Button>
                    </Group>

                    {/* Pending Item (just scanned) */}
                    {pendingItem && (
                        <Card withBorder bg="blue.0" p="md">
                            <Group justify="space-between" align="center">
                                <div>
                                    <Text fw={600} size="lg">{pendingItem.name}</Text>
                                    <Text c="dimmed" size="sm">Code: {pendingItem.code}</Text>
                                </div>
                                <Group>
                                    <NumberInput
                                        value={pendingQuantity}
                                        onChange={(val) => setPendingQuantity(typeof val === "number" ? val : 1)}
                                        min={1}
                                        max={1000}
                                        w={100}
                                        size="lg"
                                    />
                                    <Button onClick={addToCart} size="lg" leftSection={<IconCheck size={20} />}>
                                        Add to Cart
                                    </Button>
                                </Group>
                            </Group>
                        </Card>
                    )}

                        {/* Cart Table */}
                        <Divider label="Cart" labelPosition="center" />
                        {cart.length > 0 ? (
                            <Table striped highlightOnHover>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Item Code</Table.Th>
                                        <Table.Th>Item Name</Table.Th>
                                        <Table.Th w={120}>Quantity</Table.Th>
                                        <Table.Th w={60}></Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {cart.map((item, idx) => (
                                        <Table.Tr key={idx}>
                                            <Table.Td>{item.itemCode}</Table.Td>
                                            <Table.Td>{item.itemName}</Table.Td>
                                            <Table.Td>
                                                <NumberInput
                                                    value={item.quantity}
                                                    onChange={(val) => updateCartQuantity(idx, typeof val === "number" ? val : 0)}
                                                    min={1}
                                                    max={1000}
                                                    size="sm"
                                                />
                                            </Table.Td>
                                            <Table.Td>
                                                <ActionIcon color="red" variant="subtle" onClick={() => removeFromCart(idx)}>
                                                    <IconTrash size={18} />
                                                </ActionIcon>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        ) : (
                            <EmptyState
                                variant="empty-cart"
                                size="sm"
                                description="Scan items or use camera to add them to your cart"
                            />
                        )}

                        <Divider label="Staff Identification" labelPosition="center" />

                    {/* Staff Badge Scanner */}
                    <TextInput
                        ref={staffInputRef}
                        label="Scan Staff Badge"
                        placeholder="Scan QR code on staff badge"
                        value={staffEmail}
                        onChange={(e) => {
                            setStaffEmail(e.currentTarget.value);
                            parseStaffInfo(e.currentTarget.value);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleStaffScan();
                            }
                        }}
                        onBlur={handleStaffScan}
                        leftSection={<IconUser size={20} />}
                        size="lg"
                        disabled={!selectedCredential}
                    />
                    <Button
                        size="lg"
                        variant="outline"
                        leftSection={<IconCamera size={20} />}
                        onClick={() => {
                            setScanTarget("staff");
                            openCameraModal();
                        }}
                        disabled={!selectedCredential}
                        fullWidth
                    >
                        Scan Badge with Camera
                    </Button>

                    {/* Staff Info Display */}
                    {staffInfo && (
                        <Card withBorder bg="green.0" p="md">
                            <Group>
                                <ThemeIcon size="xl" radius="xl" color="green">
                                    <IconUser size={24} />
                                </ThemeIcon>
                                <div>
                                    <Text fw={600} size="lg">{staffInfo.name}</Text>
                                    {staffInfo.dept && <Text c="dimmed" size="sm">Department: {staffInfo.dept}</Text>}
                                    <Text c="dimmed" size="sm">Email: {staffEmail}</Text>
                                </div>
                            </Group>
                        </Card>
                    )}

                    <Divider />

                    {/* Submit Button */}
                    <Button
                        onClick={handleSubmit}
                        size="xl"
                        fullWidth
                        disabled={!canSubmit}
                        loading={submitting}
                        color="green"
                        leftSection={<IconCheck size={24} />}
                        h={60}
                        styles={{ label: { fontSize: 20 } }}
                    >
                        Complete Checkout ({totalItems} item{totalItems !== 1 ? "s" : ""})
                    </Button>

                    {!canSubmit && (
                        <Center>
                            <Text c="dimmed" size="sm">
                                {!selectedCredential
                                    ? "Select an Accurate account to start"
                                    : cart.length === 0
                                        ? "Scan items to add to cart"
                                        : !staffEmail.includes("@")
                                            ? "Scan staff badge to complete checkout"
                                            : "Ready to checkout"}
                            </Text>
                        </Center>
                    )}
                    </Stack>
                )}
            </Paper>
        </Stack>
    );
}
