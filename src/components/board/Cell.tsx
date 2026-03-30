import React, { useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Player } from '../../types/game';
import { COLORS, RADIUS, FONT_SIZES } from '../../constants/theme';
import { MAX_MARKS } from '../../constants/gameConfig';

interface CellProps {
  index: number;
  value: Player | null;
  markAge: number | null; // 0 = oldest, MAX_MARKS-1 = newest; null if empty
  isWinCell: boolean;
  isChaosCell: boolean;
  isEvicting: boolean; // true on the turn this cell's mark will vanish
  onPress: (index: number) => void;
  disabled: boolean;
}

// Opacity based on mark age (0=oldest/faintest, 2=newest/full)
const AGE_OPACITIES = [0.35, 0.65, 1.0];

export function Cell({
  index,
  value,
  markAge,
  isWinCell,
  isChaosCell,
  isEvicting,
  onPress,
  disabled,
}: CellProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const winGlow = useSharedValue(0);
  const chaosGlow = useSharedValue(0);

  const color = value === 'X' ? COLORS.playerX : value === 'O' ? COLORS.playerO : COLORS.textMuted;
  const targetOpacity = markAge !== null ? AGE_OPACITIES[markAge] ?? 1.0 : 1.0;

  // Entrance animation when value appears
  useEffect(() => {
    if (value !== null) {
      scale.value = 0;
      opacity.value = 0;
      scale.value = withSpring(1, { damping: 12, stiffness: 200 });
      opacity.value = withTiming(targetOpacity, { duration: 200 });
    } else {
      // Cell cleared — fade out
      scale.value = withSequence(
        withTiming(0.8, { duration: 80 }),
        withTiming(0, { duration: 120 }),
      );
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [value]);

  // Age opacity update when other marks are placed (aging existing marks)
  useEffect(() => {
    if (value !== null) {
      opacity.value = withTiming(targetOpacity, { duration: 300 });
    }
  }, [markAge, targetOpacity]);

  // Win cell glow animation
  useEffect(() => {
    if (isWinCell) {
      winGlow.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0.4, { duration: 300 }),
        withTiming(1, { duration: 300 }),
        withTiming(0.4, { duration: 300 }),
        withTiming(1, { duration: 300 }),
      );
    } else {
      winGlow.value = withTiming(0, { duration: 200 });
    }
  }, [isWinCell]);

  // Chaos cell pulse
  useEffect(() => {
    chaosGlow.value = isChaosCell
      ? withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0.3, { duration: 500 }),
          withTiming(1, { duration: 500 }),
          withTiming(0.3, { duration: 500 }),
        )
      : withTiming(0, { duration: 300 });
  }, [isChaosCell]);

  const markStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const winStyle = useAnimatedStyle(() => ({
    opacity: winGlow.value,
  }));

  const chaosStyle = useAnimatedStyle(() => ({
    opacity: chaosGlow.value,
  }));

  const getCellBg = () => {
    if (isWinCell) {
      return value === 'X' ? COLORS.playerXDim : COLORS.playerODim;
    }
    return COLORS.surfaceElevated;
  };

  return (
    <TouchableOpacity
      style={[styles.cell, { backgroundColor: getCellBg() }]}
      onPress={() => onPress(index)}
      disabled={disabled || value !== null}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={
        value
          ? `Cell ${index + 1}, ${value} mark${isEvicting ? ', will vanish next turn' : ''}`
          : `Cell ${index + 1}, empty`
      }
    >
      {/* Chaos cell glow */}
      {isChaosCell && (
        <Animated.View
          style={[styles.chaosGlow, chaosStyle]}
          pointerEvents="none"
        />
      )}

      {/* Win cell highlight */}
      {isWinCell && (
        <Animated.View
          style={[
            styles.winGlow,
            { backgroundColor: value === 'X' ? COLORS.playerX : COLORS.playerO },
            winStyle,
          ]}
          pointerEvents="none"
        />
      )}

      {/* Mark */}
      {value && (
        <Animated.Text style={[styles.mark, { color }, markStyle]}>
          {value}
        </Animated.Text>
      )}

      {/* Chaos cell indicator (no mark) */}
      {isChaosCell && !value && (
        <Animated.View style={[styles.chaosIndicator, chaosStyle]} pointerEvents="none">
          <Text style={styles.chaosText}>⚡</Text>
        </Animated.View>
      )}

      {/* Eviction warning dot */}
      {isEvicting && value && (
        <View style={[styles.evictDot, { backgroundColor: color }]} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cell: {
    flex: 1,
    margin: 3,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mark: {
    fontSize: FONT_SIZES['4xl'],
    fontWeight: '900',
    textAlign: 'center',
  },
  winGlow: {
    position: 'absolute',
    inset: 0,
    borderRadius: RADIUS.md,
    opacity: 0.25,
  },
  chaosGlow: {
    position: 'absolute',
    inset: 0,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.chaos,
    opacity: 0.2,
  },
  chaosIndicator: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chaosText: {
    fontSize: FONT_SIZES['2xl'],
  },
  evictDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.9,
  },
});
