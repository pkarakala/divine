import { View, Text, StyleSheet } from 'react-native';
import { ORGANIZATIONS, Organization } from '../../types/database';
import { Colors, BorderRadius, FontSize, Spacing } from '../../constants/Theme';

interface OrgBadgeProps {
  organization: Organization;
  size?: 'sm' | 'md' | 'lg';
  showFullName?: boolean;
}

export function OrgBadge({ organization, size = 'md', showFullName = false }: OrgBadgeProps) {
  const org = ORGANIZATIONS[organization];
  if (!org) return null;

  const abbreviation = org.name
    .split(' ')
    .map(w => w[0])
    .join('');

  return (
    <View
      style={[styles.badge, styles[`badge_${size}`], { backgroundColor: org.color + '20', borderColor: org.color }]}
      accessibilityLabel={`${org.name} badge`}
    >
      <Text style={[styles.text, styles[`text_${size}`], { color: org.color }]}>
        {showFullName ? org.name : abbreviation}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    alignSelf: 'flex-start',
  },
  badge_sm: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  badge_md: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  badge_lg: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  text: {
    fontWeight: '700',
  },
  text_sm: {
    fontSize: FontSize.xs,
  },
  text_md: {
    fontSize: FontSize.sm,
  },
  text_lg: {
    fontSize: FontSize.md,
  },
});
