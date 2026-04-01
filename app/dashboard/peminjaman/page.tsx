"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Stack,
    Title,
    Text,
    Group,
    Card,
    Badge,
    Button,
    TextInput,
    NumberInput,
    Table,
    Tabs,
    ActionIcon,
    Loader,
    Center,
    Box,
    rem,
    Select,
    ScrollArea,
    Paper,
    Tooltip,
    Modal,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
    IconClipboardList,
    IconPackage,
    IconHistory,
    IconSearch,
    IconPlus,
    IconTrash,
    IconRefresh,
    IconUser,
    IconCalendar,
} from "@tabler/icons-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { EmptyState } from "@/components/ui/EmptyState";
import { useLanguage } from "@/lib/language";

interface Credential {
    id: string;
    appKey: string;
    host: string | null;
}

interface BorrowableItem {
    id: string;
    itemCode: string;
    itemName: string;
    totalStock: number;
    currentlyOut: number;
    available: number;
    createdAt: string;
}

interface BorrowingSession {
    id: string;
    borrowerEmail: string;
    borrowerName: string | null;
    borrowerDept: string | null;
    status: string;
    borrowedAt: string;
    returnedAt: string | null;
    items: {
        id: string;
        itemCode: string;
        itemName: string;
        quantity: number;
        returnedQty: number;
    }[];
}

export default function PeminjamanDashboardPage() {
    const { language } = useLanguage();
    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [selectedCredentialId, setSelectedCredentialId] = useState<
        string | null
    >(null);
    const [loading, setLoading] = useState(true);

    // Items tab
    const [items, setItems] = useState<BorrowableItem[]>([]);
    const [itemsLoading, setItemsLoading] = useState(false);
    const [newItemCode, setNewItemCode] = useState("");
    const [newItemStock, setNewItemStock] = useState<number>(1);
    const [lookingUp, setLookingUp] = useState(false);
    const [addingItem, setAddingItem] = useState(false);

    // Sessions tab
    const [sessions, setSessions] = useState<BorrowingSession[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>("active");
    const [searchQuery, setSearchQuery] = useState("");
    const [totalSessions, setTotalSessions] = useState(0);

    // Fetch credentials
    useEffect(() => {
        const fetchCreds = async () => {
            try {
                const res = await fetch("/api/credentials");
                if (res.ok) {
                    const data = await res.json();
                    setCredentials(data);
                    if (data.length > 0) {
                        setSelectedCredentialId(data[0].id);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch credentials", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCreds();
    }, []);

    // Fetch borrowable items
    const fetchItems = useCallback(async () => {
        if (!selectedCredentialId) return;
        setItemsLoading(true);
        try {
            const res = await fetch(
                `/api/peminjaman/items?credentialId=${selectedCredentialId}`
            );
            if (res.ok) {
                const data = await res.json();
                setItems(data);
            }
        } catch (err) {
            console.error("Failed to fetch items", err);
        } finally {
            setItemsLoading(false);
        }
    }, [selectedCredentialId]);

    // Fetch sessions
    const fetchSessions = useCallback(async () => {
        if (!selectedCredentialId) return;
        setSessionsLoading(true);
        try {
            const res = await fetch(
                `/api/peminjaman/sessions?credentialId=${selectedCredentialId}&status=${statusFilter}&search=${encodeURIComponent(searchQuery)}`
            );
            if (res.ok) {
                const data = await res.json();
                setSessions(data.sessions);
                setTotalSessions(data.total);
            }
        } catch (err) {
            console.error("Failed to fetch sessions", err);
        } finally {
            setSessionsLoading(false);
        }
    }, [selectedCredentialId, statusFilter, searchQuery]);

    useEffect(() => {
        fetchItems();
        fetchSessions();
    }, [fetchItems, fetchSessions]);

    // Add borrowable item
    const handleAddItem = async () => {
        if (!selectedCredentialId || !newItemCode) return;

        setAddingItem(true);
        setLookingUp(true);

        try {
            // First lookup the item from Accurate
            const lookupRes = await fetch(
                `/api/self-checkout/lookup?code=${encodeURIComponent(newItemCode)}&credentialId=${selectedCredentialId}`
            );

            if (!lookupRes.ok) {
                const err = await lookupRes.json();
                notifications.show({
                    title: language === "id" ? "Barang Tidak Ditemukan" : "Item Not Found",
                    message: err.error || newItemCode,
                    color: "red",
                });
                return;
            }

            const lookupData = await lookupRes.json();

            // Add to borrowable items
            const res = await fetch("/api/peminjaman/items", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    credentialId: selectedCredentialId,
                    itemCode: lookupData.itemCode,
                    itemName: lookupData.itemName,
                    totalStock: newItemStock,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error);
            }

            notifications.show({
                title: language === "id" ? "Berhasil" : "Success",
                message: `${lookupData.itemName} ${language === "id" ? "ditambahkan" : "added"}`,
                color: "green",
            });

            setNewItemCode("");
            setNewItemStock(1);
            fetchItems();
        } catch (err: any) {
            notifications.show({
                title: language === "id" ? "Gagal" : "Failed",
                message: err.message,
                color: "red",
            });
        } finally {
            setAddingItem(false);
            setLookingUp(false);
        }
    };

    // Delete borrowable item
    const handleDeleteItem = async (id: string) => {
        try {
            const res = await fetch(`/api/peminjaman/items?id=${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete");
            notifications.show({
                title: language === "id" ? "Berhasil" : "Success",
                message: language === "id" ? "Barang dihapus" : "Item deleted",
                color: "green",
            });
            fetchItems();
        } catch {
            notifications.show({
                title: language === "id" ? "Gagal" : "Failed",
                message: language === "id" ? "Gagal menghapus" : "Failed to delete",
                color: "red",
            });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active":
                return "orange";
            case "returned":
                return "green";
            case "partial":
                return "yellow";
            default:
                return "gray";
        }
    };

    const getStatusLabel = (status: string) => {
        if (language === "id") {
            switch (status) {
                case "active":
                    return "Dipinjam";
                case "returned":
                    return "Dikembalikan";
                case "partial":
                    return "Sebagian";
                default:
                    return status;
            }
        }
        switch (status) {
            case "active":
                return "Active";
            case "returned":
                return "Returned";
            case "partial":
                return "Partial";
            default:
                return status;
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <Center h={400}>
                    <Loader />
                </Center>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <Stack gap="lg">
                {/* Header */}
                <Group justify="space-between" align="flex-start">
                    <Stack gap="xs">
                        <Title order={2}>
                            {language === "id" ? "Peminjaman" : "Borrowing"}
                        </Title>
                        <Text c="dimmed" size="sm">
                            {language === "id"
                                ? "Kelola barang pinjaman, lihat status peminjaman, dan riwayat"
                                : "Manage borrowable items, view loan status, and history"}
                        </Text>
                    </Stack>
                    {credentials.length > 1 && (
                        <Select
                            value={selectedCredentialId}
                            onChange={setSelectedCredentialId}
                            data={credentials.map((c) => ({
                                value: c.id,
                                label: c.appKey + (c.host ? ` (${c.host})` : ""),
                            }))}
                            w={250}
                        />
                    )}
                </Group>

                <Tabs defaultValue="items">
                    <Tabs.List>
                        <Tabs.Tab value="items" leftSection={<IconPackage size={16} />}>
                            {language === "id" ? "Barang" : "Items"}
                            {items.length > 0 && (
                                <Badge size="xs" variant="light" ml="xs">
                                    {items.length}
                                </Badge>
                            )}
                        </Tabs.Tab>
                        <Tabs.Tab
                            value="active"
                            leftSection={<IconClipboardList size={16} />}
                        >
                            {language === "id" ? "Pinjaman Aktif" : "Active Loans"}
                        </Tabs.Tab>
                        <Tabs.Tab value="history" leftSection={<IconHistory size={16} />}>
                            {language === "id" ? "Riwayat" : "History"}
                        </Tabs.Tab>
                    </Tabs.List>

                    {/* Items Tab */}
                    <Tabs.Panel value="items" pt="md">
                        <Stack gap="md">
                            {/* Add Item Form */}
                            <Card withBorder radius="md" p="md">
                                <Stack gap="sm">
                                    <Text fw={600} size="sm">
                                        {language === "id"
                                            ? "Tambah Barang Peminjaman"
                                            : "Add Borrowable Item"}
                                    </Text>
                                    <Group gap="sm" align="flex-end">
                                        <TextInput
                                            label={
                                                language === "id" ? "Kode Barang" : "Item Code"
                                            }
                                            placeholder={
                                                language === "id"
                                                    ? "Masukkan kode barang Accurate..."
                                                    : "Enter Accurate item code..."
                                            }
                                            value={newItemCode}
                                            onChange={(e) => setNewItemCode(e.currentTarget.value)}
                                            style={{ flex: 1 }}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") handleAddItem();
                                            }}
                                        />
                                        <NumberInput
                                            label={
                                                language === "id"
                                                    ? "Total Stok"
                                                    : "Total Stock"
                                            }
                                            value={newItemStock}
                                            onChange={(val) =>
                                                setNewItemStock(typeof val === "number" ? val : 1)
                                            }
                                            min={1}
                                            w={120}
                                        />
                                        <Button
                                            leftSection={<IconPlus size={16} />}
                                            onClick={handleAddItem}
                                            loading={addingItem}
                                            disabled={!newItemCode}
                                        >
                                            {language === "id" ? "Tambah" : "Add"}
                                        </Button>
                                    </Group>
                                </Stack>
                            </Card>

                            {/* Items Table */}
                            {itemsLoading ? (
                                <Center h={200}>
                                    <Loader />
                                </Center>
                            ) : items.length === 0 ? (
                                <Card withBorder radius="md" p={0}>
                                    <EmptyState
                                        variant="custom"
                                        title={language === "id" ? "Belum ada barang" : "No items yet"}
                                        description={
                                            language === "id"
                                                ? "Tambahkan barang dari Accurate untuk memulai."
                                                : "Add items from Accurate to get started."
                                        }
                                        icon={<IconPackage size={48} stroke={1.5} />}
                                    />
                                </Card>
                            ) : (
                                <Card withBorder radius="md" p={0}>
                                    <Table.ScrollContainer minWidth={600}>
                                        <Table striped highlightOnHover>
                                            <Table.Thead>
                                                <Table.Tr>
                                                    <Table.Th>
                                                        {language === "id" ? "Kode" : "Code"}
                                                    </Table.Th>
                                                    <Table.Th>
                                                        {language === "id" ? "Nama Barang" : "Item Name"}
                                                    </Table.Th>
                                                    <Table.Th ta="center">
                                                        {language === "id"
                                                            ? "Total Stok"
                                                            : "Total Stock"}
                                                    </Table.Th>
                                                    <Table.Th ta="center">
                                                        {language === "id"
                                                            ? "Dipinjam"
                                                            : "Borrowed"}
                                                    </Table.Th>
                                                    <Table.Th ta="center">
                                                        {language === "id"
                                                            ? "Tersedia"
                                                            : "Available"}
                                                    </Table.Th>
                                                    <Table.Th ta="center">
                                                        {language === "id" ? "Aksi" : "Action"}
                                                    </Table.Th>
                                                </Table.Tr>
                                            </Table.Thead>
                                            <Table.Tbody>
                                                {items.map((item) => (
                                                    <Table.Tr key={item.id}>
                                                        <Table.Td>
                                                            <Text size="sm" ff="monospace">
                                                                {item.itemCode}
                                                            </Text>
                                                        </Table.Td>
                                                        <Table.Td>
                                                            <Text size="sm" fw={500}>
                                                                {item.itemName}
                                                            </Text>
                                                        </Table.Td>
                                                        <Table.Td ta="center">
                                                            <Badge color="blue" variant="light">
                                                                {item.totalStock}
                                                            </Badge>
                                                        </Table.Td>
                                                        <Table.Td ta="center">
                                                            <Badge
                                                                color={
                                                                    item.currentlyOut > 0
                                                                        ? "orange"
                                                                        : "gray"
                                                                }
                                                                variant="light"
                                                            >
                                                                {item.currentlyOut}
                                                            </Badge>
                                                        </Table.Td>
                                                        <Table.Td ta="center">
                                                            <Badge
                                                                color={
                                                                    item.available > 0 ? "green" : "red"
                                                                }
                                                                variant="light"
                                                            >
                                                                {item.available}
                                                            </Badge>
                                                        </Table.Td>
                                                        <Table.Td ta="center">
                                                            <Tooltip
                                                                label={
                                                                    language === "id" ? "Hapus" : "Delete"
                                                                }
                                                            >
                                                                <ActionIcon
                                                                    color="red"
                                                                    variant="subtle"
                                                                    onClick={() =>
                                                                        handleDeleteItem(item.id)
                                                                    }
                                                                >
                                                                    <IconTrash size={16} />
                                                                </ActionIcon>
                                                            </Tooltip>
                                                        </Table.Td>
                                                    </Table.Tr>
                                                ))}
                                            </Table.Tbody>
                                        </Table>
                                    </Table.ScrollContainer>
                                </Card>
                            )}
                        </Stack>
                    </Tabs.Panel>

                    {/* Active Loans Tab */}
                    <Tabs.Panel value="active" pt="md">
                        <Stack gap="md">
                            <Group gap="sm">
                                <TextInput
                                    placeholder={
                                        language === "id"
                                            ? "Cari peminjam atau barang..."
                                            : "Search borrower or item..."
                                    }
                                    leftSection={<IconSearch size={16} />}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.currentTarget.value)}
                                    style={{ flex: 1 }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") fetchSessions();
                                    }}
                                />
                                <Button
                                    variant="light"
                                    leftSection={<IconRefresh size={16} />}
                                    onClick={() => {
                                        setStatusFilter("active");
                                        setSearchQuery("");
                                        fetchSessions();
                                    }}
                                >
                                    {language === "id" ? "Segarkan" : "Refresh"}
                                </Button>
                            </Group>

                            {sessionsLoading ? (
                                <Center h={200}>
                                    <Loader />
                                </Center>
                            ) : sessions.filter((s) => s.status !== "returned").length ===
                                0 ? (
                                <Card withBorder radius="md" p={0}>
                                    <EmptyState
                                        variant="custom"
                                        title={language === "id" ? "Tidak ada pinjaman aktif" : "No active loans"}
                                        description={
                                            language === "id"
                                                ? "Pinjaman yang belum dikembalikan akan muncul di sini."
                                                : "Loans that have not been returned will appear here."
                                        }
                                        icon={<IconClipboardList size={48} stroke={1.5} />}
                                    />
                                </Card>
                            ) : (
                                <Stack gap="sm">
                                    {sessions
                                        .filter((s) => s.status !== "returned")
                                        .map((session) => (
                                            <Card
                                                key={session.id}
                                                withBorder
                                                radius="md"
                                                p="md"
                                            >
                                                <Group
                                                    justify="space-between"
                                                    mb="sm"
                                                >
                                                    <Group gap="sm">
                                                        <IconUser size={18} />
                                                        <Stack gap={0}>
                                                            <Text size="sm" fw={600}>
                                                                {session.borrowerName ||
                                                                    session.borrowerEmail}
                                                            </Text>
                                                            <Text size="xs" c="dimmed">
                                                                {session.borrowerEmail}
                                                                {session.borrowerDept
                                                                    ? ` • ${session.borrowerDept}`
                                                                    : ""}
                                                            </Text>
                                                        </Stack>
                                                    </Group>
                                                    <Group gap="sm">
                                                        <Badge
                                                            color={getStatusColor(session.status)}
                                                            variant="light"
                                                        >
                                                            {getStatusLabel(session.status)}
                                                        </Badge>
                                                        <Text size="xs" c="dimmed">
                                                            {new Date(
                                                                session.borrowedAt
                                                            ).toLocaleDateString()}
                                                        </Text>
                                                    </Group>
                                                </Group>
                                                <Group gap="xs" wrap="wrap">
                                                    {session.items.map((item) => (
                                                        <Badge
                                                            key={item.id}
                                                            variant="dot"
                                                            color={
                                                                item.returnedQty >= item.quantity
                                                                    ? "green"
                                                                    : "orange"
                                                            }
                                                            size="lg"
                                                        >
                                                            {item.itemName} ×{item.quantity}
                                                            {item.returnedQty > 0 &&
                                                                item.returnedQty < item.quantity &&
                                                                ` (${item.returnedQty} ${language === "id" ? "kembali" : "returned"})`}
                                                        </Badge>
                                                    ))}
                                                </Group>
                                            </Card>
                                        ))}
                                </Stack>
                            )}
                        </Stack>
                    </Tabs.Panel>

                    {/* History Tab */}
                    <Tabs.Panel value="history" pt="md">
                        <Stack gap="md">
                            <Group gap="sm">
                                <TextInput
                                    placeholder={
                                        language === "id"
                                            ? "Cari peminjam atau barang..."
                                            : "Search borrower or item..."
                                    }
                                    leftSection={<IconSearch size={16} />}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.currentTarget.value)}
                                    style={{ flex: 1 }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            setStatusFilter("all");
                                            fetchSessions();
                                        }
                                    }}
                                />
                                <Select
                                    value={statusFilter}
                                    onChange={(val) => setStatusFilter(val || "all")}
                                    data={[
                                        {
                                            value: "all",
                                            label: language === "id" ? "Semua" : "All",
                                        },
                                        {
                                            value: "active",
                                            label:
                                                language === "id" ? "Dipinjam" : "Active",
                                        },
                                        {
                                            value: "returned",
                                            label:
                                                language === "id"
                                                    ? "Dikembalikan"
                                                    : "Returned",
                                        },
                                        {
                                            value: "partial",
                                            label:
                                                language === "id" ? "Sebagian" : "Partial",
                                        },
                                    ]}
                                    w={150}
                                />
                            </Group>

                            {sessionsLoading ? (
                                <Center h={200}>
                                    <Loader />
                                </Center>
                            ) : sessions.length === 0 ? (
                                <Card withBorder radius="md" p={0}>
                                    <EmptyState
                                        variant="custom"
                                        title={language === "id" ? "Belum ada riwayat peminjaman" : "No borrowing history yet"}
                                        description={
                                            language === "id"
                                                ? "Semua riwayat peminjaman akan tercatat di sini."
                                                : "All borrowing history will be recorded here."
                                        }
                                        icon={<IconHistory size={48} stroke={1.5} />}
                                    />
                                </Card>
                            ) : (
                                <Card withBorder radius="md" p={0}>
                                    <Table.ScrollContainer minWidth={700}>
                                        <Table striped highlightOnHover>
                                            <Table.Thead>
                                                <Table.Tr>
                                                    <Table.Th>
                                                        {language === "id" ? "Peminjam" : "Borrower"}
                                                    </Table.Th>
                                                    <Table.Th>
                                                        {language === "id" ? "Barang" : "Items"}
                                                    </Table.Th>
                                                    <Table.Th>
                                                        {language === "id"
                                                            ? "Tanggal Pinjam"
                                                            : "Borrow Date"}
                                                    </Table.Th>
                                                    <Table.Th>
                                                        {language === "id"
                                                            ? "Tanggal Kembali"
                                                            : "Return Date"}
                                                    </Table.Th>
                                                    <Table.Th>Status</Table.Th>
                                                </Table.Tr>
                                            </Table.Thead>
                                            <Table.Tbody>
                                                {sessions.map((session) => (
                                                    <Table.Tr key={session.id}>
                                                        <Table.Td>
                                                            <Stack gap={0}>
                                                                <Text size="sm" fw={500}>
                                                                    {session.borrowerName ||
                                                                        session.borrowerEmail}
                                                                </Text>
                                                                <Text size="xs" c="dimmed">
                                                                    {session.borrowerDept || ""}
                                                                </Text>
                                                            </Stack>
                                                        </Table.Td>
                                                        <Table.Td>
                                                            <Group gap="xs" wrap="wrap">
                                                                {session.items.map((item) => (
                                                                    <Badge
                                                                        key={item.id}
                                                                        variant="light"
                                                                        size="sm"
                                                                    >
                                                                        {item.itemName} ×{item.quantity}
                                                                    </Badge>
                                                                ))}
                                                            </Group>
                                                        </Table.Td>
                                                        <Table.Td>
                                                            <Text size="sm">
                                                                {new Date(
                                                                    session.borrowedAt
                                                                ).toLocaleDateString()}
                                                            </Text>
                                                        </Table.Td>
                                                        <Table.Td>
                                                            <Text size="sm">
                                                                {session.returnedAt
                                                                    ? new Date(
                                                                        session.returnedAt
                                                                    ).toLocaleDateString()
                                                                    : "-"}
                                                            </Text>
                                                        </Table.Td>
                                                        <Table.Td>
                                                            <Badge
                                                                color={getStatusColor(session.status)}
                                                                variant="light"
                                                            >
                                                                {getStatusLabel(session.status)}
                                                            </Badge>
                                                        </Table.Td>
                                                    </Table.Tr>
                                                ))}
                                            </Table.Tbody>
                                        </Table>
                                    </Table.ScrollContainer>
                                </Card>
                            )}

                            {totalSessions > 20 && (
                                <Text c="dimmed" size="sm" ta="center">
                                    {language === "id"
                                        ? `Menampilkan 20 dari ${totalSessions} sesi`
                                        : `Showing 20 of ${totalSessions} sessions`}
                                </Text>
                            )}
                        </Stack>
                    </Tabs.Panel>
                </Tabs>
            </Stack>
        </DashboardLayout>
    );
}
