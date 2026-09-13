import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { IllustratedEmptyState } from '@/components/ui/IllustratedEmptyState';
import { colors, spacing, typography } from '@/constants/theme';
import { useMyMatches } from '@/hooks/use-my-matches';

const fallbackAvatar = require('../../../assets/branding/logo-mark.png');

export default function ChatsScreen() {
  const { rows, loading, error } = useMyMatches();

  return (
    <Screen scroll contentStyle={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.subtitle}>{loading ? 'Loading…' : 'Matched conversations'}</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {rows.length ? (
        <View>
          {rows.map((item) => (
            <Pressable
              key={item.match_id}
              style={styles.row}
              onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.other_user_id, matchId: item.match_id, name: item.display_name } })}>
              <Image source={item.avatar_url ? { uri: item.avatar_url } : fallbackAvatar} style={styles.avatar} resizeMode="cover" />
              <View style={styles.middle}>
                <Text style={styles.name}>{item.display_name}</Text>
                <Text style={styles.message} numberOfLines={1}>{item.last_message || 'Say hi!'}</Text>
              </View>
              <Text style={styles.area}>{item.approximate_area || 'Nearby'}</Text>
            </Pressable>
          ))}
        </View>
      ) : !loading && !error ? (
        <IllustratedEmptyState
          image={require('../../../assets/illustrations/empty-chat.png')}
          title="No chats yet"
          body="Once a like becomes mutual, you can start a conversation here."
          actionLabel="Explore people"
          onAction={() => router.push('/(tabs)/discover')}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: spacing.lg, paddingBottom: 90 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: spacing.lg },
  title: { color: colors.text, fontSize: typography.title, fontWeight: '600' },
  subtitle: { color: colors.textMuted, fontSize: 12 },
  error: { color: colors.danger, fontSize: 12, lineHeight: 18, marginBottom: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 86, paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  avatar: { width: 60, height: 60, borderRadius: 30, marginRight: spacing.lg, backgroundColor: colors.primaryLight },
  middle: { flex: 1 },
  name: { color: colors.text, fontSize: typography.body, fontWeight: '600' },
  message: { color: colors.textMuted, fontSize: 12, marginTop: 5 },
  area: { color: colors.textMuted, fontSize: 10, marginLeft: spacing.sm },
});
