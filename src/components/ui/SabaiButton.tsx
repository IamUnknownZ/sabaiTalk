import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';
import { colors, radius, shadow, spacing, typography } from '@/constants/theme';

type Props = PressableProps & { label: string; variant?: 'primary' | 'secondary' | 'ghost' | 'danger' };

export function SabaiButton({ label, variant = 'primary', disabled, ...props }: Props) {
  return (
    <Pressable
      {...props}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}>
      <Text style={[styles.label, variant === 'ghost' && styles.ghostLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 50, borderRadius: radius.pill, paddingHorizontal: spacing.xl, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: colors.primaryStrong },
  secondary: { backgroundColor: colors.mint },
  ghost: { backgroundColor: colors.surface, ...shadow },
  danger: { backgroundColor: colors.danger },
  label: { color: colors.surface, fontSize: typography.body, fontWeight: '700' },
  ghostLabel: { color: colors.navy },
  disabled: { opacity: 0.42 },
  pressed: { transform: [{ scale: 0.985 }], opacity: 0.9 },
});
