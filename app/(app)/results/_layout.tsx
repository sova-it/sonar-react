import { Stack } from "expo-router";

export default function ResultsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="event-selection" />
      <Stack.Screen name="track-field/entry-mode" />
      {/* Future: bowling, swimming, tennis screens */}
    </Stack>
  );
}