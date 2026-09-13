import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'sabaitalk:demo:';
const DISCOVERY_KEY = `${PREFIX}acted-profiles`;

export type DemoChatMessage = {
  id: string;
  sender_id: 'demo-me' | 'demo-them';
  content: string;
  created_at: string;
};

export async function getDemoActedProfileIds() {
  const raw = await AsyncStorage.getItem(DISCOVERY_KEY);
  if (!raw) return [] as string[];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
  } catch {
    return [];
  }
}

export async function saveDemoActedProfileIds(ids: string[]) {
  await AsyncStorage.setItem(DISCOVERY_KEY, JSON.stringify([...new Set(ids)]));
}

function chatKey(profileId: string) {
  return `${PREFIX}chat:${profileId}`;
}

export async function getDemoMessages(profileId: string) {
  const raw = await AsyncStorage.getItem(chatKey(profileId));
  if (!raw) return [] as DemoChatMessage[];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as DemoChatMessage[] : [];
  } catch {
    return [];
  }
}

export async function saveDemoMessages(profileId: string, messages: DemoChatMessage[]) {
  await AsyncStorage.setItem(chatKey(profileId), JSON.stringify(messages));
}

export async function clearDemoState() {
  const keys = await AsyncStorage.getAllKeys();
  const demoKeys = keys.filter((key) => key.startsWith(PREFIX));
  if (demoKeys.length) await AsyncStorage.multiRemove(demoKeys);
}
