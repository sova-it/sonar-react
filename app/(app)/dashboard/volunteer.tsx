import React, { useEffect, useState } from "react";
import { router } from "expo-router";
import { useAuth } from "../../../context/auth";

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Pressable,
} from "react-native";
import {
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import axios from "axios";

interface UpcomingEvent {
  id: number;
  title: string;
  date: string;
  time: string;
  image: any;
  sport?: string;
  start_time?: string; // ISO or human-readable, whichever your details screen expects
  end_time?: string;   // ISO or human-readable, whichever your details screen expects
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

const VolunteerDashboard = () => {
  const { userData, isReady , role,userId  } = useAuth();
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  useEffect(() => {
    if (isReady && role !== "volunteer") {
      router.replace("/login");
    }
  }, [isReady, role]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading...</Text>
      </View>
    );
  }
  useEffect(() => 
    {
      const fetchEvents = async () => {

        try {
          const [response,response2] = await Promise.all([
            axios.get("http://127.0.0.1:8000/users/" + userId + "/events"),
            axios.get("http://127.0.0.1:8000/users/" + userId + "/subevents"),
        ]);

          console.log("Events response:", response.data);
          console.log("Subevents response:", response2.data);

          const defaultImageUrl = "https://api.builder.io/api/v1/image/assets/TEMP/d657c7793a39131a1442e864a26a553b086c478b?width=720";
          const events = Array.isArray(response.data?.events) ? response.data.events : [];
          const subevents = Array.isArray(response2.data?.subevents) ? response2.data.subevents : [];

          console.log("Events count:", events.length);
          console.log("Subevents count:", subevents.length);

          const normalizedEvents = events.map((ev: any) => {
            const computeStatus = (item: any) => {
              const startRaw = item.startTime ?? item.start_time;
              const endRaw = item.endTime ?? item.end_time;

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

            return {
              ...ev,
              id: String(ev._id || ev.id),
              title: ev.title,
              image: ev.imageUrl || defaultImageUrl,
              status: computeStatus(ev),
              sport: ev.sport || ev.title,
              start_time: ev.startTime || ev.start_time,
              end_time: ev.endTime || ev.end_time,
              date: new Date(ev.startTime || ev.start_time).toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'}),
              time: new Date(ev.startTime || ev.start_time).toLocaleTimeString('en-US', {hour: 'numeric', minute: 'numeric', hour12: true}),
            };
          });
          const normalizedSubevents = subevents.map((sub: any) => {
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

            return {
              ...sub,
              id: String(sub._id || sub.id),
              title: sub.title,
              image: sub.imageUrl || defaultImageUrl,
              status: computeStatus(sub),
              sport: sub.sport || sub.title,
              start_time: sub.startTime || sub.start_time,
              end_time: sub.endTime || sub.end_time,
              date: new Date(sub.start_time || sub.startTime).toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'}),
              time: new Date(sub.start_time || sub.startTime).toLocaleTimeString('en-US', {hour: 'numeric', minute: 'numeric', hour12: true}),
            };
          });

          const combined = [...normalizedEvents, ...normalizedSubevents];
          const upcomingOnly: UpcomingEvent[] = combined.filter((ev:any) => (ev.status ?? "").toLowerCase() === "upcoming");
          setUpcomingEvents(upcomingOnly);
          console.log("Upcoming:" + combined);
          } catch (err) {
          console.error("Error fetching events:", err);
        }
      };
      fetchEvents();
    }, [userId]
  );
    const initials = `${userData?.first_name?.[0] ?? ""}${userData?.last_name?.[0] ?? ""}`.toUpperCase();
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

  const actionButtons: ActionButton[] = [
    {
      icon: "checkmark-circle-outline",
      localImage: require("../../../assets/images/checkin.svg"),
      label: "Check-in",
      onPress: () => console.log("Check-in pressed"),
    },
    {
      icon: "map",
      localImage: require("../../../assets/images/map.png"),
      label: "Map",
      onPress: () => console.log("Map pressed"),
    },
  ];

  const navigationButtons: NavigationButton[] = [
    {
      icon: "qr-code-scanner",
      localImage: require("../../../assets/images/qr.png"),
      label: "QR Code Scanner",
      onPress: () => console.log("QR Code Scanner pressed"),
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
          <TennisIcon />
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

      {/* Top Banner */}
      <View style={styles.topBanner}>
        <View style={styles.headerContent}>
          <View style={styles.headerSpacer} />
          <Text style={styles.headerTitle}>Volunteers Homepage</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => router.push("../profile")}>
              <View style={styles.profileInitials}>
                <Text style={styles.profileText}>{initials}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        
        {/* Action Buttons */}
        <View style={styles.section}>
          <View style={styles.buttonGrid}>
            {actionButtons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={styles.actionButton}
                onPress={button.onPress}
                activeOpacity={0.7}
              >
                {button.localImage ? (
                  <Image
                    source={button.localImage}
                    style={{ width: 48, height: 48, resizeMode: "contain" }}
                  />
                ) : (
                  <Ionicons name={button.icon} size={48} color="#C4161C" />
                )}
                <Text style={styles.buttonLabel}>{button.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Navigation Buttons */}
        <View style={styles.section}>
          <View style={styles.buttonGrid}>
            {navigationButtons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={styles.navigationButton}
                onPress={button.onPress}
                activeOpacity={0.7}
              >
                {button.localImage ? (
                  <Image
                    source={button.localImage}
                    style={{ width: 48, height: 48, resizeMode: "contain" }}
                  />
                ) : (
                  <MaterialIcons name={button.icon!} size={48} color="#000" />
                )}
                <Text style={styles.navigationButtonLabel}>{button.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Upcoming Events Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your upcoming events</Text>
          <View style={styles.eventsContainer}>
            {upcomingEvents.length === 0 ? (
              <View style={styles.noEventsContainer}>
                <Ionicons name="calendar-outline" size={48} color="#999" />
                <Text style={styles.noEventsText}>No upcoming events</Text>
              </View>
              ) : (
              upcomingEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onPress={() => openDetails(event)}
              />
            ))
          )}
          </View>
        </View>

        {/* Bottom spacing for navigation */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavContainer}>
        {/* Profile Picture Overlay */}
        <View style={styles.profilePictureOverlay}>
          <View style={styles.profilePicture}>
            <Pressable onPress={() => router.push("/(app)/dashboard/events")}>
              <Image
                source={require("../../../assets/images/events.png")}
                style={styles.profileImage}
              />
            </Pressable>
          </View>
        </View>

        {/* Navigation Bar */}
        <View style={styles.bottomNav}>
          <View style={styles.navContent}>
            <TouchableOpacity style={styles.navButton} activeOpacity={0.7}>
              <Ionicons name="home-outline" size={32} color="#C4161C" />
              <Text style={styles.navLabel}>Home</Text>
            </TouchableOpacity>

            <View style={styles.navSpacer} />

            <TouchableOpacity style={styles.navButton} activeOpacity={0.7} onPress={() => router.push("/(app)/inbox" as any)}>
              <MaterialCommunityIcons
                name="inbox-outline"
                size={32}
                color="#888888"
              />
              <Text style={[styles.navLabel, { color: "#888888" }]}>Inbox</Text>
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

export default VolunteerDashboard;
