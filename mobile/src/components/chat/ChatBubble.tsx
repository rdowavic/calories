import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, Platform, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  FadeIn,
} from 'react-native-reanimated';
import Markdown from 'react-native-markdown-display';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { ChatMessageUI } from '../../stores/chatStore';
import FoodCard from './FoodCard';
import NarrowingQuestion from './NarrowingQuestion';

interface ChatBubbleProps {
  message: ChatMessageUI;
  isStreaming?: boolean;
  onFoodCardSelect?: (food: any) => void;
  onNarrowingSelect?: (option: string) => void;
  onTypeInstead?: () => void;
}

function CursorBlink() {
  const { colors } = useTheme();
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 400 }),
        withTiming(1, { duration: 400 })
      ),
      -1,
      true
    );
  }, []);

  const cursorStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.cursor,
        cursorStyle,
        { backgroundColor: colors.primary },
      ]}
    />
  );
}

export default function ChatBubble({
  message,
  isStreaming = false,
  onFoodCardSelect,
  onNarrowingSelect,
  onTypeInstead,
}: ChatBubbleProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const [selectedFoodIndex, setSelectedFoodIndex] = useState<number | null>(null);

  const isUser = message.role === 'user';
  const metadata = message.metadata;

  const bubbleStyle = isUser
    ? {
        backgroundColor: colors.chatUserBubble,
        borderRadius: borderRadius.xl,
        borderBottomRightRadius: borderRadius.xs ?? 4,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        maxWidth: '80%' as const,
        alignSelf: 'flex-end' as const,
        marginRight: spacing.lg,
        marginLeft: spacing.xxxl,
      }
    : {
        backgroundColor: colors.chatAssistantBubble,
        borderRadius: borderRadius.xl,
        borderBottomLeftRadius: borderRadius.xs ?? 4,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        maxWidth: '85%' as const,
        alignSelf: 'flex-start' as const,
        marginLeft: spacing.lg,
        marginRight: spacing.xxl,
      };

  const textColor = isUser ? colors.chatUserText : colors.chatAssistantText;

  const markdownStyles = useMemo(
    () => ({
      body: {
        ...(typography.body as object),
        color: textColor,
      },
      strong: {
        fontWeight: '700' as const,
        color: textColor,
      },
      em: {
        fontStyle: 'italic' as const,
        color: textColor,
      },
      paragraph: {
        marginTop: 0,
        marginBottom: 4,
        color: textColor,
      },
      bullet_list: {
        marginTop: 2,
        marginBottom: 2,
      },
      ordered_list: {
        marginTop: 2,
        marginBottom: 2,
      },
      list_item: {
        marginTop: 1,
        marginBottom: 1,
      },
      bullet_list_icon: {
        color: textColor,
        marginTop: 4,
        fontSize: 8,
      },
      heading1: {
        ...(typography.h3 as object),
        color: textColor,
        marginTop: 4,
        marginBottom: 4,
      },
      heading2: {
        ...(typography.h4 as object),
        color: textColor,
        marginTop: 4,
        marginBottom: 2,
      },
      heading3: {
        ...(typography.bodyBold as object),
        color: textColor,
        marginTop: 2,
        marginBottom: 2,
      },
      code_inline: {
        backgroundColor: isUser ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.06)',
        color: textColor,
        borderRadius: 4,
        paddingHorizontal: 4,
        fontSize: 13,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      },
      fence: {
        backgroundColor: isUser ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)',
        borderRadius: 8,
        padding: 8,
        marginVertical: 4,
      },
      link: {
        color: isUser ? '#A5D8FF' : colors.primary,
      },
    }),
    [colors, typography, textColor, isUser]
  );

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={[styles.wrapper, { marginVertical: spacing.xs }]}
    >
      {/* Photo attachment */}
      {metadata?.photoUrl && (
        <View
          style={[
            styles.photoContainer,
            {
              alignSelf: isUser ? 'flex-end' : 'flex-start',
              marginHorizontal: spacing.lg,
              marginBottom: spacing.xs,
              borderRadius: borderRadius.lg,
              overflow: 'hidden',
            },
          ]}
        >
          <Image
            source={{ uri: metadata.photoUrl }}
            style={styles.photo}
            resizeMode="cover"
          />
        </View>
      )}

      {/* Message bubble */}
      <View style={bubbleStyle}>
        {isUser ? (
          <View style={styles.textRow}>
            <Text style={[typography.body, { color: textColor }]}>
              {message.content}
            </Text>
          </View>
        ) : (
          <View style={styles.markdownContainer}>
            <Markdown style={markdownStyles}>
              {message.content || ''}
            </Markdown>
            {isStreaming && <CursorBlink />}
          </View>
        )}

        {/* Food cards as selectable options — Claude Code style */}
        {metadata?.foodCards && metadata.foodCards.length > 0 && (
          <View
            style={[
              styles.optionsList,
              {
                marginTop: spacing.md,
                borderTopWidth: 1,
                borderTopColor: colors.border,
                borderRadius: borderRadius.md,
                overflow: 'hidden',
                opacity: metadata.foodCardsDismissed ? 0.5 : 1,
              },
            ]}
          >
            {metadata.foodCards.filter((food: any) => food?.food_name).map((food: any, index: number) => (
              <FoodCard
                key={`${food.food_name}-${index}`}
                food={food}
                index={index}
                selected={selectedFoodIndex === index}
                onSelect={!metadata.foodCardsDismissed && onFoodCardSelect ? () => {
                  setSelectedFoodIndex(index);
                  onFoodCardSelect(food);
                } : undefined}
              />
            ))}
            {!metadata.foodCardsDismissed && onTypeInstead && (
              <TouchableOpacity
                onPress={onTypeInstead}
                activeOpacity={0.7}
                style={[
                  styles.typeInsteadRow,
                  {
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.md,
                  },
                ]}
              >
                <Text style={[typography.small, { color: colors.textTertiary }]}>
                  Type something else...
                </Text>
                <View
                  style={[
                    styles.typeInsteadBadge,
                    {
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[typography.smallBold, { color: colors.textSecondary }]}>
                    {(metadata.foodCards?.filter((f: any) => f?.food_name).length ?? 0) + 1}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Narrowing question */}
        {metadata?.narrowingQuestion && onNarrowingSelect && (
          <NarrowingQuestion
            question={metadata.narrowingQuestion.question}
            options={metadata.narrowingQuestion.options}
            onSelect={onNarrowingSelect}
          />
        )}

        {/* Log confirmed badge */}
        {metadata?.logConfirmed && (
          <View
            style={[
              styles.confirmedBadge,
              {
                backgroundColor: colors.successLight,
                borderRadius: borderRadius.sm,
                paddingVertical: spacing.xs,
                paddingHorizontal: spacing.sm,
                marginTop: spacing.sm,
              },
            ]}
          >
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={colors.success}
            />
            <Text
              style={[
                typography.smallBold,
                { color: colors.success, marginLeft: spacing.xs },
              ]}
            >
              Logged successfully
            </Text>
          </View>
        )}
      </View>

      {/* Timestamp */}
      <Text
        style={[
          typography.small,
          {
            color: colors.textTertiary,
            marginTop: 2,
            marginHorizontal: spacing.xl,
            alignSelf: isUser ? 'flex-end' : 'flex-start',
          },
        ]}
      >
        {new Date(message.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {},
  textRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  markdownContainer: {
    flexDirection: 'column',
  },
  cursor: {
    width: 2,
    height: 18,
    marginLeft: 2,
    borderRadius: 1,
  },
  photoContainer: {
    width: 200,
    height: 200,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  confirmedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  optionsList: {},
  typeInsteadRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeInsteadBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
});
