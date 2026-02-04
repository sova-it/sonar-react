import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useAuth } from "../../../context/auth";

type Phase = "idle" | "loading" | "confirm" | "error";

export default function QrScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const { userId: performerId } = useAuth(); // person performing check-in
  const { subevent_id } = useLocalSearchParams<{ subevent_id?: string }>();

  const [scanned, setScanned] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [scannedUserId, setScannedUserId] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<string>("");

  const tRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const EVENT_ID = "6877b78987459c2e6d0409e7"; // Summer Games 2025

  const onBarcodeScanned = useCallback(
    async ({ data }: { data: string; type: string }) => {
      if (scanned || phase !== "idle") return;

      setScanned(true);
      setPhase("loading");
      setResultMessage("");
      setScannedUserId(data);

      const isSubevent = !!subevent_id;
      const endpoint = isSubevent
        ? "/api/checkins/subevent"
        : "/api/checkins/event";

      const body = {
        type_id: isSubevent ? "subevent" : "event",
        event_id: EVENT_ID,
        subevent_id: isSubevent ? subevent_id : null,
        task_id: null,
        user_id: data,
        checkin_time: new Date().toISOString(),
        checkout_time: null,
        method: "QR",
        by: performerId,
        meta: null,
        updated_at: null,
      };

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const json = await res.json().catch(() => ({}));
        console.log("📡 Check-in response:", res.status, json);

        // show loading spinner for ~2 seconds before revealing result
        tRef.current = setTimeout(() => {
          if (res.status === 201 || res.status === 200) {
            setResultMessage(json?.message || "Checked in successfully");
            setPhase("confirm");
          } else {
            setResultMessage(
              json?.detail ||
                json?.message ||
                "Error checking in. Please try again."
            );
            setPhase("error");
          }
        }, 2000);
      } catch (err: any) {
        console.error("❌ Network / fetch error:", err);
        setTimeout(() => {
          setResultMessage("Network error while checking in.");
          setPhase("error");
        }, 2000);
      }
    },
    [scanned, phase, performerId, subevent_id]
  );

  useEffect(() => {
    return () => {
      if (tRef.current) clearTimeout(tRef.current);
    };
  }, []);

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Checking camera permission…</Text>
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
    setScannedUserId(null);
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
        <Pressable
          onPress={goBack}
          style={styles.iconBtn}
          accessibilityLabel="Close scanner"
        >
          <Ionicons name="close" size={28} color="#fff" />
        </Pressable>
        <Text style={styles.header}>Scan a QR Code</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.focusBoxContainer} pointerEvents="none">
        <View style={styles.focusBox} />
        <Text style={styles.helperText}>Align the QR code within the frame</Text>
      </View>

      {phase === "loading" && (
        <View style={styles.overlay} pointerEvents="none">
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Checking in…</Text>
        </View>
      )}

      {phase === "confirm" && (
        <View style={styles.overlay} pointerEvents="auto">
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Checked In ✅</Text>
            <Text style={styles.cardSubtitle}>{resultMessage}</Text>

            <Pressable
              style={[styles.primaryBtn, { marginTop: 16 }]}
              onPress={resetAndRescan}
            >
              <Text style={styles.primaryBtnText}>Scan Next</Text>
            </Pressable>

            <Pressable
              style={[styles.secondaryBtn, { marginTop: 12 }]}
              onPress={goBack}
            >
              <Text style={styles.secondaryBtnText}>Done</Text>
            </Pressable>
          </View>
        </View>
      )}

      {phase === "error" && (
        <View style={styles.overlay} pointerEvents="auto">
          <View style={styles.card}>
            <Text style={[styles.cardTitle, { color: "#ff4d4d" }]}>Error ❌</Text>
            <Text style={styles.cardSubtitle}>{resultMessage}</Text>

            <Pressable
              style={[styles.primaryBtn, { marginTop: 16 }]}
              onPress={resetAndRescan}
            >
              <Text style={styles.primaryBtnText}>Try Again</Text>
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
  cardDetails: {
    color: "#808080",
    fontSize: 12,
    textAlign: "center",
  },
});
