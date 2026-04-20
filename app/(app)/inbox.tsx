import React, { useState, useRef, useEffect } from "react";
import { router } from "expo-router";
import { useAuth } from "../../context/auth";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  ScrollView,
  Animated,
  Modal,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

// ── Types ─────────────────────────────────────────────────────────────────────

export type NotificationType = "event" | "assignment" | "announcement";
type FilterType = "All" | "Unread" | "Events" | "Assignments";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  preview: string;
  timestamp: string; // ISO string — replace with API field (e.g. created_at)
  read: boolean;
}

// ── API Hook (swap mock data for real fetch here) ─────────────────────────────
//
// When connecting to the backend, replace MOCK_NOTIFICATIONS with an API call:
//
//   const fetchNotifications = async (userId: string, token: string) => {
//     const res = await fetch(`http://<host>/users/${userId}/notifications`, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     return res.json() as Promise<Notification[]>;
//   };
//
//   const markNotificationRead = (userId: string, token: string, id: string) =>
//     fetch(`http://<host>/users/${userId}/notifications/${id}/read`, {
//       method: "PATCH",
//       headers: { Authorization: `Bearer ${token}` },
//     });
//
//   const deleteNotification = (userId: string, token: string, id: string) =>
//     fetch(`http://<host>/users/${userId}/notifications/${id}`, {
//       method: "DELETE",
//       headers: { Authorization: `Bearer ${token}` },
//     });

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

const TYPE_CONFIG: Record<
  NotificationType,
  { color: string; icon: keyof typeof Ionicons.glyphMap; label: string }
> = {
  event:        { color: "#C4161C", icon: "calendar-outline",  label: "Event" },
  assignment:   { color: "#2196F3", icon: "person-outline",    label: "Assignment" },
  announcement: { color: "#4CAF50", icon: "megaphone-outline", label: "Announcement" },
};

// ── Mock Data (replace with API fetch) ────────────────────────────────────────

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "event",
    title: "Women's Tennis Venue Change",
    preview: "Women's tennis has been moved to Robins Center. Please update your schedules accordingly.",
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    read: false,
  },
  {
    id: "2",
    type: "assignment",
    title: "You've been assigned to Red Ball Singles",
    preview: "You have a new volunteer assignment for Red Ball Singles Match on June 20 at 2:00 PM.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    read: false,
  },
  {
    id: "3",
    type: "announcement",
    title: "Welcome to Sonar 2025!",
    preview: "The 2025 Special Olympics Virginia State Summer Games are officially underway. Thank you for participating!",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    read: false,
  },
  {
    id: "4",
    type: "event",
    title: "Green Dot Singles Match Reminder",
    preview: "Your event starts in 1 hour. Please arrive 15 minutes early for warm-ups.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    read: true,
  },
  {
    id: "5",
    type: "assignment",
    title: "Assignment Updated: Match Play Singles",
    preview: "Your volunteer role for Match Play Singles has been updated. Check-in location is now Gate C.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 27).toISOString(),
    read: true,
  },
  {
    id: "6",
    type: "event",
    title: "Match Play Singles — Start Time Change",
    preview: "Match Play Singles has been moved from 5:00 PM to 4:30 PM. Please plan accordingly.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    read: true,
  },
  {
    id: "7",
    type: "announcement",
    title: "Volunteer Appreciation Dinner",
    preview: "All volunteers are invited to the appreciation dinner on Saturday at 7:00 PM in the main hall.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    read: true,
  },
  {
    id: "8",
    type: "event",
    title: "Event Results Posted",
    preview: "Results for the Red Ball Singles Match are now available. Tap to view the full scoreboard.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    read: true,
  },
];

// ── Notification Card ─────────────────────────────────────────────────────────

interface NotificationCardProps {
  item: Notification;
  animValue: Animated.Value;
  onPress: (item: Notification) => void;
}

const NotificationCard = ({ item, animValue, onPress }: NotificationCardProps) => {
  const config = TYPE_CONFIG[item.type];

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          opacity: animValue,
          transform: [
            {
              translateY: animValue.interpolate({
                inputRange: [0, 1],
                outputRange: [16, 0],
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => onPress(item)}
        style={[styles.card, item.read ? styles.cardRead : styles.cardUnread]}
      >
        {/* Left color bar */}
        <View style={[styles.colorBar, { backgroundColor: config.color }]} />

        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: config.color + "18" }]}>
          <Ionicons name={config.icon} size={22} color={config.color} />
        </View>

        {/* Content */}
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, item.read && styles.cardTitleRead]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.cardPreview} numberOfLines={2}>
            {item.preview}
          </Text>
          <Text style={styles.cardTimestamp}>{timeAgo(item.timestamp)}</Text>
        </View>

        {/* Unread dot — always rendered, hidden when read */}
        {!item.read && (
          <View style={[styles.unreadDot, { backgroundColor: config.color }]} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── Detail Modal ──────────────────────────────────────────────────────────────

interface DetailModalProps {
  notification: Notification | null;
  onClose: () => void;
  onDelete: (id: string) => void;
}

const DetailModal = ({ notification, onClose, onDelete }: DetailModalProps) => {
  if (!notification) return null;
  const config = TYPE_CONFIG[notification.type];

  return (
    <Modal visible animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* X button */}
          <TouchableOpacity style={styles.modalClose} onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color="#555" />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Icon */}
            <View style={styles.modalIconWrapper}>
              <View style={[styles.modalIconCircle, { backgroundColor: config.color + "18" }]}>
                <Ionicons name={config.icon} size={36} color={config.color} />
              </View>
            </View>

            {/* Type badge */}
            <View style={[styles.modalTypeBadge, { backgroundColor: config.color }]}>
              <Text style={styles.modalTypeBadgeText}>{config.label}</Text>
            </View>

            {/* Title */}
            <Text style={styles.modalTitle}>{notification.title}</Text>

            {/* Timestamp */}
            <Text style={styles.modalTimestamp}>{timeAgo(notification.timestamp)}</Text>

            {/* Full body */}
            <Text style={styles.modalBody}>{notification.preview}</Text>
          </ScrollView>

          {/* Delete button */}
          <TouchableOpacity
            style={styles.deleteButton}
            activeOpacity={0.8}
            onPress={() => onDelete(notification.id)}
          >
            <Ionicons name="trash-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.deleteButtonText}>Delete Notification</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────

const FILTERS: FilterType[] = ["All", "Unread", "Events", "Assignments"];

export default function InboxScreen() {
  const { userData } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  const animValues = useRef(
    MOCK_NOTIFICATIONS.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const animations = animValues.map((val, i) =>
      Animated.timing(val, {
        toValue: 1,
        duration: 350,
        delay: i * 55,
        useNativeDriver: true,
      })
    );
    Animated.parallel(animations).start();
  }, []);

  const openNotification = (item: Notification) => {
    // Mark as read when opened
    // TODO: call markNotificationRead(userId, token, item.id) when API is ready
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );
    setSelectedNotification({ ...item, read: true });
  };

  const deleteNotification = (id: string) => {
    // TODO: call deleteNotification(userId, token, id) when API is ready
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setSelectedNotification(null);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Unread") return !n.read;
    if (activeFilter === "Events") return n.type === "event";
    if (activeFilter === "Assignments") return n.type === "assignment";
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const initials = `${userData?.first_name?.[0] ?? ""}${userData?.last_name?.[0] ?? ""}`.toUpperCase();

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="inbox-outline" size={80} color="#CCCCCC" />
      <Text style={styles.emptyTitle}>No notifications</Text>
      <Text style={styles.emptySubtitle}>
        {activeFilter === "Unread"
          ? "You're all caught up!"
          : `No ${activeFilter.toLowerCase()} notifications yet.`}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#C4161C" />

      {/* Header */}
      <View style={styles.topBanner}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Inbox</Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity onPress={() => router.push("/(app)/profile" as any)} style={styles.headerRight}>
            <View style={styles.profileInitials}>
              <Text style={styles.profileText}>{initials}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={styles.filterContent}
        >
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter}
              onPress={() => setActiveFilter(filter)}
              activeOpacity={0.75}
              style={[
                styles.filterChip,
                activeFilter === filter ? styles.filterChipActive : styles.filterChipInactive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === filter ? styles.filterChipTextActive : styles.filterChipTextInactive,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Notification List */}
      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationCard
            item={item}
            animValue={animValues[MOCK_NOTIFICATIONS.findIndex((n) => n.id === item.id)]}
            onPress={openNotification}
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          filteredNotifications.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />

      {/* Detail Modal */}
      <DetailModal
        notification={selectedNotification}
        onClose={() => setSelectedNotification(null)}
        onDelete={deleteNotification}
      />

      {/* Bottom Navigation */}
      <View style={styles.bottomNavContainer}>
        <View style={styles.bottomNav}>
          <View style={styles.navContent}>
            <TouchableOpacity
              style={styles.navButton}
              activeOpacity={0.7}
              onPress={() => router.back()}
            >
              <Ionicons name="home-outline" size={32} color="#888888" />
              <Text style={styles.navLabelInactive}>Home</Text>
            </TouchableOpacity>

            <View style={styles.navSpacer} />

            <TouchableOpacity style={styles.navButton} activeOpacity={0.7}>
              <MaterialCommunityIcons name="inbox-outline" size={32} color="#C4161C" />
              <Text style={styles.navLabelActive}>Inbox</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },

  // Header
  topBanner: {
    backgroundColor: "#C4161C",
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  unreadBadge: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#C4161C",
  },
  headerRight: {
    padding: 4,
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

  // Filter chips
  filterRow: {
    flexGrow: 0,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: "row",
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  filterChipActive: {
    backgroundColor: "#FFFFFF",
  },
  filterChipInactive: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: "#C4161C",
  },
  filterChipTextInactive: {
    color: "#FFFFFF",
  },

  // List
  listContent: {
    padding: 16,
    paddingBottom: 120,
  },
  listContentEmpty: {
    flexGrow: 1,
  },

  // Card
  cardWrapper: {
    marginBottom: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    overflow: "hidden",
    paddingRight: 12,
  },
  cardUnread: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardRead: {
    backgroundColor: "#F8F8F8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  colorBar: {
    width: 4,
    alignSelf: "stretch",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 12,
    flexShrink: 0,
  },
  cardContent: {
    flex: 1,
    paddingVertical: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111111",
    marginBottom: 3,
  },
  cardTitleRead: {
    color: "#444444",
    fontWeight: "500",
  },
  cardPreview: {
    fontSize: 13,
    fontWeight: "400",
    color: "#666666",
    lineHeight: 18,
    marginBottom: 5,
  },
  cardTimestamp: {
    fontSize: 11,
    fontWeight: "400",
    color: "#999999",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 10,
    flexShrink: 0,
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#444444",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: "400",
    color: "#999999",
    marginTop: 6,
    textAlign: "center",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    backgroundColor: "#fff",
    width: "100%",
    maxHeight: "85%",
    borderRadius: 16,
    padding: 20,
  },
  modalClose: {
    position: "absolute",
    top: 14,
    right: 14,
    zIndex: 10,
    padding: 4,
  },
  modalIconWrapper: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  modalIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTypeBadge: {
    alignSelf: "center",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  modalTypeBadgeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
    marginBottom: 6,
  },
  modalTimestamp: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginBottom: 16,
  },
  modalBody: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
    marginBottom: 24,
  },
  deleteButton: {
    backgroundColor: "#C4161C",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },

  // Bottom nav
  bottomNavContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomNav: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 24,
    paddingBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
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
  navLabelActive: {
    fontSize: 12,
    fontWeight: "600",
    color: "#C4161C",
    marginTop: 4,
  },
  navLabelInactive: {
    fontSize: 12,
    fontWeight: "600",
    color: "#888888",
    marginTop: 4,
  },
});