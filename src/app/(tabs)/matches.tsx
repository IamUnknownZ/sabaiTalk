import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { IllustratedEmptyState } from '@/components/ui/IllustratedEmptyState';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { mockProfiles } from '@/data/mock-data';
import { calculateMatchScore } from '@/services/matching';
import { useMyMatches } from '@/hooks/use-my-matches';

const fallbackAvatar = require('../../../assets/branding/logo-mark.png');

export default function MatchesScreen() {
  const { rows, loading, usingDemo } = useMyMatches();

  const Header = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Matches</Text>
      <Text style={styles.subtitle}>{usingDemo ? 'Demo matches' : loading ? 'Loading…' : 'Mutual likes only'}</Text>
    </View>
  );

  if (!usingDemo) {
    return (
      <Screen contentStyle={styles.screen}>
        <FlatList
          ListHeaderComponent={<Header />}
          data={rows}
          numColumns={2}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.row}
          keyExtractor={(item) => item.match_id}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.other_user_id, matchId: item.match_id, name: item.display_name } })}>
              <Image source={item.avatar_url ? { uri: item.avatar_url } : fallbackAvatar} style={styles.avatar} resizeMode="cover" />
              <View style={styles.badge}><Text style={styles.badgeText}>MATCHED</Text></View>
              <View style={styles.caption}>
                <Text style={styles.name} numberOfLines={1}>{item.display_name}</Text>
                <Text style={styles.meta} numberOfLines={1}>{item.approximate_area || 'Nearby area'}</Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={!loading ? (
            <IllustratedEmptyState
              image={require('../../../assets/illustrations/empty-matches.png')}
              title="No matches yet"
              body="When a like is mutual, it appears here."
              actionLabel="Explore people"
              onAction={() => router.push('/(tabs)/discover')}
            />
          ) : null}
        />
      </Screen>
    );
  }

  return (
    <Screen contentStyle={styles.screen}>
      <FlatList
        ListHeaderComponent={<Header />}
        data={mockProfiles.slice(0, 3)}
        numColumns={2}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const score = calculateMatchScore(['gaming', 'music', 'coding', 'coffee'], item).total;
          return (
            <Pressable style={styles.card} onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.id } })}>
              <Image source={item.avatar} style={styles.avatar} resizeMode="cover" />
              <View style={styles.badge}><Text style={styles.badgeText}>{score}% VIBE</Text></View>
              <View style={styles.caption}>
                <Text style={styles.name} numberOfLines={1}>{item.displayName}</Text>
                <Text style={styles.meta}>~{item.distanceKm.toFixed(1)} km</Text>
              </View>
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: spacing.md },
  title: { color: colors.text, fontSize: typography.title, fontWeight: '600' },
  subtitle: { color: colors.textMuted, fontSize: 11 },
  list: { paddingBottom: 92 },
  row: { justifyContent: 'space-between', marginBottom: spacing.md },
  card: { width: '48%', flexGrow: 0, flexShrink: 0, height: 168, overflow: 'hidden', borderRadius: radius.sm, backgroundColor: colors.primaryLight },
  avatar: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  badge: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(45,140,255,0.92)', borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { color: colors.surface, fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
  caption: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 10, paddingTop: 20, paddingBottom: 9, backgroundColor: 'rgba(23,58,107,0.72)' },
  name: { color: colors.surface, fontSize: 15, fontWeight: '700' },
  meta: { color: 'rgba(255,255,255,0.82)', fontSize: 10, marginTop: 2 },
});
