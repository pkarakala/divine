import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/Theme';

export default function WeMet() {
  const router = useRouter();
  const { matchId, name } = useLocalSearchParams<{ matchId: string; name: string }>();
  const [met, setMet] = useState<boolean | null>(null);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (met === null) return;
    setSubmitting(true);

    await supabase.from('matches').update({
      we_met: met,
      we_met_feedback: feedback || null,
    }).eq('id', matchId);

    setSubmitting(false);
    Alert.alert(
      met ? 'Amazing!' : 'Thanks for letting us know',
      met
        ? 'We love hearing about connections that happen on Divine!'
        : 'Your feedback helps us improve our matching.',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Did you meet{'\n'}{name}?</Text>
        <Text style={styles.subtitle}>Your answer helps us improve matches for everyone.</Text>

        <View style={styles.options}>
          <TouchableOpacity
            style={[styles.optionCard, met === true && styles.optionActive]}
            onPress={() => setMet(true)}
          >
            <Text style={styles.optionEmoji}>🎉</Text>
            <Text style={[styles.optionText, met === true && styles.optionTextActive]}>Yes, we met!</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionCard, met === false && styles.optionActive]}
            onPress={() => setMet(false)}
          >
            <Text style={styles.optionEmoji}>👋</Text>
            <Text style={[styles.optionText, met === false && styles.optionTextActive]}>Not yet</Text>
          </TouchableOpacity>
        </View>

        {met !== null && (
          <Input
            value={feedback}
            onChangeText={setFeedback}
            label={met ? "How was it? (optional)" : "What happened? (optional)"}
            placeholder={met ? "Tell us about your date!" : "Any feedback on this match?"}
            multiline
            maxLength={300}
          />
        )}

        <Button
          title="Submit"
          onPress={handleSubmit}
          disabled={met === null}
          loading={submitting}
          size="lg"
          style={{ marginTop: Spacing.lg }}
        />

        <Button
          title="Skip"
          onPress={() => router.back()}
          variant="ghost"
          size="sm"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: { flex: 1, padding: Spacing.lg, justifyContent: 'center' },
  title: { fontSize: FontSize.xxxl, fontWeight: FontWeight.bold, color: Colors.text.primary, textAlign: 'center' },
  subtitle: { fontSize: FontSize.md, color: Colors.text.secondary, textAlign: 'center', marginTop: Spacing.sm, marginBottom: Spacing.xl },
  options: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  optionCard: { flex: 1, padding: Spacing.lg, borderRadius: BorderRadius.lg, borderWidth: 2, borderColor: Colors.gray[200], alignItems: 'center', gap: Spacing.sm },
  optionActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '10' },
  optionEmoji: { fontSize: 32 },
  optionText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text.secondary },
  optionTextActive: { color: Colors.accent },
});
