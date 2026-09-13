import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { SabaiButton } from '@/components/ui/SabaiButton';
import { InterestChip } from '@/components/ui/InterestChip';
import { colors, spacing, typography } from '@/constants/theme';
import { interests } from '@/data/mock-data';
import { hasSupabaseConfig } from '@/lib/env';
import { saveMyInterests } from '@/services/profile';

export default function InterestsScreen() {
  const [selected, setSelected] = useState<string[]>(['gaming', 'music', 'coffee']);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const validSelection = selected.length >= 3 && selected.length <= 6;

  const toggle = (id: string) => {
    setSelected((current) => {
      if (current.includes(id)) {
        setError('');
        return current.filter((x) => x !== id);
      }
      if (current.length >= 6) {
        setError('Choose up to 6 interests.');
        return current;
      }
      setError('');
      return [...current, id];
    });
  };

  const next = async () => {
    if (!validSelection) {
      setError('Choose 3–6 interests before continuing.');
      return;
    }

    if (hasSupabaseConfig) {
      setBusy(true);
      setError('');
      try {
        await saveMyInterests(selected);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not save interests.');
        setBusy(false);
        return;
      }
      setBusy(false);
    }
    router.push('/(onboarding)/location');
  };

  return (
    <Screen scroll contentStyle={styles.screen}>
      <Text style={styles.step}>2 / 3</Text>
      <Text style={styles.title}>What are you into?</Text>
      <Text style={styles.subtitle}>Pick 3–6. Shared interests are the strongest part of the vibe score.</Text>

      <View style={styles.grid}>
        {interests.map((interest) => (
          <InterestChip key={interest.id} {...interest} selected={selected.includes(interest.id)} onPress={() => toggle(interest.id)} />
        ))}
      </View>

      <Text style={styles.count}>{selected.length} selected</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <SabaiButton label={busy ? 'Saving...' : 'Set location'} disabled={busy || !validSelection} onPress={next} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: spacing.xl, paddingBottom: spacing.xl },
  step: { color: colors.primaryStrong, fontWeight: '700', textAlign: 'center' },
  title: { color: colors.text, fontSize: typography.title, fontWeight: '700', textAlign: 'center', marginTop: spacing.xl },
  subtitle: { color: colors.textMuted, lineHeight: 21, textAlign: 'center', marginTop: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm, marginVertical: spacing.xxl },
  count: { color: colors.textMuted, textAlign: 'center', marginBottom: spacing.sm },
  error: { color: colors.danger, textAlign: 'center', fontSize: 12, marginBottom: spacing.md },
});
