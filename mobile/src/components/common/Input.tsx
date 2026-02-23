import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '../../theme';

interface InputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: TextInputProps['keyboardType'];
  error?: string;
  multiline?: boolean;
}

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  error,
  multiline = false,
  ...rest
}: InputProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const labelPosition = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    labelPosition.value = withTiming(isFocused || value ? 1 : 0, {
      duration: 200,
    });
  }, [isFocused, value]);

  const labelAnimatedStyle = useAnimatedStyle(() => {
    return {
      top: interpolate(labelPosition.value, [0, 1], [17, -8]),
      fontSize: interpolate(labelPosition.value, [0, 1], [16, 12]),
    };
  });

  const borderColor = error
    ? colors.error
    : isFocused
    ? colors.primary
    : colors.border;

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.container,
          {
            borderColor,
            borderRadius: borderRadius.md,
            backgroundColor: colors.surface,
            borderWidth: isFocused ? 2 : 1,
            paddingHorizontal: spacing.lg,
            paddingTop: label ? spacing.xl : spacing.md,
            paddingBottom: spacing.md,
            minHeight: multiline ? 100 : undefined,
          },
        ]}
      >
        {label && (
          <Animated.Text
            style={[
              styles.label,
              labelAnimatedStyle,
              {
                color: error
                  ? colors.error
                  : isFocused
                  ? colors.primary
                  : colors.textSecondary,
                backgroundColor: colors.surface,
                paddingHorizontal: spacing.xs,
                left: spacing.md,
              },
            ]}
            onPress={() => inputRef.current?.focus()}
          >
            {label}
          </Animated.Text>
        )}
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={!label || isFocused || value ? placeholder : undefined}
          placeholderTextColor={colors.textTertiary}
          keyboardType={keyboardType}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            typography.body,
            {
              color: colors.text,
              padding: 0,
              margin: 0,
            },
            multiline && { minHeight: 60 },
          ]}
          {...rest}
        />
      </View>
      {error && (
        <Text
          style={[
            typography.small,
            {
              color: colors.error,
              marginTop: spacing.xs,
              marginLeft: spacing.lg,
            },
          ]}
        >
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  container: {
    position: 'relative',
  },
  label: {
    position: 'absolute',
    zIndex: 1,
    fontWeight: '500',
  },
});
