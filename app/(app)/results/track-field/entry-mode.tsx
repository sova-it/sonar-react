import { useAuth } from '@/context/auth';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/lib/api';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Athlete, EntryMode, Score, ScoreEntry } from '../../../../types/results';
import { calculateTrackRankings } from '../../../../utils/rankingCalculation';
import { formatTime, validateTrackScore } from '../../../../utils/scoreValidation';
import AthleteSearchBar from '../components/AthleteSearchBar';
import ConfirmationDialog from '../components/ConfirmationDialog';
import ScoreInput from '../components/ScoreInput';
import Toast, { ToastType } from '../components/Toast';


const TrackFieldEntryScreen = () => {
  const params = useLocalSearchParams();
  const { userId, role } = useAuth();
  const eventId = params.event_id as string;
  const subeventId = params.subevent_id as string;
  const eventTitle = params.event_title as string;
  const eventLocation = params.event_location as string;
  const eventStartTime = params.event_start_time as string;
  const eventEndTime = params.event_end_time as string;
  const date = fmtDate(eventStartTime);
  const fmtEventStartTime = fmtTime(eventStartTime);
  const fmtEventEndTime = fmtTime(eventEndTime);
  const participantEventId = subeventId || eventId;
  const scoreEventId = subeventId || eventId;

  const canEnterScores = role === 'coordinator' || role === 'volunteer' || role === 'admin';

  const [activeMode, setActiveMode] = useState<EntryMode>(canEnterScores ? 'individual' : 'rankings');

  // Individual entry state
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [timeValue, setTimeValue] = useState({ minutes: '', seconds: '', milliseconds: '' });
  const [notes, setNotes] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Bulk entry state
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [bulkScores, setBulkScores] = useState<Map<string, ScoreEntry>>(new Map());
  const [bulkErrors, setBulkErrors] = useState<Map<string, string[]>>(new Map());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showBulkConfirmDialog, setShowBulkConfirmDialog] = useState(false);
  const [bulkValidEntries, setBulkValidEntries] = useState<ScoreEntry[]>([]);

  // Rankings state
  const [scores, setScores] = useState<Score[]>([]);
  const [rankingsLoading, setRankingsLoading] = useState(false);

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');
  const[toastDuration, setToastDuration] = useState(2000);

  const showToast = (message: string, type: ToastType, duration?: number) => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
    setToastDuration(duration || 2000);
  };

  // Load athletes for event
  useEffect(() => {
    const loadAthletes = async () => {
      try {
        const endpoint = "/subevents/"+subeventId+"/participants";
        const response = await api.get(endpoint);
        let participants: Athlete[] = (response.data.items || []).map((item: any) => ({
          _id: item.memberId,
          first_name: item.firstName,
          last_name: item.lastName,
          email: item.email,
          phone: item.phone,
          role: item.role,
        }));
        participants=participants?.filter((athlete) => athlete.role === 'athlete').sort((a, b) => a.last_name.localeCompare(b.last_name));
        setAthletes([...participants]);
      } catch (error) {
        showToast('Failed to load athletes', 'error', 3000);
      }
    };

    loadAthletes();
  }, [subeventId]);

  useEffect(() => {
    if (activeMode === 'bulk') {
      loadDraftScores();
    }
  }, [activeMode]);
  useEffect(() => {
    if (activeMode === 'rankings') {
      loadScores();
    }
  }, [activeMode]);

  const loadDraftScores = async () => {
    try {
      const draft = await AsyncStorage.getItem(`draft_scores_${subeventId}`);
      if (draft) {
        const entries = JSON.parse(draft);
        setBulkScores(new Map(entries));
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
  };

  const loadScores = async () => {
    try {
      setRankingsLoading(true);
      const response = await api.get('/scores');
      const eventScores = response.data.scores.filter(
        (s: Score) => s.subevent_id === subeventId
      );
      setScores(eventScores);
    } catch (error) {
      console.error('Failed to load scores:', error);
      showToast('Failed to load scores', 'error', 3000);  
    } finally {
      setRankingsLoading(false);
    }
  };

  // Individual Entry Functions
  const handleTimeChange = (value: { minutes: string; seconds: string; milliseconds: string }) => {
    setTimeValue(value);
    const errors = validateTrackScore(value.minutes, value.seconds, value.milliseconds);
    setValidationErrors(errors);
  };

  const handleIndividualSubmit = () => {
    if (!selectedAthlete) {
      showToast('Please select an athlete', 'error',3000);
      return;
    }

    const errors = validateTrackScore(timeValue.minutes, timeValue.seconds, timeValue.milliseconds);
    if (errors.length > 0) {
      showToast("Validation error", 'error',3000);
      return;
    }

    setShowConfirmDialog(true);
  };

  const confirmIndividualSubmit = async () => {
    setShowConfirmDialog(false);
    setSubmitting(true);

    try {
      await api.post('/scores/athlete', {
        athlete_id: selectedAthlete!._id,
        subevent_id: subeventId,
        score: formatTime(timeValue.minutes, timeValue.seconds, timeValue.milliseconds),
        rank: '',
        recorded_by: userId,
        recorded_at: new Date().toISOString(),
        notes: notes
      });

      showToast('Score submitted successfully!', 'success');

      // Reset form
      setSelectedAthlete(null);
      setTimeValue({ minutes: '', seconds: '', milliseconds: '' });
      setNotes('');
      setValidationErrors([]);
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      const errorMessage = typeof detail === 'string'
        ? detail
        : detail?.message || 'Failed to submit score';
      showToast(errorMessage, 'error',3000);
    } finally {
      setSubmitting(false);
    }
  };

  // Bulk Entry Functions
  const handleBulkInputChange = (athleteId: string, field: 'minutes' | 'seconds' | 'milliseconds', value: string) => {
    const entry = bulkScores.get(athleteId) || {
      athlete_id: athleteId,
      minutes: '',
      seconds: '',
      milliseconds: '',
    };
    entry[field] = value;

    const newMap = new Map(bulkScores);
    newMap.set(athleteId, entry);
    setBulkScores(newMap);

    // Validate
    const errors = validateTrackScore(entry.minutes, entry.seconds, entry.milliseconds);
    const newErrors = new Map(bulkErrors);
    newErrors.set(athleteId, errors);
    setBulkErrors(newErrors);
  };

  const saveDraft = async () => {
    try {
      await AsyncStorage.setItem(
        `draft_scores_${subeventId}`,
        JSON.stringify(Array.from(bulkScores.entries()))
      );
      showToast('Draft saved successfully', 'success');
    } catch (error) {
      showToast('Failed to save draft', 'error',3000);
    }
  };

  const submitBulkScores = () => {
    const validEntries: ScoreEntry[] = [];

    bulkScores.forEach((entry) => {
      if (entry.minutes || entry.seconds || entry.milliseconds) {
        const errors = validateTrackScore(entry.minutes, entry.seconds, entry.milliseconds);
        if (errors.length === 0) {
          validEntries.push(entry);
        }
      }
    });

    if (validEntries.length === 0) {
      showToast("Submit at least one score", 'error',3000);
      return;
    }

    setBulkValidEntries(validEntries);
    setShowBulkConfirmDialog(true);
  };

  const confirmBulkSubmit = async () => {
    setShowBulkConfirmDialog(false);
    setBulkLoading(true);

    try {
      const promises = bulkValidEntries.map((entry) =>
        api.post('/scores/athlete', {
          athlete_id: entry.athlete_id,
          subevent_id: subeventId,
          score: formatTime(entry.minutes, entry.seconds, entry.milliseconds),
          rank: '',
          recorded_by: userId,
          notes: "",
        })
      );

      await Promise.all(promises);
      showToast(`${bulkValidEntries.length} score(s) submitted`, 'success');

      await AsyncStorage.removeItem(`draft_scores_${subeventId}`);
      setBulkScores(new Map());
      setBulkErrors(new Map());
      setBulkValidEntries([]);
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      const errorMessage = typeof detail === 'string'
        ? detail
        : detail?.message || 'Some scores failed to submit';
      showToast(errorMessage, 'error',3000);
    } finally {
      setBulkLoading(false);
    }
  };

  // Rankings Functions
  const athleteMap = new Map(athletes.map((a) => [a._id, a]));
  const rankings = calculateTrackRankings(scores, athleteMap);

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
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
  // Render Individual Entry Mode
  const renderIndividualMode = () => (
    
    
    
    <View style={styles.modeContent}>
      <View style = {styles.titleRow}>
        <View style = {{flex: 1, paddingRight: 12}}>
        <Text style = {styles.title}>{eventTitle}</Text>
        </View>
      </View>
      <Text style = {styles.metaLine}>{date}</Text>
      <Text style = {styles.metaLine}>{fmtEventStartTime + "-" + fmtEventEndTime}</Text>
      <Text style={styles.subSectionTitle}>Select Athlete</Text>
      <AthleteSearchBar
        onSelect={setSelectedAthlete}
        selectedAthlete={selectedAthlete}
        athletes={athletes}
      />

      {selectedAthlete && (
        <>
          <Text style={styles.subSectionTitle}>Enter Time</Text>
          <ScoreInput
            value={timeValue}
            onChange={handleTimeChange}
            errors={validationErrors}
          />

          <Text style={styles.subSectionTitle}>Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add any notes about this performance..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                setTimeValue({ minutes: '', seconds: '', milliseconds: '' });
                setNotes('');
              }}
            >
              <Text style={styles.secondaryButtonText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryButton, (submitting || validationErrors.length > 0) && styles.disabledButton]}
              onPress={handleIndividualSubmit}
              disabled={submitting || validationErrors.length > 0}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Submit Score</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}

      <ConfirmationDialog
        visible={showConfirmDialog}
        title="Confirm Score Submission"
        message={`Submit score for ${selectedAthlete?.first_name} ${selectedAthlete?.last_name}?\n\nTime: ${formatTime(timeValue.minutes, timeValue.seconds, timeValue.milliseconds)}\n${notes ? `Notes: ${notes}` : ''}`}
        onConfirm={confirmIndividualSubmit}
        onCancel={() => setShowConfirmDialog(false)}
      />
    </View>
  );

  // Render Bulk Entry Mode
  const renderBulkMode = () => {
    const scoredCount = Array.from(bulkScores.values()).filter(
      (e) => e.minutes || e.seconds || e.milliseconds
    ).length;

    return (
      <View style={styles.modeContent}>
        <View style={styles.bulkHeader}>
          <Text style={styles.progressText}>
            {scoredCount} of {athletes.length} athletes scored
          </Text>
          <View style={styles.bulkActions}>
            <TouchableOpacity style={styles.draftButton} onPress={saveDraft}>
              <Ionicons name="save-outline" size={20} color="#C4161C" />
              <Text style={styles.draftButtonText}>Save Draft</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, styles.nameCell]}>Name</Text>
              <Text style={[styles.tableCell, styles.timeCell]}>Min</Text>
              <Text style={[styles.tableCell, styles.timeCell]}>Sec</Text>
              <Text style={[styles.tableCell, styles.timeCell]}>MS</Text>
              <Text style={[styles.tableCell, styles.statusCell]}>Status</Text>
            </View>

            {/* Table Rows */}
            {athletes.map((athlete) => {
              const entry = bulkScores.get(athlete._id);
              const errors = bulkErrors.get(athlete._id) || [];
              const hasErrors = errors.length > 0;
              const hasData = entry && (entry.minutes || entry.seconds || entry.milliseconds);
              const isValid = hasData && !hasErrors;

              return (
                <View key={athlete._id} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.nameCell]}>
                    {athlete.first_name} {athlete.last_name}
                  </Text>
                  <TextInput
                    style={[styles.tableCell, styles.timeCell, styles.tableInput, hasErrors && styles.inputError]}
                    value={entry?.minutes || ''}
                    onChangeText={(v) => handleBulkInputChange(athlete._id, 'minutes', v)}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="0"
                  />
                  <TextInput
                    style={[styles.tableCell, styles.timeCell, styles.tableInput, hasErrors && styles.inputError]}
                    value={entry?.seconds || ''}
                    onChangeText={(v) => handleBulkInputChange(athlete._id, 'seconds', v)}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="00"
                  />
                  <TextInput
                    style={[styles.tableCell, styles.timeCell, styles.tableInput, hasErrors && styles.inputError]}
                    value={entry?.milliseconds || ''}
                    onChangeText={(v) => handleBulkInputChange(athlete._id, 'milliseconds', v)}
                    keyboardType="number-pad"
                    maxLength={3}
                    placeholder="000"
                  />
                  <View style={[styles.statusCell, styles.statusCellContainer]}>
                    {hasErrors ? (
                      <Ionicons name="close-circle" size={20} color="#C4161C" />
                    ) : isValid ? (
                      <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                    ) : (
                      <Text style={styles.tableCell}>-</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>

        <TouchableOpacity
          style={[styles.primaryButton, styles.submitAllButton, bulkLoading && styles.disabledButton]}
          onPress={submitBulkScores}
          disabled={bulkLoading}
        >
          {bulkLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Submit All Scores</Text>
          )}
        </TouchableOpacity>

        <ConfirmationDialog
          visible={showBulkConfirmDialog}
          title="Confirm Bulk Submission"
          message={`Submit scores for ${bulkValidEntries.length} athlete${bulkValidEntries.length !== 1 ? 's' : ''}?\n\n${bulkValidEntries.map(entry => {
            const athlete = athletes.find(a => a._id === entry.athlete_id);
            const athleteName = athlete ? `${athlete.first_name} ${athlete.last_name}` : 'Unknown';
            return `• ${athleteName}: ${formatTime(entry.minutes, entry.seconds, entry.milliseconds)}`;
          }).join('\n')}`}
          onConfirm={confirmBulkSubmit}
          onCancel={() => setShowBulkConfirmDialog(false)}
        />
      </View>
    );
  };

  // Render Rankings Mode
  const renderRankingsMode = () => (
    <View style={styles.modeContent}>
      {rankingsLoading ? (
        <ActivityIndicator size="large" color="#C4161C" />
      ) : rankings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="trophy-outline" size={48} color="#999" />
          <Text style={styles.emptyText}>No scores recorded yet</Text>
        </View>
      ) : (
        <ScrollView>
          {rankings.map((entry, index) => {
            const medal = getMedalIcon(entry.rank);
            return (
              <View
                key={entry.score_id}
                style={[
                  styles.rankingCard,
                  entry.rank <= 3 && styles.podiumCard,
                ]}
              >
                <View style={styles.rankingLeft}>
                  <Text style={styles.rankNumber}>
                    {medal || `#${entry.rank}`}
                  </Text>
                  <View>
                    <Text style={styles.rankingName}>{entry.athlete_name}</Text>
                    <Text style={styles.rankingTime}>
                      {entry.score}
                      {entry.isTie && ' (Tied)'}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      <TouchableOpacity style={styles.refreshButton} onPress={loadScores}>
        <Ionicons name="refresh" size={20} color="#C4161C" />
        <Text style={styles.refreshButtonText}>Refresh Rankings</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#C4161C" />
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
        duration={toastDuration}
      />

      {/* Top Banner */}
      <View style={styles.topBanner}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>{eventTitle}</Text>
            <Text style={styles.headerSubtitle}>Track & Field</Text>
          </View>
          <View style={{ width: 24 }} />
        </View>
      </View>

      {/* Mode Tabs */}
      <View style={styles.tabsContainer}>
        {canEnterScores && (
          <>
            <TouchableOpacity
              style={[styles.tab, activeMode === 'individual' && styles.activeTab]}
              onPress={() => setActiveMode('individual')}
            >
              <Text style={[styles.tabText, activeMode === 'individual' && styles.activeTabText]}>
                Individual
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeMode === 'bulk' && styles.activeTab]}
              onPress={() => setActiveMode('bulk')}
            >
              <Text style={[styles.tabText, activeMode === 'bulk' && styles.activeTabText]}>
                Bulk Entry
              </Text>
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity
          style={[styles.tab, activeMode === 'rankings' && styles.activeTab]}
          onPress={() => setActiveMode('rankings')}
        >
          <Text style={[styles.tabText, activeMode === 'rankings' && styles.activeTabText]}>
            Rankings
          </Text>
        </TouchableOpacity>
      </View>

      {/* Mode Content */}
      <ScrollView style={styles.content}>
        {activeMode === 'individual' && renderIndividualMode()}
        {activeMode === 'bulk' && renderBulkMode()}
        {activeMode === 'rankings' && renderRankingsMode()}
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
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  title: { fontSize: 36, fontWeight: "800", color: "#A22723", lineHeight: 40 },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 2,
  },
  metaLine: { fontSize: 20, color: "#000000", marginTop: 10 },

  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderBottomWidth: 1,
    borderBottomColor: '#DDDDDD',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#C4161C',
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#C4161C',
  },
  content: {
    flex: 1,
  },
  modeContent: {
    padding: 16,
  },
  subSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#870005',
    marginTop: 16,
    marginBottom: 12,
  },
  notesInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#C4161C',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  bulkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  bulkActions: {
    flexDirection: 'row',
    gap: 8,
  },
  draftButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  draftButtonText: {
    color: '#C4161C',
    fontSize: 14,
    fontWeight: '600',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  titleRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 8},
  tableCell: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },
  nameCell: {
    width: 150,
  },
  timeCell: {
    width: 60,
    textAlign: 'center',
  },
  statusCell: {
    width: 60,
  },
  statusCellContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableInput: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 4,
    padding: 6,
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#C4161C',
  },
  submitAllButton: {
    marginTop: 24,
  },
  rankingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  podiumCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#C4161C',
  },
  rankingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#C4161C',
    marginRight: 16,
    width: 50,
  },
  rankingName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  rankingTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0F0',
    borderRadius: 8,
    padding: 14,
    marginTop: 16,
    gap: 8,
  },
  refreshButtonText: {
    color: '#C4161C',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
});

export default TrackFieldEntryScreen;