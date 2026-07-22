import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/Theme';
import {
  getAllAssignments,
  getExperimentConfig,
  overrideVariant,
  resetExperiments,
} from '../../lib/experiments';

export default function ExperimentsScreen() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Record<string, string>>({});

  const experimentIds = [
    'scoring_weights_v1',
    'daily_likes_limit',
    'match_expiry_days',
    'discovery_feed_style',
  ];

  const loadAssignments = async () => {
    const data = await getAllAssignments();
    setAssignments(data);
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  const handleOverride = (experimentId: string) => {
    const config = getExperimentConfig(experimentId);
    if (!config) return;

    Alert.alert(
      config.name,
      'Select variant:',
      [
        ...config.variants.map(v => ({
          text: v,
          onPress: async () => {
            await overrideVariant(experimentId, v);
            loadAssignments();
          },
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ]
    );
  };

  const handleReset = () => {
    Alert.alert('Reset Experiments', 'Clear all experiment assignments?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          await resetExperiments();
          setAssignments({});
        },
      },
    ]);
  };

  if (!__DEV__) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Experiments</Text>
          <View style={{ width: 50 }} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Only available in dev mode</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Experiments</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {experimentIds.map(id => {
          const config = getExperimentConfig(id);
          if (!config) return null;
          const current = assignments[id];

          return (
            <TouchableOpacity
              key={id}
              style={styles.experimentCard}
              onPress={() => handleOverride(id)}
            >
              <Text style={styles.experimentName}>{config.name}</Text>
              <Text style={styles.experimentId}>{id}</Text>
              <View style={styles.variantRow}>
                <Text style={styles.variantLabel}>Current:</Text>
                <View style={[styles.variantBadge, current ? styles.variantActive : styles.variantInactive]}>
                  <Text style={styles.variantText}>{current || 'not assigned'}</Text>
                </View>
              </View>
              <View style={styles.allVariants}>
                {config.variants.map((v, i) => (
                  <Text key={v} style={styles.variantOption}>
                    {v} ({Math.round(config.weights[i] * 100)}%)
                  </Text>
                ))}
              </View>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Text style={styles.resetText}>Reset All Experiments</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  backBtn: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  experimentCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  experimentName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  experimentId: {
    fontSize: FontSize.xs,
    color: Colors.text.light,
    fontFamily: 'SpaceMono',
    marginBottom: Spacing.sm,
  },
  variantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  variantLabel: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },
  variantBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  variantActive: {
    backgroundColor: Colors.accent,
  },
  variantInactive: {
    backgroundColor: Colors.gray[200],
  },
  variantText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
  },
  allVariants: {
    gap: 2,
  },
  variantOption: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
  },
  resetButton: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.error,
    alignItems: 'center',
  },
  resetText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.error,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.text.light,
  },
});
