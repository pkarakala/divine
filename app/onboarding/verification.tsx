import { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { moderatePhoto } from '../../lib/photoModeration';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/Theme';
import type { Organization } from '../../types/database';

/** "MM/DD/YYYY" -> "YYYY-MM-DD" (null if malformed). DOB was validated 18+ in
 * profile-basics; the DB trigger (migration 0008) enforces it regardless. */
function parseDobToISO(value: string | undefined): string | null {
  const m = (value || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[1]}-${m[2]}` : null;
}

export default function Verification() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { setOnboarded, fetchProfile } = useAuthStore();
  const [proofUri, setProofUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickProof = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled) {
      setProofUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const userId = session.user.id;

      // Save gender and looking_for to users table
      const gender = params.gender as string || null;
      const lookingFor = params.lookingFor as string || null;
      if (gender || lookingFor) {
        const userUpdate: Record<string, string | null> = {};
        if (gender) userUpdate.gender = gender;
        if (lookingFor) userUpdate.looking_for = lookingFor;
        await supabase.from('users').update(userUpdate).eq('id', userId);
      }

      // Create/update profile
      const { error: profileError } = await supabase.from('profiles').upsert({
        user_id: userId,
        display_name: params.name as string,
        date_of_birth: parseDobToISO(params.dateOfBirth as string),
        organization: params.org as Organization,
        chapter_name: params.chapterName as string,
        line_name: (params.lineName as string) || null,
        line_number: params.lineNumber ? parseInt(params.lineNumber as string) : null,
        initiation_year: params.initiationYear ? parseInt(params.initiationYear as string) : null,
        occupation: (params.occupation as string) || null,
        city: (params.city as string) || null,
        org_preference: 'any_d9',
      });

      if (profileError) throw profileError;

      const photoUris = JSON.parse((params.photoUris as string) || '[]') as string[];
      for (let i = 0; i < photoUris.length; i++) {
        const uri = photoUris[i];
        const fileName = `${userId}/photo_${i}_${Date.now()}.jpg`;
        const response = await fetch(uri);
        const blob = await response.blob();
        await supabase.storage.from('photos').upload(fileName, blob, { contentType: 'image/jpeg' });
        const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(fileName);
        const { data: photoRecord } = await supabase.from('photos').insert({
          user_id: userId,
          storage_path: publicUrl,
          order_index: i,
          is_primary: i === 0,
        }).select().single();

        if (photoRecord) {
          await moderatePhoto(userId, photoRecord.id, publicUrl);
        }
      }

      // Save prompts
      const prompts = JSON.parse((params.prompts as string) || '[]');
      for (let i = 0; i < prompts.length; i++) {
        await supabase.from('prompts').insert({
          user_id: userId,
          prompt_question: prompts[i].question,
          prompt_answer: prompts[i].answer,
          order_index: i,
          type: 'text',
        });
      }

      // Upload verification proof. The verifications bucket is PRIVATE
      // (membership-card PII — see 0002_p0b_storage_hardening.sql, C-3):
      // store the storage path, never a public URL. Admin review generates
      // short-lived signed URLs server-side.
      if (proofUri) {
        const proofFileName = `${userId}/verification_${Date.now()}.jpg`;
        const proofResponse = await fetch(proofUri);
        const proofBlob = await proofResponse.blob();
        const { error: proofUploadError } = await supabase.storage
          .from('verifications')
          .upload(proofFileName, proofBlob, { contentType: 'image/jpeg' });
        if (proofUploadError) throw proofUploadError;
        await supabase.from('verifications').insert({
          user_id: userId,
          organization: params.org as Organization,
          chapter_name: params.chapterName as string,
          proof_type: 'membership_card',
          proof_url: proofFileName,
          status: 'pending',
        });
      }

      await fetchProfile();
      setOnboarded(true);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.step}>Step 5 of 5</Text>
        <Text style={styles.title}>Verify Membership</Text>
        <Text style={styles.subtitle}>
          Upload proof of your D9 membership. This helps us keep Divine exclusive and trusted.
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Accepted Proof</Text>
          <Text style={styles.infoItem}>• Membership card photo</Text>
          <Text style={styles.infoItem}>• Letter of good standing</Text>
          <Text style={styles.infoItem}>• Chapter verification letter</Text>
          <Text style={styles.infoItem}>• Probate/crossing photo with identifiable org</Text>
        </View>

        <Button
          title={proofUri ? "✓ Proof Uploaded" : "Upload Verification"}
          onPress={pickProof}
          variant={proofUri ? 'secondary' : 'outline'}
          size="lg"
        />

        <Text style={styles.note}>
          Verification is reviewed manually within 24-48 hours. You can use the app while pending, but your profile won't appear in discovery until approved.
        </Text>
      </View>

      <View style={styles.footer}>
        <Button
          title="Complete Profile"
          onPress={handleSubmit}
          loading={loading}
          size="lg"
        />
        <Button
          title="Skip for now"
          onPress={handleSubmit}
          variant="ghost"
          size="sm"
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
    lineHeight: 22,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  infoCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  infoTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  infoItem: {
    fontSize: FontSize.md,
    color: Colors.text.secondary,
    lineHeight: 24,
  },
  note: {
    fontSize: FontSize.sm,
    color: Colors.text.light,
    lineHeight: 20,
    textAlign: 'center',
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
    gap: Spacing.sm,
  },
});
