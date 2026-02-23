import React, { useState, useCallback } from 'react';
import { View, TextInput, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { searchFoods, getFrequentFoods } from '../../services/foodService';
import { FoodSearchResult } from '@calories/shared';

export default function FoodSearchScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const [query, setQuery] = useState('');

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['foods', 'search', query],
    queryFn: () => searchFoods(query),
    enabled: query.length >= 2,
    staleTime: 5 * 60 * 1000,
  });

  const { data: frequentFoods } = useQuery({
    queryKey: ['foods', 'frequent'],
    queryFn: getFrequentFoods,
    staleTime: 10 * 60 * 1000,
  });

  const results = query.length >= 2 ? (searchResults?.results ?? []) : (frequentFoods ?? []);
  const sectionTitle = query.length >= 2 ? `Results for "${query}"` : 'Frequently Logged';

  const handleSelectFood = useCallback((food: FoodSearchResult) => {
    router.push({
      pathname: '/(modals)/food-detail',
      params: { foodId: food.external_food_id, source: food.food_source },
    });
  }, []);

  const renderItem = useCallback(({ item }: { item: FoodSearchResult }) => (
    <TouchableOpacity
      style={[styles.resultItem, { borderBottomColor: colors.border }]}
      onPress={() => handleSelectFood(item)}
      activeOpacity={0.6}
    >
      <View style={{ flex: 1 }}>
        <Text style={[typography.body, { color: colors.text }]} numberOfLines={1}>
          {item.food_name}
        </Text>
        {item.brand_name && (
          <Text style={[typography.small, { color: colors.textTertiary }]} numberOfLines={1}>
            {item.brand_name}
          </Text>
        )}
        <Text style={[typography.small, { color: colors.textSecondary, marginTop: 2 }]}>
          {item.serving_qty} {item.serving_unit}
        </Text>
      </View>
      <View style={styles.calorieColumn}>
        <Text style={[typography.bodyBold, { color: colors.primary }]}>
          {Math.round(item.calories)}
        </Text>
        <Text style={[typography.small, { color: colors.textTertiary }]}>cal</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} style={{ marginLeft: 8 }} />
    </TouchableOpacity>
  ), [colors, typography, handleSelectFood]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={[styles.searchInput, { backgroundColor: colors.background, borderRadius: borderRadius.md }]}>
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <TextInput
            style={[typography.body, { color: colors.text, flex: 1, marginLeft: 8, paddingVertical: 0 }]}
            value={query}
            onChangeText={setQuery}
            placeholder="Search foods..."
            placeholderTextColor={colors.textTertiary}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Section Header */}
      <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>
        <Text style={[typography.label, { color: colors.textSecondary }]}>
          {sectionTitle}
        </Text>
      </View>

      {/* Results */}
      <FlashList
        data={results}
        renderItem={renderItem}
        estimatedItemSize={72}
        keyExtractor={(item) => `${item.food_source}-${item.external_food_id}`}
        contentContainerStyle={{ paddingHorizontal: spacing.lg }}
        ListEmptyComponent={
          query.length >= 2 && !isLoading ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color={colors.textTertiary} />
              <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.md }]}>
                No results found
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: {
    padding: 16,
    borderBottomWidth: 1,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  calorieColumn: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
});
