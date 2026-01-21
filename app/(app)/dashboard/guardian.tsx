import React, { useEffect } from "react";
import { router } from "expo-router";
import { useAuth } from "../../../context/auth";

import { View, Text, StyleSheet } from "react-native";

export default function GuardianDashboard() {
  const { userData, isReady , role  } = useAuth(); // Mk role update
  
  
  useEffect(() => {
    if (isReady && role !== "guardian") {
      router.replace("/login");
    }
  }, [isReady, role]);

  if (!isReady) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome Guardian! This is your dashboard.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 18, fontWeight: "bold" },
});
