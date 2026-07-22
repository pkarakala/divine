import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Colors, FontSize, FontWeight, Spacing } from '../../constants/Theme';

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

  const isValid = name.length >= 2 && chapterName.length >= 2;

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
        />
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
            params: { org, name, chapterName, lineName, lineNumber, initiationYear, occupation, city, dateOfBirth },
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
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
  },
});
