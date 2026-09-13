import { useEffect } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import type { UserProfile } from '@/types/domain';
import { colors, radius, spacing } from '@/constants/theme';

export function NearbyRadar({
  profiles,
  radiusKm,
  onSelect,
}: {
  profiles: UserProfile[];
  radiusKm: number;
  onSelect?: (profile: UserProfile) => void;
}) {
  const pulse = useSharedValue(0);
  const sweep = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }),
      -1,
      false,
    );
    sweep.value = withRepeat(
      withTiming(1, { duration: 3200, easing: Easing.linear }),
      -1,
      false,
    );
  }, [pulse, sweep]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.55 * (1 - pulse.value),
    transform: [{ scale: 0.72 + pulse.value * 0.42 }],
  }));

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sweep.value * 360}deg` }],
  }));

  return (
    <View style={styles.shell}>
      <View style={styles.radar}>
        <View style={[styles.ring, styles.outer]} />
        <View style={[styles.ring, styles.middle]} />
        <View style={[styles.ring, styles.inner]} />
        <Animated.View style={[styles.pulse, pulseStyle]} />
        <Animated.View style={[styles.sweep, sweepStyle]}>
          <View style={styles.sweepLine} />
        </Animated.View>
        <View style={styles.center}>
          <Text style={styles.you}>YOU</Text>
        </View>
      </View>

      <Text style={styles.radius}>{radiusKm} km search radius</Text>
      <Text style={styles.disclaimer}>Illustrative scan only · distance only, never direction or live pins</Text>

      <View style={styles.people}>
        {profiles.slice(0, 4).map((profile, index) => (
          <Animated.View key={profile.id} entering={FadeInDown.delay(index * 55).duration(260)}>
            <Pressable style={styles.personRow} onPress={() => onSelect?.(profile)}>
              <Image source={profile.avatar} style={styles.avatar} resizeMode="cover" />
              <View style={styles.personCopy}>
                <Text style={styles.name}>{profile.displayName}</Text>
                <Text style={styles.area}>{profile.approximateArea || 'Nearby area'}</Text>
              </View>
              <Text style={styles.distance}>~{profile.distanceKm.toFixed(1)} km  ›</Text>
            </Pressable>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { width: '100%', alignSelf: 'center', alignItems: 'center', paddingTop: spacing.sm },
  radar: { width: 190, height: 190, borderRadius: 95, backgroundColor: '#EAF7FF', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  ring: { position: 'absolute', borderRadius: radius.pill, borderWidth: 1, borderColor: '#B9DDF6' },
  outer: { width: 170, height: 170 },
  middle: { width: 122, height: 122 },
  inner: { width: 76, height: 76 },
  pulse: { position: 'absolute', width: 154, height: 154, borderRadius: 77, borderWidth: 2, borderColor: colors.primaryStrong },
  sweep: { position: 'absolute', width: 170, height: 170, borderRadius: 85 },
  sweepLine: { position: 'absolute', top: 84, right: 8, width: 76, height: 1, backgroundColor: 'rgba(45,140,255,0.32)' },
  center: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.primaryStrong, alignItems: 'center', justifyContent: 'center' },
  you: { color: colors.surface, fontWeight: '800', fontSize: 11 },
  radius: { color: colors.navy, fontSize: 12, fontWeight: '700', marginTop: spacing.sm },
  disclaimer: { color: colors.textMuted, fontSize: 10, lineHeight: 14, textAlign: 'center', marginTop: 3, paddingHorizontal: spacing.lg },
  people: { width: '100%', marginTop: spacing.md },
  personRow: { flexDirection: 'row', alignItems: 'center', minHeight: 52, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primaryLight },
  personCopy: { flex: 1, marginLeft: spacing.md },
  name: { color: colors.text, fontSize: 13, fontWeight: '700' },
  area: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
  distance: { color: colors.primaryStrong, fontSize: 10, fontWeight: '700' },
});
