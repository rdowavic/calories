import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../theme';

interface UnitToggleProps {
  value: 'metric' | 'imperial';
  onChange: (val: 'metric' | 'imperial') => void;
}

export default function UnitToggle({ value, onChange }: UnitToggleProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const translateX = useSharedValue(value === 'metric' ? 0 : 1);

  React.useEffect(() => {
    translateX.value = withSpring(value === 'metric' ? 0 : 1, {
      damping: 20,
      stiffness: 200,
    });
  }, [value]);

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: translateX.value * SEGMENT_WIDTH,
        },
      ],
    };
  });

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderRadius: borderRadius.md,
          borderWidth: 1,
          borderColor: colors.border,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.indicator,
          indicatorStyle,
          {
            backgroundColor: colors.primary,
            borderRadius: borderRadius.sm,
          },
        ]}
      />
      <TouchableOpacity
        style={styles.segment}
        onPress={() => onChange('metric')}
        activeOpacity={0.7}
      >
        <Text
          style={[
            typography.captionBold,
            {
              color: value === 'metric' ? '#FFFFFF' : colors.textSecondary,
            },
          ]}
        >
          Metric
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.segment}
        onPress={() => onChange('imperial')}
        activeOpacity={0.7}
      >
        <Text
          style={[
            typography.captionBold,
            {
              color: value === 'imperial' ? '#FFFFFF' : colors.textSecondary,
            },
          ]}
        >
          Imperial
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const SEGMENT_WIDTH = 100;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    width: SEGMENT_WIDTH * 2,
    height: 40,
    padding: 3,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: SEGMENT_WIDTH - 3,
    height: 34,
  },
  segment: {
    width: SEGMENT_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
});
