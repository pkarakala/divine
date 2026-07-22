import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

interface Experiment {
  id: string;
  name: string;
  variants: string[];
  weights: number[];
}

interface UserAssignment {
  experimentId: string;
  variant: string;
  assignedAt: string;
}

const STORAGE_KEY = 'divine:experiments';

const EXPERIMENTS: Experiment[] = [
  {
    id: 'scoring_weights_v1',
    name: 'Scoring algorithm weights',
    variants: ['control', 'high_reciprocal', 'high_demographic'],
    weights: [0.5, 0.25, 0.25],
  },
  {
    id: 'daily_likes_limit',
    name: 'Daily like limit',
    variants: ['8_likes', '5_likes', '12_likes'],
    weights: [0.34, 0.33, 0.33],
  },
  {
    id: 'match_expiry_days',
    name: 'Match expiry duration',
    variants: ['7_days', '3_days', '14_days'],
    weights: [0.5, 0.25, 0.25],
  },
  {
    id: 'discovery_feed_style',
    name: 'Feed presentation',
    variants: ['single_card', 'stack_preview'],
    weights: [0.7, 0.3],
  },
];

function weightedRandom(weights: number[]): number {
  const total = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    random -= weights[i];
    if (random <= 0) return i;
  }
  return weights.length - 1;
}

async function getAssignments(): Promise<Record<string, UserAssignment>> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : {};
}

async function saveAssignments(assignments: Record<string, UserAssignment>) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
}

export async function getVariant(experimentId: string): Promise<string> {
  const assignments = await getAssignments();

  if (assignments[experimentId]) {
    return assignments[experimentId].variant;
  }

  const experiment = EXPERIMENTS.find(e => e.id === experimentId);
  if (!experiment) return 'control';

  const variantIndex = weightedRandom(experiment.weights);
  const variant = experiment.variants[variantIndex];

  assignments[experimentId] = {
    experimentId,
    variant,
    assignedAt: new Date().toISOString(),
  };
  await saveAssignments(assignments);

  return variant;
}

export async function getAllAssignments(): Promise<Record<string, string>> {
  const assignments = await getAssignments();
  const result: Record<string, string> = {};
  Object.entries(assignments).forEach(([id, a]) => {
    result[id] = a.variant;
  });
  return result;
}

export async function trackExperimentEvent(
  experimentId: string,
  event: string,
  metadata?: Record<string, any>
) {
  const variant = await getVariant(experimentId);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  await supabase.from('analytics_events').insert({
    user_id: session.user.id,
    event_type: 'session_start' as any,
    metadata: {
      experiment_id: experimentId,
      variant,
      experiment_event: event,
      ...metadata,
    },
  });
}

export function getExperimentConfig(experimentId: string): Experiment | undefined {
  return EXPERIMENTS.find(e => e.id === experimentId);
}

export async function overrideVariant(experimentId: string, variant: string) {
  const assignments = await getAssignments();
  assignments[experimentId] = {
    experimentId,
    variant,
    assignedAt: new Date().toISOString(),
  };
  await saveAssignments(assignments);
}

export async function resetExperiments() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
