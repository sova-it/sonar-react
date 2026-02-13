import api from "@/lib/api";
import { router } from "expo-router";
import React, { useState } from "react";
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../context/auth"; // make sure this path is correct

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { setAuth } = useAuth(); // 👈 get setRole from context

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
      setError(err?.response?.data?.detail || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require("../../assets/images/logo.png")} style={styles.logo} resizeMode="contain" />
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
});




