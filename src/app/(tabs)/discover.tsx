import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { Screen } from '@/components/ui/Screen';
import { ProfileCard } from '@/components/ProfileCard';
import { NearbyRadar } from '@/components/NearbyRadar';
import { IllustratedEmptyState } from '@/components/ui/IllustratedEmptyState';
import { colors, radius, shadow, spacing } from '@/constants/theme';
import { useNearbyProfiles } from '@/hooks/use-nearby-profiles';
import { useMyProfile } from '@/hooks/use-my-profile';
import { likeProfile, passProfile } from '@/services/social';

export default function DiscoverScreen() {
  const [mode, setMode] = useState<'cards' | 'nearby'>('nearby');
  const [radiusKm, setRadiusKm] = useState(5);
  const [actedIds, setActedIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const { profiles: candidates, loading, error } = useNearbyProfiles(radiusKm);
  const { profile: myProfile } = useMyProfile();

  const viewerInterestIds = useMemo(
    () => (myProfile?.interests ?? []).map((interest) => interest.slug),
    [myProfile],
  );

  const available = useMemo(
    () => candidates.filter((profile) => !actedIds.includes(profile.id)),
    [actedIds, candidates],
  );
  const current = available[0];
  const selected = available.find((profile) => profile.id === selectedId);
  const target = mode === 'nearby' ? selected : current;

  const markActed = (profileId: string) => {
    setActedIds((currentIds) => [...new Set([...currentIds, profileId])]);
    if (selectedId === profileId) setSelectedId(null);
  };

  const like = async (): Promise<boolean> => {
    if (!target || acting) return false;

    setActing(true);
    try {
      const matchId = await likeProfile(target.id);
      markActed(target.id);
      if (matchId) {
        router.push({ pathname: '/match/[id]', params: { id: matchId, profileId: target.id, name: target.displayName } });
      }
      return true;
    } catch (cause) {
      Alert.alert('Could not like profile', cause instanceof Error ? cause.message : 'Please try again.');
      return false;
    } finally {
      setActing(false);
    }
  };

  const pass = async (): Promise<boolean> => {
    if (!target || acting) return false;

    setActing(true);
    try {
      await passProfile(target.id);
      markActed(target.id);
      return true;
    } catch (cause) {
      Alert.alert('Could not pass profile', cause instanceof Error ? cause.message : 'Please try again.');
      return false;
    } finally {
      setActing(false);
    }
  };

  const openProfile = () => {
    if (!target) return;
    router.push({ pathname: '/profile/[id]', params: { id: target.id, distance: String(target.distanceKm) } });
  };

  const emptyBody = radiusKm < 10
    ? 'No more real profiles are available in this range. Try a wider range.'
    : 'No more real profiles are available right now.';

  return (
    <Screen scroll contentStyle={styles.screen}>
      <View style={styles.top}>
        <Pressable style={styles.utility}>
          <Ionicons name="location" size={15} color={colors.primaryStrong} />
          <Text style={styles.utilityText}>{radiusKm} km</Text>
        </Pressable>

        <Pressable
          style={styles.utility}
          onPress={() => {
            setSelectedId(null);
            setMode((value) => value === 'cards' ? 'nearby' : 'cards');
          }}>
          <Ionicons name={mode === 'cards' ? 'grid-outline' : 'albums-outline'} size={15} color={colors.primaryStrong} />
          <Text style={styles.utilityText}>{mode === 'cards' ? 'Radar' : 'Cards'}</Text>
        </Pressable>
      </View>

      <View style={styles.radiusRow}>
        {[1, 3, 5, 10].map((km) => (
          <Pressable key={km} onPress={() => { setRadiusKm(km); setSelectedId(null); }} style={styles.radiusOption}>
            <Text style={[styles.radiusText, radiusKm === km && styles.radiusTextActive]}>{km} km</Text>
            {radiusKm === km ? <View style={styles.radiusDot} /> : null}
          </Pressable>
        ))}
      </View>

      <Text style={styles.counter}>
        {loading ? 'Loading…' : mode === 'nearby' ? available.length + ' nearby • tap a person' : available.length + ' profiles left • swipe or tap'}
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!error && mode === 'nearby' ? (
        available.length ? (
          <>
            <NearbyRadar profiles={available} radiusKm={radiusKm} onSelect={(profile) => setSelectedId(profile.id)} />
            {selected ? (
              <Animated.View
                key={selected.id}
                entering={FadeInDown.duration(240)}
                exiting={FadeOutDown.duration(180)}>
                <ProfileCard
                  compact
                  disabled={acting}
                  profile={selected}
                  viewerInterestIds={viewerInterestIds}
                  onLike={like}
                  onPass={pass}
                  onOpen={openProfile}
                />
              </Animated.View>
            ) : null}
          </>
        ) : !loading ? (
          <IllustratedEmptyState
            image={require('../../../assets/illustrations/empty-nearby.png')}
            title="You’re caught up"
            body={emptyBody}
            actionLabel={radiusKm < 10 ? 'Use 10 km' : undefined}
            onAction={radiusKm < 10 ? () => setRadiusKm(10) : undefined}
          />
        ) : null
      ) : !error && current ? (
        <Animated.View
          key={current.id}
          entering={FadeInDown.duration(240)}
          exiting={FadeOutDown.duration(180)}>
          <ProfileCard
            disabled={acting}
            profile={current}
            viewerInterestIds={viewerInterestIds}
            onLike={like}
            onPass={pass}
            onOpen={openProfile}
          />
        </Animated.View>
      ) : !error && !loading ? (
        <IllustratedEmptyState
          image={require('../../../assets/illustrations/empty-nearby.png')}
          title="You’re caught up"
          body={emptyBody}
          actionLabel={radiusKm < 10 ? 'Use 10 km' : undefined}
          onAction={radiusKm < 10 ? () => setRadiusKm(10) : undefined}
        />
      ) : null}

      {acting ? <Text style={styles.working}>Saving…</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: spacing.md, paddingBottom: 88 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  utility: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surface, paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill, ...shadow },
  utilityText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  radiusRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  radiusOption: { alignItems: 'center', paddingVertical: spacing.sm, minWidth: 54 },
  radiusText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  radiusTextActive: { color: colors.primaryStrong },
  radiusDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primaryStrong, marginTop: 4 },
  counter: { color: colors.textMuted, fontSize: 11, textAlign: 'center', marginBottom: spacing.sm },
  error: { color: colors.danger, fontSize: 12, lineHeight: 18, textAlign: 'center', marginVertical: spacing.lg },
  working: { color: colors.textMuted, textAlign: 'center', fontSize: 12, marginTop: spacing.sm },
});
