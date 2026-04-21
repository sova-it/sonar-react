import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect } from "react";
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../../context/auth";

// this
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

const AdminDashboard = () => {
  const { userData, isReady, role } = useAuth();

  useEffect(() => {
    if (isReady && role !== "admin") {
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
  const getInitials = (userData: any) => {
    if (!userData) return "U";
    const first = userData.first_name || userData.firstName || "";
    const last = userData.last_name || userData.lastName || "";
    if (first || last) {
      return ((first.charAt(0) || "") + (last.charAt(0) || "")).toUpperCase();
    }
    if (userData.name) {
      const parts = userData.name.split(" ");
      return (
        (parts[0]?.charAt(0) || "") + (parts[1]?.charAt(0) || "")
      ).toUpperCase();
    }
    // last fallback: just return "U" for user
    return "U";
  };
  const upcomingEvents: UpcomingEvent[] = [
    {
      id: 1,
      title: "Red Ball Singles Match",
      date: "Friday, June 20",
      time: "2:00 PM",
      image: require("../../../assets/images/tennis.png"),
      sport: "tennis",
      start_time: "2025-06-20T14:00:00Z",
      end_time: "2025-06-20T15:00:00Z",
    },

    {
      id: 2,
      title: "Green Dot Singles Match",
      date: "Friday, June 20",
      time: "3:30 PM",
      image: require("../../../assets/images/tennis.png"),
    },
    {
      id: 3,
      title: "Match Play Singles",
      date: "Friday, June 20",
      time: "5:00 PM",
      image: require("../../../assets/images/tennis.png"),
    },
  ];

  // this
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
      icon: "time-outline",
      localImage: require("../../../assets/images/updates.svg"),
      label: "Event Updates",
      onPress: () => console.log("Event Updates pressed"),
    },
    {
      icon: "clipboard-outline",
      localImage: require("../../../assets/images/manageusers.svg"),
      label: "Manage Users",
      onPress: () => router.push("/ManageUsers"),
    },
  ];

  const navigationButtons: NavigationButton[] = [
    {
      icon: "map",
      localImage: require("../../../assets/images/map.png"),
      label: "Map",
      onPress: () => router.push("/(app)/dashboard/map"),
    },
    {
      icon: "qr-code-scanner",
      localImage: require("../../../assets/images/qr.png"),
      label: "QR Code Scanner",
      onPress: () => router.push("/(app)/dashboard/QRScanner"),
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

  const EventCard = ({ event }: { event: UpcomingEvent }) => (
    <View style={styles.eventCard}>
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
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#C4161C" />

      {/* Top Banner */}
      <View style={styles.topBanner}>
        <View style={styles.headerContent}>
          <View style={styles.headerSpacer} />
          <Text style={styles.headerTitle}>Admin Homepage</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => router.push("../profile")}>
              <View style={styles.profileInitials}>
                <Text style={styles.profileText}>{getInitials(userData)}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Notification Banner */}
        <View style={styles.notificationBanner}>
          <View style={styles.notificationContent}>
            <Text style={styles.notificationText}>
              Women's tennis has been moved to Robins Center
            </Text>
            <MaterialIcons name="chevron-right" size={16} color="#BF1818" />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.section}>
          {/* maje the events pressable */}
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
            {upcomingEvents.map((event) => (
              <TouchableOpacity
                key={event.id}
                activeOpacity={0.7}
                onPress={() => openDetails(event)}
              >
                <EventCard event={event} />
              </TouchableOpacity>
            ))}
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
});

export default AdminDashboard;
