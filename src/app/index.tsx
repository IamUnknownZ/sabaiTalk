import { Image, StyleSheet, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { GuardError, GuardLoading } from '@/components/GuardState';
import { Screen } from '@/components/ui/Screen';
import { SabaiButton } from '@/components/ui/SabaiButton';
import { colors, spacing, typography } from '@/constants/theme';
import { onboardingStagePath, useAuthSession } from '@/providers/AuthSessionProvider';

export default function WelcomeScreen() {
  const { session, authReady, stage, stageReady, error } = useAuthSession();

  if (!authReady || (session && !stageReady)) return <GuardLoading />;
  if (session && error) return <GuardError />;
  if (session && stage) return <Redirect href={onboardingStagePath(stage)} />;

  return (
    <Screen scroll contentStyle={styles.screen}>
      <Image source={require('../../assets/branding/logo-horizontal.png')} style={styles.logo} resizeMode="contain" />

      <View style={styles.heroWrap}>
        <Image source={require('../../assets/illustrations/welcome.png')} style={styles.hero} resizeMode="contain" />
      </View>

      <View style={styles.copy}>
        <Text style={styles.title}>Same vibe. Nearby.</Text>
        <Text style={styles.subtitle}>Meet people through shared interests, chat after a mutual match, then find a fair public place to meet.</Text>
      </View>

      <View style={styles.actions}>
        <SabaiButton label="Get started" onPress={() => router.push('/(auth)/login')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: spacing.xl, paddingBottom: spacing.xl, justifyContent: 'space-between', minHeight: 760 },
  logo: { width: 168, height: 54, alignSelf: 'center' },
  heroWrap: { flex: 1, minHeight: 360, alignItems: 'center', justifyContent: 'center' },
  hero: { width: '100%', height: 360 },
  copy: { alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md },
  title: { color: colors.text, fontSize: typography.display, fontWeight: '700', textAlign: 'center' },
  subtitle: { color: colors.textMuted, fontSize: typography.body, lineHeight: 22, textAlign: 'center' },
  actions: { gap: spacing.md, marginTop: spacing.xl },
});
