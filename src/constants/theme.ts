import { Platform } from 'react-native';

export const colors = {
  primary: '#78B7EE',
  primaryStrong: '#2D8CFF',
  primaryLight: '#A9D7F7',
  background: '#F7FAFC',
  surface: '#FFFFFF',
  accentGreen: '#9BCB9A',
  mint: '#5EE2B8',
  navy: '#173A6B',
  text: '#363636',
  textMuted: '#757E90',
  border: '#E7ECF1',
  coral: '#FF7A8A',
  yellow: '#FFD166',
  purple: '#8A7CFF',
  danger: '#EF6675',
  success: '#43C98B',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, jumbo: 48 } as const;
export const radius = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 } as const;

export const shadow = Platform.select({
  ios: { shadowColor: '#000000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  android: { elevation: 2 },
  default: { boxShadow: '0 4px 14px rgba(0,0,0,0.06)' },
});

export const typography = { display: 32, title: 24, heading: 20, body: 15, caption: 12 } as const;
