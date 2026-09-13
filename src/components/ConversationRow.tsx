import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Conversation } from '@/types/domain';
import { colors, spacing, typography } from '@/constants/theme';

export function ConversationRow({ conversation, onPress }: { conversation: Conversation; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <Image source={conversation.user.avatar} style={styles.avatar} resizeMode="cover" />
      <View style={styles.middle}>
        <Text style={styles.name}>{conversation.user.displayName}</Text>
        <Text numberOfLines={1} style={styles.message}>{conversation.lastMessage}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.time}>{conversation.updatedLabel}</Text>
        {conversation.unread > 0 ? <View style={styles.unread}><Text style={styles.unreadText}>{conversation.unread}</Text></View> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 86, paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  avatar: { width: 60, height: 60, borderRadius: 30, marginRight: spacing.lg, backgroundColor: colors.primaryLight },
  middle: { flex: 1 },
  name: { color: colors.text, fontSize: typography.body, fontWeight: '600' },
  message: { color: colors.textMuted, fontSize: 12, marginTop: 5 },
  right: { alignItems: 'flex-end', gap: 8, marginLeft: spacing.sm },
  time: { color: colors.textMuted, fontSize: 11 },
  unread: { minWidth: 20, height: 20, paddingHorizontal: 6, borderRadius: 10, backgroundColor: colors.primaryStrong, alignItems: 'center', justifyContent: 'center' },
  unreadText: { color: colors.surface, fontSize: 10, fontWeight: '700' },
});
