import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { SabaiButton } from '@/components/ui/SabaiButton';
import { InterestChip } from '@/components/ui/InterestChip';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { interests } from '@/data/mock-data';
import { hasSupabaseConfig } from '@/lib/env';
import { clearDemoState } from '@/lib/demo-state';
import { pickAndUploadAvatar } from '@/services/avatar';
import { signOut } from '@/services/auth';
import { fetchMyProfile } from '@/services/profile';
import { useMyMatches } from '@/hooks/use-my-matches';

export default function MyProfileScreen() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [liveProfile, setLiveProfile] = useState<Awaited<ReturnType<typeof fetchMyProfile>> | null>(null);
  const [uploading, setUploading] = useState(false);
  const [exiting, setExiting] = useState(false);
  const { rows: matchRows } = useMyMatches();

  useEffect(() => {
    if (!hasSupabaseConfig) return;
    let cancelled = false;
    fetchMyProfile()
      .then((profile) => { if (!cancelled) setLiveProfile(profile); })
      .catch((error) => {
        if (!cancelled) Alert.alert('Could not load profile', error instanceof Error ? error.message : 'Please try again.');
      });
    return () => { cancelled = true; };
  }, []);

  const demoAvatar = require('../../../assets/avatars/avatar-05.webp');
  const placeholderAvatar = require('../../../assets/branding/logo-mark.png');
  const avatar = avatarUrl
    ? { uri: avatarUrl }
    : liveProfile?.avatar_url
      ? { uri: liveProfile.avatar_url }
      : hasSupabaseConfig ? placeholderAvatar : demoAvatar;
  const displayName = hasSupabaseConfig ? liveProfile?.display_name ?? 'Loading profile…' : 'Your profile';
  const areaLabel = liveProfile?.approximate_area ? liveProfile.approximate_area : 'Approximate area only';
  const profileInterests = hasSupabaseConfig ? liveProfile?.interests ?? [] : interests.slice(0, 4);
  const matchCount = hasSupabaseConfig ? matchRows.length : 3;

  const exit = async () => {
    if (exiting) return;
    setExiting(true);
    try {
      await clearDemoState();
      if (hasSupabaseConfig) {
        const { error } = await signOut();
        if (error) throw error;
      }
      router.replace('/(auth)/login');
    } catch (error) {
      Alert.alert('Could not sign out', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setExiting(false);
    }
  };

  const changeAvatar = async () => {
    if (!hasSupabaseConfig) {
      Alert.alert('Demo mode', 'Avatar upload will become live after Supabase is configured.');
      return;
    }

    setUploading(true);
    try {
      const url = await pickAndUploadAvatar();
      if (url) setAvatarUrl(url);
    } catch (error) {
      Alert.alert('Could not update avatar', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Screen scroll contentStyle={styles.screen}>
      <View style={styles.photo}>
        <Image source={avatar} style={styles.photoImage} resizeMode="cover" />
        <Pressable
          style={styles.cameraButton}
          onPress={changeAvatar}
          disabled={uploading}
          accessibilityLabel="Change avatar">
          <Ionicons name={uploading ? 'hourglass-outline' : 'camera-outline'} size={20} color={colors.navy} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <View style={styles.identity}>
          <Text style={styles.name}>{displayName}</Text>
          <View style={styles.areaRow}>
            <Ionicons name="location-outline" size={15} color={colors.textMuted} />
            <Text style={styles.area}>{areaLabel}</Text>
          </View>
        </View>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>5 km</Text>
            <Text style={styles.statLabel}>Radius</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profileInterests.length}</Text>
            <Text style={styles.statLabel}>Interests</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{matchCount}</Text>
            <Text style={styles.statLabel}>Matches</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interests</Text>
          <View style={styles.interests}>
            {profileInterests.map((interest) => <InterestChip key={'id' in interest ? interest.id : interest.slug} emoji={interest.emoji || undefined} label={interest.label} selected />)}
          </View>
        </View>

        <View style={styles.privacyRow}>
          <Ionicons name="lock-closed-outline" size={16} color={colors.navy} />
          <Text style={styles.privacy}>Exact location stays private and is used only for protected distance and meeting calculations.</Text>
        </View>

        <View style={styles.actions}>
          <SabaiButton label="Edit profile" onPress={() => router.push('/(onboarding)/profile-setup')} />
          <Pressable onPress={exit} disabled={exiting} style={styles.logoutButton}>
            <Text style={styles.logoutText}>{exiting ? 'Exiting…' : 'Log out / Exit demo'}</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 0, paddingBottom: 100 },
  photo: { width: '100%', height: 230, overflow: 'hidden', position: 'relative' },
  photoImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', backgroundColor: colors.primaryLight },
  cameraButton: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { paddingHorizontal: 20, paddingTop: spacing.xl },
  identity: { alignItems: 'flex-start' },
  name: { color: colors.navy, fontSize: typography.title, fontWeight: '700' },
  areaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  area: { color: colors.textMuted, fontSize: 12 },
  stats: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
  },
  stat: { flex: 1, alignItems: 'center' },
  statDivider: { width: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  statValue: { color: colors.navy, fontSize: 17, fontWeight: '700' },
  statLabel: { color: colors.textMuted, fontSize: 11, marginTop: 3 },
  section: { marginTop: spacing.xl },
  sectionTitle: { color: colors.navy, fontSize: typography.heading, fontWeight: '700' },
  interests: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', gap: spacing.sm, marginTop: spacing.md },
  privacyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, backgroundColor: '#EDF7FF', borderRadius: radius.md, padding: spacing.md, marginTop: spacing.xl },
  privacy: { flex: 1, color: colors.textMuted, fontSize: 11, lineHeight: 17 },
  actions: { gap: spacing.md, marginTop: spacing.xl },
  logoutButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  logoutText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
});
