import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../../theme/colors';
import { radius } from '../../../theme/radius';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

type ButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
  fullWidth?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
};

export default function Button({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  fullWidth = true,
  style,
  icon
}: ButtonProps) {
  const isBlocked = disabled || loading;

  const handlePress = () => {
    if (!isBlocked) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isBlocked, busy: loading }}
      accessibilityLabel={title}
      onPress={handlePress}
      disabled={isBlocked}
      style={({ pressed }) => [
        styles.button,
        fullWidth && styles.fullWidth,
        variantStyles[variant],
        isBlocked && styles.disabled,
        pressed && !isBlocked && styles.pressed,
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.black : variant === 'ghost' ? colors.textSecondary : colors.white} />
      ) : (
        <View style={styles.content}>
          {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
          <Text style={[styles.text, textStyles[variant]]}>{title.toUpperCase()}</Text>
        </View>
      )}
    </Pressable>
  );
}

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.primary,
    borderWidth: 0,
  },
  secondary: {
    backgroundColor: colors.transparent,
    borderColor: colors.border,
    borderWidth: 1,
  },
  ghost: {
    backgroundColor: colors.transparent,
    borderWidth: 0,
  },
  danger: {
    backgroundColor: colors.danger,
    borderWidth: 0,
  }
});

const textStyles = StyleSheet.create({
  primary: { 
    color: colors.black,
    fontWeight: '900'
  },
  secondary: { 
    color: colors.white 
  },
  ghost: { 
    color: colors.textSecondary 
  },
  danger: { 
    color: colors.white 
  }
});

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  fullWidth: {
    width: '100%'
  },
  content: {
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconWrap: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm
  },
  text: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
    flexShrink: 1,
    textAlign: 'center',
    includeFontPadding: false,
  },
  disabled: {
    opacity: 0.4
  },
  pressed: {
    transform: [{ scale: 0.98 }]
  }
});
