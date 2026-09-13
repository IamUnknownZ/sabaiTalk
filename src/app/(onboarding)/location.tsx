import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { SabaiButton } from '@/components/ui/SabaiButton';
import { colors, spacing, typography } from '@/constants/theme';
import { useAuthSession } from '@/providers/AuthSessionProvider';
import { useCurrentLocation } from '@/hooks/use-current-location';
import { saveMyLocation } from '@/services/social';

export default function LocationSetupScreen() {
  const { refreshOnboarding } = useAuthSession();
  const location = useCurrentLocation();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  const requestAndSave = async () => {
    setSaveError('');
    const coordinates = await location.request();
    if (!coordinates) return;

    setSaving(true);
    try {
      await saveMyLocation(coordinates.latitude, coordinates.longitude);
      await refreshOnboarding();
      setSaved(true);
    } catch (cause) {
      setSaved(false);
      setSaveError(cause instanceof Error ? cause.message : 'Could not save your location.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll contentStyle={styles.screen}>
      <Text style={styles.step}>3 / 3</Text>
      <Image
        source={location.granted === false ? require('../../../assets/illustrations/location-denied.png') : require('../../../assets/illustrations/location-permission.png')}
        style={styles.image}
        resizeMode="contain"
      />

      <Text style={styles.title}>Find people nearby</Text>
      <Text style={styles.subtitle}>SabaiTalk uses foreground location for approximate distance. Other users never receive your exact coordinates.</Text>

      {location.error ? <Text style={styles.error}>{location.error}</Text> : null}
      {saveError ? <Text style={styles.error}>{saveError}</Text> : null}

      {saved ? (
        <View style={styles.ready}>
          <Text style={styles.readyTitle}>Location saved ✓</Text>
          <Text style={styles.readyText}>People only see approximate distance and area.</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        {!saved ? (
          <SabaiButton
            label={location.loading || saving ? 'Saving location...' : 'Allow foreground location'}
            disabled={location.loading || saving}
            onPress={requestAndSave}
          />
        ) : (
          <SabaiButton label="Start discovering" onPress={() => router.replace('/(tabs)/discover')} />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: spacing.xl, paddingBottom: spacing.xl, alignItems: 'stretch' },
  step: { color: colors.primaryStrong, fontWeight: '700', textAlign: 'center' },
  image: { width: '100%', height: 240, marginTop: spacing.lg },
  title: { color: colors.text, fontSize: typography.title, fontWeight: '700', textAlign: 'center' },
  subtitle: { color: colors.textMuted, lineHeight: 21, textAlign: 'center', marginTop: spacing.sm },
  error: { color: colors.danger, textAlign: 'center', marginTop: spacing.md },
  ready: { alignItems: 'center', marginTop: spacing.lg },
  readyTitle: { color: colors.success, fontWeight: '700' },
  readyText: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  actions: { gap: spacing.md, marginTop: spacing.xl },
});
