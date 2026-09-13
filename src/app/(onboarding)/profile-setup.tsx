import { useState } from 'react';
import { Image, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { SabaiButton } from '@/components/ui/SabaiButton';
import { colors, spacing, typography } from '@/constants/theme';
import { upsertMyProfile } from '@/services/profile';

export default function ProfileSetupScreen() {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const canContinue = name.trim().length > 0 && bio.trim().length > 0 && bio.length <= 160;

  const next = async () => {
    if (!canContinue) {
      setError('Add a display name and short bio before continuing.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      await upsertMyProfile({ displayName: name.trim(), bio: bio.trim() });
      router.push('/(onboarding)/interests');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save profile.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll contentStyle={styles.screen}>
      <Text style={styles.step}>1 / 3</Text>
      <Image source={require('../../../assets/branding/logo-mark.png')} style={styles.avatar} resizeMode="contain" />
      <Text style={styles.title}>Make it feel like you</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Display name</Text>
        <TextInput placeholder="What should people call you?" placeholderTextColor={colors.textMuted} value={name} onChangeText={setName} style={styles.input} />

        <Text style={styles.label}>Short bio</Text>
        <TextInput
          placeholder="Gaming, music, cafe hopping…"
          placeholderTextColor={colors.textMuted}
          value={bio}
          onChangeText={(text) => setBio(text.slice(0, 160))}
          maxLength={160}
          multiline
          style={[styles.input, styles.bio]}
        />
        <Text style={styles.counter}>{bio.length}/160</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <SabaiButton label={busy ? 'Saving...' : 'Choose interests'} disabled={busy || !canContinue} onPress={next} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: spacing.xl, paddingBottom: spacing.xl },
  step: { color: colors.primaryStrong, fontWeight: '700', textAlign: 'center' },
  avatar: { width: 118, height: 118, borderRadius: 59, alignSelf: 'center', marginTop: spacing.xl, backgroundColor: colors.primaryLight },
  title: { color: colors.text, fontSize: typography.title, fontWeight: '700', textAlign: 'center', marginTop: spacing.lg },
  form: { marginTop: spacing.xl, gap: spacing.sm },
  label: { color: colors.primaryStrong, textAlign: 'center', fontWeight: '700', marginTop: spacing.sm },
  input: { minHeight: 48, borderBottomWidth: 1, borderBottomColor: colors.border, color: colors.text, fontSize: 17, textAlign: 'center', paddingHorizontal: spacing.md },
  bio: { minHeight: 86, textAlignVertical: 'top', paddingTop: spacing.md },
  counter: { color: colors.textMuted, fontSize: 11, textAlign: 'right' },
  error: { color: colors.danger, textAlign: 'center', fontSize: 12 },
});
