import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Athlete } from '../../../../types/results';

interface AthleteSearchBarProps {
  onSelect: (athlete: Athlete) => void;
  selectedAthlete?: Athlete | null;
  athletes: Athlete[];
}

const AthleteSearchBar: React.FC<AthleteSearchBarProps> = ({
  onSelect,
  selectedAthlete,
  athletes,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Athlete[]>(athletes);
  const [showResults, setShowResults] = useState(true);

  useEffect(() => {
    if (!selectedAthlete) {
      setResults(athletes);
      setShowResults(true);
    }
  }, [athletes, selectedAthlete]);

  // Filter athletes based on search query
  useEffect(() => {
    if (selectedAthlete) {
      return;
    }

    if (query.length === 0) {
      setResults(athletes);
      setShowResults(true);
      return;
    }

    if (query.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    // Filter locally from fetched athletes
    const lowerQuery = query.toLowerCase();
    const filtered = athletes.filter((athlete) =>
      `${athlete.first_name} ${athlete.last_name}`.toLowerCase().includes(lowerQuery)
    );
    setResults(filtered.slice(0, 10));
    setShowResults(true);
  }, [query, athletes, selectedAthlete]);

  const handleSelect = (athlete: Athlete) => {
    onSelect(athlete);
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  return (
    <View style={styles.container}>
      {selectedAthlete ? (
        <View style={styles.selectedCard}>
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedName}>
              {selectedAthlete.first_name} {selectedAthlete.last_name}
            </Text>
            <Text style={styles.selectedId}>ID: {selectedAthlete._id}</Text>
          </View>
          <TouchableOpacity onPress={() => onSelect(null as any)}>
            <Ionicons name="close-circle" size={24} color="#C4161C" />
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#999" style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Search athletes by name..."
              value={query}
              onChangeText={setQuery}
              style={styles.searchInput}
            />
          </View>

          {showResults && results.length > 0 && (
            <View style={styles.dropdown}>
              <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                {results.map((athlete, index) => (
                  <TouchableOpacity
                    key={athlete._id}
                    style={[
                      styles.resultItem,
                      index === results.length - 1 && styles.lastResultItem,
                    ]}
                    onPress={() => handleSelect(athlete)}
                  >
                    <Text style={styles.athleteName}>
                      {athlete.first_name} {athlete.last_name}
                    </Text>
                    <Text style={styles.athleteId}>ID: {athlete._id}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {showResults && results.length === 0 && (
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>No athletes found</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
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
  dropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginTop: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    flex: 1,
    overflow: 'hidden',
  },
  dropdownScroll: {
    flexGrow: 1,
  },
  resultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  lastResultItem: {
    borderBottomWidth: 0,
  },
  athleteName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  athleteId: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  selectedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#C4161C',
  },
  selectedInfo: {
    flex: 1,
  },
  selectedName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  selectedId: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  noResults: {
    padding: 16,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    color: '#666',
  },
});

export default AthleteSearchBar;