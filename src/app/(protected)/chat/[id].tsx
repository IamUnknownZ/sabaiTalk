import { useEffect, useRef, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { SabaiButton } from '@/components/ui/SabaiButton';
import { IllustratedEmptyState } from '@/components/ui/IllustratedEmptyState';
import { colors, spacing, typography } from '@/constants/theme';
import { requireSupabase } from '@/lib/supabase';
import { fetchPublicProfile } from '@/services/profile';
import { listMessages, sendMessage, subscribeToMessages } from '@/services/messages';

type LiveMessage = {
  id: string | number;
  sender_id: string;
  content: string;
  created_at?: string;
};

const fallbackAvatar = require('../../../../assets/branding/logo-mark.png');

export default function ChatScreen() {
  const { id, matchId, name } = useLocalSearchParams<{ id: string; matchId?: string; name?: string }>();
  const scrollRef = useRef<ScrollView>(null);

  const [value, setValue] = useState('');
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [profileName, setProfileName] = useState(name || 'Match');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(matchId));
  const [error, setError] = useState<string | null>(matchId ? null : 'Open a chat from an active match.');

  useEffect(() => {
    if (!id) return;
    let mounted = true;

    fetchPublicProfile(id)
      .then((profile) => {
        if (!mounted) return;
        setProfileName(profile.display_name || name || 'Match');
        setAvatarUrl(profile.avatar_url);
      })
      .catch(() => {
        // Chat membership/messages are authoritative. Header can safely use route data.
      });

    return () => {
      mounted = false;
    };
  }, [id, name]);

  useEffect(() => {
    if (!matchId) return;

    let mounted = true;
    let unsubscribe = () => {};
    setLoading(true);
    setError(null);

    Promise.resolve()
      .then(() => Promise.all([
        requireSupabase().auth.getSession(),
        listMessages(matchId),
      ]))
      .then(([sessionResult, rows]) => {
        if (!mounted) return;
        setMyId(sessionResult.data.session?.user.id ?? null);
        setMessages(rows as LiveMessage[]);
        unsubscribe = subscribeToMessages(matchId, (message) => {
          if (!mounted) return;
          setMessages((current) => current.some((item) => item.id === message.id)
            ? current
            : [...current, message as LiveMessage]);
        });
      })
      .catch((cause) => {
        if (!mounted) return;
        setError(cause instanceof Error ? cause.message : 'Could not load chat.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [matchId]);

  const send = async () => {
    const content = value.trim();
    if (!content || !matchId || error) return;

    const optimistic: LiveMessage = {
      id: 'temp-' + Date.now(),
      sender_id: myId || 'me',
      content,
      created_at: new Date().toISOString(),
    };

    setMessages((current) => [...current, optimistic]);
    setValue('');

    try {
      const sent = await sendMessage(matchId, content);
      setMessages((current) => {
        const withoutOptimistic = current.filter((item) => item.id !== optimistic.id);
        if (!sent || withoutOptimistic.some((item) => item.id === sent.id)) return withoutOptimistic;
        return [...withoutOptimistic, sent as LiveMessage];
      });
    } catch (cause) {
      setMessages((current) => current.filter((item) => item.id !== optimistic.id));
      setValue(content);
      Alert.alert('Could not send message', cause instanceof Error ? cause.message : 'Please try again.');
    }
  };

  return (
    <Screen contentStyle={styles.screen}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Ionicons name="chevron-back" size={28} color={colors.primaryStrong} />
          </Pressable>
          <Image source={avatarUrl ? { uri: avatarUrl } : fallbackAvatar} style={styles.avatar} resizeMode="cover" />
          <View style={styles.headerCopy}>
            <Text style={styles.name}>{profileName}</Text>
            <Text style={styles.status}>{loading ? 'Loading…' : error ? 'Chat unavailable' : 'Realtime chat'}</Text>
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
          {messages.map((message, index) => {
            const mine = message.sender_id === myId;
            return (
              <Animated.View
                key={String(message.id)}
                entering={FadeInUp.delay(Math.min(index, 4) * 35).duration(220)}
                style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                <Text style={mine ? styles.mineText : styles.bubbleText}>{message.content}</Text>
              </Animated.View>
            );
          })}
          {!loading && !error && !messages.length ? (
            <IllustratedEmptyState
              image={require('../../../../assets/illustrations/empty-chat.png')}
              title="Say hi"
              body="You already matched. Start the conversation when you’re ready."
            />
          ) : null}
        </ScrollView>

        <SabaiButton
          label="Find a fair place"
          variant="secondary"
          disabled={!matchId || Boolean(error)}
          onPress={() => router.push({ pathname: '/meeting/[id]', params: { id, matchId: matchId || '', name: profileName } })}
        />

        <View style={styles.composer}>
          <TextInput
            placeholder="Send message..."
            placeholderTextColor={colors.textMuted}
            value={value}
            onChangeText={setValue}
            onSubmitEditing={send}
            returnKeyType="send"
            blurOnSubmit={false}
            editable={Boolean(matchId) && !error}
            style={styles.input}
          />
          <Pressable style={styles.send} onPress={send} disabled={!matchId || Boolean(error)} accessibilityLabel="Send message">
            <Ionicons name="send" size={20} color={value.trim() && !error ? colors.primaryStrong : colors.textMuted} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: spacing.sm, paddingBottom: spacing.md },
  keyboard: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', minHeight: 68, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  back: { paddingVertical: spacing.sm, paddingRight: spacing.sm },
  avatar: { width: 46, height: 46, borderRadius: 23, marginRight: spacing.md, backgroundColor: colors.primaryLight },
  headerCopy: { flex: 1 },
  name: { color: colors.text, fontSize: typography.heading, fontWeight: '500' },
  status: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  error: { color: colors.danger, fontSize: 12, lineHeight: 18, paddingVertical: spacing.sm },
  messages: { flex: 1 },
  messagesContent: { paddingVertical: spacing.lg },
  bubble: { maxWidth: '78%', paddingHorizontal: spacing.lg, paddingVertical: 11, marginBottom: spacing.sm },
  theirs: { backgroundColor: colors.surface, alignSelf: 'flex-start', borderRadius: 18, borderBottomLeftRadius: 4 },
  mine: { backgroundColor: colors.primaryStrong, alignSelf: 'flex-end', borderRadius: 18, borderBottomRightRadius: 4 },
  bubbleText: { color: colors.text, lineHeight: 20 },
  mineText: { color: colors.surface, lineHeight: 20 },
  composer: { flexDirection: 'row', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, marginTop: spacing.md, paddingTop: spacing.sm },
  input: { flex: 1, minHeight: 44, color: colors.text, fontSize: 16, paddingHorizontal: spacing.sm },
  send: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
