import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../../../context/auth";

export default function DashboardIndex() {
  const { role, isReady } = useAuth();

  useEffect(() => {
    if (!isReady) return;

    if (role) {
      router.replace({ pathname: `/dashboard/${role}` as any });
    } else {
      router.replace("/(app)/dashboard/athlete");
    }
  }, [role, isReady]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#C4161C" />
    </View>
  );
}
