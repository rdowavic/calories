import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useTheme } from '../../theme';
import { useSettingsStore } from '../../stores/settingsStore';
import { useAuthStore } from '../../stores/authStore';
import { createWeightEntry } from '../../services/weightService';
import Button from '../../components/common/Button';
import { lbToKg, kgToLb, formatWeight } from '@calories/shared';

export default function WeightLogScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const unit = useSettingsStore((s) => s.unitPreference);
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const currentWeightKg = user?.current_weight_kg ? Number(user.current_weight_kg) : null;
  const displayCurrent = currentWeightKg ? formatWeight(currentWeightKg, unit) : 'Not set';

  const [weightInput, setWeightInput] = useState('');
  const [note, setNote] = useState('');
  const [date] = useState(format(new Date(), 'yyyy-MM-dd'));

  const mutation = useMutation({
    mutationFn: () => {
      const valueInUnit = parseFloat(weightInput);
      if (isNaN(valueInUnit)) throw new Error('Invalid weight');
      const weight_kg = unit === 'imperial' ? lbToKg(valueInUnit) : valueInUnit;
      return createWeightEntry({ weight_kg, logged_date: date, note: note || undefined });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight'] });
      queryClient.invalidateQueries({ queryKey: ['projections'] });
      router.back();
    },
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ padding: spacing.lg }}>
        {/* Previous weight reference */}
        <View style={[styles.referenceCard, { backgroundColor: colors.surface, borderRadius: borderRadius.md }]}>
          <Text style={[typography.small, { color: colors.textSecondary }]}>Previous weight</Text>
          <Text style={[typography.bodyBold, { color: colors.text }]}>{displayCurrent}</Text>
        </View>

        {/* Weight Input */}
        <View style={{ marginTop: spacing.xl }}>
          <Text style={[typography.captionBold, { color: colors.text, marginBottom: spacing.sm }]}>
            Today's Weight
          </Text>
          <View style={[styles.inputRow, { backgroundColor: colors.surface, borderRadius: borderRadius.md }]}>
            <TextInput
              style={[typography.numberSmall, { color: colors.text, flex: 1, textAlign: 'center' }]}
              value={weightInput}
              onChangeText={setWeightInput}
              placeholder={unit === 'metric' ? '75.0' : '165.0'}
              placeholderTextColor={colors.textTertiary}
              keyboardType="decimal-pad"
              autoFocus
            />
            <Text style={[typography.body, { color: colors.textSecondary }]}>
              {unit === 'metric' ? 'kg' : 'lb'}
            </Text>
          </View>
        </View>

        {/* Note */}
        <View style={{ marginTop: spacing.lg }}>
          <Text style={[typography.captionBold, { color: colors.text, marginBottom: spacing.sm }]}>
            Note (optional)
          </Text>
          <TextInput
            style={[
              styles.noteInput,
              typography.body,
              { color: colors.text, backgroundColor: colors.surface, borderRadius: borderRadius.md },
            ]}
            value={note}
            onChangeText={setNote}
            placeholder="e.g., After breakfast, morning weigh-in"
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Date */}
        <View style={{ marginTop: spacing.lg }}>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            Date: {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </Text>
        </View>

        {/* Save Button */}
        <View style={{ marginTop: spacing.xl }}>
          <Button
            title="Save Weight"
            onPress={() => mutation.mutate()}
            loading={mutation.isPending}
            disabled={!weightInput || isNaN(parseFloat(weightInput))}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  referenceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  noteInput: {
    padding: 12,
    minHeight: 60,
    textAlignVertical: 'top',
  },
});
