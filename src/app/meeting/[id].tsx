import { useEffect, useMemo, useState } from 'react';
import { Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { SabaiButton } from '@/components/ui/SabaiButton';
import { MeetingMap } from '@/components/MeetingMap';
import { fetchMeetingRecommendations, type MeetingRecommendation } from '@/services/meeting-api';
import { fetchPublicProfile } from '@/services/profile';
import { colors, radius, spacing, typography } from '@/constants/theme';
import type { MeetingCategory } from '@/types/domain';

const categories: { id: MeetingCategory; label: string; image: number }[] = [
  { id: 'cafe', label: 'Cafe', image: require('../../../assets/places/cafe.png') },
  { id: 'food', label: 'Food', image: require('../../../assets/places/food.png') },
  { id: 'park', label: 'Park', image: require('../../../assets/places/park.png') },
  { id: 'mall', label: 'Mall', image: require('../../../assets/places/mall.png') },
  { id: 'cinema', label: 'Cinema', image: require('../../../assets/places/cinema.png') },
  { id: 'study', label: 'Study', image: require('../../../assets/places/study.png') },
];

export default function MeetingScreen() {
  const { id, matchId, name } = useLocalSearchParams<{ id: string; matchId?: string; name?: string }>();
  const [displayName, setDisplayName] = useState(name || 'your match');
  const [category, setCategory] = useState<MeetingCategory>('cafe');
  const [places, setPlaces] = useState<MeetingRecommendation[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(matchId ? 'Ready to search for public meeting places.' : 'Open Fair Meeting from an active match.');

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    fetchPublicProfile(id)
      .then((profile) => {
        if (mounted) setDisplayName(profile.display_name || name || 'your match');
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [id, name]);

  const selected = useMemo(
    () => places.find((place) => place.id === selectedId) ?? places[0] ?? null,
    [places, selectedId],
  );

  const search = async () => {
    if (!matchId) {
      setNotice('Open Fair Meeting from an active match.');
      return;
    }

    setLoading(true);
    setNotice('');
    try {
      const results = await fetchMeetingRecommendations(matchId, category);
      if (!results.length) {
        setPlaces([]);
        setSelectedId('');
        setNotice('No suitable public places found. Try another category.');
        return;
      }
      setPlaces(results);
      setSelectedId(results[0].id);
      setNotice('Ranked by balanced travel time.');
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Could not load meeting recommendations.';
      setNotice(message.includes('google_meeting_api_not_configured')
        ? 'Google Places/Routes keys are not configured yet.'
        : message);
    } finally {
      setLoading(false);
    }
  };

  const openInMaps = async () => {
    if (!selected) return;
    const url = 'https://www.google.com/maps/search/?api=1&query=' + selected.latitude + ',' + selected.longitude;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    await Linking.openURL(url);
  };

  return (
    <Screen scroll contentStyle={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={25} color={colors.navy} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Meet somewhere fair</Text>
          <Text style={styles.subtitle}>We compare travel time without showing either person’s starting point.</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
        {categories.map((item) => {
          const active = category === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => setCategory(item.id)}
              style={[styles.category, active && styles.categoryActive]}>
              <Image source={item.image} style={styles.categoryImage} resizeMode="contain" />
              <Text style={[styles.categoryLabel, active && styles.categoryLabelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <SabaiButton label={loading ? 'Finding places…' : 'Find fair places'} disabled={loading || !matchId} onPress={search} />
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}

      {selected ? (
        <>
          <View style={styles.result}>
            <View style={styles.resultTop}>
              <View style={styles.resultCopy}>
                <Text style={styles.recommended}>TOP RECOMMENDATION</Text>
                <Text style={styles.place}>{selected.name}</Text>
                {selected.address ? <Text style={styles.address}>{selected.address}</Text> : null}
              </View>
              <View style={styles.fairMetric}>
                <Text style={styles.fairScore}>{selected.fairness}%</Text>
                <Text style={styles.fairLabel}>fair</Text>
              </View>
            </View>

            <View style={styles.times}>
              <View style={styles.timeColumn}>
                <Text style={styles.timeLabel}>You</Text>
                <Text style={styles.time}>{selected.yourMinutes} min</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.timeColumn}>
                <Text style={styles.timeLabel}>{displayName}</Text>
                <Text style={styles.time}>{selected.friendMinutes} min</Text>
              </View>
            </View>

            <View style={styles.meta}>
              {selected.rating !== null ? <Text style={styles.metaText}>★ {selected.rating.toFixed(1)}</Text> : null}
              {selected.openNow !== null ? <Text style={styles.metaText}>{selected.openNow ? 'Open now' : 'Closed now'}</Text> : null}
              <Text style={styles.metaText}>{selected.totalMinutes} min combined</Text>
            </View>

            <MeetingMap destination={{ latitude: selected.latitude, longitude: selected.longitude, name: selected.name, address: selected.address }} />

            <Pressable style={styles.mapsLink} onPress={openInMaps}>
              <Ionicons name="navigate-outline" size={18} color={colors.primaryStrong} />
              <Text style={styles.mapsLinkText}>Open destination in Maps</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.primaryStrong} />
            </Pressable>

            <View style={styles.privacyRow}>
              <Ionicons name="lock-closed-outline" size={16} color={colors.navy} />
              <Text style={styles.privacy}>Only the public destination is shown. Exact starting coordinates stay hidden.</Text>
            </View>
          </View>

          {places.length > 1 ? (
            <View style={styles.alternatives}>
              <Text style={styles.altTitle}>Other options</Text>
              {places.slice(1, 5).map((place) => (
                <Pressable key={place.id} style={styles.altRow} onPress={() => setSelectedId(place.id)}>
                  <View style={styles.altCopy}>
                    <Text style={styles.altName}>{place.name}</Text>
                    <Text style={styles.altMeta}>{place.yourMinutes}m you · {place.friendMinutes}m {displayName}</Text>
                  </View>
                  <Text style={styles.altFair}>{place.fairness}%</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </>
      ) : (
        <View style={styles.noPlace}>
          <Image source={require('../../../assets/illustrations/no-place-found.png')} style={styles.noPlaceImage} resizeMode="contain" />
          <View style={styles.noPlaceCopy}>
            <Text style={styles.noPlaceTitle}>No destination selected</Text>
            <Text style={styles.noPlaceText}>Choose a category, then search for a real public meeting place.</Text>
          </View>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: spacing.md, paddingBottom: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.lg },
  back: { width: 40, height: 40, marginLeft: -spacing.sm, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, paddingTop: 5 },
  title: { color: colors.navy, fontSize: typography.heading, fontWeight: '700' },
  subtitle: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 4, maxWidth: 360 },
  categories: { gap: spacing.sm, paddingBottom: spacing.lg, paddingRight: spacing.lg },
  category: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  categoryActive: { borderColor: colors.primaryStrong, backgroundColor: '#EDF7FF' },
  categoryImage: { width: 24, height: 24 },
  categoryLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  categoryLabelActive: { color: colors.primaryStrong },
  notice: { color: colors.textMuted, fontSize: 11, lineHeight: 16, marginTop: spacing.sm },
  result: { marginTop: spacing.xl },
  resultTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.lg },
  resultCopy: { flex: 1 },
  recommended: { color: colors.primaryStrong, fontSize: 10, fontWeight: '800', letterSpacing: 0.9 },
  place: { color: colors.navy, fontSize: typography.title, fontWeight: '700', marginTop: 5 },
  address: { color: colors.textMuted, lineHeight: 19, marginTop: 5 },
  fairMetric: { minWidth: 62, alignItems: 'flex-end' },
  fairScore: { color: colors.primaryStrong, fontSize: 22, fontWeight: '800' },
  fairLabel: { color: colors.textMuted, fontSize: 11, marginTop: -2 },
  times: { flexDirection: 'row', alignItems: 'stretch', marginTop: spacing.xl, marginBottom: spacing.md },
  timeColumn: { flex: 1 },
  divider: { width: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginHorizontal: spacing.lg },
  timeLabel: { color: colors.textMuted, fontSize: 11, marginBottom: 3 },
  time: { color: colors.text, fontSize: 18, fontWeight: '700' },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, marginBottom: spacing.lg },
  metaText: { color: colors.textMuted, fontSize: 11 },
  mapsLink: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    marginTop: spacing.md,
  },
  mapsLinkText: { flex: 1, color: colors.primaryStrong, fontWeight: '700', fontSize: 13 },
  privacyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, backgroundColor: '#EDF7FF', borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md },
  privacy: { flex: 1, color: colors.textMuted, fontSize: 10, lineHeight: 16 },
  alternatives: { marginTop: spacing.xl },
  altTitle: { color: colors.navy, fontSize: typography.heading, fontWeight: '700', marginBottom: spacing.sm },
  altRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  altCopy: { flex: 1 },
  altName: { color: colors.text, fontWeight: '600' },
  altMeta: { color: colors.textMuted, marginTop: 3, fontSize: 11 },
  altFair: { color: colors.primaryStrong, fontWeight: '800' },
  noPlace: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.xl },
  noPlaceImage: { width: 96, height: 96 },
  noPlaceCopy: { flex: 1 },
  noPlaceTitle: { color: colors.navy, fontWeight: '700' },
  noPlaceText: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 4 },
});
