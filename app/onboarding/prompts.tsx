import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PROMPT_QUESTIONS } from '../../types/database';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/Theme';

interface PromptEntry {
  question: string;
  answer: string;
}

export default function Prompts() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [prompts, setPrompts] = useState<PromptEntry[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState('');

  const usedQuestions = prompts.map(p => p.question);
  const availableQuestions = PROMPT_QUESTIONS.filter(q => !usedQuestions.includes(q));

  const handleSelectQuestion = (question: string) => {
    setSelectedQuestion(question);
    setShowPicker(false);
  };

  const handleSavePrompt = () => {
    if (!selectedQuestion || !currentAnswer.trim()) return;

    if (editingIndex !== null) {
      const updated = [...prompts];
      updated[editingIndex] = { question: selectedQuestion, answer: currentAnswer.trim() };
      setPrompts(updated);
    } else {
      setPrompts([...prompts, { question: selectedQuestion, answer: currentAnswer.trim() }]);
    }
    setSelectedQuestion('');
    setCurrentAnswer('');
    setEditingIndex(null);
  };

  const handleRemovePrompt = (index: number) => {
    setPrompts(prompts.filter((_, i) => i !== index));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.step}>Step 4 of 5</Text>
        <Text style={styles.title}>Your Prompts</Text>
        <Text style={styles.subtitle}>Answer 3 prompts to show your personality. These give matches conversation starters.</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {prompts.map((prompt, index) => (
          <View key={index} style={styles.promptCard}>
            <Text style={styles.promptQuestion}>{prompt.question}</Text>
            <Text style={styles.promptAnswer}>{prompt.answer}</Text>
            <TouchableOpacity onPress={() => handleRemovePrompt(index)} style={styles.removeBtn}>
              <Text style={styles.removeBtnText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))}

        {prompts.length < 3 && (
          <View style={styles.addSection}>
            {selectedQuestion ? (
              <View style={styles.answerSection}>
                <Text style={styles.selectedQuestion}>{selectedQuestion}</Text>
                <Input
                  value={currentAnswer}
                  onChangeText={setCurrentAnswer}
                  placeholder="Your answer..."
                  multiline
                  maxLength={300}
                  numberOfLines={4}
                />
                <View style={styles.answerActions}>
                  <Button title="Save" onPress={handleSavePrompt} size="sm" disabled={!currentAnswer.trim()} />
                  <Button title="Cancel" onPress={() => { setSelectedQuestion(''); setCurrentAnswer(''); }} variant="ghost" size="sm" />
                </View>
              </View>
            ) : (
              <Button
                title="+ Add a Prompt"
                onPress={() => setShowPicker(true)}
                variant="outline"
                size="md"
              />
            )}
          </View>
        )}
      </ScrollView>

      <Modal visible={showPicker} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose a Prompt</Text>
            <TouchableOpacity onPress={() => setShowPicker(false)}>
              <Text style={styles.modalClose}>Close</Text>
            </TouchableOpacity>
          </View>
          <ScrollView>
            {availableQuestions.map((question) => (
              <TouchableOpacity
                key={question}
                style={styles.questionOption}
                onPress={() => handleSelectQuestion(question)}
              >
                <Text style={styles.questionText}>{question}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <View style={styles.footer}>
        <Button
          title="Continue"
          onPress={() => router.push({
            pathname: '/onboarding/verification',
            params: { ...params, prompts: JSON.stringify(prompts) },
          })}
          disabled={prompts.length < 3}
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
    lineHeight: 22,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingTop: 0,
  },
  promptCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  promptQuestion: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  promptAnswer: {
    fontSize: FontSize.md,
    color: Colors.text.primary,
    lineHeight: 22,
  },
  removeBtn: {
    marginTop: Spacing.sm,
    alignSelf: 'flex-end',
  },
  removeBtnText: {
    fontSize: FontSize.sm,
    color: Colors.error,
    fontWeight: FontWeight.medium,
  },
  addSection: {
    marginTop: Spacing.md,
  },
  answerSection: {
    gap: Spacing.sm,
  },
  selectedQuestion: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  answerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  modalClose: {
    fontSize: FontSize.md,
    color: Colors.accent,
    fontWeight: FontWeight.semibold,
  },
  questionOption: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  questionText: {
    fontSize: FontSize.md,
    color: Colors.text.primary,
    lineHeight: 22,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
  },
});
