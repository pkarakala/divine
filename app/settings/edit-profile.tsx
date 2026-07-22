import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { OrgBadge } from '../../components/ui/OrgBadge';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/Theme';
import type { Photo, Prompt } from '../../types/database';

export default function EditProfile() {
  const router = useRouter();
  const { user, profile, fetchProfile } = useAuthStore();
  const [name, setName] = useState(profile?.display_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [occupation, setOccupation] = useState(profile?.occupation || '');
  const [employer, setEmployer] = useState(profile?.employer || '');
  const [city, setCity] = useState(profile?.city || '');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    if (!user) return;
    const [photosRes, promptsRes] = await Promise.all([
      supabase.from('photos').select('*').eq('user_id', user.id).order('order_index'),
      supabase.from('prompts').select('*').eq('user_id', user.id).order('order_index'),
    ]);
    setPhotos(photosRes.data || []);
    setPrompts(promptsRes.data || []);
  };

  const addPhoto = async () => {
    if (photos.length >= 6) {
      Alert.alert('Maximum photos', 'You can have up to 6 photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!result.canceled && user) {
      const uri = result.assets[0].uri;
      const fileName = `${user.id}/photo_${photos.length}_${Date.now()}.jpg`;
      const response = await fetch(uri);
      const blob = await response.blob();
      await supabase.storage.from('photos').upload(fileName, blob, { contentType: 'image/jpeg' });
      const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(fileName);
      await supabase.from('photos').insert({
        user_id: user.id,
        storage_path: publicUrl,
        order_index: photos.length,
        is_primary: photos.length === 0,
      });
      loadProfileData();
    }
  };

  const removePhoto = async (photoId: string) => {
    await supabase.from('photos').delete().eq('id', photoId);
    loadProfileData();
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      display_name: name,
      bio,
      occupation,
      employer,
      city,
    }).eq('user_id', user.id);

    if (error) {
      Alert.alert('Error', 'Failed to save profile.');
    } else {
      await fetchProfile();
      Alert.alert('Saved', 'Your profile has been updated.');
      router.back();
    }
    setSaving(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Photos</Text>
        <View style={styles.photoGrid}>
          {photos.map((photo) => (
            <TouchableOpacity key={photo.id} style={styles.photoSlot} onPress={() => removePhoto(photo.id)}>
              <Image source={{ uri: photo.storage_path }} style={styles.photoImage} />
              <View style={styles.removeIcon}>
                <Text style={styles.removeText}>×</Text>
              </View>
            </TouchableOpacity>
          ))}
          {photos.length < 6 && (
            <TouchableOpacity style={[styles.photoSlot, styles.addSlot]} onPress={addPhoto}>
              <Text style={styles.addIcon}>+</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.sectionTitle}>About</Text>
        <Input value={name} onChangeText={setName} label="Display Name" placeholder="Your first name" />
        <Input value={bio} onChangeText={setBio} label="Bio" placeholder="Short bio..." multiline maxLength={150} />
        <Input value={occupation} onChangeText={setOccupation} label="Occupation" placeholder="What do you do?" />
        <Input value={employer} onChangeText={setEmployer} label="Employer" placeholder="Where do you work?" />
        <Input value={city} onChangeText={setCity} label="City" placeholder="Where are you based?" />

        {profile?.organization && (
          <View style={styles.orgSection}>
            <Text style={styles.sectionTitle}>Organization</Text>
            <OrgBadge organization={profile.organization} showFullName size="md" />
            <Text style={styles.chapterText}>{profile.chapter_name}</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Prompts</Text>
        {prompts.map((prompt, index) => (
          <View key={prompt.id} style={styles.promptCard}>
            <Text style={styles.promptQuestion}>{prompt.prompt_question}</Text>
            <Text style={styles.promptAnswer}>{prompt.prompt_answer}</Text>
          </View>
        ))}

        <Button title="Save Changes" onPress={handleSave} loading={saving} size="lg" style={{ marginTop: Spacing.lg }} />
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
  sectionTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text.secondary, textTransform: 'uppercase', letterSpacing: 1, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  photoSlot: { width: '31%', aspectRatio: 3 / 4, borderRadius: BorderRadius.md, overflow: 'hidden' },
  photoImage: { width: '100%', height: '100%' },
  addSlot: { backgroundColor: Colors.gray[100], borderWidth: 2, borderColor: Colors.gray[300], borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  addIcon: { fontSize: 32, color: Colors.gray[400] },
  removeIcon: { position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.error, justifyContent: 'center', alignItems: 'center' },
  removeText: { color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold },
  orgSection: { gap: Spacing.sm },
  chapterText: { fontSize: FontSize.sm, color: Colors.text.secondary },
  promptCard: { backgroundColor: Colors.gray[50], borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm },
  promptQuestion: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text.secondary, marginBottom: Spacing.xs },
  promptAnswer: { fontSize: FontSize.md, color: Colors.text.primary, lineHeight: 22 },
});
