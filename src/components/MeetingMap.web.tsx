import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/constants/theme';

type Destination = {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
};

const demoDestination: Destination = {
  latitude: 13.806,
  longitude: 100.524,
  name: 'Demo public meeting place',
  address: 'Destination only — user origins are intentionally hidden',
};

export function MeetingMap({ destination = demoDestination }: { destination?: Destination }) {
  return (
    <View style={styles.frame}>
      <View style={styles.pin}>
        <Text style={styles.pinEmoji}>📍</Text>
      </View>
      <Text style={styles.title}>{destination.name || 'Public meeting place'}</Text>
      <Text style={styles.address}>
        {destination.address || 'Destination only — user origins are intentionally hidden'}
      </Text>
      <Text style={styles.note}>Interactive map preview is available in the mobile app.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    height: 250,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: '#EAF7FF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.xs,
  },
  pin: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    marginBottom: spacing.xs,
  },
  pinEmoji: { fontSize: 30 },
  title: { fontSize: typography.heading, fontWeight: '700', color: colors.text, textAlign: 'center' },
  address: { fontSize: typography.body, color: colors.textMuted, textAlign: 'center' },
  note: { fontSize: typography.caption, color: colors.primaryStrong, textAlign: 'center', marginTop: spacing.sm },
});
