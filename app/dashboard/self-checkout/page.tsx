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
  Box,
  rem,
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
import { useLanguage } from "@/lib/language";

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
  const { t } = useLanguage();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [selectedCredential, setSelectedCredential] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Camera Scanner state
  const [
    cameraModalOpened,
    { open: openCameraModal, close: closeCameraModal },
  ] = useDisclosure(false);
  const [scanTarget, setScanTarget] = useState<"item" | "staff" | null>(null);

  // Item scanning
  const [itemScanInput, setItemScanInput] = useState("");
  const [lookingUpItem, setLookingUpItem] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [pendingItem, setPendingItem] = useState<{
    code: string;
    name: string;
  } | null>(null);
  const [pendingQuantity, setPendingQuantity] = useState<number>(1);

  // Staff badge scanning
  const [staffEmail, setStaffEmail] = useState("");
  const [staffInfo, setStaffInfo] = useState<{
    name: string;
    dept: string;
  } | null>(null);

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

  const performLookup = async (code: string) => {
    setItemError("");
    setLookingUpItem(true);
    setPendingItem(null);

    try {
      const response = await fetch(
        `/api/self-checkout/lookup?code=${encodeURIComponent(code)}&credentialId=${selectedCredential}`,
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t.selfCheckout.scanner.notFound);
      }

      const item = await response.json();
      setPendingItem({ code: item.itemCode, name: item.itemName });
      setPendingQuantity(1);
      setItemScanInput("");

      notifications.show({
        title: t.selfCheckout.notifications.itemAdded,
        message: `${item.itemName} (${item.itemCode})`,
        color: "blue",
        icon: <IconPackage size={16} />,
      });
    } catch (err: any) {
      setItemError(err.message);
      notifications.show({
        title: t.selfCheckout.scanner.notFound,
        message: err.message,
        color: "red",
      });
    } finally {
      setLookingUpItem(false);
      itemInputRef.current?.focus();
    }
  };

  const handleItemScan = useCallback(async () => {
    const code = itemScanInput.trim();
    if (!code || !selectedCredential) return;
    performLookup(code);
  }, [itemScanInput, selectedCredential, t]);

  const handleCameraScanSuccess = (decodedText: string) => {
    if (scanTarget === "item") {
      setItemScanInput(decodedText);
      closeCameraModal();
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

  const addToCart = () => {
    if (!pendingItem || pendingQuantity <= 0) return;

    const existingIndex = cart.findIndex(
      (item) => item.itemCode === pendingItem.code,
    );

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

    const itemName = pendingItem.name;
    setPendingItem(null);
    setPendingQuantity(1);
    itemInputRef.current?.focus();

    notifications.show({
      title: t.selfCheckout.notifications.itemAdded,
      message: `${itemName} x${pendingQuantity}`,
      color: "green",
      icon: <IconCheck size={16} />,
    });
  };

  const removeFromCart = (index: number) => {
    if (!confirm(t.selfCheckout.cart.confirmDelete)) return;
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const updateCartQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(index);
      return;
    }
    const newCart = [...cart];
    newCart[index].quantity = quantity;
    setCart(newCart);
  };

  const parseStaffInfo = (email: string) => {
    if (!email || !email.includes("@")) {
      setStaffInfo(null);
      return;
    }

    const localPart = email.split("@")[0];
    const parts = localPart.split(".");
    const capitalize = (str: string) =>
      str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

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

  const handleStaffScan = () => {
    const email = staffEmail.trim().toLowerCase();
    if (email && email.includes("@")) {
      parseStaffInfo(email);
    }
  };

  const handleSubmit = async () => {
    if (!selectedCredential || !staffEmail || cart.length === 0) return;

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

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Checkout gagal");
      }

      notifications.show({
        title: t.selfCheckout.notifications.checkoutSuccess,
        message: t.selfCheckout.notifications.checkoutMessage.replace(
          "{number}",
          result.adjustmentNumber || result.adjustmentId,
        ),
        color: "green",
        icon: <IconCheck size={16} />,
        autoClose: 5000,
      });

      setCart([]);
      setStaffEmail("");
      setStaffInfo(null);
      setPendingItem(null);
      itemInputRef.current?.focus();
    } catch (err: any) {
      setError(err.message);
      notifications.show({
        title: t.selfCheckout.notifications.checkoutError,
        message: err.message,
        color: "red",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const canSubmit =
    cart.length > 0 && staffEmail.includes("@") && selectedCredential;

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Group gap="md">
          <Title order={1}>{t.selfCheckout.title}</Title>
          <Button
            component={Link}
            href="/kiosk"
            variant="light"
            color="blue"
            leftSection={<IconExternalLink size={18} />}
            size="sm"
          >
            {t.dashboard.userMenu.openKiosk}
          </Button>
        </Group>
        {cart.length > 0 && (
          <Badge
            size="xl"
            variant="filled"
            color="blue"
            leftSection={<IconShoppingCart size={16} />}
          >
            {totalItems} {t.selfCheckout.cart.total}
          </Badge>
        )}
      </Group>

      <Modal
        opened={cameraModalOpened}
        onClose={closeCameraModal}
        title={`${t.common.processing === "Memproses..." ? "Memindai" : "Scanning"} ${
          scanTarget === "item"
            ? t.selfCheckout.cart.item
            : t.selfCheckout.staff.title
        }`}
        size="lg"
      >
        <CameraScanner
          onScanSuccess={handleCameraScanSuccess}
          qrbox={scanTarget === "staff" ? 250 : { width: 300, height: 150 }}
        />
      </Modal>

      <Paper p="md" withBorder pos="relative">
        <LoadingOverlay visible={loading || submitting} />

        <Stack gap="lg">
          <Select
            label={t.dashboard.nav.credentials}
            placeholder={t.dashboard.emptyState.noCredentials.title}
            data={credentials.map((c) => ({ value: c.id, label: c.appKey }))}
            value={selectedCredential}
            onChange={setSelectedCredential}
            size="md"
          />

          <Divider
            label={t.selfCheckout.scanner.placeholder}
            labelPosition="center"
          />

          <Group grow align="flex-end">
            <TextInput
              ref={itemInputRef}
              label={t.selfCheckout.cart.item}
              placeholder={t.selfCheckout.scanner.placeholder}
              value={itemScanInput}
              onChange={(e) => setItemScanInput(e.currentTarget.value)}
              onKeyDown={(e) => e.key === "Enter" && handleItemScan()}
              size="lg"
              disabled={!selectedCredential}
              leftSection={<IconScan size={20} />}
              error={itemError}
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
              style={{ flex: "0 0 auto" }}
            >
              Camera
            </Button>
          </Group>

          {pendingItem && (
            <Card withBorder bg="blue.0" p="md">
              <Group justify="space-between" align="center">
                <div>
                  <Text fw={600} size="lg">
                    {pendingItem.name}
                  </Text>
                  <Text c="dimmed" size="sm">
                    Code: {pendingItem.code}
                  </Text>
                </div>
                <Group>
                  <NumberInput
                    value={pendingQuantity}
                    onChange={(val) =>
                      setPendingQuantity(typeof val === "number" ? val : 1)
                    }
                    min={1}
                    max={1000}
                    w={100}
                    size="lg"
                  />
                  <Button
                    onClick={addToCart}
                    size="lg"
                    leftSection={<IconCheck size={20} />}
                  >
                    {t.inventoryAdjustment.export.actions.next === "Lanjutkan"
                      ? "Tambah ke Keranjang"
                      : "Add to Cart"}
                  </Button>
                </Group>
              </Group>
            </Card>
          )}

          <Divider label={t.selfCheckout.cart.title} labelPosition="center" />

          {cart.length > 0 ? (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>
                    {
                      t.inventoryAdjustment.import.upload.template.columns
                        .itemNo
                    }
                  </Table.Th>
                  <Table.Th>
                    {t.inventoryAdjustment.export.preview.table.item}
                  </Table.Th>
                  <Table.Th w={120}>
                    {t.inventoryAdjustment.export.preview.table.quantity}
                  </Table.Th>
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
                        onChange={(val) =>
                          updateCartQuantity(
                            idx,
                            typeof val === "number" ? val : 0,
                          )
                        }
                        min={1}
                        size="sm"
                      />
                    </Table.Td>
                    <Table.Td>
                      <ActionIcon
                        color="red"
                        variant="subtle"
                        onClick={() => removeFromCart(idx)}
                      >
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
              description={t.selfCheckout.cart.empty}
            />
          )}

          <Divider label={t.selfCheckout.staff.title} labelPosition="center" />

          <TextInput
            ref={staffInputRef}
            label={t.selfCheckout.staff.email}
            placeholder={t.selfCheckout.staff.placeholder}
            value={staffEmail}
            onChange={(e) => {
              setStaffEmail(e.currentTarget.value);
              parseStaffInfo(e.currentTarget.value);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleStaffScan()}
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
            {t.selfCheckout.staff.placeholder}
          </Button>

          {staffInfo && (
            <Card withBorder bg="green.0" p="md">
              <Group>
                <ThemeIcon size="xl" radius="xl" color="green">
                  <IconUser size={24} />
                </ThemeIcon>
                <div>
                  <Text fw={600} size="lg">
                    {staffInfo.name}
                  </Text>
                  {staffInfo.dept && (
                    <Text c="dimmed" size="sm">
                      {staffInfo.dept}
                    </Text>
                  )}
                  <Text c="dimmed" size="sm">
                    {staffEmail}
                  </Text>
                </div>
              </Group>
            </Card>
          )}

          <Divider />

          {error && (
            <Alert icon={<IconAlertCircle size={16} />} color="red">
              {error}
            </Alert>
          )}

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
            {t.selfCheckout.actions.checkout} ({totalItems})
          </Button>

          {!canSubmit && (
            <Center>
              <Text c="dimmed" size="sm">
                {!selectedCredential
                  ? t.dashboard.emptyState.noCredentials.description
                  : cart.length === 0
                    ? t.selfCheckout.cart.empty
                    : !staffEmail.includes("@")
                      ? t.selfCheckout.staff.placeholder
                      : "Ready"}
              </Text>
            </Center>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}
