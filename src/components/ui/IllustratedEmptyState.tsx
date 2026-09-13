import { Image, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { colors, spacing, typography } from '@/constants/theme';
import { SabaiButton } from '@/components/ui/SabaiButton';

type Props = {
  image: ImageSourcePropType;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function IllustratedEmptyState({ image, title, body, actionLabel, onAction }: Props) {
  return (
    <View style={styles.wrap}>
      <Image source={image} style={styles.image} resizeMode="contain" />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <SabaiButton label={actionLabel} variant="ghost" onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  image: { width: 210, height: 210, marginBottom: spacing.sm },
  title: {
    color: colors.navy,
    fontSize: typography.heading,
    fontWeight: '900',
    textAlign: 'center',
  },
  body: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 360,
  },
  action: { width: '100%', marginTop: spacing.lg },
});
