import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { api } from '../../services/api';
import Button from '../../components/common/Button';
import { Recipe, CreateRecipeInput } from '@calories/shared';

export default function RecipeEditorScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [servings, setServings] = useState('1');
  const [ingredients, setIngredients] = useState<CreateRecipeInput['ingredients']>([]);

  const { data: recipes } = useQuery({
    queryKey: ['recipes'],
    queryFn: async () => {
      const { data } = await api.get('/recipes');
      return data.recipes as Recipe[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/recipes', {
        name,
        servings: parseFloat(servings) || 1,
        ingredients,
      });
      return data.recipe;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      setName('');
      setServings('1');
      setIngredients([]);
    },
  });

  const totalCalories = ingredients.reduce((sum, ing) => sum + ing.calories, 0);
  const perServing = Math.round(totalCalories / (parseFloat(servings) || 1));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Existing Recipes */}
        {recipes && recipes.length > 0 && (
          <View style={{ marginBottom: spacing.xl }}>
            <Text style={[typography.label, { color: colors.textSecondary, marginBottom: spacing.md }]}>
              MY RECIPES
            </Text>
            {recipes.map((recipe) => (
              <TouchableOpacity
                key={recipe.id}
                style={[styles.recipeItem, { backgroundColor: colors.surface, borderRadius: borderRadius.md }]}
                activeOpacity={0.6}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyBold, { color: colors.text }]}>{recipe.name}</Text>
                  <Text style={[typography.small, { color: colors.textSecondary }]}>
                    {recipe.servings} serving{Number(recipe.servings) !== 1 ? 's' : ''} • {Math.round(Number(recipe.total_calories) / Number(recipe.servings))} cal/serving
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* New Recipe Form */}
        <Text style={[typography.label, { color: colors.textSecondary, marginBottom: spacing.md }]}>
          CREATE NEW RECIPE
        </Text>

        <View style={{ marginBottom: spacing.lg }}>
          <Text style={[typography.captionBold, { color: colors.text, marginBottom: spacing.xs }]}>Name</Text>
          <TextInput
            style={[styles.input, typography.body, { color: colors.text, backgroundColor: colors.surface, borderRadius: borderRadius.md }]}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Chicken Stir Fry"
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        <View style={{ marginBottom: spacing.lg }}>
          <Text style={[typography.captionBold, { color: colors.text, marginBottom: spacing.xs }]}>Servings</Text>
          <TextInput
            style={[styles.input, typography.body, { color: colors.text, backgroundColor: colors.surface, borderRadius: borderRadius.md }]}
            value={servings}
            onChangeText={setServings}
            placeholder="1"
            placeholderTextColor={colors.textTertiary}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Ingredients */}
        <View style={{ marginBottom: spacing.lg }}>
          <View style={styles.sectionHeader}>
            <Text style={[typography.captionBold, { color: colors.text }]}>
              Ingredients ({ingredients.length})
            </Text>
            <TouchableOpacity onPress={() => router.push('/(modals)/food-search')}>
              <Text style={[typography.captionBold, { color: colors.primary }]}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {ingredients.length === 0 ? (
            <View style={[styles.emptyIngredients, { backgroundColor: colors.surface, borderRadius: borderRadius.md }]}>
              <Text style={[typography.caption, { color: colors.textTertiary, textAlign: 'center' }]}>
                Search and add ingredients to your recipe
              </Text>
            </View>
          ) : (
            ingredients.map((ing, i) => (
              <View key={i} style={[styles.ingredientRow, { borderBottomColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.body, { color: colors.text }]}>{ing.food_name}</Text>
                  <Text style={[typography.small, { color: colors.textSecondary }]}>
                    {ing.serving_qty} {ing.serving_unit}
                  </Text>
                </View>
                <Text style={[typography.captionBold, { color: colors.primary }]}>
                  {Math.round(ing.calories)} cal
                </Text>
                <TouchableOpacity
                  onPress={() => setIngredients(ingredients.filter((_, idx) => idx !== i))}
                  style={{ marginLeft: 8 }}
                >
                  <Ionicons name="close-circle" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Summary */}
        {ingredients.length > 0 && (
          <View style={[styles.summary, { backgroundColor: colors.primaryLight, borderRadius: borderRadius.md }]}>
            <Text style={[typography.captionBold, { color: colors.primary }]}>
              Total: {totalCalories} cal • Per serving: {perServing} cal
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Save Button */}
      {name && ingredients.length > 0 && (
        <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <Button
            title="Save Recipe"
            onPress={() => createMutation.mutate()}
            loading={createMutation.isPending}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  recipeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
  },
  input: {
    padding: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyIngredients: {
    padding: 24,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  summary: {
    padding: 16,
    alignItems: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
  },
});
