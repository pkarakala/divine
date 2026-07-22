import { View, StyleSheet } from 'react-native';
import { Skeleton } from './ui/Skeleton';
import { Colors, Spacing, BorderRadius } from '../constants/Theme';

function MatchRowSkeleton() {
  return (
    <View style={styles.row}>
      <Skeleton width={60} height={60} borderRadius={30} />
      <View style={styles.lines}>
        <Skeleton width={120} height={16} borderRadius={4} />
        <Skeleton width={180} height={14} borderRadius={4} />
      </View>
    </View>
  );
}

export function MatchListSkeleton() {
  return (
    <View style={styles.container}>
      {Array.from({ length: 5 }).map((_, i) => (
        <MatchRowSkeleton key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  lines: {
    flex: 1,
    marginLeft: Spacing.md,
    gap: Spacing.sm,
  },
});
