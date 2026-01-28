import React from 'react';
import { View, Text, TextInput, StyleSheet, useWindowDimensions } from 'react-native';

interface ScoreInputProps {
  value: { minutes: string; seconds: string; milliseconds: string };
  onChange: (value: { minutes: string; seconds: string; milliseconds: string }) => void;
  errors: string[];
}
const ScoreInput: React.FC<ScoreInputProps> = ({ value, onChange, errors }) => {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 360;

  const inputWidth = isSmallScreen ? Math.min(Math.floor((width - 40) / 3.5), 100): Math.max(Math.floor((width - 40) / 3.5), 100);
  const inputPadding = isSmallScreen ? 8 : 12;
  const separatorMargin = isSmallScreen ? 4 : 8;

  return (
    <View style={styles.container}>
      <View style={styles.scoreInputContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Minutes</Text>
          <TextInput
            style={[
              styles.input,
              { width: inputWidth, padding: inputPadding },
              errors.length > 0 && styles.inputError
            ]}
            value={value.minutes}
            onChangeText={(min) => onChange({ ...value, minutes: min })}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="00"
          />
        </View>

        <Text style={[styles.separator, { marginHorizontal: separatorMargin }]}>:</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Seconds</Text>
          <TextInput
            style={[
              styles.input,
              { width: inputWidth, padding: inputPadding },
              errors.length > 0 && styles.inputError
            ]}
            value={value.seconds}
            onChangeText={(sec) => onChange({ ...value, seconds: sec })}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="00"
          />
        </View>

        <Text style={[styles.separator, { marginHorizontal: separatorMargin }]}>.</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>MS</Text>
          <TextInput
            style={[
              styles.input,
              { width: inputWidth, padding: inputPadding },
              errors.length > 0 && styles.inputError
            ]}
            value={value.milliseconds}
            onChangeText={(ms) => onChange({ ...value, milliseconds: ms })}
            keyboardType="number-pad"
            maxLength={3}
            placeholder="000"
          />
        </View>
      </View>

      {errors.length > 0 && (
        <View style={styles.errorsContainer}>
          {errors.map((error, index) => (
            <Text key={index} style={styles.errorText}>
              • {error}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  scoreInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputGroup: {
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputError: {
    borderColor: '#C4161C',
    borderWidth: 2,
  },
  separator: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginTop: 20,
  },
  errorsContainer: {
    marginTop: 8,
    paddingHorizontal: 12,
  },
  errorText: {
    color: '#C4161C',
    fontSize: 14,
    marginTop: 4,
  },
});

export default ScoreInput;