import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/Theme';
import type { Gender, LookingFor } from '../../types/database';

export default function ProfileBasics() {
  const router = useRouter();
  const { org } = useLocalSearchParams<{ org: string }>();
  const [name, setName] = useState('');
  const [chapterName, setChapterName] = useState('');
  const [lineName, setLineName] = useState('');
  const [lineNumber, setLineNumber] = useState('');
  const [initiationYear, setInitiationYear] = useState('');
  const [occupation, setOccupation] = useState('');
  const [city, setCity] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [lookingFor, setLookingFor] = useState<LookingFor | null>(null);

  // 18+ age gate (App Store requirement for dating apps). The server enforces
  // this too (migration 0008); this is the UX layer.
  const parseDob = (value: string): Date | null => {
    const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return null;
    const [, mm, dd, yyyy] = m;
    const d = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
    if (isNaN(d.getTime()) || d.getMonth() + 1 !== parseInt(mm) || d.getDate() !== parseInt(dd)) return null;
    return d;
  };
  const dob = parseDob(dateOfBirth);
  const age = dob ? Math.floor((Date.now() - dob.getTime()) / 31557600000) : null;
  const dobEntered = dateOfBirth.length === 10;
  const dobValid = dob !== null && age !== null && age >= 18 && age <= 100;
  const dobError = dobEntered && !dobValid
    ? (dob && age !== null && age < 18 ? 'You must be at least 18 to use Divine.' : 'Enter a valid date (MM/DD/YYYY).')
    : undefined;

  const isValid = name.length >= 2 && chapterName.length >= 2 && gender !== null && lookingFor !== null && dobValid;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.step}>Step 2 of 5</Text>
        <Text style={styles.title}>About You</Text>
        <Text style={styles.subtitle}>Tell us about yourself and your Greek life</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Input
          value={name}
          onChangeText={setName}
          label="Display Name"
          placeholder="Your first name"
        />
        <Input
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
          label="Date of Birth"
          placeholder="MM/DD/YYYY"
          keyboardType="number-pad"
          maxLength={10}
          error={dobError}
        />

        <View style={styles.selectorSection}>
          <Text style={styles.selectorLabel}>I am a...</Text>
          <View style={styles.chipGroup}>
            {([
              { key: 'male', label: 'Man' },
              { key: 'female', label: 'Woman' },
              { key: 'non_binary', label: 'Non-binary' },
            ] as { key: Gender; label: string }[]).map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                style={[styles.chip, gender === key && styles.chipActive]}
                onPress={() => setGender(key)}
              >
                <Text style={[styles.chipText, gender === key && styles.chipTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.selectorSection}>
          <Text style={styles.selectorLabel}>I'm interested in...</Text>
          <View style={styles.chipGroup}>
            {([
              { key: 'male', label: 'Men' },
              { key: 'female', label: 'Women' },
              { key: 'everyone', label: 'Everyone' },
            ] as { key: LookingFor; label: string }[]).map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                style={[styles.chip, lookingFor === key && styles.chipActive]}
                onPress={() => setLookingFor(key)}
              >
                <Text style={[styles.chipText, lookingFor === key && styles.chipTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Input
          value={chapterName}
          onChangeText={setChapterName}
          label="Chapter Name"
          placeholder="e.g., Alpha Beta Chapter"
        />
        <Input
          value={lineName}
          onChangeText={setLineName}
          label="Line Name (optional)"
          placeholder="Your line name"
        />
        <Input
          value={lineNumber}
          onChangeText={setLineNumber}
          label="Line Number (optional)"
          placeholder="e.g., 7"
          keyboardType="number-pad"
        />
        <Input
          value={initiationYear}
          onChangeText={setInitiationYear}
          label="Initiation Year"
          placeholder="e.g., 2019"
          keyboardType="number-pad"
          maxLength={4}
        />
        <Input
          value={occupation}
          onChangeText={setOccupation}
          label="Occupation"
          placeholder="What do you do?"
        />
        <Input
          value={city}
          onChangeText={setCity}
          label="City"
          placeholder="Where are you based?"
        />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Continue"
          onPress={() => router.push({
            pathname: '/onboarding/photos',
            params: { org, name, chapterName, lineName, lineNumber, initiationYear, occupation, city, dateOfBirth, gender, lookingFor },
          })}
          disabled={!isValid}
          size="lg"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  step: {
    fontSize: FontSize.sm,
    color: Colors.accent,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingTop: 0,
  },
  selectorSection: {
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  selectorLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  chipGroup: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.gray[300],
    backgroundColor: Colors.white,
  },
  chipActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '15',
  },
  chipText: {
    fontSize: FontSize.md,
    color: Colors.text.secondary,
    fontWeight: FontWeight.medium,
  },
  chipTextActive: {
    color: Colors.accent,
    fontWeight: FontWeight.semibold,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
  },
});
