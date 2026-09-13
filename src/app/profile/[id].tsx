import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { SabaiButton } from '@/components/ui/SabaiButton';
import { InterestChip } from '@/components/ui/InterestChip';
import { MatchScoreBadge } from '@/components/ui/MatchScoreBadge';
import { mockProfiles } from '@/data/mock-data';
import { calculateMatchScore } from '@/services/matching';
import { blockProfile, reportProfile } from '@/services/safety';
import { fetchPublicProfile } from '@/services/profile';
import { hasSupabaseConfig } from '@/lib/env';
import { colors, radius, spacing, typography } from '@/constants/theme';
import type { UserProfile } from '@/types/domain';

const fallbackAvatar = require('../../../assets/branding/logo-mark.png');

export default function ProfileDetailScreen() {
  const { id, distance } = useLocalSearchParams<{ id: string; distance?: string }>();
  const mock = mockProfiles.find((item) => item.id === id);
  const [remote, setRemote] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(Boolean(hasSupabaseConfig && !mock));

  useEffect(() => {
    if (!hasSupabaseConfig || mock || !id) return;
    let cancelled = false;

    fetchPublicProfile(id)
      .then((row) => {
        if (cancelled) return;
        setRemote({
          id: row.id,
          displayName: row.display_name,
          bio: row.bio,
          avatar: row.avatar_url ? { uri: row.avatar_url } : fallbackAvatar,
          distanceKm: Number(distance || 0),
          approximateArea: row.approximate_area || 'Nearby area',
          lastActiveMinutes: Math.max(0, Math.round((Date.now() - new Date(row.last_active_at).getTime()) / 60000)),
          interests: row.interests.map((interest: any) => ({
            id: interest.slug,
            label: interest.label,
            emoji: interest.emoji || '✨',
          })),
        });
      })
      .catch((error) => {
        Alert.alert('Could not load profile', error instanceof Error ? error.message : 'Please try again.');
      })
      .finally(() => !cancelled && setLoading(false));

    return () => { cancelled = true; };
  }, [id, distance, mock]);

  const profile = mock ?? remote;
  const score = useMemo(
    () => profile ? calculateMatchScore(['gaming', 'music', 'coding', 'coffee'], profile).total : 0,
    [profile],
  );

  if (loading || !profile) {
    return (
      <Screen contentStyle={styles.loading}>
        <Text style={styles.loadingText}>Loading profile…</Text>
        <SabaiButton label="Back" variant="ghost" onPress={() => router.back()} />
      </Screen>
    );
  }

  const block = () => {
    Alert.alert(
      'Block ' + profile.displayName + '?',
      'They will disappear from discovery and normal communication.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            if (hasSupabaseConfig) {
              try {
                await blockProfile(profile.id);
              } catch (error) {
                Alert.alert('Could not block', error instanceof Error ? error.message : 'Please try again.');
                return;
              }
            }
            Alert.alert('Blocked', profile.displayName + ' will no longer appear in your discovery flow.');
            router.replace('/(tabs)/discover');
          },
        },
      ],
    );
  };

  const report = () => {
    Alert.alert(
      'Report ' + profile.displayName + '?',
      'This records a general report for review.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: async () => {
            if (hasSupabaseConfig) {
              try {
                await reportProfile(profile.id, 'other');
              } catch (error) {
                Alert.alert('Could not report', error instanceof Error ? error.message : 'Please try again.');
                return;
              }
            }
            Alert.alert('Report received', 'Thanks. The report has been recorded.');
          },
        },
      ],
    );
  };

  return (
    <Screen scroll contentStyle={styles.screen}>
      <View style={styles.photo}>
        <Image source={profile.avatar} style={styles.photoImage} resizeMode="cover" />
        <Pressable style={styles.backButton} onPress={() => router.back()} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={24} color={colors.navy} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <View style={styles.identityRow}>
          <View style={styles.identityCopy}>
            <Text style={styles.name}>{profile.displayName}{profile.age ? ', ' + profile.age : ''}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={15} color={colors.textMuted} />
              <Text style={styles.location}>~{profile.distanceKm.toFixed(1)} km · {profile.approximateArea}</Text>
            </View>
          </View>
          <MatchScoreBadge score={score} />
        </View>

        <Text style={styles.bio}>{profile.bio}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shared vibe</Text>
          <View style={styles.interests}>
            {profile.interests.map((interest) => <InterestChip key={interest.id} {...interest} />)}
          </View>
        </View>

        <View style={styles.privacyRow}>
          <Ionicons name="shield-checkmark-outline" size={17} color={colors.navy} />
          <Text style={styles.privacy}>Approximate distance only. SabaiTalk never exposes this person’s exact coordinates or a live map pin.</Text>
        </View>

        <View style={styles.safety}>
          <Pressable style={styles.safetyButton} onPress={report}>
            <Ionicons name="flag-outline" size={17} color={colors.textMuted} />
            <Text style={styles.safetyText}>Report</Text>
          </Pressable>
          <Pressable style={[styles.safetyButton, styles.blockButton]} onPress={block}>
            <Ionicons name="ban-outline" size={17} color={colors.danger} />
            <Text style={[styles.safetyText, styles.blockText]}>Block</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 0, paddingBottom: spacing.xl },
  loading: { alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  loadingText: { color: colors.textMuted },
  photo: { width: '100%', height: 260, overflow: 'hidden', position: 'relative', paddingTop: spacing.lg },
  photoImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', backgroundColor: colors.primaryLight },
  backButton: { marginLeft: spacing.lg, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: 20, paddingTop: spacing.xl },
  identityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  identityCopy: { flex: 1 },
  name: { color: colors.navy, fontSize: typography.title, fontWeight: '700' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  location: { flex: 1, color: colors.textMuted, fontSize: 12 },
  bio: { color: colors.text, fontSize: typography.body, lineHeight: 22, textAlign: 'left', marginTop: spacing.xl },
  section: { marginTop: spacing.xl },
  sectionTitle: { color: colors.navy, fontSize: 14, fontWeight: '700' },
  interests: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', gap: spacing.sm, marginTop: spacing.md },
  privacyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, backgroundColor: '#EDF7FF', borderRadius: radius.md, padding: spacing.md, marginTop: spacing.xl },
  privacy: { flex: 1, color: colors.textMuted, fontSize: 11, lineHeight: 17 },
  safety: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  safetyButton: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  blockButton: { borderColor: '#F5C9CF' },
  safetyText: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
  blockText: { color: colors.danger },
});
