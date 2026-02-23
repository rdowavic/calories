import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../theme';

interface NarrowingQuestionProps {
  question: string;
  options: string[];
  onSelect: (option: string) => void;
}

export default function NarrowingQuestion({
  question,
  options,
  onSelect,
}: NarrowingQuestionProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (option: string) => {
    setSelected(option);
    onSelect(option);
  };

  return (
    <View style={[styles.container, { marginTop: spacing.sm }]}>
      <Text
        style={[
          typography.captionBold,
          { color: colors.text, marginBottom: spacing.sm },
        ]}
      >
        {question}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.chipsContainer, { gap: spacing.sm }]}
      >
        {options.map((option) => {
          const isSelected = selected === option;
          return (
            <TouchableOpacity
              key={option}
              onPress={() => handleSelect(option)}
              activeOpacity={0.7}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected
                    ? colors.primary
                    : colors.surfaceElevated,
                  borderRadius: borderRadius.full,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.lg,
                  borderWidth: 1,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  typography.captionBold,
                  {
                    color: isSelected ? '#FFFFFF' : colors.text,
                  },
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  chipsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
  },
  chip: {},
});
