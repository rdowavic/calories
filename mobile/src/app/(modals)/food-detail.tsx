import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { useDailyLogStore } from '../../stores/dailyLogStore';
import { useChatStore } from '../../stores/chatStore';
import { getFoodDetail } from '../../services/foodService';
import { createLog, addToFavorites } from '../../services/logService';
import Button from '../../components/common/Button';
import { MealCategory } from '@calories/shared';

export default function FoodDetailScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const params = useLocalSearchParams<{ foodId: string; source: string; barcode?: string; prefetchedFood?: string }>();
  const queryClient = useQueryClient();
  const selectedDate = useDailyLogStore((s) => s.selectedDate);

  // Use prefetched food data if available (e.g. from barcode scanner with Open Food Facts,
  // or from tapping a logged entry on the home screen)
  const parsedPrefetch = useMemo(() => {
    if (params.prefetchedFood) {
      try {
        return JSON.parse(params.prefetchedFood);
      } catch {
        return null;
      }
    }
    return null;
  }, [params.prefetchedFood]);

  const [servingQty, setServingQty] = useState(parsedPrefetch?.serving_qty ?? 1);
  const mealCategory: MealCategory = 'snack'; // No longer categorizing by meal

  const { data: fetchedFood, isLoading } = useQuery({
    queryKey: ['food', params.foodId, params.source],
    queryFn: () => getFoodDetail(params.foodId!, params.source!),
    enabled: !!params.foodId && !!params.source && !parsedPrefetch,
  });

  const food = parsedPrefetch ?? fetchedFood;

  const scaled = useMemo(() => {
    if (!food) return null;
    return {
      calories: Math.round((food.calories ?? 0) * servingQty),
      protein_g: Math.round((food.protein_g ?? 0) * servingQty * 10) / 10,
      carbs_g: Math.round((food.carbs_g ?? 0) * servingQty * 10) / 10,
      fat_g: Math.round((food.fat_g ?? 0) * servingQty * 10) / 10,
      fiber_g: Math.round((food.fiber_g ?? 0) * servingQty * 10) / 10,
      sugar_g: Math.round((food.sugar_g ?? 0) * servingQty * 10) / 10,
      sodium_mg: Math.round((food.sodium_mg ?? 0) * servingQty),
    };
  }, [food, servingQty]);

  const logMutation = useMutation({
    mutationFn: () => createLog({
      food_name: food!.food_name,
      brand_name: food!.brand_name ?? undefined,
      external_food_id: food!.external_food_id,
      food_source: food!.food_source,
      barcode: params.barcode,
      calories: scaled!.calories,
      protein_g: scaled!.protein_g,
      carbs_g: scaled!.carbs_g,
      fat_g: scaled!.fat_g,
      fiber_g: scaled!.fiber_g,
      sugar_g: scaled!.sugar_g,
      sodium_mg: scaled!.sodium_mg,
      serving_qty: servingQty,
      serving_unit: food!.serving_unit,
      serving_size_g: food!.serving_size_g ?? undefined,
      meal_category: mealCategory,
      logged_date: selectedDate,
      input_method: params.barcode ? 'barcode' : 'search',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs', selectedDate] });

      // Add confirmation message to chat
      const brandStr = food!.brand_name ? ` (${food!.brand_name})` : '';
      const qtyStr = servingQty !== 1 ? `${servingQty} × ` : '';
      useChatStore.getState().addMessage({
        id: `log-confirm-${Date.now()}`,
        role: 'assistant',
        content: `Logged **${food!.food_name}**${brandStr} — ${qtyStr}${food!.serving_unit}, **${scaled!.calories} cal**.`,
        timestamp: Date.now(),
        metadata: { logConfirmed: true },
      });

      router.back();
    },
  });

  if (isLoading || !food || !scaled) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[typography.body, { color: colors.textSecondary }]}>Loading nutrition info...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Food Info Header */}
        <View style={{ padding: spacing.lg }}>
          <Text style={[typography.h3, { color: colors.text }]}>{food.food_name}</Text>
          {food.brand_name && (
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
              {food.brand_name}
            </Text>
          )}
        </View>

        {/* Calorie Display */}
        <View style={[styles.calorieCard, { backgroundColor: colors.surface, marginHorizontal: spacing.lg, borderRadius: borderRadius.lg }]}>
          <Text style={[typography.number, { color: colors.primary }]}>{scaled.calories}</Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>calories</Text>
        </View>

        {/* Macros */}
        <View style={[styles.macroRow, { paddingHorizontal: spacing.lg, marginTop: spacing.lg }]}>
          {[
            { label: 'Protein', value: `${scaled.protein_g}g`, color: colors.proteinColor },
            { label: 'Carbs', value: `${scaled.carbs_g}g`, color: colors.carbsColor },
            { label: 'Fat', value: `${scaled.fat_g}g`, color: colors.fatColor },
          ].map(({ label, value, color }) => (
            <View key={label} style={[styles.macroItem, { backgroundColor: colors.surface, borderRadius: borderRadius.md }]}>
              <View style={[styles.macroDot, { backgroundColor: color }]} />
              <Text style={[typography.smallBold, { color: colors.textSecondary }]}>{label}</Text>
              <Text style={[typography.h4, { color: colors.text }]}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Portion Slider */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
          <Text style={[typography.captionBold, { color: colors.text, marginBottom: spacing.sm }]}>
            Serving Size
          </Text>
          <View style={[styles.sliderCard, { backgroundColor: colors.surface, borderRadius: borderRadius.md }]}>
            <Text style={[typography.h4, { color: colors.primary, textAlign: 'center' }]}>
              {servingQty} {food.serving_unit}
            </Text>
            <Slider
              style={{ marginTop: spacing.md }}
              minimumValue={0.25}
              maximumValue={5}
              step={0.25}
              value={servingQty}
              onValueChange={setServingQty}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
            <View style={styles.sliderLabels}>
              <Text style={[typography.small, { color: colors.textTertiary }]}>0.25</Text>
              <Text style={[typography.small, { color: colors.textTertiary }]}>5.0</Text>
            </View>
          </View>
        </View>

        {/* Additional Nutrition */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
          <Text style={[typography.captionBold, { color: colors.text, marginBottom: spacing.sm }]}>
            Nutrition Details
          </Text>
          <View style={[styles.nutritionList, { backgroundColor: colors.surface, borderRadius: borderRadius.md }]}>
            {[
              { label: 'Fiber', value: `${scaled.fiber_g}g` },
              { label: 'Sugar', value: `${scaled.sugar_g}g` },
              { label: 'Sodium', value: `${scaled.sodium_mg}mg` },
            ].map(({ label, value }, i) => (
              <View key={label}>
                <View style={styles.nutritionRow}>
                  <Text style={[typography.caption, { color: colors.textSecondary }]}>{label}</Text>
                  <Text style={[typography.captionBold, { color: colors.text }]}>{value}</Text>
                </View>
                {i < 2 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={[styles.actionBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.favButton, { borderColor: colors.border, borderRadius: borderRadius.md }]}
          onPress={() => {}}
        >
          <Ionicons name="heart-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Button
            title={`Add to Log  •  ${scaled.calories} cal`}
            onPress={() => logMutation.mutate()}
            loading={logMutation.isPending}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  calorieCard: {
    padding: 24,
    alignItems: 'center',
  },
  macroRow: {
    flexDirection: 'row',
    gap: 8,
  },
  macroItem: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  macroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sliderCard: {
    padding: 16,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  nutritionList: {
    padding: 16,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  divider: {
    height: 1,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
  },
  favButton: {
    width: 48,
    height: 48,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
