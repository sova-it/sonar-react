import api from "@/lib/api";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../../context/auth";

import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import {
  Image,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface UpcomingEvent {
  id: number;
  title: string;
  date: string;
  time: string;
  image: any;
  sport?: string;
  start_time?: string;
  end_time?: string;
}

interface ActionButton {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  localImage?: any;
}

interface NavigationButton {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
  localImage?: any;
}

const sportConfig: Record<string, any> = {
  running: { icon: "run" },
  bowling: { icon: "bowling" },
  swimming: { icon: "swim" },
  softball: { icon: "baseball" },
  tennis: {
    image: require("../../../assets/images/tennispixel.png"),
  },
};

const getSportKey = (sport?: string) =>
  sport?.toLowerCase().includes("tennis")
    ? "tennis"
    : sport?.toLowerCase().includes("swim")
      ? "swimming"
      : sport?.toLowerCase().includes("bowl")
        ? "bowling"
        : sport?.toLowerCase().includes("run")
          ? "running"
          : sport?.toLowerCase().includes("soft")
            ? "softball"
            : "running";

const AthleteDashboard = () => {
  const { userData, isReady, role, userId } = useAuth();
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  useEffect(() => {
    if (!isReady) return;

    if (!role) {
      return;
    }

    const normalizedRole = role.toLowerCase();

    if (normalizedRole === "admin") {
      router.replace("/(app)/dashboard/admin");
    } else if (normalizedRole === "volunteer") {
      router.replace("/(app)/dashboard/volunteer");
    } else if (normalizedRole === "coordinator") {
      router.replace("/(app)/dashboard/coordinator");
    }
  }, [role, isReady]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.get(`/users/${userId}/events`);

        const defaultImageUrl =
          "https://api.builder.io/api/v1/image/assets/TEMP/d657c7793a39131a1442e864a26a553b086c478b?width=720";

        const events = Array.isArray(response.data)
          ? response.data
          : response.data?.events || [];

        const computeStatus = (item: any) => {
          const startRaw = item.start_time ?? item.startTime;
          const endRaw = item.end_time ?? item.endTime;

          if (!startRaw) return "upcoming";

          const startTs = Date.parse(startRaw);
          const endTs = endRaw ? Date.parse(endRaw) : NaN;
          const now = Date.now();

          if (isNaN(startTs)) return "upcoming";

          if (!isNaN(endTs)) {
            if (now < startTs) return "upcoming";
            if (now > endTs) return "completed";
            return "ongoing";
          }

          return startTs < now ? "completed" : "upcoming";
        };

        const normalize = (ev: any) => ({
          ...ev,
          id: String(ev._id || ev.id),
          title: ev.title,
          image: ev.imageUrl || defaultImageUrl,
          status: computeStatus(ev),
          sport: ev.sport || ev.title,
          start_time: ev.start_time || ev.startTime,
          end_time: ev.endTime || ev.end_time,
          date: new Date(ev.start_time || ev.startTime).toLocaleDateString(
            "en-US",
            { year: "numeric", month: "long", day: "numeric" },
          ),
          time: new Date(ev.start_time || ev.startTime).toLocaleTimeString(
            "en-US",
            { hour: "numeric", minute: "numeric", hour12: true },
          ),
        });

        const upcomingOnly = events
          .map(normalize)
          .filter((ev: any) => ev.status?.toLowerCase() === "upcoming")
          .sort(
            (a: any, b: any) =>
              new Date(a.start_time || 0).getTime() -
              new Date(b.start_time || 0).getTime(),
          )
          .slice(0, 5);

        setUpcomingEvents(upcomingOnly);
      } catch (err) {
        console.error(err);
      }
    };

    fetchEvents();
  }, [userId]);

  const initials =
    `${userData?.first_name?.[0] ?? ""}${userData?.last_name?.[0] ?? ""}`.toUpperCase();

  const openDetails = (e: UpcomingEvent) => {
    router.push({
      pathname: "/(app)/dashboard/event-details",
      params: {
        id: String(e.id),
        title: e.title ?? "",
        sport: e.sport ?? "",
        start_time: e.start_time ?? "",
        end_time: e.end_time ?? "",
      },
    });
  };

  const actionButtons: ActionButton[] = [];

  const navigationButtons: NavigationButton[] = [
    {
      icon: "map",
      localImage: require("../../../assets/images/map.png"),
      label: "Map",
      onPress: () => router.push("./map"),
    },
    {
      icon: "emoji-events",
      localImage: require("../../../assets/images/results.png"),
      label: "Results",
      onPress: () => router.push("/(app)/results/event-selection" as any),
    },
  ];

  const TennisIcon = () => (
    <Image
      source={require("../../../assets/images/tennispixel.png")}
      style={styles.tennisIconImage}
    />
  );

  const EventCard = ({
    event,
    onPress,
  }: {
    event: UpcomingEvent;
    onPress: () => void;
  }) => (
    <Pressable style={styles.eventCard} onPress={onPress}>
      <Image source={event.image} style={styles.eventImage} />
      <View style={styles.eventContent}>
        <View style={styles.eventHeader}>
          {(() => {
            const sportKey = getSportKey(event.sport);
            const config = sportConfig[sportKey];

            return config.image ? (
              <Image source={config.image} style={styles.tennisIconImage} />
            ) : (
              <MaterialCommunityIcons
                name={config.icon}
                size={45}
                color="#C4161C"
                style={{ marginRight: 12 }}
              />
            );
          })()}

          <View style={styles.eventTitleContainer}>
            <Text style={styles.eventTitle}>{event.title}</Text>
          </View>
        </View>
        <View style={styles.eventDetails}>
          <Text style={styles.eventDate}>{event.date}</Text>
          <Text style={styles.eventTime}>{event.time}</Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#C4161C" />

      <View style={styles.topBanner}>
        <View style={styles.headerContent}>
          <View style={styles.headerSpacer} />
          <Text style={styles.headerTitle}>Athlete Homepage</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={() => {
                if (userData) {
                  router.push("../profile");
                } else {
                  router.push("/login");
                }
              }}
            >
              <View style={styles.profileInitials}>
                {userData ? (
                  <Text style={styles.profileText}>{initials}</Text>
                ) : (
                  <Ionicons name="person-outline" size={18} color="#000000" />
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  topBanner: {
    backgroundColor: "#C4161C",
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerSpacer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
  },
  headerRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  profileInitials: {
    width: 40,
    height: 40,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  profileText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
  },
  scrollContainer: {
    flex: 1,
  },
  notificationBanner: {
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#C4161C",
  },
  notificationContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  notificationText: {
    fontSize: 14,
    color: "#BF1818",
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  buttonGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  actionButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    flex: 1,
  },
  navigationButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    flex: 1,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: "400",
    color: "#000000",
    marginTop: 8,
    textAlign: "center",
  },
  navigationButtonLabel: {
    fontSize: 18,
    fontWeight: "400",
    color: "#000000",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#870005",
    marginBottom: 24,
  },
  eventsContainer: {
    gap: 16,
  },
  eventCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventImage: {
    width: 124,
    height: 114,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  eventContent: {
    flex: 1,
    padding: 8,
    paddingLeft: 16,
  },
  eventHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  tennisIconContainer: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  tennisIcon: {
    width: 40,
    height: 40,
    backgroundColor: "#C4161C",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  tennisBall: {
    width: 24,
    height: 24,
    backgroundColor: "#FFD700",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  tennisBallLine: {
    width: 20,
    height: 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 1,
  },
  eventTitleContainer: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
    lineHeight: 24,
  },
  eventDetails: {
    marginLeft: 60,
    gap: 4,
  },
  eventDate: {
    fontSize: 18,
    fontWeight: "400",
    color: "#000000",
  },
  eventTime: {
    fontSize: 18,
    fontWeight: "400",
    color: "#000000",
  },
  bottomSpacing: {
    height: 120,
  },
  bottomNavContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  profilePictureOverlay: {
    alignItems: "center",
    marginBottom: -40,
    zIndex: 10,
  },
  profilePicture: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  profileImage: {
    width: 72,
    height: 72,
  },
  bottomNav: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 24,
    paddingBottom: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  navContent: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  navButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  navSpacer: {
    width: 80,
  },
  navLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#C4161C",
    marginTop: 4,
  },
  tennisIconImage: {
    width: 48,
    height: 48,
    resizeMode: "contain",
    marginRight: 12,
  },
  checkInContainer: {
    paddingHorizontal: 40,
    paddingTop: 28,
    marginBottom: 4,
  },
  checkInTitle: {
    fontSize: 20,
    fontWeight: "400",
    color: "#000",
    marginBottom: 18,
    marginLeft: 8,
  },
  checkInButton: {
    backgroundColor: "#C4161C",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignSelf: "flex-start",
    marginLeft: 8,
  },
  checkInButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  noEventsContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    marginTop: 8,
  },
  noEventsText: {
    fontSize: 16,
    color: "#666",
    marginTop: 12,
  },
});

export default AthleteDashboard;
