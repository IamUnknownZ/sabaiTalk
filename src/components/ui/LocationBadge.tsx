import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/constants/theme';

export function LocationBadge({ distanceKm, area }: { distanceKm: number; area?: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.pin}>📍</Text>
      <Text style={styles.text}>~{distanceKm.toFixed(1)} km{area ? ` • ${area}` : ''}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs },
  pin: { marginRight: 3, fontSize: 12 },
  text: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
});
