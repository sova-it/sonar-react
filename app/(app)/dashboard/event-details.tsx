import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import api from "@/lib/api";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    FlatList,
    Image,
    ImageSourcePropType,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { useAuth } from "../../../context/auth";
type SportConf =
  | { label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; image?: never }
  | { label: string; image: ImageSourcePropType; icon?: never };

const sportConfig: Record<string, SportConf> = {
  running:  { label: "Athletics", icon: "run" },
  bowling:  { label: "Bowling",   icon: "bowling" },
  swimming: { label: "Swimming",  icon: "swim" },
  softball: { label: "Softball",  icon: "baseball" },
  tennis:   { label: "Tennis",    image: require("../../../assets/images/tennispixel.png") },
};

function fmtDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(+d) ? "" : d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}
function fmtTime(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(+d) ? "" : d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export default function EventDetails() {
  const { userData } = useAuth();
  const [selectedRole, setSelectedRole] = useState("All Roles");
  //Filtering by role
  const roles = ["All Roles", "Admin", "Coordinator", "Volunteer", "Athlete", "Guardian"];
  const {id,title = "", sport = "", start_time, end_time, role = "" } =
    useLocalSearchParams<{ id: string; title?: string; sport?: string; start_time?: string; end_time?: string; role?: string }>();
  const [participants, setParticipants] = useState<any[]>([]);
  //Fetch participants depending on event type
  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const response = await api.get('/subevents/' + id + '/participants');
        
        setParticipants(response.data.items||[])
      } catch(error:any){
        if (error.response && error.response.status === 404) {
            try{
              const response2 = await api.get('/events/' + id + '/participants');
              setParticipants(response2.data.items||[]);
            }catch(error2){
              console.log(error2);
              setParticipants([]);
            }
        }else {
          console.log(error);
          setParticipants([]);
        }
      } 
    };
    fetchParticipants();
  }, [id])
  
  
    const handleRoleSelection = (role: string) => {
  setSelectedRole(role);
  };
  const filteredParticipants = useMemo(() => {
  return participants?.filter((participant) => {
    if (selectedRole === "All Roles") {
      return true;
    }
    return participant.role.toLowerCase() === selectedRole.toLowerCase();
  }) ?? [];
}, [participants, selectedRole]);
  const initials = `${userData?.first_name?.[0] ?? ""}${userData?.last_name?.[0] ?? ""}`.toUpperCase();

  

  const conf: SportConf =
    sportConfig[(sport || "").toLowerCase()] ?? ({ label: sport || "Sport", icon: "trophy" } as const);
  const date = fmtDate(start_time);
  const start = fmtTime(start_time);
  const end = fmtTime(end_time);

  const eventsImage = require("../../../assets/images/events.png");

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#C4161C" />

      <View style={styles.topBanner}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={styles.headerLeft}>
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Upcoming Event</Text>

          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => router.push("../profile")}>
              <View style={styles.profileInitials}>
                <Text style={styles.profileText}>{initials}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 140 }}>
        <Text style={styles.sportLabel}>{conf.label}</Text>

        <View style={styles.titleRow}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.title}>{title || "Event"}</Text>
            {(userData?.role ?? "").toLowerCase() !== "athlete" && (
            <TouchableOpacity
              onPress={() => router.push(`/(app)/dashboard/QRScanner?subevent_id=${id}`)}
              style={{ marginTop: 8, alignSelf: "flex-start" }}
              accessibilityLabel="Open scanner for this subevent"
            >
              <MaterialIcons name="qr-code-scanner" size={28} color="#A22723" />
            </TouchableOpacity>
            )}
          </View>
          {"image" in conf ? (
            <Image source={conf.image} style={{ width: 110, height: 125, resizeMode: "contain" }} />
          ) : (
            <MaterialCommunityIcons name={conf.icon} size={80} color="#C4161C" />
          )}
        </View>

        {!!role && (
          <Text style={styles.roleText}>
            <Text style={{ color: "#A22723" }}>Assigned role:</Text>
            <Text style={{ color: "#A22723", fontWeight: "700" }}> {role}</Text>
          </Text>
        )}

        {!!date && <Text style={styles.metaLine}>{date}</Text>}

        {(start || end) && (
          <Text style={styles.metaLine}>
            {start}
            {start && end ? "–" : ""}
            {end}
          </Text>
        )}

        <Text style={styles.participantHeader}>Participants</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roleFilterRow}>
          {roles.map((role) => (
            <TouchableOpacity
              key={role}
                style={[styles.roleButton, selectedRole === role && styles.roleButtonActive]}
                onPress={() => handleRoleSelection(role)}>
                  <Text style={selectedRole === role ? styles.roleTextActive : styles.roleText}>{role}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
        <View style={styles.bar} />
        <FlatList
          data={filteredParticipants}
          keyExtractor={(item) => item.memberId.toString()}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <View style={styles.userCard}>
              <View style={styles.avatarContainer}>
                <View style={[styles.avatar, { backgroundColor: "#ccc", justifyContent: "center", alignItems: "center" }]}>
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>
                    {item.firsName?.[0] ?? ""}{item.lastName?.[0] ?? ""}
                  </Text>
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <View style={styles.userHeader}>
                  <Text style={styles.userName}>{item.firstName} {item.lastName}</Text>
                  <Text style={styles.roleBadge}>{item.role.charAt(0).toUpperCase() + item.role.slice(1)}</Text>
                </View>
                <Text style={styles.userDetail}>{item.email}</Text>
                <Text style={styles.userDetail}>{item.phone}</Text>
              </View>

              {/* <Feather name="chevron-right" size={20} color="#C4161C" /> */}
            </View>
          )}
        />
  
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },

  topBanner: { backgroundColor: "#C4161C", paddingBottom: 16 },
  headerContent: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 16,
  },
  headerLeft: { width: 40, alignItems: "flex-start" },
  headerTitle: { fontSize: 20, fontWeight: "600", color: "#FFFFFF", textAlign: "center" },
  headerRight: { width: 40, alignItems: "flex-end" },
  profileInitials: {
    width: 40, height: 40, backgroundColor: "#FFFFFF", borderRadius: 20,
    alignItems: "center", justifyContent: "center",
  },
  profileText: { fontSize: 14, fontWeight: "600", color: "#000000" },

  content: { flex: 1, paddingHorizontal: 16, paddingTop: 18 },

  sportLabel: { color: "#6A6A6A", fontSize: 18, marginBottom: 8 },

  titleRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  title: { fontSize: 36, fontWeight: "800", color: "#A22723", lineHeight: 40 },

  roleText: { 
    color: "#333",
    fontSize: 12,},

  metaLine: { fontSize: 20, color: "#000000", marginTop: 10 },

  participantHeader: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 24,
    marginBottom: 10,
    color: "#000",
  },
  bar: {
    height: 8,
    backgroundColor: "#C4161C",
    borderRadius: 10,
    marginBottom: 12,
  },
  separator: {
    height: 1,
    backgroundColor: "#eee",
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 8,
  },roleFilterRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  roleButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#eee",
    marginRight: 8,
  },
  roleButtonActive: {
    backgroundColor: "#C4161C",
  },roleTextActive: {
    color: "#FFF",
    fontSize: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#C4161C",
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  userName: {
    fontWeight: "bold",
    color: "#000",
    marginRight: 8,
  },
  roleBadge: {
    backgroundColor: "#C4161C",
    color: "#FFF",
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: "hidden",
  },
  userDetail: {
    fontSize: 12,
    color: "#555",
  },

  bottomNavContainer: { position: "absolute", bottom: 0, left: 0, right: 0 },
  profilePictureOverlay: { alignItems: "center", marginBottom: -40, zIndex: 10 },
  profilePicture: {
    width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: "#FFFFFF", overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 8,
  },
  profileImage: { width: 72, height: 72, resizeMode: "cover" },

  bottomNav: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingTop: 24, paddingBottom: 24,
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 8,
  },
  navContent: { flexDirection: "row", justifyContent: "space-around", alignItems: "center", paddingHorizontal: 32 },
  navButton: { alignItems: "center", justifyContent: "center", padding: 8 },
  navSpacer: { width: 80 },
  navLabel: { fontSize: 12, fontWeight: "600", color: "#C4161C", marginTop: 4 },
});
