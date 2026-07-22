import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { ORGANIZATIONS, Organization } from '../../types/database';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/Theme';

export default function OrgSelect() {
  const router = useRouter();
  const [selected, setSelected] = useState<Organization | null>(null);

  const orgs = Object.entries(ORGANIZATIONS) as [Organization, typeof ORGANIZATIONS[Organization]][];
  const fraternities = orgs.filter(([_, o]) => o.type === 'fraternity');
  const sororities = orgs.filter(([_, o]) => o.type === 'sorority');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.step}>Step 1 of 5</Text>
        <Text style={styles.title}>Your Organization</Text>
        <Text style={styles.subtitle}>Select your Divine 9 organization</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Fraternities</Text>
        {fraternities.map(([key, org]) => (
          <TouchableOpacity
            key={key}
            style={[styles.orgCard, selected === key && { borderColor: org.color, backgroundColor: org.color + '10' }]}
            onPress={() => setSelected(key)}
            activeOpacity={0.7}
          >
            <View style={[styles.orgDot, { backgroundColor: org.color }]} />
            <View style={styles.orgInfo}>
              <Text style={styles.orgName}>{org.name}</Text>
              <Text style={styles.orgYear}>Founded {org.founded}</Text>
            </View>
            {selected === key && <Text style={styles.check}>✓</Text>}
          </TouchableOpacity>
        ))}

        <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>Sororities</Text>
        {sororities.map(([key, org]) => (
          <TouchableOpacity
            key={key}
            style={[styles.orgCard, selected === key && { borderColor: org.color, backgroundColor: org.color + '10' }]}
            onPress={() => setSelected(key)}
            activeOpacity={0.7}
          >
            <View style={[styles.orgDot, { backgroundColor: org.color }]} />
            <View style={styles.orgInfo}>
              <Text style={styles.orgName}>{org.name}</Text>
              <Text style={styles.orgYear}>Founded {org.founded}</Text>
            </View>
            {selected === key && <Text style={styles.check}>✓</Text>}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Continue"
          onPress={() => router.push({ pathname: '/onboarding/profile-basics', params: { org: selected } })}
          disabled={!selected}
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
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  orgCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.gray[200],
    marginBottom: Spacing.sm,
  },
  orgDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.md,
  },
  orgInfo: {
    flex: 1,
  },
  orgName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
  },
  orgYear: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  check: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.success,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
  },
});
