import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  style?: ViewStyle;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
}: ButtonProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const isDisabled = disabled || loading;

  const sizeStyles: Record<ButtonSize, { container: ViewStyle; text: TextStyle; iconSize: number }> = {
    sm: {
      container: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.sm,
      },
      text: { ...typography.captionBold },
      iconSize: 16,
    },
    md: {
      container: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.md,
      },
      text: { ...typography.bodyBold },
      iconSize: 20,
    },
    lg: {
      container: {
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.xxl,
        borderRadius: borderRadius.lg,
      },
      text: { ...typography.bodyBold, fontSize: 17 },
      iconSize: 22,
    },
  };

  const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> = {
    primary: {
      container: {
        backgroundColor: isDisabled ? colors.textTertiary : colors.primary,
      },
      text: { color: '#FFFFFF' },
    },
    secondary: {
      container: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: isDisabled ? colors.textTertiary : colors.primary,
      },
      text: { color: isDisabled ? colors.textTertiary : colors.primary },
    },
    ghost: {
      container: {
        backgroundColor: 'transparent',
      },
      text: { color: isDisabled ? colors.textTertiary : colors.primary },
    },
  };

  const currentSize = sizeStyles[size];
  const currentVariant = variantStyles[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.base,
        currentSize.container,
        currentVariant.container,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#FFFFFF' : colors.primary}
        />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon as any}
              size={currentSize.iconSize}
              color={currentVariant.text.color as string}
              style={{ marginRight: spacing.sm }}
            />
          )}
          <Text style={[currentSize.text, currentVariant.text]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
