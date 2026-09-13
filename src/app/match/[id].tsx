import { Image, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInLeft, FadeInRight, ZoomIn } from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { SabaiButton } from '@/components/ui/SabaiButton';
import { mockProfiles } from '@/data/mock-data';
import { colors, spacing, typography } from '@/constants/theme';
import { hasSupabaseConfig } from '@/lib/env';

export default function MatchCreatedScreen() {
  const { id, profileId, name } = useLocalSearchParams<{ id: string; profileId?: string; name?: string }>();
  const other = mockProfiles.find((profile) => profile.id === profileId);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.screen}>
        <Image source={require('../../../assets/branding/logo-horizontal.png')} style={styles.logo} resizeMode="contain" />

        <View style={styles.matchVisual}>
          <Animated.View entering={FadeInLeft.springify().damping(16)}>
            <Image source={hasSupabaseConfig ? require('../../../assets/branding/logo-mark.png') : require('../../../assets/avatars/avatar-05.webp')} style={styles.avatar} resizeMode="cover" />
          </Animated.View>
          <Animated.View entering={ZoomIn.delay(120).springify().damping(14)} style={styles.connector}>
            <Ionicons name="chatbubbles-outline" size={22} color={colors.navy} />
          </Animated.View>
          <Animated.View entering={FadeInRight.delay(70).springify().damping(16)}>
            <Image source={other?.avatar || (hasSupabaseConfig ? require('../../../assets/branding/logo-mark.png') : require('../../../assets/avatars/avatar-01.webp'))} style={styles.avatar} resizeMode="cover" />
          </Animated.View>
        </View>

        <Animated.View entering={FadeInDown.delay(160).duration(320)} style={styles.copy}>
          <Text style={styles.eyebrow}>MUTUAL MATCH</Text>
          <Text style={styles.title}>You both said yes</Text>
          <Text style={styles.body}>You and {name || 'someone nearby'} chose each other. Start with a message, then find a fair public place when you are ready.</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(240).duration(320)} style={styles.actions}>
          <SabaiButton
            label="Send a message"
            variant="ghost"
            onPress={() => router.replace({ pathname: '/chat/[id]', params: { id: profileId || 'match', matchId: id, name: name || 'Match' } })}
          />
          <Pressable onPress={() => router.replace('/(tabs)/discover')} style={styles.keepExploring}>
            <Text style={styles.link}>Keep exploring</Text>
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primaryStrong },
  screen: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.xl },
  logo: { width: 142, height: 42, alignSelf: 'flex-start', tintColor: colors.surface },
  matchVisual: { flex: 1, minHeight: 250, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  avatar: { width: 112, height: 112, borderRadius: 56, borderWidth: 3, borderColor: colors.surface },
  connector: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  copy: { alignItems: 'flex-start', marginBottom: spacing.xl },
  eyebrow: { color: 'rgba(255,255,255,0.78)', fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  title: { color: colors.surface, fontSize: typography.display, fontWeight: '700', marginTop: spacing.sm },
  body: { color: 'rgba(255,255,255,0.86)', fontSize: typography.body, lineHeight: 22, marginTop: spacing.sm, maxWidth: 390 },
  actions: { width: '100%', gap: spacing.md },
  keepExploring: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  link: { color: colors.surface, textAlign: 'center', fontWeight: '600' },
});
