import { router } from "expo-router";
import React from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useAuth } from "../../context/auth";

const screenWidth = Dimensions.get("window").width;

const ProfileScreen = () => {
  const { userData, role, userId, isReady, clearAuth } = useAuth();

  const fullName = userData?.name || "";
  const nameParts = fullName.split(" ");

  const firstName = userData?.first_name || nameParts[0] || "";
  const lastName = userData?.last_name || nameParts[1] || "";

  const initials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase();

  const handleLogout = () => {
    clearAuth();
    router.push("/");
  };

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!userData) {
    router.replace("/(app)/dashboard/athlete");
    return null;
  }

  const renderField = (label: string, value: string) => (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.value}>{value || "N/A"}</Text>
    </View>
  );

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.container}
    >
      <View style={styles.headerBackground}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.replace({ pathname: `/dashboard/` as any })}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
          <View style={{ width: 50 }} />
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.headerWrapper}>
          <View style={styles.cardBackground} />

          <View style={[styles.avatar, styles.initialsCircle]}>
            <Text style={styles.initialsText}>{initials}</Text>
          </View>

          <Text style={styles.nameText}>
            {firstName || "Unknown"} {lastName}
          </Text>

          <Text style={styles.roleText}>
            ({userData.pronouns || ""}) | {userData.role || ""}
          </Text>

          <Text style={styles.memberId}>
            Member ID: {userData.member_id || userData.id || ""}
          </Text>
        </View>

        <View style={styles.qrcode}>
          <QRCode
            value={userId ?? "null"}
            size={200}
            color="#000000ff"
            backgroundColor="#fff"
          />
        </View>

        <Text style={styles.sectionTitle}>Personal Information</Text>

        {renderField("First Name", firstName)}
        {renderField("Last Name", lastName)}
        {renderField("Phone Number", userData.phone || "")}
        {renderField("Email", userData.email || "")}
        {renderField("Pronouns", userData.pronouns || "")}

        {role === "guardian" &&
          renderField("Linked Athlete ID", userData.linked_athlete_id || "")}

        {role === "athlete" && (
          <>
            {renderField("Linked Athlete ID", userData.linked_athlete_id || "")}
            {renderField("Linked Guardian ID", userData.guardian_id || "")}
            {renderField("Guardian Name", userData.guardian_name || "")}
            {renderField("Date of Birth", userData.dob || "")}
            {renderField("Medical Info", userData.medical_info || "")}
            {renderField(
              "Emergency Contact Name",
              userData.emergency_contact_name || "",
            )}
            {renderField(
              "Emergency Contact Number",
              userData.emergency_contact_phone || "",
            )}
          </>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 20,
    paddingTop: 0,
    backgroundColor: "#FFF",
  },
  headerWrapper: {
    alignItems: "center",
    marginBottom: 30,
    backgroundColor: "#FFF",
    paddingBottom: 20,
  },
  headerBackground: {
    backgroundColor: "#FFF",
    width: screenWidth,
    paddingVertical: 20,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  cardBackground: {
    backgroundColor: "#C4161C",
    width: "100%",
    height: 138,
    borderRadius: 14,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
  },
  backText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginTop: -50,
    backgroundColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  initialsCircle: {
    backgroundColor: "#FFFFFF",
  },
  initialsText: {
    color: "#000000",
    fontSize: 32,
    fontWeight: "bold",
  },
  nameText: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 12,
  },
  roleText: {
    fontSize: 16,
    marginVertical: 4,
  },
  memberId: {
    fontSize: 14,
    color: "gray",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderBottomWidth: 4,
    borderBottomColor: "#C4161C",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardLabel: {
    fontWeight: "bold",
    marginBottom: 6,
    color: "#000",
  },
  value: {
    fontSize: 16,
    color: "#000",
  },
  logoutButton: {
    marginTop: 30,
    paddingVertical: 12,
    backgroundColor: "#888",
    borderRadius: 8,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  qrcode: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 50,
  },
});
