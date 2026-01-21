import { useAuth } from "../../../context/auth";
import { useEffect } from "react";
import { router } from "expo-router";
import { View, ActivityIndicator } from "react-native";

export default function DashboardIndex() {
  const { role, isReady } = useAuth();

  useEffect(() => {
    if (!isReady) return;

    if (role) {
      router.replace({ pathname: `/dashboard/${role}` as any });
    } else {
      router.replace("/login");
    }
  }, [role, isReady]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#C4161C" />
    </View>
  );
}
