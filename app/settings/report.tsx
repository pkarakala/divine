import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/Theme';

const REASONS = [
  { key: 'inappropriate', label: 'Inappropriate content', description: 'Photos or text that violate community guidelines' },
  { key: 'spam', label: 'Spam or scam', description: 'Fake profile, bot, or trying to sell something' },
  { key: 'fake', label: 'Fake profile', description: 'Not a real D9 member or using someone else\'s photos' },
  { key: 'harassment', label: 'Harassment', description: 'Unwanted, aggressive, or threatening behavior' },
  { key: 'other', label: 'Other', description: 'Something else that makes you uncomfortable' },
];

export default function Report() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user } = useAuthStore();
  const [selectedReason, setSelectedReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !userId || !selectedReason) return;
    setSubmitting(true);

    const { error } = await supabase.from('reports').insert({
      reporter_id: user.id,
      reported_id: userId,
      reason: selectedReason,
      details: details || null,
    });

    setSubmitting(false);

    if (error) {
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } else {
      Alert.alert('Report Submitted', 'Thank you for helping keep Divine safe. We\'ll review this within 24 hours.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  };

  const handleBlock = async () => {
    Alert.alert('Block User', 'They won\'t be able to see your profile or message you. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: async () => {
          if (!user || !userId) return;
          await supabase.from('reports').insert({
            reporter_id: user.id,
            reported_id: userId,
            reason: 'other',
            details: 'User blocked',
            status: 'actioned',
          });
          Alert.alert('Blocked', 'This user has been blocked.');
          router.back();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Report</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>Why are you reporting this person?</Text>

        {REASONS.map((reason) => (
          <TouchableOpacity
            key={reason.key}
            style={[styles.reasonCard, selectedReason === reason.key && styles.reasonActive]}
            onPress={() => setSelectedReason(reason.key)}
          >
            <Text style={[styles.reasonLabel, selectedReason === reason.key && styles.reasonLabelActive]}>{reason.label}</Text>
            <Text style={styles.reasonDesc}>{reason.description}</Text>
          </TouchableOpacity>
        ))}

        {selectedReason && (
          <Input
            value={details}
            onChangeText={setDetails}
            label="Additional details (optional)"
            placeholder="Tell us more about what happened..."
            multiline
            maxLength={500}
          />
        )}

        <Button
          title="Submit Report"
          onPress={handleSubmit}
          disabled={!selectedReason}
          loading={submitting}
          size="lg"
          style={{ marginTop: Spacing.md }}
        />

        <Button
          title="Block This User"
          onPress={handleBlock}
          variant="outline"
          size="md"
          style={{ marginTop: Spacing.md, borderColor: Colors.error }}
          textStyle={{ color: Colors.error }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md },
  backBtn: { fontSize: FontSize.md, color: Colors.primary, fontWeight: FontWeight.semibold },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text.primary },
  content: { padding: Spacing.lg },
  subtitle: { fontSize: FontSize.md, color: Colors.text.secondary, marginBottom: Spacing.md },
  reasonCard: { padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.gray[200], marginBottom: Spacing.sm },
  reasonActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '08' },
  reasonLabel: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text.primary },
  reasonLabelActive: { color: Colors.primary },
  reasonDesc: { fontSize: FontSize.sm, color: Colors.text.secondary, marginTop: 2 },
});
