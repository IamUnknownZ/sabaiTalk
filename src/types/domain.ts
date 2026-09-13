import type { ImageSourcePropType } from 'react-native';

export type Interest = { id: string; label: string; emoji: string };

export type UserProfile = {
  id: string;
  displayName: string;
  age?: number;
  bio: string;
  avatar: ImageSourcePropType;
  distanceKm: number;
  approximateArea: string;
  lastActiveMinutes: number;
  interests: Interest[];
};

export type MeetingCategory = 'cafe' | 'food' | 'park' | 'mall' | 'cinema' | 'study';
