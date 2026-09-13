import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { ConversationRow } from '@/components/ConversationRow';
import { IllustratedEmptyState } from '@/components/ui/IllustratedEmptyState';
import { colors, spacing, typography } from '@/constants/theme';
import { mockConversations } from '@/data/mock-data';
import { useMyMatches } from '@/hooks/use-my-matches';

const fallbackAvatar = require('../../../assets/avatars/avatar-01.webp');

export default function ChatsScreen() {
  const { rows, loading, usingDemo } = useMyMatches();

  return (
    <Screen scroll contentStyle={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.subtitle}>{usingDemo ? 'Demo conversations' : loading ? 'Loading…' : 'Matched conversations'}</Text>
      </View>

      {usingDemo ? (
        <View>
          {mockConversations.map((conversation) => (
            <ConversationRow key={conversation.id} conversation={conversation} onPress={() => router.push({ pathname: '/chat/[id]', params: { id: conversation.user.id } })} />
          ))}
        </View>
      ) : rows.length ? (
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
      ) : !loading ? (
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
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 86, paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  avatar: { width: 60, height: 60, borderRadius: 30, marginRight: spacing.lg, backgroundColor: colors.primaryLight },
  middle: { flex: 1 },
  name: { color: colors.text, fontSize: typography.body, fontWeight: '600' },
  message: { color: colors.textMuted, fontSize: 12, marginTop: 5 },
  area: { color: colors.textMuted, fontSize: 10, marginLeft: spacing.sm },
});
