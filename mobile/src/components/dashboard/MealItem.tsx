import React, { useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { FoodLog } from '@calories/shared';
import { useTheme } from '../../theme';
import { getFoodEmoji } from '../../utils/foodEmoji';

interface MealItemProps {
  log: FoodLog;
  onPress: () => void;
  onDelete: () => void;
}

const SWIPE_THRESHOLD = -80;
const DELETE_THRESHOLD = -160;

export default function MealItem({ log, onPress, onDelete }: MealItemProps) {
  const { colors, typography, spacing } = useTheme();
  const translateX = useSharedValue(0);
  const isDeleting = useSharedValue(false);

  const triggerDelete = useCallback(() => {
    onDelete();
  }, [onDelete]);

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-5, 5])
    .onUpdate((e) => {
      // Only allow swiping left
      if (e.translationX < 0) {
        translateX.value = e.translationX;
      } else {
        translateX.value = 0;
      }
    })
    .onEnd((e) => {
      if (e.translationX < DELETE_THRESHOLD) {
        // Full swipe — delete with animation
        isDeleting.value = true;
        translateX.value = withTiming(-500, { duration: 200 }, () => {
          runOnJS(triggerDelete)();
        });
      } else if (e.translationX < SWIPE_THRESHOLD) {
        // Partial swipe — snap to reveal delete button
        translateX.value = withTiming(SWIPE_THRESHOLD);
      } else {
        // Not enough — snap back
        translateX.value = withTiming(0);
      }
    });

  const tap = Gesture.Tap().onEnd(() => {
    if (translateX.value < -10) {
      // If swiped open, close it
      translateX.value = withTiming(0);
    } else {
      runOnJS(onPress)();
    }
  });

  const composed = Gesture.Race(pan, tap);

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const deleteButtonStyle = useAnimatedStyle(() => {
    // Make the red background fill the entire exposed area
    const width = Math.abs(Math.min(translateX.value, 0));
    const opacity = interpolate(
      translateX.value,
      [SWIPE_THRESHOLD / 2, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    );
    return { width, opacity };
  });

  return (
    <View style={styles.wrapper}>
      {/* Delete button behind */}
      <Animated.View
        style={[
          styles.deleteAction,
          { backgroundColor: colors.error ?? '#EF4444' },
          deleteButtonStyle,
        ]}
      >
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            isDeleting.value = true;
            translateX.value = withTiming(-500, { duration: 200 }, () => {
              runOnJS(triggerDelete)();
            });
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Main content */}
      <GestureDetector gesture={composed}>
        <Animated.View
          style={[
            styles.container,
            {
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.lg,
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: colors.border,
              backgroundColor: colors.surfaceElevated,
            },
            rowStyle,
          ]}
        >
          <Text style={styles.emoji}>{getFoodEmoji(log.food_name, log.brand_name)}</Text>
          <View style={styles.leftContent}>
            <Text
              style={[typography.body, { color: colors.text }]}
              numberOfLines={1}
            >
              {log.food_name}
            </Text>
            <View style={styles.subtitleRow}>
              {log.brand_name && (
                <Text
                  style={[typography.small, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {log.brand_name}
                </Text>
              )}
              <Text style={[typography.small, { color: colors.textTertiary }]}>
                {log.brand_name ? ' \u00B7 ' : ''}
                {log.serving_qty} {log.serving_unit}
              </Text>
            </View>
          </View>

          <View style={styles.rightContent}>
            <Text style={[typography.bodyBold, { color: colors.text }]}>
              {Math.round(log.calories)}
            </Text>
            <Text style={[typography.small, { color: colors.textTertiary }]}>
              cal
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.textTertiary}
            style={{ marginLeft: spacing.sm }}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 4,
  },
  deleteText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emoji: {
    fontSize: 24,
    marginRight: 10,
  },
  leftContent: {
    flex: 1,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  rightContent: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
});
