"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Stack,
  Title,
  Text,
  Group,
  ThemeIcon,
  Button,
  TextInput,
  NumberInput,
  ActionIcon,
  Center,
  Loader,
  Box,
  Badge,
  Paper,
  ScrollArea,
  Divider,
  rem,
  Transition,
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
  IconId,
  IconCreditCard,
  IconCircleCheck,
  IconAlertCircle,
  IconPlus,
  IconMinus,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { PersistentScanner } from "@/components/PersistentScanner";

interface CartItem {
  itemCode: string;
  itemName: string;
  quantity: number;
}

interface StaffInfo {
  name: string;
  dept: string;
}

type Step = "identify" | "scan" | "confirm";

export default function KioskCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const credentialId = params.credentialId as string;

  // Flow step management
  const [currentStep, setCurrentStep] = useState<Step>("identify");

  // Scanner mode
  const [useScanner, setUseScanner] = useState(false);

  // Refs for auto-focus
  const badgeInputRef = useRef<HTMLInputElement>(null);
  const itemInputRef = useRef<HTMLInputElement>(null);

  // Staff identification state
  const [staffEmail, setStaffEmail] = useState("");
  const [staffInfo, setStaffInfo] = useState<StaffInfo | null>(null);
  const [scanInput, setScanInput] = useState("");

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lookingUp, setLookingUp] = useState(false);

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [checkoutComplete, setCheckoutComplete] = useState(false);
  const [adjustmentNumber, setAdjustmentNumber] = useState<string | null>(null);

  // Auto-focus for scanner mode
  useEffect(() => {
    if (!useScanner) return;

    const focusActiveInput = () => {
      if (currentStep === "identify" && badgeInputRef.current) {
        badgeInputRef.current.focus();
      } else if (currentStep === "scan" && itemInputRef.current) {
        itemInputRef.current.focus();
      }
    };

    focusActiveInput();

    const handleFocusOut = (e: FocusEvent) => {
      const target = e.relatedTarget as HTMLElement | null;
      if (
        target &&
        (target.tagName === "BUTTON" || target.tagName === "INPUT")
      ) {
        return;
      }
      setTimeout(focusActiveInput, 100);
    };

    document.addEventListener("focusout", handleFocusOut);
    return () => document.removeEventListener("focusout", handleFocusOut);
  }, [useScanner, currentStep]);

  // Parse staff info from email
  const parseStaffInfo = useCallback((email: string): StaffInfo | null => {
    if (!email || !email.includes("@")) return null;

    const localPart = email.split("@")[0];
    const parts = localPart.split(".");
    const capitalize = (str: string) =>
      str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

    if (parts.length >= 3) {
      const department = capitalize(parts[parts.length - 1]);
      const nameParts = parts.slice(0, -1).map(capitalize);
      return { name: nameParts.join(" "), dept: department };
    } else if (parts.length === 2) {
      return { name: parts.map(capitalize).join(" "), dept: "" };
    } else {
      return { name: capitalize(parts[0]), dept: "" };
    }
  }, []);

  // Handle badge scan (Step 1)
  const handleBadgeScan = useCallback(
    (scannedValue: string) => {
      const trimmedEmail = scannedValue.trim().toLowerCase();
      if (!trimmedEmail.includes("@")) return;

      const info = parseStaffInfo(trimmedEmail);
      setStaffEmail(trimmedEmail);
      setStaffInfo(info);
      setScanInput("");

      notifications.show({
        title: "ID Card Scanned",
        message: `Welcome, ${info?.name || trimmedEmail}!`,
        color: "green",
        icon: <IconCircleCheck size={16} />,
        autoClose: 2000,
      });

      // Auto advance to scan step after a short delay
      setTimeout(() => setCurrentStep("scan"), 500);
    },
    [parseStaffInfo],
  );

  // Handle item scan (Step 2) - auto add to cart
  const handleItemScan = useCallback(
    async (code: string) => {
      if (lookingUp || currentStep !== "scan") return;

      setLookingUp(true);
      setScanInput("");

      try {
        const response = await fetch(
          `/api/self-checkout/lookup?code=${encodeURIComponent(code)}&credentialId=${credentialId}`,
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Item not found");
        }

        const item = await response.json();

        // Auto add to cart
        setCart((prevCart) => {
          const existingIndex = prevCart.findIndex(
            (i) => i.itemCode === item.itemCode,
          );
          if (existingIndex >= 0) {
            const newCart = [...prevCart];
            newCart[existingIndex].quantity += 1;
            return newCart;
          }
          return [
            ...prevCart,
            {
              itemCode: item.itemCode,
              itemName: item.itemName,
              quantity: 1,
            },
          ];
        });

        notifications.show({
          title: "Item Added",
          message: item.itemName,
          color: "green",
          icon: <IconPackage size={16} />,
          autoClose: 1500,
        });
      } catch (err: any) {
        notifications.show({
          title: "Item Not Found",
          message: err.message,
          color: "red",
          icon: <IconAlertCircle size={16} />,
          autoClose: 3000,
        });
      } finally {
        setLookingUp(false);
      }
    },
    [credentialId, lookingUp, currentStep],
  );

  // Handle camera scan based on current step
  const handleCameraScan = useCallback(
    (code: string) => {
      if (currentStep === "identify") {
        handleBadgeScan(code);
      } else if (currentStep === "scan") {
        handleItemScan(code);
      }
    },
    [currentStep, handleBadgeScan, handleItemScan],
  );

  // Cart operations
  const updateQuantity = (index: number, delta: number) => {
    setCart((prevCart) => {
      const newCart = [...prevCart];
      const newQty = newCart[index].quantity + delta;
      if (newQty <= 0) {
        newCart.splice(index, 1);
      } else {
        newCart[index].quantity = newQty;
      }
      return newCart;
    });
  };

  const setQuantity = (index: number, qty: number) => {
    if (qty <= 0) {
      removeFromCart(index);
      return;
    }
    setCart((prevCart) => {
      const newCart = [...prevCart];
      newCart[index].quantity = qty;
      return newCart;
    });
  };

  const removeFromCart = (index: number) => {
    setCart((prevCart) => {
      const newCart = [...prevCart];
      newCart.splice(index, 1);
      return newCart;
    });
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
      setAdjustmentNumber(result.adjustmentNumber || result.adjustmentId);
      setCheckoutComplete(true);

      notifications.show({
        title: "Checkout Complete!",
        message: `Adjustment created successfully`,
        color: "green",
        autoClose: 5000,
      });
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

  // Reset and start new session
  const handleNewSession = () => {
    setCart([]);
    setStaffEmail("");
    setStaffInfo(null);
    setScanInput("");
    setCurrentStep("identify");
    setCheckoutComplete(false);
    setAdjustmentNumber(null);
  };

  // Cancel and return home
  const handleCancel = () => {
    handleNewSession();
    router.push("/kiosk");
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Glass card style
  const glassStyle = {
    background: "rgba(255, 255, 255, 0.05)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: rem(20),
  };

  // Checkout complete screen
  if (checkoutComplete) {
    return (
      <Box p="xl" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Center style={{ flex: 1 }}>
          <Box p="xl" style={{ ...glassStyle, maxWidth: 500, width: "100%" }}>
            <Stack align="center" gap="xl" p="xl">
              <Box
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, rgba(34, 197, 94, 0.3) 0%, rgba(16, 185, 129, 0.3) 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  animation: "successPulse 1s ease-out",
                }}
              >
                <IconCircleCheck size={60} color="#4ade80" />
              </Box>

              <Stack align="center" gap="sm">
                <Title order={2} c="white" ta="center">
                  Checkout Complete!
                </Title>
                <Text c="rgba(255,255,255,0.6)" ta="center" size="lg">
                  Your items have been processed successfully.
                </Text>
              </Stack>

              {adjustmentNumber && (
                <Box
                  p="md"
                  style={{
                    background: "rgba(34, 197, 94, 0.1)",
                    borderRadius: rem(12),
                    border: "1px solid rgba(34, 197, 94, 0.3)",
                  }}
                >
                  <Text c="rgba(255,255,255,0.6)" size="sm" ta="center">
                    Adjustment Number
                  </Text>
                  <Text c="white" fw={700} size="xl" ta="center">
                    #{adjustmentNumber}
                  </Text>
                </Box>
              )}

              <Stack gap="sm" w="100%">
                <Button
                  size="xl"
                  fullWidth
                  variant="gradient"
                  gradient={{ from: "blue.5", to: "violet.5", deg: 135 }}
                  leftSection={<IconScan size={22} />}
                  onClick={handleNewSession}
                  h={60}
                >
                  Start New Session
                </Button>
                <Button
                  size="lg"
                  fullWidth
                  variant="subtle"
                  color="gray"
                  leftSection={<IconHome size={20} />}
                  onClick={handleCancel}
                >
                  Return to Home
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Center>

        <style
          dangerouslySetInnerHTML={{
            __html: `
              @keyframes successPulse {
                0% { transform: scale(0.5); opacity: 0; }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); opacity: 1; }
              }
            `,
          }}
        />
      </Box>
    );
  }

  return (
    <Box
      p={{ base: "sm", md: "lg" }}
      style={{ flex: 1, display: "flex", flexDirection: "column" }}
    >
      {/* Header */}
      <Group justify="space-between" mb="lg">
        <Group gap="md">
          <ActionIcon
            size="xl"
            variant="subtle"
            color="gray"
            onClick={handleCancel}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <IconHome size={22} />
          </ActionIcon>
          <Stack gap={0}>
            <Title order={3} c="white">
              Self Checkout
            </Title>
            <Text c="rgba(255,255,255,0.5)" size="xs">
              {staffInfo?.name || "Please scan your ID card"}
            </Text>
          </Stack>
        </Group>

        <Group gap="md">
          <Button
            variant={useScanner ? "filled" : "subtle"}
            color={useScanner ? "green" : "gray"}
            leftSection={
              useScanner ? <IconBarcode size={18} /> : <IconCamera size={18} />
            }
            onClick={() => setUseScanner(!useScanner)}
            style={
              !useScanner
                ? {
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }
                : {}
            }
          >
            {useScanner ? "Scanner Mode" : "Camera Mode"}
          </Button>
          {cart.length > 0 && (
            <Badge
              size="xl"
              variant="gradient"
              gradient={{ from: "blue.5", to: "violet.5", deg: 135 }}
              leftSection={<IconShoppingCart size={16} />}
              style={{ padding: "12px 16px" }}
            >
              {totalItems} item{totalItems !== 1 ? "s" : ""}
            </Badge>
          )}
        </Group>
      </Group>

      {/* Step Indicator */}
      <Group justify="center" mb="xl">
        <StepIndicator
          step={1}
          label="Scan ID Card"
          icon={<IconId size={18} />}
          active={currentStep === "identify"}
          completed={currentStep === "scan" || currentStep === "confirm"}
        />
        <Box
          style={{
            width: 60,
            height: 2,
            background:
              currentStep !== "identify"
                ? "linear-gradient(90deg, #60a5fa, #a78bfa)"
                : "rgba(255,255,255,0.2)",
            borderRadius: 1,
          }}
        />
        <StepIndicator
          step={2}
          label="Scan Products"
          icon={<IconScan size={18} />}
          active={currentStep === "scan"}
          completed={currentStep === "confirm"}
        />
        <Box
          style={{
            width: 60,
            height: 2,
            background:
              currentStep === "confirm"
                ? "linear-gradient(90deg, #60a5fa, #a78bfa)"
                : "rgba(255,255,255,0.2)",
            borderRadius: 1,
          }}
        />
        <StepIndicator
          step={3}
          label="Confirm"
          icon={<IconCheck size={18} />}
          active={currentStep === "confirm"}
          completed={false}
        />
      </Group>

      {/* Main Content */}
      <Box style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Step 1: Identify */}
        <Transition
          mounted={currentStep === "identify"}
          transition="fade"
          duration={300}
        >
          {(styles) => (
            <Center style={{ ...styles, flex: 1 }}>
              <Box
                p="xl"
                style={{ ...glassStyle, maxWidth: 550, width: "100%" }}
              >
                <Stack align="center" gap="xl" p="md">
                  <ThemeIcon
                    size={80}
                    radius="xl"
                    variant="gradient"
                    gradient={{ from: "blue.5", to: "violet.5", deg: 135 }}
                  >
                    <IconId size={40} />
                  </ThemeIcon>

                  <Stack align="center" gap="xs">
                    <Title order={2} c="white" ta="center">
                      Scan Your ID Card
                    </Title>
                    <Text c="rgba(255,255,255,0.6)" ta="center" size="lg">
                      Hold your employee badge up to the scanner
                    </Text>
                  </Stack>

                  {!useScanner && (
                    <Box w="100%">
                      <PersistentScanner
                        onScan={handleCameraScan}
                        scannerHeight={220}
                      />
                    </Box>
                  )}

                  <TextInput
                    ref={badgeInputRef}
                    placeholder={
                      useScanner
                        ? "Waiting for badge scan..."
                        : "Or type your email manually..."
                    }
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && scanInput.trim()) {
                        handleBadgeScan(scanInput.trim());
                      }
                    }}
                    size="lg"
                    w="100%"
                    leftSection={<IconUser size={20} />}
                    autoFocus={useScanner}
                    styles={{
                      input: {
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        color: "white",
                        "&::placeholder": { color: "rgba(255,255,255,0.4)" },
                      },
                    }}
                  />
                </Stack>
              </Box>
            </Center>
          )}
        </Transition>

        {/* Step 2: Scan Products */}
        <Transition
          mounted={currentStep === "scan"}
          transition="fade"
          duration={300}
        >
          {(styles) => (
            <Group grow align="stretch" style={{ ...styles, flex: 1 }} gap="lg">
              {/* Left: Scanner */}
              <Box style={{ ...glassStyle, padding: rem(20), flex: 1 }}>
                <Stack gap="md" h="100%">
                  <Group justify="space-between">
                    <Text c="white" fw={600} size="lg">
                      Scan Products
                    </Text>
                    {lookingUp && (
                      <Group gap="xs">
                        <Loader size="xs" color="blue" />
                        <Text c="rgba(255,255,255,0.6)" size="sm">
                          Looking up...
                        </Text>
                      </Group>
                    )}
                  </Group>

                  {!useScanner && (
                    <PersistentScanner
                      onScan={handleCameraScan}
                      scannerHeight={200}
                      disabled={lookingUp}
                    />
                  )}

                  <TextInput
                    ref={itemInputRef}
                    placeholder={
                      useScanner
                        ? "Scan item barcode..."
                        : "Or type item code and press Enter..."
                    }
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && scanInput.trim()) {
                        handleItemScan(scanInput.trim());
                      }
                    }}
                    size="lg"
                    leftSection={<IconBarcode size={20} />}
                    disabled={lookingUp}
                    autoFocus={useScanner}
                    styles={{
                      input: {
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        color: "white",
                        "&::placeholder": { color: "rgba(255,255,255,0.4)" },
                      },
                    }}
                  />

                  <Box
                    p="md"
                    style={{
                      background: "rgba(59, 130, 246, 0.1)",
                      borderRadius: rem(12),
                      border: "1px solid rgba(59, 130, 246, 0.2)",
                    }}
                  >
                    <Group gap="sm">
                      <IconCircleCheck size={20} color="#60a5fa" />
                      <Text c="rgba(255,255,255,0.8)" size="sm">
                        Items are automatically added to cart when scanned
                      </Text>
                    </Group>
                  </Box>
                </Stack>
              </Box>

              {/* Right: Cart */}
              <Box
                style={{
                  ...glassStyle,
                  padding: rem(20),
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Group justify="space-between" mb="md">
                  <Text c="white" fw={600} size="lg">
                    Cart
                  </Text>
                  <Badge
                    variant="light"
                    color="blue"
                    style={{
                      background: "rgba(59, 130, 246, 0.15)",
                      color: "#60a5fa",
                    }}
                  >
                    {cart.length} item{cart.length !== 1 ? "s" : ""}
                  </Badge>
                </Group>

                <ScrollArea style={{ flex: 1 }}>
                  {cart.length === 0 ? (
                    <Center h={200}>
                      <Stack align="center" gap="md">
                        <ThemeIcon
                          size={60}
                          radius="xl"
                          variant="light"
                          color="gray"
                          style={{
                            background: "rgba(255,255,255,0.05)",
                          }}
                        >
                          <IconShoppingCart size={30} />
                        </ThemeIcon>
                        <Text c="rgba(255,255,255,0.5)" ta="center">
                          Scan items to add them here
                        </Text>
                      </Stack>
                    </Center>
                  ) : (
                    <Stack gap="sm">
                      {cart.map((item, idx) => (
                        <Box
                          key={idx}
                          p="sm"
                          style={{
                            background: "rgba(255,255,255,0.03)",
                            borderRadius: rem(12),
                            border: "1px solid rgba(255,255,255,0.08)",
                          }}
                        >
                          <Group justify="space-between" align="center">
                            <Stack gap={2} style={{ flex: 1 }}>
                              <Text c="white" fw={500} lineClamp={1}>
                                {item.itemName}
                              </Text>
                              <Text c="rgba(255,255,255,0.5)" size="xs">
                                {item.itemCode}
                              </Text>
                            </Stack>
                            <Group gap="xs">
                              <ActionIcon
                                variant="subtle"
                                color="gray"
                                onClick={() => updateQuantity(idx, -1)}
                                style={{
                                  background: "rgba(255,255,255,0.05)",
                                }}
                              >
                                <IconMinus size={14} />
                              </ActionIcon>
                              <NumberInput
                                value={item.quantity}
                                onChange={(val) =>
                                  setQuantity(
                                    idx,
                                    typeof val === "number" ? val : 0,
                                  )
                                }
                                min={1}
                                max={999}
                                w={60}
                                size="xs"
                                hideControls
                                styles={{
                                  input: {
                                    textAlign: "center",
                                    background: "rgba(255,255,255,0.05)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    color: "white",
                                    fontWeight: 600,
                                  },
                                }}
                              />
                              <ActionIcon
                                variant="subtle"
                                color="gray"
                                onClick={() => updateQuantity(idx, 1)}
                                style={{
                                  background: "rgba(255,255,255,0.05)",
                                }}
                              >
                                <IconPlus size={14} />
                              </ActionIcon>
                              <ActionIcon
                                color="red"
                                variant="subtle"
                                onClick={() => removeFromCart(idx)}
                                style={{
                                  background: "rgba(239, 68, 68, 0.1)",
                                }}
                              >
                                <IconTrash size={16} />
                              </ActionIcon>
                            </Group>
                          </Group>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </ScrollArea>
              </Box>
            </Group>
          )}
        </Transition>

        {/* Step 3: Confirm */}
        <Transition
          mounted={currentStep === "confirm"}
          transition="fade"
          duration={300}
        >
          {(styles) => (
            <Center style={{ ...styles, flex: 1 }}>
              <Box
                p="xl"
                style={{ ...glassStyle, maxWidth: 650, width: "100%" }}
              >
                <Stack gap="xl" p="md">
                  <Title order={2} c="white" ta="center">
                    Confirm Checkout
                  </Title>

                  <Divider color="rgba(255,255,255,0.1)" />

                  {/* Staff Info */}
                  <Group
                    p="md"
                    style={{
                      background: "rgba(59, 130, 246, 0.1)",
                      borderRadius: rem(12),
                      border: "1px solid rgba(59, 130, 246, 0.2)",
                    }}
                  >
                    <ThemeIcon
                      size="xl"
                      radius="xl"
                      variant="gradient"
                      gradient={{ from: "blue.5", to: "violet.5", deg: 135 }}
                    >
                      <IconUser size={24} />
                    </ThemeIcon>
                    <Stack gap={2}>
                      <Text c="white" fw={600}>
                        {staffInfo?.name || staffEmail}
                      </Text>
                      {staffInfo?.dept && (
                        <Text c="rgba(255,255,255,0.6)" size="sm">
                          Department: {staffInfo.dept}
                        </Text>
                      )}
                      <Text c="rgba(255,255,255,0.5)" size="sm">
                        {staffEmail}
                      </Text>
                    </Stack>
                  </Group>

                  <Divider
                    label={
                      <Text c="rgba(255,255,255,0.5)" size="sm">
                        Items ({totalItems} total)
                      </Text>
                    }
                    labelPosition="center"
                    color="rgba(255,255,255,0.1)"
                  />

                  {/* Items Summary */}
                  <ScrollArea mah={250}>
                    <Stack gap="xs">
                      {cart.map((item, idx) => (
                        <Group key={idx} justify="space-between" p="xs">
                          <Stack gap={0} style={{ flex: 1 }}>
                            <Text c="white" size="sm" lineClamp={1}>
                              {item.itemName}
                            </Text>
                            <Text c="rgba(255,255,255,0.5)" size="xs">
                              {item.itemCode}
                            </Text>
                          </Stack>
                          <Badge
                            variant="light"
                            size="lg"
                            style={{
                              background: "rgba(139, 92, 246, 0.15)",
                              color: "#a78bfa",
                            }}
                          >
                            ×{item.quantity}
                          </Badge>
                        </Group>
                      ))}
                    </Stack>
                  </ScrollArea>

                  <Divider color="rgba(255,255,255,0.1)" />

                  <Button
                    size="xl"
                    fullWidth
                    variant="gradient"
                    gradient={{ from: "green.5", to: "teal.5", deg: 135 }}
                    leftSection={<IconCheck size={24} />}
                    onClick={handleSubmit}
                    loading={submitting}
                    h={60}
                    styles={{ label: { fontSize: 18, fontWeight: 600 } }}
                  >
                    Complete Checkout
                  </Button>
                </Stack>
              </Box>
            </Center>
          )}
        </Transition>
      </Box>

      {/* Navigation Footer */}
      <Group justify="space-between" mt="lg">
        <Button
          size="lg"
          variant="subtle"
          color="red"
          leftSection={<IconX size={20} />}
          onClick={handleCancel}
          style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
          }}
        >
          Cancel
        </Button>

        <Group gap="md">
          {currentStep !== "identify" && (
            <Button
              size="lg"
              variant="subtle"
              color="gray"
              leftSection={<IconArrowLeft size={20} />}
              onClick={() =>
                setCurrentStep(currentStep === "confirm" ? "scan" : "identify")
              }
              disabled={submitting}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              Back
            </Button>
          )}
          {currentStep === "scan" && cart.length > 0 && (
            <Button
              size="lg"
              variant="gradient"
              gradient={{ from: "blue.5", to: "violet.5", deg: 135 }}
              rightSection={<IconArrowRight size={20} />}
              onClick={() => setCurrentStep("confirm")}
            >
              Review & Checkout
            </Button>
          )}
        </Group>
      </Group>
    </Box>
  );
}

// Step Indicator Component
function StepIndicator({
  step,
  label,
  icon,
  active,
  completed,
}: {
  step: number;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  completed: boolean;
}) {
  return (
    <Group gap="sm">
      <Box
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: completed
            ? "linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)"
            : active
              ? "rgba(59, 130, 246, 0.3)"
              : "rgba(255, 255, 255, 0.05)",
          border: active
            ? "2px solid #60a5fa"
            : completed
              ? "none"
              : "1px solid rgba(255, 255, 255, 0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.3s ease",
        }}
      >
        {completed ? (
          <IconCheck size={20} color="white" />
        ) : (
          <Box style={{ color: active ? "#60a5fa" : "rgba(255,255,255,0.4)" }}>
            {icon}
          </Box>
        )}
      </Box>
      <Text
        c={active || completed ? "white" : "rgba(255,255,255,0.4)"}
        fw={active ? 600 : 500}
        size="sm"
        visibleFrom="sm"
      >
        {label}
      </Text>
    </Group>
  );
}
