import api from "@/lib/api";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../../context/auth";

const categories = ["All Sports", "Athletics", "Bowling", "Swimming", "Tennis"];

const computeStatus = (item: any): string => {
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

const EventScreen = () => {
  const { userId } = useAuth();
  const statuses = userId
    ? ["all", "ongoing", "upcoming", "completed", "my_events"]
    : ["all", "ongoing", "upcoming", "completed"];
  const [activeCategory, setActiveCategory] = useState("All Sports");
  const [activeStatus, setActiveStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [allEventData, setAllEventData] = useState<any[]>([]);
  const [eventData, setEventData] = useState<any[]>([]);

  // Fetch user-specific events
  useEffect(() => {
    const fetchUserEvents = async () => {
      try {
        const response = await api.get("/users/" + userId + "/events");
        const defaultImageUrl =
          "https://api.builder.io/api/v1/image/assets/TEMP/d657c7793a39131a1442e864a26a553b086c478b?width=720";
        const list = Array.isArray(response.data?.events)
          ? response.data.events
          : [];
        setEventData(
          list.map((ev: any) => ({
            ...ev,
            id: String(ev.id ?? ev._id),
            imageUrl: ev.imageUrl || defaultImageUrl,
            sportCategory: ev.sportCategory || "General",
            status: computeStatus(ev),
          })),
        );
      } catch (error) {
        console.error(error);
      }
    };

    fetchUserEvents();
  }, [userId]);
  useEffect(() => {
    const fetchAllEvents = async () => {
      try {
        const [response, response2] = await Promise.all([
          api.get("/events"),
          api.get("/subevents"),
        ]);
        const getSportCategory = (event: any) => {
          const matchedCategory = categories.find(
            (cat) => cat.toLowerCase() === event.title?.toLowerCase(),
          );

          // Return matched category, existing, or default
          return matchedCategory || event.sportCategory || "Athletics";
        };
        const defaultImageUrl =
          "https://api.builder.io/api/v1/image/assets/TEMP/d657c7793a39131a1442e864a26a553b086c478b?width=720";
        const events = Array.isArray(response.data?.events)
          ? response.data.events
          : [];
        const subevents = Array.isArray(response2.data?.subevents)
          ? response2.data.subevents
          : [];
        console.log("Raw Events:", JSON.stringify(events[2], null, 2));
        console.log(computeStatus(events[2]));
        const normalizedEvents = events.map((ev: any) => ({
          ...ev,
          id: String(ev._id || ev.id),
          title: ev.title,
          imageUrl: ev.imageUrl || defaultImageUrl,
          sportCategory: getSportCategory(ev),
          status: computeStatus(ev),
          sport: ev.sport || ev.title,
          participants: ev.participants || 0,
          startTime: ev.start_time || ev.startTime,
        }));

        const normalizedSubevents = subevents.map((ev: any) => ({
          ...ev,
          id: String(ev._id || ev.id),
          title: ev.title,
          imageUrl: ev.imageUrl || defaultImageUrl,
          sportCategory: getSportCategory(ev),
          status: computeStatus(ev),
          sport: ev.sport || ev.title,
          participants: ev.participants || 0,
          startTime: ev.start_time || ev.startTime,
        }));

        const combined = [...normalizedEvents, ...normalizedSubevents];

        setAllEventData(combined);
      } catch (error) {
        console.error(error);
      }
    };

    fetchAllEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    const source = activeStatus === "my_events" ? eventData : allEventData;
    let filtered = source;

    if (activeCategory !== "All Sports") {
      filtered = filtered.filter((e) => e.sportCategory === activeCategory);
    }
    if (activeStatus !== "all" && activeStatus !== "my_events") {
      filtered = filtered.filter(
        (e) => e.status?.toLowerCase() === activeStatus.toLowerCase(),
      );
    }
    if (searchQuery) {
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.sportCategory.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    return filtered;
  }, [activeCategory, activeStatus, searchQuery, eventData, allEventData]);

  type Event = {
    id: string;
    title: string;
    sport: string;
    sportCategory: string;
    status: string;
    imageUrl: string;
    participants: number;
    startTime: string;
    start_time?: string;
    end_time?: string;
  };

  const groupedEvents = useMemo<Record<string, Event[]>>(() => {
    const map: Record<string, Event[]> = {};
    for (const event of filteredEvents as Event[]) {
      if (!map[event.sportCategory]) map[event.sportCategory] = [];
      map[event.sportCategory].push(event);
    }
    return map;
  }, [filteredEvents]);

  const openDetails = (e: Event) => {
    router.push({
      pathname: "/(app)/dashboard/event-details",
      params: {
        id: String(e.id),
        title: e.title ?? "",
        sport: e.sport ?? "",
        start_time: (e as any).start_time ?? "",
        end_time: (e as any).end_time ?? "",
      },
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Events</Text>
        <View style={styles.avatar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="#C4161C" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchBar}>
        <Ionicons
          name="search"
          size={16}
          color="#999"
          style={{ marginRight: 8 }}
        />
        <TextInput
          placeholder="What are you looking for?"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipRow}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, activeCategory === cat && styles.chipActive]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text
              style={
                activeCategory === cat ? styles.chipTextActive : styles.chipText
              }
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipRow}
      >
        {statuses.map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.chip, activeStatus === status && styles.chipActive]}
            onPress={() => setActiveStatus(status)}
          >
            <Text
              style={
                activeStatus === status
                  ? styles.chipTextActive
                  : styles.chipText
              }
            >
              {status === "my_events"
                ? "My Events"
                : status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {Object.keys(groupedEvents).length === 0 ? (
        <View style={styles.noEventContainer}>
          <Ionicons name="calendar-outline" size={48} color="#999" />
          <Text style={styles.noEventsText}>No events assigned to you</Text>
        </View>
      ) : (
        Object.entries(groupedEvents).map(([category, events]) => (
          <View key={category} style={{ marginTop: 16 }}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeader}>{category} Events</Text>
            </View>

            {events.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={styles.eventCard}
                onPress={() => openDetails(event)}
              >
                <Image
                  source={{ uri: event.imageUrl }}
                  style={styles.eventImage}
                />
                <View style={styles.eventFooter}>
                  <View>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <View style={styles.eventMeta}>
                      {(() => {
                        const sportConfig: Record<
                          string,
                          {
                            icon?: keyof typeof MaterialCommunityIcons.glyphMap;
                            image?: any;
                          }
                        > = {
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

                        const sportKey = getSportKey(event.sport);
                        const config = sportConfig[sportKey];

                        if (config.image) {
                          return (
                            <Image
                              source={config.image}
                              style={{ width: 14, height: 14, marginRight: 6 }}
                            />
                          );
                        }

                        return (
                          <MaterialCommunityIcons
                            name={config.icon!}
                            size={14}
                            color="#C4161C"
                            style={{ marginRight: 6 }}
                          />
                        );
                      })()}

                      <Text style={{ color: "green", fontSize: 12 }}>
                        {event.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Feather name="edit" size={16} color="#444" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
};

export default EventScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  input: {
    borderBottomWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    marginBottom: 12,
  },
  row: { flexDirection: "row", marginBottom: 12 },
  card: {
    flexDirection: "row",
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: "center",
  },
  image: { width: 60, height: 60, borderRadius: 8, marginRight: 12 },
  cardContent: { flex: 1 },
  title: { fontWeight: "bold", color: "#000" },
  detail: { color: "#666", fontSize: 12 },
  status: { fontSize: 12, color: "#C4161C", marginTop: 4 },
  header: {
    backgroundColor: "#C4161C",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 6,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  avatar: {
    backgroundColor: "#fff",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontWeight: "bold",
    color: "#C4161C",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#000",
  },
  chipRow: {
    marginTop: 12,
    flexDirection: "row",
    height: 36,
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#eee",
    marginRight: 8,
    height: 32,
  },
  chipActive: {
    backgroundColor: "#C4161C",
  },
  chipText: {
    fontSize: 12,
    color: "#333",
  },
  chipTextActive: {
    fontSize: 12,
    color: "#fff",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "bold",
  },
  eventCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventImage: {
    width: "100%",
    height: 140,
    resizeMode: "cover",
  },
  eventFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
  },
  eventTitle: {
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 4,
  },
  eventMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  noEventContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    marginTop: 8,
  },
  noEventsText: { fontSize: 16, color: "#666", marginTop: 8 },
});
