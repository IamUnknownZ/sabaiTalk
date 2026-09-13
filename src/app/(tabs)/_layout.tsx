import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GuardError, GuardLoading } from '@/components/GuardState';
import { colors } from '@/constants/theme';
import { onboardingStagePath, useAuthSession } from '@/providers/AuthSessionProvider';

export default function TabsLayout() {
  const { session, authReady, stage, stageReady, error } = useAuthSession();

  if (!authReady || (session && !stageReady)) return <GuardLoading />;
  if (!session) return <Redirect href="/login" />;
  if (error) return <GuardError />;
  if (stage && stage !== 'complete') return <Redirect href={onboardingStagePath(stage)} />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryStrong,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 72, paddingTop: 7, paddingBottom: 7 },
        tabBarLabelStyle: { fontWeight: '700', fontSize: 10, textTransform: 'uppercase' },
      }}>
      <Tabs.Screen name="discover" options={{ title: 'Discover', tabBarIcon: ({ color, size }) => <Ionicons name="location-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="matches" options={{ title: 'Matches', tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="chats" options={{ title: 'Chat', tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} /> }} />
    </Tabs>
  );
}
