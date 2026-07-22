import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Modal, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { OrgBadge } from '../../components/ui/OrgBadge';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { moderatePhoto } from '../../lib/photoModeration';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/Theme';
import { PROMPT_QUESTIONS } from '../../types/database';
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
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [editingAnswer, setEditingAnswer] = useState('');
  const [showQuestionPicker, setShowQuestionPicker] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');

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
      const { data: photoRecord } = await supabase.from('photos').insert({
        user_id: user.id,
        storage_path: publicUrl,
        order_index: photos.length,
        is_primary: photos.length === 0,
      }).select().single();

      if (photoRecord) {
        const moderation = await moderatePhoto(user.id, photoRecord.id, publicUrl);
        if (moderation.status === 'rejected') {
          Alert.alert('Photo removed', "This photo doesn't meet our community guidelines.");
        } else if (moderation.status === 'flagged') {
          Alert.alert('Under review', 'Your photo is being reviewed and will be visible shortly.');
        }
      }

      loadProfileData();
    }
  };

  const removePhoto = async (photoId: string) => {
    await supabase.from('photos').delete().eq('id', photoId);
    loadProfileData();
  };

  const startEditPrompt = (prompt: Prompt) => {
    setEditingPromptId(prompt.id);
    setEditingAnswer(prompt.prompt_answer);
  };

  const cancelEditPrompt = () => {
    setEditingPromptId(null);
    setEditingAnswer('');
  };

  const saveEditPrompt = async (promptId: string) => {
    if (!editingAnswer.trim()) return;
    await supabase.from('prompts').update({ prompt_answer: editingAnswer.trim() }).eq('id', promptId);
    setPrompts(prompts.map(p => p.id === promptId ? { ...p, prompt_answer: editingAnswer.trim() } : p));
    setEditingPromptId(null);
    setEditingAnswer('');
  };

  const removePrompt = async (promptId: string) => {
    await supabase.from('prompts').delete().eq('id', promptId);
    setPrompts(prompts.filter(p => p.id !== promptId));
  };

  const handleAddPrompt = async () => {
    if (!user || !selectedQuestion || !newAnswer.trim()) return;
    const { data } = await supabase.from('prompts').insert({
      user_id: user.id,
      prompt_question: selectedQuestion,
      prompt_answer: newAnswer.trim(),
      order_index: prompts.length,
      type: 'text',
    }).select().single();
    if (data) {
      setPrompts([...prompts, data]);
    }
    setShowQuestionPicker(false);
    setSelectedQuestion('');
    setNewAnswer('');
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
        {prompts.map((prompt) => (
          <View key={prompt.id} style={styles.promptCard}>
            <Text style={styles.promptQuestion}>{prompt.prompt_question}</Text>
            {editingPromptId === prompt.id ? (
              <View>
                <Input
                  value={editingAnswer}
                  onChangeText={setEditingAnswer}
                  multiline
                  maxLength={200}
                  placeholder="Your answer..."
                />
                <View style={styles.promptActions}>
                  <TouchableOpacity style={styles.promptActionBtn} onPress={() => saveEditPrompt(prompt.id)}>
                    <Text style={styles.promptSaveText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.promptActionBtn} onPress={cancelEditPrompt}>
                    <Text style={styles.promptCancelText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View>
                <Text style={styles.promptAnswer}>{prompt.prompt_answer}</Text>
                <View style={styles.promptActions}>
                  <TouchableOpacity style={styles.promptActionBtn} onPress={() => startEditPrompt(prompt)}>
                    <Text style={styles.promptEditText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.promptActionBtn} onPress={() => removePrompt(prompt.id)}>
                    <Text style={styles.promptRemoveText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ))}

        {prompts.length < 3 && (
          <TouchableOpacity style={styles.addPromptBtn} onPress={() => setShowQuestionPicker(true)}>
            <Text style={styles.addPromptText}>+ Add Prompt</Text>
          </TouchableOpacity>
        )}

        <Button title="Save Changes" onPress={handleSave} loading={saving} size="lg" style={{ marginTop: Spacing.lg }} />
      </ScrollView>

      <Modal visible={showQuestionPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {!selectedQuestion ? (
              <>
                <Text style={styles.modalTitle}>Choose a Prompt</Text>
                <FlatList
                  data={PROMPT_QUESTIONS.filter(q => !prompts.some(p => p.prompt_question === q))}
                  keyExtractor={(item) => item}
                  style={styles.questionList}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.questionRow} onPress={() => setSelectedQuestion(item)}>
                      <Text style={styles.questionText}>{item}</Text>
                    </TouchableOpacity>
                  )}
                />
                <Button title="Cancel" variant="ghost" onPress={() => setShowQuestionPicker(false)} />
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>{selectedQuestion}</Text>
                <Input
                  value={newAnswer}
                  onChangeText={setNewAnswer}
                  placeholder="Write your answer..."
                  multiline
                  maxLength={200}
                />
                <View style={styles.modalActions}>
                  <Button title="Save Prompt" onPress={handleAddPrompt} size="md" />
                  <Button title="Back" variant="ghost" onPress={() => { setSelectedQuestion(''); setNewAnswer(''); }} size="sm" />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  promptActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
  promptActionBtn: { paddingVertical: Spacing.xs },
  promptEditText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.primary },
  promptRemoveText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.error },
  promptSaveText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.primary },
  promptCancelText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text.secondary },
  addPromptBtn: { backgroundColor: Colors.gray[50], borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1.5, borderColor: Colors.gray[300], borderStyle: 'dashed', alignItems: 'center' },
  addPromptText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.primary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.lg, paddingBottom: Spacing.xxl, maxHeight: '70%' },
  modalTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text.primary, marginBottom: Spacing.md },
  modalActions: { gap: Spacing.sm, marginTop: Spacing.md },
  questionList: { marginBottom: Spacing.md },
  questionRow: { paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  questionText: { fontSize: FontSize.md, color: Colors.text.primary, lineHeight: 22 },
});
