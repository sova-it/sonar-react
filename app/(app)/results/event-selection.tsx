import { useAuth } from '@/context/auth';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SportContext } from '../../../types/results';

interface Subevent {
  _id: string;
  event_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  type?: 'event' | 'subevent';
}

const EventSelectionScreen = () => {
  const { role, isReady } = useAuth();
  const [allEvents, setAllEvents] = useState<Subevent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sportContext, setSportContext] = useState<SportContext>('Track & Field');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Role check - only coordinators, volunteers and admins can enter scores
  const canEnterScores = role === 'coordinator' || role === 'volunteer' || role === 'admin';

  // Fetch both events and subevents
  useEffect(() => {
    const fetchSubevents = async () => {
      try {
        setLoading(true);
        const subeventsRes = await api.get('public/events-with-subevents');
        
        let subevents: Subevent[] = [];
        for (const event of subeventsRes.data.events || []){
          if (event?.subevents?.length >0){
            subevents= [...subevents, ...event.subevents.map((s: any) => ({
              ...s,
              type: 'subevent' as const,
            }))]
          }
        }
        // Combine both events and subevents
        setAllEvents([...subevents]);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch events:', err);
        setError('Failed to load events. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubevents();
  }, []);

  // Filter events based on search query
  const filteredEvents = useMemo(() => {
    let filtered = allEvents;

    if (searchQuery) {
      filtered = filtered.filter((e) =>
        e.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [allEvents, searchQuery]);

  const handleEventSelect = (event: Subevent) => {
    const participantsEventId = event.type === 'subevent' ? event.event_id : event._id;

    if (sportContext === 'Track & Field') {
      router.push({
        pathname: '/(app)/results/track-field/entry-mode' as any,
        params: {
          event_id: participantsEventId,
          subevent_id: event._id,
          event_title: event.title,
          event_location: event.location || '',
          event_start_time: event.start_time,
          event_end_time: event.end_time
        },
      });
    } else if (sportContext === 'Distance') {
      router.push({
        pathname: '/(app)/results/distance/entry-mode' as any,
        params: {
          event_id: participantsEventId,
          subevent_id: event._id,
          event_title: event.title,
          event_location: event.location || '',
          event_start_time: event.start_time,
          event_end_time: event.end_time
        },
      });
    }
    else {
      Alert.alert(
        'Coming Soon',
        `${sportContext} score entry will be available in a future update.`
      );
    }
  };

  const formatEventDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatEventTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return dateString;
    }
  };

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#C4161C" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#C4161C" />

      {/* Top Banner */}
      <View style={styles.topBanner}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Event Selection</Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Sport Context Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Sport Type</Text>
          <View style={styles.sportOptionsContainer}>
            <TouchableOpacity
              style={[
                styles.sportOption,
                sportContext === 'Track & Field' && styles.sportOptionSelected,
              ]}
              onPress={() => setSportContext('Track & Field')}
              activeOpacity={0.7}
            >
              <View style={[
                styles.sportIconContainer,
                sportContext === 'Track & Field' && styles.sportIconContainerSelected,
              ]}>
                <Ionicons
                  name="stopwatch"
                  size={28}
                  color={sportContext === 'Track & Field' ? '#FFFFFF' : '#C4161C'}
                />
              </View>
              <View style={styles.sportTextContainer}>
                <Text style={[
                  styles.sportOptionTitle,
                  sportContext === 'Track & Field' && styles.sportOptionTitleSelected,
                ]}>
                  Track & Field
                </Text>
                <Text style={styles.sportOptionSubtitle}>Time-based events</Text>
              </View>
              {sportContext === 'Track & Field' && (
                <Ionicons name="checkmark-circle" size={24} color="#C4161C" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sportOption,
                sportContext === 'Distance' && styles.sportOptionSelected,
              ]}
              onPress={() => setSportContext('Distance')}
              activeOpacity={0.7}
            >
              <View style={[
                styles.sportIconContainer,
                sportContext === 'Distance' && styles.sportIconContainerSelected,
              ]}>
                <Ionicons
                  name="resize"
                  size={28}
                  color={sportContext === 'Distance' ? '#FFFFFF' : '#C4161C'}
                />
              </View>
              <View style={styles.sportTextContainer}>
                <Text style={[
                  styles.sportOptionTitle,
                  sportContext === 'Distance' && styles.sportOptionTitleSelected,
                ]}>
                  Distance
                </Text>
                <Text style={styles.sportOptionSubtitle}>Distance-based events</Text>
              </View>
              {sportContext === 'Distance' && (
                <Ionicons name="checkmark-circle" size={24} color="#C4161C" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.section}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#999" style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Search events..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
          </View>
        </View>

        {/* Events List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Events</Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#C4161C" />
              <Text style={styles.loadingText}>Loading events...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={48} color="#C4161C" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => window.location.reload()}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : filteredEvents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color="#999" />
              <Text style={styles.emptyText}>
                {searchQuery ? 'No events match your search' : 'No events available'}
              </Text>
            </View>
          ) : (
            <View style={styles.eventsContainer}>
              {filteredEvents.map((event) => (
                <TouchableOpacity
                  key={event._id}
                  style={styles.eventCard}
                  onPress={() => handleEventSelect(event)}
                  activeOpacity={0.7}
                >
                  <View style={styles.eventIconContainer}>
                    <Ionicons name="flag" size={32} color="#C4161C" />
                  </View>
                  <View style={styles.eventContent}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <View style={styles.eventDetail}>
                      <Ionicons name="location" size={16} color="#666" />
                      <Text style={styles.eventLocation}>{event.location}</Text>
                    </View>
                    <View style={styles.eventDetail}>
                      <Ionicons name="calendar" size={16} color="#666" />
                      <Text style={styles.eventDate}>
                        {formatEventDate(event.start_time)}
                      </Text>
                    </View>
                    <View style={styles.eventDetail}>
                      <Ionicons name="time" size={16} color="#666" />
                      <Text style={styles.eventTime}>
                        {formatEventTime(event.start_time)}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#C4161C" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBanner: {
    backgroundColor: '#C4161C',
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#870005',
    marginBottom: 16,
  },
  sportOptionsContainer: {
    gap: 12,
  },
  sportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  sportOptionSelected: {
    borderColor: '#C4161C',
    backgroundColor: '#FFF8F8',
  },
  sportIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  sportIconContainerSelected: {
    backgroundColor: '#C4161C',
  },
  sportTextContainer: {
    flex: 1,
  },
  sportOptionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
  },
  sportOptionTitleSelected: {
    color: '#C4161C',
  },
  sportOptionSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  eventsContainer: {
    gap: 16,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  eventLocation: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  eventDate: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  eventTime: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#C4161C',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#C4161C',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 40,
  },
});

export default EventSelectionScreen;