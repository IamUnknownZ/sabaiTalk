import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius, shadow, spacing } from '@/constants/theme';
import type { UserProfile } from '@/types/domain';
import { calculateMatchScore } from '@/services/matching';
import { InterestChip } from '@/components/ui/InterestChip';
import { LocationBadge } from '@/components/ui/LocationBadge';
import { MatchScoreBadge } from '@/components/ui/MatchScoreBadge';

type DecisionResult = boolean | void | Promise<boolean | void>;

export function ProfileCard({
  profile,
  viewerInterestIds,
  onLike,
  onPass,
  onOpen,
  compact = false,
  disabled = false,
}: {
  profile: UserProfile;
  viewerInterestIds: string[];
  onLike?: () => DecisionResult;
  onPass?: () => DecisionResult;
  onOpen?: () => void;
  compact?: boolean;
  disabled?: boolean;
}) {
  const score = calculateMatchScore(viewerInterestIds, profile);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const resetCard = () => {
    translateX.value = withSpring(0, { damping: 18, stiffness: 220 });
    translateY.value = withSpring(0, { damping: 18, stiffness: 220 });
  };

  const commitDecision = async (direction: 'like' | 'pass') => {
    try {
      const result = direction === 'like' ? await onLike?.() : await onPass?.();
      if (result === false) resetCard();
    } catch {
      resetCard();
    }
  };

  const dismiss = (direction: 'like' | 'pass') => {
    if (disabled) return;
    const target = direction === 'like' ? 430 : -430;
    translateX.value = withTiming(target, { duration: 190 }, (finished) => {
      if (finished) runOnJS(commitDecision)(direction);
    });
  };

  const pan = Gesture.Pan()
    .enabled(!compact && !disabled)
    .activeOffsetX([-10, 10])
    .failOffsetY([-22, 22])
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.18;
    })
    .onEnd((event) => {
      const like = event.translationX > 92 || event.velocityX > 780;
      const pass = event.translationX < -92 || event.velocityX < -780;

      if (like || pass) {
        const direction = like ? 'like' : 'pass';
        const target = like ? 430 : -430;
        translateX.value = withTiming(target, { duration: 180 }, (finished) => {
          if (finished) runOnJS(commitDecision)(direction);
        });
        return;
      }

      translateX.value = withSpring(0, { damping: 18, stiffness: 220 });
      translateY.value = withSpring(0, { damping: 18, stiffness: 220 });
    });

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${interpolate(translateX.value, [-220, 0, 220], [-7, 0, 7])}deg` },
    ],
  }));

  const likeCueStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [25, 115], [0, 1], 'clamp'),
  }));

  const passCueStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-115, -25], [1, 0], 'clamp'),
  }));

  if (compact) {
    return (
      <View style={styles.compactCard}>
        <Pressable onPress={onOpen} style={styles.compactPhotoWrap}>
          <Image source={profile.avatar} style={styles.compactImage} resizeMode="cover" />
        </Pressable>

        <View style={styles.compactBody}>
          <View style={styles.compactHeading}>
            <Text style={styles.compactName} numberOfLines={1}>{profile.displayName}{profile.age ? ', ' + profile.age : ''}</Text>
            <MatchScoreBadge score={score.total} />
          </View>
          <LocationBadge distanceKm={profile.distanceKm} area={profile.approximateArea} />
          <Text style={styles.compactBio} numberOfLines={2}>{profile.bio}</Text>

          <View style={styles.compactActions}>
            <Pressable disabled={disabled} onPress={() => void onPass?.()} style={[styles.compactAction, styles.pass, disabled && styles.disabled]} accessibilityLabel="Pass">
              <Text style={styles.compactPassText}>×</Text>
            </Pressable>
            <Pressable disabled={disabled} onPress={() => void onLike?.()} style={[styles.compactAction, styles.like, disabled && styles.disabled]} accessibilityLabel="Like">
              <Text style={styles.compactLikeText}>👋</Text>
            </Pressable>
            <Pressable disabled={disabled} onPress={onOpen} style={styles.openProfile}>
              <Text style={styles.openProfileText}>View profile</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.card, animatedCardStyle]}>
        <Animated.View pointerEvents="none" style={[styles.decisionCue, styles.likeCue, likeCueStyle]}>
          <Text style={[styles.decisionCueText, styles.likeCueText]}>LIKE</Text>
        </Animated.View>
        <Animated.View pointerEvents="none" style={[styles.decisionCue, styles.passCue, passCueStyle]}>
          <Text style={[styles.decisionCueText, styles.passCueText]}>PASS</Text>
        </Animated.View>

        <Pressable onPress={onOpen} style={styles.photoWrap}>
          <Image source={profile.avatar} style={styles.image} resizeMode="cover" />
        </Pressable>

        <View style={styles.body}>
          <View style={styles.matchBadge}><MatchScoreBadge score={score.total} /></View>
          <Text style={styles.name}>{profile.displayName}{profile.age ? ', ' + profile.age : ''}</Text>
          <LocationBadge distanceKm={profile.distanceKm} area={profile.approximateArea} />
          <Text style={styles.bio} numberOfLines={3}>{profile.bio}</Text>

          <View style={styles.interests}>
            {profile.interests.slice(0, 3).map((interest) => (
              <InterestChip key={interest.id} label={interest.label} emoji={interest.emoji} />
            ))}
          </View>

          <View style={styles.actions}>
            <Pressable disabled={disabled} onPress={() => dismiss('pass')} style={[styles.action, styles.pass, disabled && styles.disabled]} accessibilityLabel="Pass">
              <Text style={styles.passText}>×</Text>
            </Pressable>
            <Pressable disabled={disabled} onPress={() => dismiss('like')} style={[styles.action, styles.like, disabled && styles.disabled]} accessibilityLabel="Like">
              <Text style={styles.likeText}>👋</Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: { width: '100%', maxWidth: 310, alignSelf: 'center', backgroundColor: colors.surface, borderRadius: radius.md, padding: 7, ...shadow },
  photoWrap: { overflow: 'hidden', borderRadius: radius.sm },
  image: { width: '100%', height: 210, backgroundColor: colors.primaryLight },
  body: { alignItems: 'stretch', paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  matchBadge: { alignSelf: 'flex-start', marginTop: -18, marginBottom: spacing.sm },
  name: { color: colors.text, fontSize: 22, fontWeight: '600', textAlign: 'left' },
  bio: { color: colors.textMuted, fontSize: 13, lineHeight: 18, textAlign: 'left', marginTop: 6 },
  interests: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', gap: spacing.sm, marginTop: spacing.sm },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg, paddingTop: spacing.md },
  action: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow },
  pass: { backgroundColor: '#EEF3F7' },
  like: { backgroundColor: '#D9F8EC' },
  disabled: { opacity: 0.45 },
  passText: { color: colors.text, fontSize: 28, lineHeight: 30, fontWeight: '300' },
  likeText: { fontSize: 22 },
  decisionCue: { position: 'absolute', top: 24, zIndex: 4, borderWidth: 3, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 6 },
  likeCue: { left: 22, borderColor: colors.success, transform: [{ rotate: '-8deg' }] },
  passCue: { right: 22, borderColor: colors.danger, transform: [{ rotate: '8deg' }] },
  decisionCueText: { fontSize: 18, fontWeight: '900', letterSpacing: 1.3 },
  likeCueText: { color: colors.success },
  passCueText: { color: colors.danger },

  compactCard: {
    width: '100%',
    marginTop: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: spacing.md,
  },
  compactPhotoWrap: { width: 92, height: 116, overflow: 'hidden', borderRadius: radius.md },
  compactImage: { width: '100%', height: '100%', backgroundColor: colors.primaryLight },
  compactBody: { flex: 1, minWidth: 0 },
  compactHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  compactName: { flex: 1, color: colors.navy, fontSize: 18, fontWeight: '700' },
  compactBio: { color: colors.textMuted, fontSize: 12, lineHeight: 17, marginTop: 5 },
  compactActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 'auto', paddingTop: spacing.sm },
  compactAction: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  compactPassText: { color: colors.text, fontSize: 23, lineHeight: 24, fontWeight: '300' },
  compactLikeText: { fontSize: 17 },
  openProfile: { marginLeft: 'auto', minHeight: 34, justifyContent: 'center' },
  openProfileText: { color: colors.primaryStrong, fontSize: 12, fontWeight: '700' },
});
