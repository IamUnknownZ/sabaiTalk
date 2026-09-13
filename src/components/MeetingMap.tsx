import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { env } from '@/lib/env';

type Destination = {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
};

export function MeetingMap({ destination }: { destination: Destination }) {
  if (!env.googleMapsApiKey) {
    return (
      <View style={styles.placeholder}>
        <View style={styles.placeholderPin}>
          <Ionicons name="location" size={27} color={colors.primaryStrong} />
        </View>
        <Text style={styles.placeholderTitle}>{destination.name || 'Public meeting place'}</Text>
        <Text style={styles.placeholderAddress}>
          {destination.address || 'Destination only — user origins are intentionally hidden'}
        </Text>
        <Text style={styles.placeholderNote}>Native map activates after the Android Maps key is configured.</Text>
      </View>
    );
  }

  return (
    <View style={styles.frame}>
      <MapView
        key={`${destination.latitude}:${destination.longitude}`}
        style={StyleSheet.absoluteFill}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        initialRegion={{
          latitude: destination.latitude,
          longitude: destination.longitude,
          latitudeDelta: 0.035,
          longitudeDelta: 0.035,
        }}>
        <Marker
          coordinate={{ latitude: destination.latitude, longitude: destination.longitude }}
          title={destination.name || 'Public meeting place'}
          description={destination.address || 'Destination only — user origins are intentionally hidden'}
          pinColor={colors.primaryStrong}
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    height: 250,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: '#EAF7FF',
  },
  placeholder: {
    height: 250,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: '#EAF7FF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  placeholderPin: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  placeholderTitle: {
    color: colors.navy,
    fontSize: typography.heading,
    fontWeight: '700',
    textAlign: 'center',
  },
  placeholderAddress: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  placeholderNote: {
    color: colors.primaryStrong,
    fontSize: typography.caption,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
