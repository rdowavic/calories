import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

interface ChatInputProps {
  onSend: (text: string) => void;
  onCameraPress?: () => void;
  onBarcodePress?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function ChatInput({
  onSend,
  onCameraPress,
  onBarcodePress,
  disabled = false,
  placeholder = 'Describe what you ate...',
}: ChatInputProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const [text, setText] = useState('');
  const [inputHeight, setInputHeight] = useState(40);
  const inputRef = useRef<TextInput>(null);

  const hasText = text.trim().length > 0;

  const handleSend = () => {
    if (!hasText || disabled) return;
    const trimmed = text.trim();
    setText('');
    setInputHeight(40);
    onSend(trimmed);
  };

  const maxInputHeight = 40 * 4;

  return (
    <View
      style={[
        styles.outerContainer,
        {
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingHorizontal: spacing.md,
          paddingTop: 6,
          paddingBottom: 6,
        },
      ]}
    >
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: colors.surface,
            borderRadius: borderRadius.xl,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: spacing.xs,
            alignItems: 'flex-end',
          },
        ]}
      >
        {/* Camera button */}
        {onCameraPress && (
          <TouchableOpacity
            onPress={onCameraPress}
            disabled={disabled}
            activeOpacity={0.6}
            style={[styles.iconButton, { marginBottom: 3 }]}
          >
            <Ionicons
              name="camera-outline"
              size={22}
              color={disabled ? colors.textTertiary : colors.textSecondary}
            />
          </TouchableOpacity>
        )}

        {/* Barcode button */}
        {onBarcodePress && (
          <TouchableOpacity
            onPress={onBarcodePress}
            disabled={disabled}
            activeOpacity={0.6}
            style={[styles.iconButton, { marginBottom: 3 }]}
          >
            <Ionicons
              name="barcode-outline"
              size={22}
              color={disabled ? colors.textTertiary : colors.textSecondary}
            />
          </TouchableOpacity>
        )}

        {/* Text input */}
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          multiline
          editable={!disabled}
          onContentSizeChange={(e) => {
            const height = e.nativeEvent.contentSize.height;
            setInputHeight(Math.min(Math.max(40, height), maxInputHeight));
          }}
          style={[
            typography.body,
            styles.textInput,
            {
              color: colors.text,
              height: inputHeight,
              paddingHorizontal: spacing.sm,
            },
          ]}
          returnKeyType="default"
        />

        {/* Send button */}
        {hasText && (
          <AnimatedTouchable
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(150)}
            onPress={handleSend}
            disabled={disabled}
            activeOpacity={0.7}
            style={[
              styles.sendButton,
              {
                backgroundColor: disabled ? colors.textTertiary : colors.primary,
                borderRadius: borderRadius.full,
                marginBottom: 3,
              },
            ]}
          >
            <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
          </AnimatedTouchable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {},
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
});
