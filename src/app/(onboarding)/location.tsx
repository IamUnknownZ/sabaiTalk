import { Image, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { SabaiButton } from '@/components/ui/SabaiButton';
import { colors, spacing, typography } from '@/constants/theme';
import { useCurrentLocation } from '@/hooks/use-current-location';
import { hasSupabaseConfig } from '@/lib/env';
import { saveMyLocation } from '@/services/social';

export default function LocationSetupScreen() {
  const location = useCurrentLocation();

  const requestAndSave = async () => {
    const coordinates = await location.request();
    if (!coordinates || !hasSupabaseConfig) return;
    try {
      await saveMyLocation(coordinates.latitude, coordinates.longitude);
    } catch {
      // GPS permission succeeded; backend save can be retried after configuration.
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

      {location.granted ? (
        <View style={styles.ready}>
          <Text style={styles.readyTitle}>Location ready ✓</Text>
          <Text style={styles.readyText}>People only see approximate distance and area.</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        {!location.granted ? (
          <SabaiButton label={location.loading ? 'Getting location...' : 'Allow foreground location'} disabled={location.loading} onPress={requestAndSave} />
        ) : (
          <SabaiButton label="Start discovering" onPress={() => router.replace('/(tabs)/discover')} />
        )}
        <SabaiButton label="Preview without location" variant="ghost" onPress={() => router.replace('/(tabs)/discover')} />
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
