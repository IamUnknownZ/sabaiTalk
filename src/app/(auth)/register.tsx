import { useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { SabaiButton } from '@/components/ui/SabaiButton';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { hasSupabaseConfig } from '@/lib/env';
import { signUpWithEmail } from '@/services/auth';

export default function RegisterScreen() {
  const passwordRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const submit = async () => {
    if (!hasSupabaseConfig) {
      setError('Supabase is not configured. Add the real client URL and anon key to .env.local.');
      return;
    }

    setBusy(true);
    setError('');
    setNotice('');
    try {
      const { data, error: authError } = await signUpWithEmail(email, password);
      if (authError) throw authError;
      if (!data.session) {
        setNotice('Account created. Confirm your email, then log in.');
        return;
      }
      router.replace('/(onboarding)/profile-setup');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create account.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll contentStyle={styles.screen}>
      <View style={styles.content}>
        <Image source={require('../../../assets/branding/logo-horizontal.png')} style={styles.logo} resizeMode="contain" />

        <View style={styles.header}>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Start with your login. Profile, interests and location come next.</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <View style={[styles.inputShell, focusedField === 'email' && styles.inputShellFocused]}>
              <Ionicons name="mail-outline" size={20} color={focusedField === 'email' ? colors.primaryStrong : colors.textMuted} />
              <TextInput
                placeholder="you@example.com"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                keyboardType="email-address"
                returnKeyType="next"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                onSubmitEditing={() => passwordRef.current?.focus()}
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={[styles.inputShell, focusedField === 'password' && styles.inputShellFocused]}>
              <Ionicons name="lock-closed-outline" size={20} color={focusedField === 'password' ? colors.primaryStrong : colors.textMuted} />
              <TextInput
                ref={passwordRef}
                placeholder="Create a password"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
                textContentType="newPassword"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                onSubmitEditing={submit}
                returnKeyType="done"
                style={styles.input}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                hitSlop={8}
                onPress={() => setShowPassword((value) => !value)}
                style={styles.passwordToggle}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={21} color={colors.textMuted} />
              </Pressable>
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        </View>

        <View style={styles.actions}>
          <SabaiButton label={busy ? 'Creating...' : 'Create account'} disabled={busy} onPress={submit} />

          <View style={styles.alternateRow}>
            <Text style={styles.alternateText}>Already have an account?</Text>
            <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={8}>
              <Text style={styles.alternateLink}>Log in</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: spacing.xxl, paddingBottom: spacing.xxl },
  content: { flex: 1, width: '100%', maxWidth: 420, alignSelf: 'center' },
  logo: { width: 154, height: 48, alignSelf: 'flex-start' },
  header: { marginTop: spacing.jumbo, gap: spacing.sm },
  title: { color: colors.navy, fontSize: typography.display, fontWeight: '700', letterSpacing: -0.5 },
  subtitle: { color: colors.textMuted, fontSize: typography.body, lineHeight: 22, maxWidth: 380 },
  form: { marginTop: spacing.xxl, gap: spacing.lg },
  field: { gap: spacing.sm },
  label: { color: colors.navy, fontSize: 13, fontWeight: '700' },
  inputShell: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  },
  inputShellFocused: { borderColor: colors.primaryStrong },
  input: { flex: 1, minHeight: 52, color: colors.text, fontSize: 16, paddingVertical: 0 },
  passwordToggle: { minWidth: 36, minHeight: 36, marginRight: -spacing.sm, alignItems: 'center', justifyContent: 'center' },
  error: { color: colors.danger, fontSize: 13, lineHeight: 19 },
  notice: { color: colors.success, fontSize: 13, lineHeight: 19 },
  actions: { marginTop: spacing.xxl, gap: spacing.lg },
  alternateRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm },
  alternateText: { color: colors.textMuted, fontSize: 14 },
  alternateLink: { color: colors.primaryStrong, fontSize: 14, fontWeight: '700' },
});
