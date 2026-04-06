import api from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast, { ToastType } from "../(app)/results/components/Toast";
import { useAuth } from "../../context/auth"; // make sure this path is correct
export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  //Toast props
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<ToastType>("success");
  const [toastDuration, setToastDuration] = useState(3000);
  const { setAuth } = useAuth(); // 👈 get setRole from context
  const showToast = (message: string, type: ToastType, duration?: number) => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
    setToastDuration(duration || 3000);
  };
  const goToQrLogin = () => {
    router.push("/qr-login");
  };
  const handleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/login", {
        email: email.trim(),
        password,
      });

      const { user_id, role } = res.data;

      // Fetch full user info
      const userRes = await api.get(`/users/${user_id}`);
      const userData = userRes.data.user;

      await setAuth({ role, userId: user_id, userData });

      router.replace("/dashboard");
    } catch (err: any) {
      switch (err?.response?.status) {
        case 401:
          showToast("Error: Wrong username/password", "login");
          break;
        case 500:
          showToast("Error: The website has encountered an error", "login");
          break;
        case 403:
          showToast("Error: Account locked or disabled", "login");
          break;
        case 408:
        case 504:
          showToast("Error: Request timed out. Please try again", "login");
          break;
        case 503:
          showToast(
            "Error: Service temporarily unavailable. Please try again later.",
            "login",
          );
          break;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
        duration={toastDuration}
      />
      <View style={styles.backRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      <Image
        source={require("../../assets/images/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Sign in</Text>
      <TextInput
        placeholder="Email"
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        onChangeText={setEmail}
        value={email}
      />
      <TextInput
        placeholder="Password"
        style={styles.input}
        secureTextEntry
        onChangeText={setPassword}
        value={password}
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>
      <View style={styles.dividerContainer}>
        <View style={styles.line} />
        <Text style={styles.orText}>OR</Text>
        <View style={styles.line} />
      </View>

      <TouchableOpacity style={styles.secondaryButton} onPress={goToQrLogin}>
        <Text style={styles.secondaryButtonText}>QR Login</Text>
      </TouchableOpacity>
    </View>
  );
}

// Styling for the login screen components
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#C4161C",
    justifyContent: "center",
    padding: 24,
  },
  logo: {
    width: 120,
    height: 120,
    alignSelf: "center",
    marginBottom: 40,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 14,
    marginTop: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#C4161C",
    fontWeight: "bold",
    fontSize: 16,
  },
  backRow: {
    position: "absolute",
    top: 30,
    left: 20,
    zIndex: 10,
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: "#fff",
    borderRadius: 8,
    padding: 14,
    marginTop: 12,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  secondaryButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#fff",
  },
  orText: {
    marginHorizontal: 10,
    color: "#fff",
    fontWeight: "bold",
  },
});
