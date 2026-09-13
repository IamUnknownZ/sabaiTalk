import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';

export function InterestChip({ emoji, label, selected = false, onPress }: { emoji?: string; label: string; selected?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.selected]}>
      {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
      <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { flexDirection: 'row', gap: 6, alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: '#EEF3F7' },
  selected: { backgroundColor: '#DDF0FF' },
  emoji: { fontSize: 13 },
  label: { color: colors.textMuted, fontWeight: '600', fontSize: 12 },
  selectedLabel: { color: colors.navy },
});
