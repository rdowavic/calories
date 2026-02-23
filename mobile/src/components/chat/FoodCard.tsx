import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

interface FoodCardFood {
  food_name: string;
  brand_name?: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  serving_unit: string;
}

interface FoodCardProps {
  food: FoodCardFood;
  index: number;
  onSelect?: () => void;
  selected?: boolean;
}

export default function FoodCard({ food, index, onSelect, selected }: FoodCardProps) {
  const { colors, typography, spacing } = useTheme();

  const description = [
    food.brand_name,
    food.serving_unit,
    `${Math.round(food.calories)} cal`,
    `P ${Math.round(food.protein_g)}g`,
    `C ${Math.round(food.carbs_g)}g`,
    `F ${Math.round(food.fat_g)}g`,
  ].filter(Boolean).join(' · ');

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onSelect}
      disabled={!onSelect}
      style={[
        styles.container,
        {
          backgroundColor: selected ? colors.surfaceElevated : 'transparent',
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={styles.content}>
        <Text
          style={[typography.captionBold, { color: colors.text }]}
          numberOfLines={1}
        >
          {food.food_name}
        </Text>
        <Text
          style={[typography.small, { color: colors.textTertiary, marginTop: 2 }]}
          numberOfLines={1}
        >
          {description}
        </Text>
      </View>

      <View
        style={[
          styles.badge,
          {
            backgroundColor: selected ? colors.primary : colors.surface,
            borderWidth: selected ? 0 : 1,
            borderColor: colors.border,
          },
        ]}
      >
        <Text
          style={[
            typography.smallBold,
            { color: selected ? '#FFFFFF' : colors.textSecondary },
          ]}
        >
          {index + 1}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
