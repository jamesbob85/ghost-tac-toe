import React, { useEffect, useState } from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
} from 'react-native-reanimated';
import { Player } from '../../types/game';
import { useTranslation } from 'react-i18next';
import { COLORS, RADIUS, FONT_SIZES, SPRING, TIMING, glowShadow } from '../../constants/theme';

interface CellProps {
  index: number;
  value: Player | null;
  markAge: number | null;
  isWinCell: boolean;
  isChaosCell: boolean;
  isEvicting: boolean;
  isFocused: boolean;
  onPress: (index: number) => void;
  onTouchStart?: () => void;
  disabled: boolean;
  /** Board width — used to scale mark font size */
  boardWidth: number;
}

const AGE_OPACITIES = [0.35, 0.65, 1.0];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Cell({
  index,
  value,
  markAge,
  isWinCell,
  isChaosCell,
  isEvicting,
  isFocused,
  onPress,
  onTouchStart,
  disabled,
  boardWidth,
}: CellProps) {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const winGlow = useSharedValue(0);
  const chaosGlow = useSharedValue(0);
  const focusRing = useSharedValue(0);

  const color = value === 'X' ? COLORS.playerX : value === 'O' ? COLORS.playerO : COLORS.textMuted;
  const targetOpacity = markAge !== null ? AGE_OPACITIES[markAge] ?? 1.0 : 1.0;

  // Scale mark font with board size (~17% of board width)
  const markFontSize = Math.round(boardWidth * 0.17);

  // Entrance animation
  useEffect(() => {
    if (value !== null) {
      scale.value = 0;
      opacity.value = 0;
      scale.value = withSpring(1, SPRING.bounce);
      opacity.value = withTiming(targetOpacity, TIMING.fadeIn);
    } else {
      scale.value = withSequence(
        withTiming(0.8, { duration: 80 }),
        withTiming(0, { duration: 120 }),
      );
      opacity.value = withTiming(0, TIMING.fadeIn);
    }
  }, [value]);

  // Age opacity update
  useEffect(() => {
    if (value !== null) {
      opacity.value = withTiming(targetOpacity, TIMING.moderate);
    }
  }, [markAge, targetOpacity]);

  // Win cell glow
  useEffect(() => {
    if (isWinCell) {
      winGlow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 }),
        ),
        3,
        true,
      );
    } else {
      winGlow.value = withTiming(0, TIMING.fadeIn);
    }
  }, [isWinCell]);

  // Chaos cell pulse
  useEffect(() => {
    chaosGlow.value = isChaosCell
      ? withRepeat(
          withSequence(
            withTiming(1, { duration: 500 }),
            withTiming(0.3, { duration: 500 }),
          ),
          -1,
          true,
        )
      : withTiming(0, TIMING.moderate);
  }, [isChaosCell]);

  // Focus ring (keyboard/controller cursor)
  useEffect(() => {
    if (isFocused) {
      focusRing.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0.4, { duration: 500 }),
        ),
        -1,
        true,
      );
    } else {
      focusRing.value = withTiming(0, { duration: 150 });
    }
  }, [isFocused]);

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

  const focusStyle = useAnimatedStyle(() => ({
    opacity: focusRing.value,
  }));

  const getCellBg = () => {
    if (isWinCell) {
      return value === 'X' ? COLORS.playerXDim : COLORS.playerODim;
    }
    return COLORS.surfaceElevated;
  };

  const getGlowStyle = () => {
    if (isWinCell && value) {
      return glowShadow(value === 'X' ? COLORS.playerX : COLORS.playerO, 0.5);
    }
    if (isFocused) {
      return glowShadow(COLORS.borderFocus, 0.3);
    }
    return {};
  };

  return (
    <AnimatedPressable
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      style={[
        styles.cell,
        { backgroundColor: getCellBg() },
        isHovered && !disabled && !value && styles.cellHovered,
        isFocused && styles.cellFocused,
        getGlowStyle(),
      ]}
      onPress={() => onPress(index)}
      onTouchStart={onTouchStart}
      disabled={disabled || value !== null}
      accessibilityRole="button"
      accessibilityLabel={
        value
          ? (isEvicting
              ? t('a11y.cellOccupiedVanish', { cell: index + 1, player: value })
              : t('a11y.cellOccupied', { cell: index + 1, player: value }))
          : t('a11y.cellEmpty', { cell: index + 1 })
      }
    >
      {/* Focus ring (keyboard/controller cursor) */}
      {isFocused && (
        <Animated.View
          style={[styles.focusRing, focusStyle]}
          pointerEvents="none"
        />
      )}

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
        <Animated.Text style={[styles.mark, { color, fontSize: markFontSize }, markStyle]}>
          {value}
        </Animated.Text>
      )}

      {/* Chaos cell indicator */}
      {isChaosCell && !value && (
        <Animated.View style={[styles.chaosIndicator, chaosStyle]} pointerEvents="none">
          <Text style={[styles.chaosText, { fontSize: Math.round(boardWidth * 0.08) }]}>⚡</Text>
        </Animated.View>
      )}

      {/* Eviction warning dot */}
      {isEvicting && value && (
        <View style={[styles.evictDot, { backgroundColor: color }]} />
      )}
    </AnimatedPressable>
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
  cellHovered: {
    backgroundColor: COLORS.surfaceBright,
  },
  cellFocused: {
    backgroundColor: COLORS.surfaceBright,
  },
  mark: {
    fontWeight: '900',
    textAlign: 'center',
  },
  focusRing: {
    position: 'absolute',
    top: -1,
    bottom: -1,
    left: -1,
    right: -1,
    borderRadius: RADIUS.md + 1,
    borderWidth: 2,
    borderColor: COLORS.borderFocus,
  },
  winGlow: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: RADIUS.md,
  },
  chaosGlow: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
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
    // fontSize set dynamically
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
