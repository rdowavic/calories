import React, { useState, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

interface QuickAddButtonProps {
  onScan: () => void;
  onPhoto: () => void;
  onSearch: () => void;
}

interface MiniFabProps {
  icon: string;
  label: string;
  onPress: () => void;
  progress: Animated.SharedValue<number>;
  index: number;
}

function MiniFab({ icon, label, onPress, progress, index }: MiniFabProps) {
  const { colors, typography, spacing, borderRadius, isDark } = useTheme();

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      progress.value,
      [0, 1],
      [0, -(60 + index * 56)]
    );
    const scale = interpolate(progress.value, [0, 0.5, 1], [0, 0.5, 1]);
    const opacity = progress.value;

    return {
      transform: [{ translateY }, { scale }],
      opacity,
    };
  });

  return (
    <Animated.View style={[styles.miniFabRow, animatedStyle]}>
      <View
        style={[
          styles.miniFabLabel,
          {
            backgroundColor: colors.surfaceElevated,
            borderRadius: borderRadius.sm,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
            ...(isDark
              ? { borderWidth: 1, borderColor: colors.border }
              : {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                }),
          },
        ]}
      >
        <Text style={[typography.smallBold, { color: colors.text }]}>
          {label}
        </Text>
      </View>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={[
          styles.miniFab,
          {
            backgroundColor: colors.surfaceElevated,
            borderRadius: borderRadius.full,
            ...(isDark
              ? { borderWidth: 1, borderColor: colors.border }
              : {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.12,
                  shadowRadius: 8,
                  elevation: 4,
                }),
          },
        ]}
      >
        <Ionicons name={icon as any} size={22} color={colors.primary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function QuickAddButton({
  onScan,
  onPhoto,
  onSearch,
}: QuickAddButtonProps) {
  const { colors, borderRadius, isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const progress = useSharedValue(0);

  const toggle = useCallback(() => {
    const next = !isOpen;
    setIsOpen(next);
    progress.value = withSpring(next ? 1 : 0, {
      damping: 15,
      stiffness: 160,
      mass: 0.8,
    });
  }, [isOpen]);

  const handleAction = useCallback(
    (action: () => void) => {
      setIsOpen(false);
      progress.value = withSpring(0, { damping: 15, stiffness: 160 });
      action();
    },
    []
  );

  const mainRotation = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${interpolate(progress.value, [0, 1], [0, 45])}deg` },
      ],
    };
  });

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 0.3]),
    pointerEvents: progress.value > 0.1 ? 'auto' as const : 'none' as const,
  }));

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={toggle} />
      </Animated.View>

      {/* Mini FABs */}
      <View style={styles.fabStack} pointerEvents="box-none">
        <MiniFab
          icon="search-outline"
          label="Search"
          onPress={() => handleAction(onSearch)}
          progress={progress}
          index={2}
        />
        <MiniFab
          icon="camera-outline"
          label="Photo"
          onPress={() => handleAction(onPhoto)}
          progress={progress}
          index={1}
        />
        <MiniFab
          icon="barcode-outline"
          label="Scan"
          onPress={() => handleAction(onScan)}
          progress={progress}
          index={0}
        />

        {/* Main FAB */}
        <TouchableOpacity
          onPress={toggle}
          activeOpacity={0.85}
          style={[
            styles.mainFab,
            {
              backgroundColor: colors.primary,
              borderRadius: borderRadius.full,
              ...(isDark
                ? {}
                : {
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.35,
                    shadowRadius: 12,
                    elevation: 8,
                  }),
            },
          ]}
        >
          <Animated.View style={mainRotation}>
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  fabStack: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    alignItems: 'flex-end',
  },
  mainFab: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniFabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    right: 4,
    bottom: 4,
  },
  miniFabLabel: {
    marginRight: 12,
  },
  miniFab: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
