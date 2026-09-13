import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';

export function MatchScoreBadge({ score }: { score: number }) {
  return <View style={styles.badge}><Text style={styles.text}>{score}% vibe</Text></View>;
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: spacing.lg, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: colors.primaryStrong },
  text: { color: colors.surface, fontSize: 12, fontWeight: '700' },
});
