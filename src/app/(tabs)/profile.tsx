import { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { SabaiButton } from '@/components/ui/SabaiButton';
import { InterestChip } from '@/components/ui/InterestChip';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { pickAndUploadAvatar } from '@/services/avatar';
import { signOut } from '@/services/auth';
import { useMyProfile } from '@/hooks/use-my-profile';
import { useMyMatches } from '@/hooks/use-my-matches';

const placeholderAvatar = require('../../../assets/branding/logo-mark.png');

export default function MyProfileScreen() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [exiting, setExiting] = useState(false);
  const { profile, loading, error, reload } = useMyProfile();
  const { rows: matchRows } = useMyMatches();

  const avatar = avatarUrl
    ? { uri: avatarUrl }
    : profile?.avatar_url
      ? { uri: profile.avatar_url }
      : placeholderAvatar;
  const displayName = loading ? 'Loading profile…' : profile?.display_name ?? 'Profile unavailable';
  const areaLabel = profile?.approximate_area || 'Approximate area only';
  const profileInterests = profile?.interests ?? [];

  const exit = async () => {
    if (exiting) return;
    setExiting(true);
    try {
      const { error: signOutError } = await signOut();
      if (signOutError) throw signOutError;
      router.replace('/(auth)/login');
    } catch (cause) {
      Alert.alert('Could not sign out', cause instanceof Error ? cause.message : 'Please try again.');
    } finally {
      setExiting(false);
    }
  };

  const changeAvatar = async () => {
    setUploading(true);
    try {
      const url = await pickAndUploadAvatar();
      if (url) {
        setAvatarUrl(url);
        await reload();
      }
    } catch (cause) {
      Alert.alert('Could not update avatar', cause instanceof Error ? cause.message : 'Please try again.');
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
          disabled={uploading || Boolean(error)}
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

        {error ? <Text style={styles.error}>{error}</Text> : null}

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
            <Text style={styles.statValue}>{matchRows.length}</Text>
            <Text style={styles.statLabel}>Matches</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interests</Text>
          <View style={styles.interests}>
            {profileInterests.map((interest) => (
              <InterestChip key={interest.slug} emoji={interest.emoji || undefined} label={interest.label} selected />
            ))}
          </View>
        </View>

        <View style={styles.privacyRow}>
          <Ionicons name="lock-closed-outline" size={16} color={colors.navy} />
          <Text style={styles.privacy}>Exact location stays private and is used only for protected distance and meeting calculations.</Text>
        </View>

        <View style={styles.actions}>
          <SabaiButton label="Edit profile" disabled={Boolean(error)} onPress={() => router.push('/(onboarding)/profile-setup')} />
          <Pressable onPress={exit} disabled={exiting} style={styles.logoutButton}>
            <Text style={styles.logoutText}>{exiting ? 'Logging out…' : 'Log out'}</Text>
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
  error: { color: colors.danger, fontSize: 12, lineHeight: 18, marginTop: spacing.md },
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
