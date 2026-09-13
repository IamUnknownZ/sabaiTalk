import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { SabaiButton } from '@/components/ui/SabaiButton';
import { InterestChip } from '@/components/ui/InterestChip';
import { colors, spacing, typography } from '@/constants/theme';
import { useAuthSession } from '@/providers/AuthSessionProvider';
import { fetchInterestCatalog, saveMyInterests } from '@/services/profile';

type InterestRow = Awaited<ReturnType<typeof fetchInterestCatalog>>[number];

export default function InterestsScreen() {
  const { refreshOnboarding } = useAuthSession();
  const [interests, setInterests] = useState<InterestRow[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const validSelection = selected.length >= 3 && selected.length <= 6;

  useEffect(() => {
    let mounted = true;
    fetchInterestCatalog()
      .then((rows) => {
        if (mounted) setInterests(rows);
      })
      .catch((cause) => {
        if (mounted) setError(cause instanceof Error ? cause.message : 'Could not load interests.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const toggle = (slug: string) => {
    setSelected((current) => {
      if (current.includes(slug)) {
        setError('');
        return current.filter((value) => value !== slug);
      }
      if (current.length >= 6) {
        setError('Choose up to 6 interests.');
        return current;
      }
      setError('');
      return [...current, slug];
    });
  };

  const next = async () => {
    if (!validSelection) {
      setError('Choose 3–6 interests before continuing.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      await saveMyInterests(selected);
      await refreshOnboarding();
      // The onboarding guard advances to Location from the server-verified status.
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save interests.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll contentStyle={styles.screen}>
      <Text style={styles.step}>2 / 3</Text>
      <Text style={styles.title}>What are you into?</Text>
      <Text style={styles.subtitle}>Pick 3–6. Shared interests are the strongest part of the vibe score.</Text>

      <View style={styles.grid}>
        {interests.map((interest) => (
          <InterestChip
            key={interest.slug}
            emoji={interest.emoji || undefined}
            label={interest.label}
            selected={selected.includes(interest.slug)}
            onPress={() => toggle(interest.slug)}
          />
        ))}
      </View>

      <Text style={styles.count}>{loading ? 'Loading interests…' : selected.length + ' selected'}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <SabaiButton label={busy ? 'Saving...' : 'Set location'} disabled={loading || busy || !validSelection} onPress={next} />
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
