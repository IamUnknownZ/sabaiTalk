import type { Conversation, Interest, UserProfile } from '@/types/domain';

export const interests: Interest[] = [
  { id: 'gaming', label: 'Gaming', emoji: '🎮' },
  { id: 'music', label: 'Music', emoji: '🎧' },
  { id: 'movies', label: 'Movies', emoji: '🎬' },
  { id: 'coding', label: 'Coding', emoji: '💻' },
  { id: 'coffee', label: 'Cafe', emoji: '☕' },
  { id: 'study', label: 'Study', emoji: '📚' },
  { id: 'sports', label: 'Sports', emoji: '🏸' },
  { id: 'travel', label: 'Travel', emoji: '🧭' },
  { id: 'food', label: 'Food', emoji: '🍜' },
  { id: 'photo', label: 'Photography', emoji: '📷' }
];

const avatars = [
  require('../../assets/avatars/avatar-01.webp'),
  require('../../assets/avatars/avatar-02.webp'),
  require('../../assets/avatars/avatar-03.webp'),
  require('../../assets/avatars/avatar-04.webp'),
  require('../../assets/avatars/avatar-05.webp'),
  require('../../assets/avatars/avatar-06.webp'),
  require('../../assets/avatars/avatar-07.webp'),
  require('../../assets/avatars/avatar-08.webp'),
];

export const mockProfiles: UserProfile[] = [
  { id: 'demo-ton', displayName: 'Ton', age: 20, bio: 'Game nights, playlists, and finding new cafes.', avatar: avatars[0], distanceKm: 1.4, approximateArea: 'Around Bang Sue', lastActiveMinutes: 8, interests: [interests[0], interests[1], interests[4]] },
  { id: 'demo-may', displayName: 'May', age: 19, bio: 'Film photos, matcha, and weekend walks.', avatar: avatars[1], distanceKm: 2.1, approximateArea: 'Around Wong Sawang', lastActiveMinutes: 15, interests: [interests[2], interests[4], interests[9]] },
  { id: 'demo-kla', displayName: 'Kla', age: 20, bio: 'Coding, badminton, and random food missions.', avatar: avatars[2], distanceKm: 3.3, approximateArea: 'Around Tao Poon', lastActiveMinutes: 5, interests: [interests[3], interests[6], interests[8]] },
  { id: 'demo-fah', displayName: 'Fah', age: 19, bio: 'Always carrying headphones and a study list.', avatar: avatars[3], distanceKm: 4.7, approximateArea: 'Around Bang Pho', lastActiveMinutes: 31, interests: [interests[1], interests[5], interests[7]] }
];

export const mockConversations: Conversation[] = [
  { id: 'conv-ton', user: mockProfiles[0], lastMessage: 'That cafe halfway looks good 👀', updatedLabel: '2m', unread: 2 },
  { id: 'conv-may', user: mockProfiles[1], lastMessage: 'I can do Saturday afternoon!', updatedLabel: '18m', unread: 0 },
  { id: 'conv-kla', user: mockProfiles[2], lastMessage: 'gg, next round later 😂', updatedLabel: '1h', unread: 0 }
];
