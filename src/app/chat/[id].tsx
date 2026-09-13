import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { SabaiButton } from '@/components/ui/SabaiButton';
import { IllustratedEmptyState } from '@/components/ui/IllustratedEmptyState';
import { mockProfiles } from '@/data/mock-data';
import { colors, spacing, typography } from '@/constants/theme';
import { hasSupabaseConfig } from '@/lib/env';
import { requireSupabase } from '@/lib/supabase';
import { getDemoMessages, saveDemoMessages, type DemoChatMessage } from '@/lib/demo-state';
import { listMessages, sendMessage, subscribeToMessages } from '@/services/messages';

type LiveMessage = {
  id: string | number;
  sender_id: string;
  content: string;
  created_at?: string;
};

const fallbackAvatar = require('../../../assets/branding/logo-mark.png');

function seedDemoMessages(): DemoChatMessage[] {
  return [
    { id: 'demo-seed-1', sender_id: 'demo-them', content: 'Hey! I saw we both like the same stuff 👋', created_at: new Date(0).toISOString() },
    { id: 'demo-seed-2', sender_id: 'demo-me', content: 'Yep 😄 Want to find somewhere public halfway?', created_at: new Date(1).toISOString() },
  ];
}

export default function ChatScreen() {
  const { id, matchId, name } = useLocalSearchParams<{ id: string; matchId?: string; name?: string }>();
  const profile = mockProfiles.find((item) => item.id === id);
  const displayName = profile?.displayName || name || 'Match';
  const distance = profile?.distanceKm;
  const live = Boolean(hasSupabaseConfig && matchId);
  const scrollRef = useRef<ScrollView>(null);

  const [value, setValue] = useState('');
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const demoProfileId = id || 'demo-match';

  const visibleMessages = useMemo(
    () => live ? messages : messages.length ? messages : seedDemoMessages(),
    [live, messages],
  );

  useEffect(() => {
    if (live) return;
    let mounted = true;
    void getDemoMessages(demoProfileId).then((stored) => {
      if (mounted) setMessages(stored.length ? stored : seedDemoMessages());
    });
    return () => { mounted = false; };
  }, [demoProfileId, live]);

  useEffect(() => {
    if (!live || !matchId) return;

    let mounted = true;
    let unsubscribe = () => {};

    void requireSupabase().auth.getSession().then(({ data }) => {
      if (mounted) setMyId(data.session?.user.id ?? null);
    });

    void listMessages(matchId)
      .then((rows) => {
        if (!mounted) return;
        setMessages(rows as LiveMessage[]);
        unsubscribe = subscribeToMessages(matchId, (message) => {
          if (!mounted) return;
          setMessages((current) => current.some((item) => item.id === message.id)
            ? current
            : [...current, message as LiveMessage]);
        });
      })
      .catch((error) => {
        if (mounted) Alert.alert('Could not load chat', error instanceof Error ? error.message : 'Please try again.');
      });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [live, matchId]);

  const send = async () => {
    const content = value.trim();
    if (!content) return;

    if (!live || !matchId) {
      const next: DemoChatMessage[] = [
        ...(visibleMessages as DemoChatMessage[]),
        { id: 'demo-me-' + Date.now(), sender_id: 'demo-me', content, created_at: new Date().toISOString() },
      ];
      setMessages(next);
      setValue('');
      await saveDemoMessages(demoProfileId, next);
      return;
    }

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
    } catch (error) {
      setMessages((current) => current.filter((item) => item.id !== optimistic.id));
      setValue(content);
      Alert.alert('Could not send message', error instanceof Error ? error.message : 'Please try again.');
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
          <Image source={profile?.avatar || fallbackAvatar} style={styles.avatar} resizeMode="cover" />
          <View style={styles.headerCopy}>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.status}>{live ? 'Realtime chat' : distance ? '~' + distance.toFixed(1) + ' km away • demo' : 'Demo chat'}</Text>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
          {visibleMessages.map((message, index) => {
            const mine = live ? message.sender_id === myId : message.sender_id === 'demo-me';
            return (
              <Animated.View
                key={String(message.id)}
                entering={FadeInUp.delay(Math.min(index, 4) * 35).duration(220)}
                style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                <Text style={mine ? styles.mineText : styles.bubbleText}>{message.content}</Text>
              </Animated.View>
            );
          })}
          {live && !visibleMessages.length ? (
            <IllustratedEmptyState
              image={require('../../../assets/illustrations/empty-chat.png')}
              title="Say hi"
              body="You already matched. Start the conversation when you’re ready."
            />
          ) : null}
        </ScrollView>

        <SabaiButton
          label="Find a fair place"
          variant="secondary"
          onPress={() => router.push({ pathname: '/meeting/[id]', params: { id, matchId: matchId || '', name: displayName } })}
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
            style={styles.input}
          />
          <Pressable style={styles.send} onPress={send} accessibilityLabel="Send message">
            <Ionicons name="send" size={20} color={value.trim() ? colors.primaryStrong : colors.textMuted} />
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
