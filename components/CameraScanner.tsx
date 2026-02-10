"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import {
  Stack,
  Button,
  Alert,
  Text,
  Select,
  Box,
  Center,
  ThemeIcon,
  Loader,
} from "@mantine/core";
import { IconAlertCircle, IconCamera } from "@tabler/icons-react";
import { useLanguage } from "@/lib/language";

interface CameraScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (errorMessage: string) => void;
  fps?: number;
  qrbox?: number | { width: number; height: number };
  aspectRatio?: number;
  disableFlip?: boolean;
}

export function CameraScanner({
  onScanSuccess,
  onScanError,
  fps = 10,
  qrbox = 250,
  aspectRatio = 1.0,
  disableFlip = false,
}: CameraScannerProps) {
  const { language } = useLanguage();
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [status, setStatus] = useState<
    "idle" | "starting" | "scanning" | "stopping"
  >("idle");

  // Unique ID for the reader element
  const readerId = "qr-reader-container-stable";

  useEffect(() => {
    // Get available cameras
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          const formattedDevices = devices.map((dev) => ({
            id: dev.id,
            label:
              dev.label ||
              `${language === "id" ? "Kamera" : "Camera"} ${devices.indexOf(dev) + 1}`,
          }));
          setCameras(formattedDevices);
          setSelectedCamera(formattedDevices[0].id);
        } else {
          setError(
            language === "id"
              ? "Tidak ada kamera yang ditemukan di perangkat ini."
              : "No camera found on this device.",
          );
        }
      })
      .catch((err) => {
        console.error("Error getting cameras", err);
        setError(
          language === "id"
            ? "Izin kamera belum diberikan atau kamera tidak didukung."
            : "Camera permission is not granted or camera is unsupported.",
        );
      });

    return () => {
      // Cleanup on unmount
      if (scannerRef.current) {
        const scanner = scannerRef.current;
        if (scanner.isScanning) {
          scanner
            .stop()
            .then(() => {
              try {
                scanner.clear();
              } catch (e) {
                /* ignore */
              }
            })
            .catch((err) => {
              console.warn("Cleanup error during unmount:", err);
            });
        } else {
          try {
            scanner.clear();
          } catch (e) {
            /* ignore */
          }
        }
      }
    };
  }, [language]);

  const startScanning = async () => {
    if (!selectedCamera || status !== "idle") return;

    try {
      setError(null);
      setStatus("starting");

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(readerId, {
          verbose: false,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
          ],
        });
      }

      await scannerRef.current.start(
        selectedCamera,
        {
          fps,
          qrbox,
          aspectRatio,
          disableFlip,
        },
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        (errorMessage) => {
          if (onScanError) onScanError(errorMessage);
        },
      );
      setStatus("scanning");
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.warn("Camera start interrupted.");
        setStatus("idle");
        return;
      }
      console.error("Failed to start scanning", err);
      setError(
        err.message ||
          (language === "id"
            ? "Gagal memulai kamera"
            : "Failed to start camera"),
      );
      setStatus("idle");
    }
  };

  const handleScanSuccess = async (decodedText: string) => {
    if (!scannerRef.current || !scannerRef.current.isScanning) return;

    setStatus("stopping");

    try {
      await scannerRef.current.stop();
      try {
        scannerRef.current.clear();
      } catch (e) {
        /* ignore */
      }
      onScanSuccess(decodedText);
    } catch (err) {
      console.warn("Error stopping after success:", err);
      onScanSuccess(decodedText);
    } finally {
      setStatus("idle");
    }
  };

  const stopScanning = async () => {
    if (!scannerRef.current || status !== "scanning") return;

    setStatus("stopping");
    try {
      await scannerRef.current.stop();
      try {
        scannerRef.current.clear();
      } catch (e) {
        /* ignore */
      }
    } catch (err: any) {
      if (err.message && err.message.includes("removeChild")) {
        console.warn("Handled common removeChild race condition.");
      } else {
        console.error("Failed to stop scanning", err);
      }
    } finally {
      setStatus("idle");
    }
  };

  const toggleScanning = () => {
    if (status === "scanning") {
      stopScanning();
    } else if (status === "idle") {
      startScanning();
    }
  };

  return (
    <Stack gap="md">
      {/* Inject CSS to handle library's internal DOM structure and ensure visibility */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
                #${readerId} video {
                    width: 100% !important;
                    height: 100% !important;
                    min-height: 300px !important;
                    object-fit: cover !important;
                    border-radius: 8px;
                    display: block !important;
                }
                #${readerId}__scan_region {
                    background: transparent !important;
                }
                #${readerId}__dashboard {
                    display: none !important;
                }
                #${readerId} {
                    border: none !important;
                    width: 100% !important;
                }
            `,
        }}
      />

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} color="red">
          {error}
        </Alert>
      )}

      {cameras.length > 1 && status === "idle" && (
        <Select
          label={language === "id" ? "Pilih Kamera" : "Select Camera"}
          placeholder={language === "id" ? "Pilih kamera" : "Select camera"}
          data={cameras.map((c) => ({ value: c.id, label: c.label }))}
          value={selectedCamera}
          onChange={setSelectedCamera}
          leftSection={<IconCamera size={16} />}
        />
      )}

      <Box
        style={{
          width: "100%",
          minHeight: "300px",
          backgroundColor: "#000",
          borderRadius: "8px",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* The scanner will attach to this div. Keep it rendered but manage visibility. */}
        <div
          id={readerId}
          style={{
            width: "100%",
            height: "100%",
            minHeight: "300px",
            position:
              status === "scanning" || status === "stopping"
                ? "relative"
                : "absolute",
            opacity: status === "scanning" || status === "stopping" ? 1 : 0,
            zIndex: status === "scanning" || status === "stopping" ? 1 : -1,
            pointerEvents:
              status === "scanning" || status === "stopping" ? "auto" : "none",
          }}
        />

        {/* Placeholder UI managed by React */}
        {(status === "idle" || status === "starting") && (
          <Center h={300}>
            <Stack align="center" gap="xs">
              {status === "starting" ? (
                <Loader size="lg" />
              ) : (
                <ThemeIcon size={60} radius="xl" color="gray.2">
                  <IconCamera size={30} color="gray" />
                </ThemeIcon>
              )}
              <Text c="dimmed">
                {status === "starting"
                  ? language === "id"
                    ? "Memulai kamera..."
                    : "Starting camera..."
                  : language === "id"
                    ? "Pratinjau Kamera"
                    : "Camera Preview"}
              </Text>
            </Stack>
          </Center>
        )}

        {status === "stopping" && (
          <Center
            h={300}
            pos="absolute"
            top={0}
            left={0}
            w="100%"
            style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 10 }}
          >
            <Stack align="center" gap="xs">
              <Loader size="sm" color="white" />
              <Text c="white">
                {language === "id"
                  ? "Memproses hasil scan..."
                  : "Processing scan result..."}
              </Text>
            </Stack>
          </Center>
        )}
      </Box>

      <Center>
        <Button
          onClick={toggleScanning}
          color={status === "scanning" ? "red" : "blue"}
          loading={status === "starting" || status === "stopping"}
          leftSection={
            status === "scanning" ? (
              <IconAlertCircle size={18} />
            ) : (
              <IconCamera size={18} />
            )
          }
          size="lg"
        >
          {status === "scanning"
            ? language === "id"
              ? "Hentikan Kamera"
              : "Stop Camera"
            : language === "id"
              ? "Mulai Kamera"
              : "Start Camera"}
        </Button>
      </Center>
    </Stack>
  );
}
