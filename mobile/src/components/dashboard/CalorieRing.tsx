import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
  useDerivedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useTheme } from '../../theme';

interface CalorieRingProps {
  consumed: number;
  goal: number;
  size?: number;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function CalorieRing({
  consumed,
  goal,
  size = 200,
}: CalorieRingProps) {
  const { colors, typography, spacing } = useTheme();

  const strokeWidth = size * 0.07;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const remaining = Math.max(0, goal - consumed);
  const fraction = goal > 0 ? Math.min(consumed / goal, 1.2) : 0;

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(fraction, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });
  }, [fraction]);

  const animatedCircleProps = useAnimatedProps(() => {
    const dashOffset = circumference * (1 - Math.min(progress.value, 1));
    return {
      strokeDashoffset: dashOffset,
    };
  });

  // Color based on percentage
  const getRingColor = () => {
    const pct = consumed / goal;
    if (pct > 1) return colors.error;
    if (pct > 0.8) return colors.warning;
    return colors.calorieRing;
  };

  const isOver = consumed > goal;
  const displayValue = isOver ? consumed - goal : remaining;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background track */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.surface}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress arc */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={getRingColor()}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedCircleProps}
          strokeLinecap="round"
          rotation="-90"
          origin={`${center}, ${center}`}
        />
      </Svg>

      {/* Center text */}
      <View style={styles.centerContent}>
        <Text
          style={[
            typography.number,
            {
              color: isOver ? colors.error : colors.text,
              textAlign: 'center',
            },
          ]}
        >
          {Math.round(displayValue)}
        </Text>
        <Text
          style={[
            typography.caption,
            {
              color: colors.textSecondary,
              textAlign: 'center',
              marginTop: -spacing.xs,
            },
          ]}
        >
          {isOver ? 'over' : 'remaining'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
