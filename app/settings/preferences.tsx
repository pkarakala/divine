import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/Theme';
import type { Gender, LookingFor, OrgPreference } from '../../types/database';

export default function Preferences() {
  const router = useRouter();
  const { user, profile, fetchProfile } = useAuthStore();
  const [lookingFor, setLookingFor] = useState<LookingFor>(user?.looking_for || 'everyone');
  const [ageMin, setAgeMin] = useState(22);
  const [ageMax, setAgeMax] = useState(40);
  const [maxDistance, setMaxDistance] = useState(50);
  const [orgPreference, setOrgPreference] = useState<OrgPreference>(profile?.org_preference || 'any_d9');
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    await supabase.from('users').update({ looking_for: lookingFor }).eq('id', user.id);
    await supabase.from('profiles').update({ org_preference: orgPreference }).eq('user_id', user.id);
    await fetchProfile();

    setSaving(false);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Preferences</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>I'm looking for</Text>
        <View style={styles.optionGroup}>
          {(['male', 'female', 'everyone'] as LookingFor[]).map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.chip, lookingFor === option && styles.chipActive]}
              onPress={() => setLookingFor(option)}
            >
              <Text style={[styles.chipText, lookingFor === option && styles.chipTextActive]}>
                {option === 'male' ? 'Men' : option === 'female' ? 'Women' : 'Everyone'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Age Range</Text>
        <View style={styles.rangeRow}>
          <View style={styles.rangeControl}>
            <TouchableOpacity onPress={() => setAgeMin(Math.max(18, ageMin - 1))} style={styles.rangeBtn}>
              <Text style={styles.rangeBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.rangeValue}>{ageMin}</Text>
            <TouchableOpacity onPress={() => setAgeMin(Math.min(ageMax - 1, ageMin + 1))} style={styles.rangeBtn}>
              <Text style={styles.rangeBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.rangeSeparator}>to</Text>
          <View style={styles.rangeControl}>
            <TouchableOpacity onPress={() => setAgeMax(Math.max(ageMin + 1, ageMax - 1))} style={styles.rangeBtn}>
              <Text style={styles.rangeBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.rangeValue}>{ageMax}</Text>
            <TouchableOpacity onPress={() => setAgeMax(Math.min(65, ageMax + 1))} style={styles.rangeBtn}>
              <Text style={styles.rangeBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Maximum Distance</Text>
        <View style={styles.distanceRow}>
          <TouchableOpacity onPress={() => setMaxDistance(Math.max(5, maxDistance - 5))} style={styles.rangeBtn}>
            <Text style={styles.rangeBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.distanceValue}>{maxDistance} miles</Text>
          <TouchableOpacity onPress={() => setMaxDistance(Math.min(200, maxDistance + 5))} style={styles.rangeBtn}>
            <Text style={styles.rangeBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Organization Preference</Text>
        <View style={styles.optionGroup}>
          {([
            { key: 'any_d9', label: 'All D9' },
            { key: 'same_org', label: 'Same Org' },
            { key: 'no_preference', label: 'No Preference' },
          ] as { key: OrgPreference; label: string }[]).map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[styles.chip, orgPreference === key && styles.chipActive]}
              onPress={() => setOrgPreference(key)}
            >
              <Text style={[styles.chipText, orgPreference === key && styles.chipTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Other</Text>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Show verified members only</Text>
          <Switch value={showVerifiedOnly} onValueChange={setShowVerifiedOnly} trackColor={{ true: Colors.accent }} />
        </View>

        <Button title="Save Preferences" onPress={handleSave} loading={saving} size="lg" style={{ marginTop: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md },
  backBtn: { fontSize: FontSize.md, color: Colors.primary, fontWeight: FontWeight.semibold },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text.primary },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl * 2 },
  sectionTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text.secondary, textTransform: 'uppercase', letterSpacing: 1, marginTop: Spacing.lg, marginBottom: Spacing.md },
  optionGroup: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.gray[300], backgroundColor: Colors.white },
  chipActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '15' },
  chipText: { fontSize: FontSize.md, color: Colors.text.secondary, fontWeight: FontWeight.medium },
  chipTextActive: { color: Colors.accent, fontWeight: FontWeight.semibold },
  rangeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  rangeControl: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  rangeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.gray[100], justifyContent: 'center', alignItems: 'center' },
  rangeBtnText: { fontSize: 20, fontWeight: FontWeight.bold, color: Colors.text.primary },
  rangeValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text.primary, minWidth: 40, textAlign: 'center' },
  rangeSeparator: { fontSize: FontSize.md, color: Colors.text.light },
  distanceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  distanceValue: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text.primary, minWidth: 100, textAlign: 'center' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.md },
  toggleLabel: { fontSize: FontSize.md, color: Colors.text.primary },
});
