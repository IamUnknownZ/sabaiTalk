import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/constants/theme';
import { useAuthSession } from '@/providers/AuthSessionProvider';

export function GuardLoading({ label = 'Checking your session…' }: { label?: string }) {
  return (
    <View style={styles.screen}>
      <ActivityIndicator color={colors.primaryStrong} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

export function GuardError() {
  const { error, refreshOnboarding, signOut } = useAuthSession();

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Account verification failed</Text>
      <Text style={styles.text}>{error || 'Could not verify your account.'}</Text>
      <Pressable style={styles.action} onPress={() => void refreshOnboarding()}>
        <Text style={styles.actionText}>Retry</Text>
      </Pressable>
      <Pressable style={styles.secondaryAction} onPress={() => void signOut()}>
        <Text style={styles.secondaryText}>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: { color: colors.navy, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  text: { color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  action: {
    minWidth: 140,
    minHeight: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryStrong,
    marginTop: spacing.sm,
  },
  actionText: { color: colors.surface, fontWeight: '700' },
  secondaryAction: { minHeight: 42, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  secondaryText: { color: colors.textMuted, fontWeight: '600' },
});
