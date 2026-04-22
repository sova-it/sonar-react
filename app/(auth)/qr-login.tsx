import api from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { Buffer } from "buffer";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { decode as decodeJpeg } from "jpeg-js";
import jsQR from "jsqr";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "../../context/auth";

type Phase = "idle" | "loading" | "confirm" | "error";

export default function QrLogin() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [resultMessage, setResultMessage] = useState<string>("");

  const { setAuth } = useAuth();

  const tRef1 = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tRef2 = useRef<ReturnType<typeof setTimeout> | null>(null);

  const extractQRFromImage = async (uri: string): Promise<string | null> => {
    try {
      // 1. Resize + convert to JPEG + get base64
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 500 } }], // smaller = faster, 500px is enough for QR
        {
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
          compress: 0.9,
        },
      );

      if (!manipulated.base64) return null;

      // 2. Decode base64 JPEG → raw RGBA pixel data
      const rawBytes = Buffer.from(manipulated.base64, "base64");
      const { data, width, height } = decodeJpeg(rawBytes, {
        useTArray: true, // returns Uint8Array instead of Buffer
      });

      // 3. jsQR expects Uint8ClampedArray
      const clampedData = new Uint8ClampedArray(data.buffer);

      // 4. Decode QR
      const result = jsQR(clampedData, width, height, {
        inversionAttempts: "attemptBoth", // handles inverted QR codes too
      });

      return result?.data ?? null;
    } catch (err) {
      console.warn("QR extraction failed:", err);
      return null;
    }
  };

  const handleUploadQR = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (res.canceled) return;

      setPhase("loading");

      const image = res.assets[0];
      const qrValue = await extractQRFromImage(image.uri);

      if (!qrValue) {
        setResultMessage("Could not read QR code from image.");
        setPhase("error");
        return;
      }

      const response = await api.post("/auth/qr-login", {
        qr_value: qrValue,
      });

      const result = response.data;

      await setAuth({
        role: result.user.role,
        userId: result.user.id,
        userData: result.user,
        token: result.session_token || "qr-temp-token",
      });

      setResultMessage("Logged in successfully");
      setPhase("confirm");

      setTimeout(() => {
        router.replace("/dashboard");
      }, 2000);
    } catch (err) {
      setResultMessage("Could not process image.");
      setPhase("error");
    }
  };

  const onBarcodeScanned = useCallback(
    async ({ data }: { data: string; type: string }) => {
      if (scanned || phase !== "idle") return;

      setScanned(true);
      setPhase("loading");
      setResultMessage("");

      try {
        const res = await api.post("/auth/qr-login", {
          qr_value: data,
        });

        const result = res.data;

        await setAuth({
          role: result.user.role,
          userId: result.user.id,
          userData: result.user,
          token: result.session_token || "qr-temp-token",
        });

        tRef1.current = setTimeout(() => {
          setResultMessage("Logged in successfully");
          setPhase("confirm");
        }, 2000);

        tRef2.current = setTimeout(() => {
          router.replace("/dashboard");
        }, 2200);
      } catch (err: any) {
        let message = "Could not log in. Please try again.";

        switch (err?.response?.status) {
          case 401:
            message = "Invalid QR code.";
            break;
          case 500:
            message = "The website has encountered an error.";
            break;
          case 403:
            message = "Account locked or disabled.";
            break;
          case 408:
          case 504:
            message = "Request timed out. Please try again.";
            break;
          case 503:
            message =
              "Service temporarily unavailable. Please try again later.";
            break;
        }

        tRef1.current = setTimeout(() => {
          setResultMessage(message);
          setPhase("error");
        }, 2000);
      }
    },
    [scanned, phase, setAuth],
  );

  useEffect(() => {
    return () => {
      if (tRef1.current) clearTimeout(tRef1.current);
      if (tRef2.current) clearTimeout(tRef2.current);
    };
  }, []);

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Checking camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Allow Camera Access</Text>
        <Text style={styles.subtitle}>
          We need your permission to use the camera for scanning QR codes.
        </Text>
        <Pressable onPress={requestPermission} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Grant Permission</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} style={styles.secondaryBtn}>
          <Text style={styles.secondaryBtnText}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  const goBack = () => router.back();

  const resetAndRescan = () => {
    setScanned(false);
    setPhase("idle");
    setResultMessage("");
  };

  const showCamera = phase === "idle";

  return (
    <View style={styles.container}>
      {showCamera && (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={onBarcodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        />
      )}

      <View style={styles.topBar}>
        <Pressable onPress={goBack} style={styles.iconBtn}>
          <Ionicons name="close" size={28} color="#fff" />
        </Pressable>
        <Text style={styles.header}>QR Login</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.focusBoxContainer} pointerEvents="none">
        <View style={styles.focusBox} />
        <Text style={styles.helperText}>
          Align the QR code within the frame
        </Text>
      </View>

      {phase === "loading" && (
        <View style={styles.overlay} pointerEvents="none">
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Logging in...</Text>
        </View>
      )}

      {phase === "confirm" && (
        <View style={styles.overlay} pointerEvents="auto">
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Logged In</Text>
            <Text style={styles.cardSubtitle}>{resultMessage}</Text>

            <Pressable
              style={[styles.secondaryBtn, { marginTop: 12 }]}
              onPress={goBack}
            >
              <Text style={styles.secondaryBtnText}>Back</Text>
            </Pressable>
          </View>
        </View>
      )}

      {phase === "error" && (
        <View style={styles.overlay} pointerEvents="auto">
          <View style={styles.card}>
            <Text style={[styles.cardTitle, { color: "#ff4d4d" }]}>Error</Text>
            <Text style={styles.cardSubtitle}>{resultMessage}</Text>

            <Pressable
              style={[styles.primaryBtn, { marginTop: 16 }]}
              onPress={resetAndRescan}
            >
              <Text style={styles.primaryBtnText}>Scan Again</Text>
            </Pressable>

            <Pressable
              style={[styles.secondaryBtn, { marginTop: 12 }]}
              onPress={goBack}
            >
              <Text style={styles.secondaryBtnText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      )}

      <View style={styles.bottomContainer}>
        <Pressable style={styles.uploadBtn} onPress={handleUploadQR}>
          <Ionicons name="image-outline" size={20} color="#fff" />
          <Text style={styles.uploadText}>Upload QR Code</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  topBar: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  header: { fontSize: 18, fontWeight: "700", color: "#fff" },
  focusBoxContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  focusBox: {
    width: 260,
    height: 260,
    borderWidth: 2,
    borderColor: "#fff",
    borderRadius: 16,
  },
  helperText: { marginTop: 16, color: "#fff" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#0b0b0b",
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    color: "#cdcdcd",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  primaryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#C4161C",
    minWidth: 160,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  secondaryBtn: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#666",
    minWidth: 160,
    alignItems: "center",
  },
  secondaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 12,
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  card: {
    width: "85%",
    backgroundColor: "#121212",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    padding: 20,
    alignItems: "center",
  },
  cardTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 6,
  },
  cardSubtitle: {
    color: "#cdcdcd",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 6,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
  },

  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#666",
  },

  uploadText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
