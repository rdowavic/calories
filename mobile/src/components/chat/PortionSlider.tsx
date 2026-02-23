import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  runOnJS,
  withSpring,
  clamp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme';

interface PortionSliderProps {
  value: number;
  onChange: (value: number) => void;
  unit: string;
  min?: number;
  max?: number;
  step?: number;
}

const SLIDER_WIDTH = 280;
const THUMB_SIZE = 28;
const TRACK_HEIGHT = 6;

export default function PortionSlider({
  value,
  onChange,
  unit,
  min = 0.25,
  max = 5,
  step = 0.25,
}: PortionSliderProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const fraction = (value - min) / (max - min);
  const initialX = fraction * (SLIDER_WIDTH - THUMB_SIZE);
  const translateX = useSharedValue(initialX);
  const lastSteppedValue = useSharedValue(value);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
  }, []);

  const updateValue = useCallback(
    (newValue: number) => {
      onChange(newValue);
    },
    [onChange]
  );

  const snapToStep = useCallback(
    (rawFraction: number) => {
      const rawValue = min + rawFraction * (max - min);
      const stepped = Math.round(rawValue / step) * step;
      return Math.max(min, Math.min(max, parseFloat(stepped.toFixed(4))));
    },
    [min, max, step]
  );

  const handleSlide = useCallback(
    (x: number) => {
      const clamped = Math.max(0, Math.min(SLIDER_WIDTH - THUMB_SIZE, x));
      const frac = clamped / (SLIDER_WIDTH - THUMB_SIZE);
      const newValue = snapToStep(frac);

      if (newValue !== lastSteppedValue.value) {
        lastSteppedValue.value = newValue;
        triggerHaptic();
        updateValue(newValue);
      }
    },
    [snapToStep, triggerHaptic, updateValue]
  );

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: translateX.value + THUMB_SIZE / 2,
  }));

  // Since we rely on gesture handling, use a simpler approach with
  // PanResponder-like onLayout + pointer events for cross-platform.
  // For production, you'd use GestureDetector from react-native-gesture-handler.

  React.useEffect(() => {
    const frac = (value - min) / (max - min);
    translateX.value = withSpring(frac * (SLIDER_WIDTH - THUMB_SIZE), {
      damping: 20,
      stiffness: 200,
    });
  }, [value, min, max]);

  const handleTrackPress = useCallback(
    (evt: any) => {
      const x = evt.nativeEvent.locationX - THUMB_SIZE / 2;
      const clamped = Math.max(0, Math.min(SLIDER_WIDTH - THUMB_SIZE, x));
      translateX.value = withSpring(clamped, { damping: 20, stiffness: 200 });
      const frac = clamped / (SLIDER_WIDTH - THUMB_SIZE);
      const newValue = snapToStep(frac);
      triggerHaptic();
      updateValue(newValue);
    },
    [snapToStep, triggerHaptic, updateValue]
  );

  return (
    <View style={[styles.container, { marginVertical: spacing.md }]}>
      {/* Value display */}
      <View style={styles.valueRow}>
        <Text style={[typography.numberSmall, { color: colors.primary }]}>
          {value % 1 === 0 ? value.toFixed(0) : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}
        </Text>
        <Text
          style={[
            typography.caption,
            { color: colors.textSecondary, marginLeft: spacing.xs },
          ]}
        >
          {unit}
        </Text>
      </View>

      {/* Slider track */}
      <View
        style={[
          styles.track,
          {
            backgroundColor: colors.surface,
            borderRadius: borderRadius.full,
            width: SLIDER_WIDTH,
          },
        ]}
        onStartShouldSetResponder={() => true}
        onResponderGrant={handleTrackPress}
        onResponderMove={(evt) => {
          const x = evt.nativeEvent.locationX - THUMB_SIZE / 2;
          const clamped = Math.max(0, Math.min(SLIDER_WIDTH - THUMB_SIZE, x));
          translateX.value = clamped;
          handleSlide(clamped);
        }}
      >
        {/* Fill */}
        <Animated.View
          style={[
            styles.fill,
            fillStyle,
            {
              backgroundColor: colors.primary,
              borderRadius: borderRadius.full,
            },
          ]}
        />
        {/* Thumb */}
        <Animated.View
          style={[
            styles.thumb,
            thumbStyle,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.primary,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
              elevation: 4,
            },
          ]}
        />
      </View>

      {/* Min/Max labels */}
      <View style={[styles.labelsRow, { width: SLIDER_WIDTH }]}>
        <Text style={[typography.small, { color: colors.textTertiary }]}>
          {min}
        </Text>
        <Text style={[typography.small, { color: colors.textTertiary }]}>
          {max}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  track: {
    height: TRACK_HEIGHT,
    justifyContent: 'center',
    position: 'relative',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: TRACK_HEIGHT,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 3,
    top: -(THUMB_SIZE - TRACK_HEIGHT) / 2,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
});
