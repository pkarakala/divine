import { View, StyleSheet, Dimensions } from 'react-native';
import { Skeleton } from './ui/Skeleton';
import { Colors, Spacing, BorderRadius } from '../constants/Theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - Spacing.lg * 2;

export function ProfileCardSkeleton() {
  return (
    <View style={styles.container}>
      <Skeleton
        width={CARD_WIDTH}
        height={CARD_WIDTH * (4 / 3)}
        borderRadius={BorderRadius.lg}
      />
      <View style={styles.info}>
        <Skeleton width={150} height={24} borderRadius={4} />
        <Skeleton width={100} height={20} borderRadius={BorderRadius.sm} />
        <Skeleton width="100%" height={100} borderRadius={BorderRadius.md} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  info: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
});
