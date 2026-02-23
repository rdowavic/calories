import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  useDerivedValue,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { FoodLog } from '@calories/shared';
import { useTheme } from '../../theme';
import MealItem from './MealItem';

interface MealSectionProps {
  title: string;
  icon: string;
  calories: number;
  items: FoodLog[];
  onItemPress: (log: FoodLog) => void;
  onItemDelete: (logId: string) => void;
}

export default function MealSection({
  title,
  icon,
  calories,
  items,
  onItemPress,
  onItemDelete,
}: MealSectionProps) {
  const { colors, typography, spacing, borderRadius, isDark } = useTheme();
  const [isExpanded, setIsExpanded] = useState(true);

  const expandProgress = useSharedValue(1);

  const toggleExpand = useCallback(() => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    expandProgress.value = withTiming(newExpanded ? 1 : 0, { duration: 250 });
  }, [isExpanded]);

  const contentStyle = useAnimatedStyle(() => {
    return {
      maxHeight: interpolate(expandProgress.value, [0, 1], [0, 1000]),
      opacity: expandProgress.value,
      overflow: 'hidden' as const,
    };
  });

  const chevronStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: `${interpolate(expandProgress.value, [0, 1], [-90, 0])}deg`,
        },
      ],
    };
  });

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceElevated,
          borderRadius: borderRadius.lg,
          marginBottom: spacing.md,
          ...(isDark
            ? { borderWidth: 1, borderColor: colors.border }
            : {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
                elevation: 2,
              }),
        },
      ]}
    >
      {/* Header */}
      <TouchableOpacity
        onPress={toggleExpand}
        activeOpacity={0.7}
        style={[
          styles.header,
          {
            padding: spacing.lg,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Ionicons
            name={icon as any}
            size={22}
            color={colors.primary}
          />
          <Text
            style={[
              typography.h4,
              { color: colors.text, marginLeft: spacing.sm },
            ]}
          >
            {title}
          </Text>
        </View>

        <View style={styles.headerRight}>
          <Text
            style={[
              typography.captionBold,
              { color: colors.textSecondary, marginRight: spacing.sm },
            ]}
          >
            {Math.round(calories)} cal
          </Text>
          <Animated.View style={chevronStyle}>
            <Ionicons
              name="chevron-down"
              size={20}
              color={colors.textTertiary}
            />
          </Animated.View>
        </View>
      </TouchableOpacity>

      {/* Items */}
      <Animated.View style={contentStyle}>
        {items.length === 0 ? (
          <View
            style={[
              styles.emptyContainer,
              { paddingBottom: spacing.lg, paddingHorizontal: spacing.lg },
            ]}
          >
            <Text
              style={[typography.caption, { color: colors.textTertiary }]}
            >
              Nothing logged yet
            </Text>
          </View>
        ) : (
          items.map((log) => (
            <MealItem
              key={log.id}
              log={log}
              onPress={() => onItemPress(log)}
              onDelete={() => onItemDelete(log.id)}
            />
          ))
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
  },
});
