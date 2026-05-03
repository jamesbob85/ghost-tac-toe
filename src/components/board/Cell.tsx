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
import { COLORS, FONTS, SPRING, TIMING } from '../../constants/theme';

interface CellProps {
  index: number;
  value: Player | null;
  markAge: number | null;
  isWinCell: boolean;
  isChaosCell: boolean;
  isEvicting: boolean;
  isFocused: boolean;
  isLastRow: boolean;
  isLastCol: boolean;
  onPress: (index: number) => void;
  onTouchStart?: () => void;
  disabled: boolean;
  boardWidth: number;
}

const AGE_OPACITIES = [0.30, 0.62, 1.0];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function rotationFor(index: number): string {
  const deg = ((index * 31) % 11) - 5;
  return `${deg}deg`;
}

export function Cell({
  index,
  value,
  markAge,
  isWinCell,
  isChaosCell,
  isEvicting,
  isFocused,
  isLastRow,
  isLastCol,
  onPress,
  onTouchStart,
  disabled,
  boardWidth,
}: CellProps) {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const winPulse = useSharedValue(0);
  const chaosPulse = useSharedValue(0);
  const focusPulse = useSharedValue(0);

  const inkColor = value === 'X' ? COLORS.playerX : value === 'O' ? COLORS.playerO : COLORS.textMuted;
  const targetOpacity = markAge !== null ? AGE_OPACITIES[markAge] ?? 1.0 : 1.0;
  const markFontSize = Math.round(boardWidth * 0.18);
  const rotation = rotationFor(index);

  useEffect(() => {
    if (value !== null) {
      scale.value = 0.4;
      opacity.value = 0;
      scale.value = withSpring(1, SPRING.stamp);
      opacity.value = withTiming(targetOpacity, TIMING.fadeIn);
    } else {
      scale.value = withSequence(
        withTiming(0.85, { duration: 90 }),
        withTiming(0, { duration: 160 }),
      );
      opacity.value = withTiming(0, TIMING.fadeIn);
    }
  }, [value]);

  useEffect(() => {
    if (value !== null) {
      opacity.value = withTiming(targetOpacity, TIMING.moderate);
    }
  }, [markAge, targetOpacity]);

  useEffect(() => {
    if (isWinCell) {
      winPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 450 }),
          withTiming(0.4, { duration: 450 }),
        ),
        4,
        true,
      );
    } else {
      winPulse.value = withTiming(0, TIMING.fadeIn);
    }
  }, [isWinCell]);

  useEffect(() => {
    chaosPulse.value = isChaosCell
      ? withRepeat(
          withSequence(
            withTiming(1, { duration: 700 }),
            withTiming(0.45, { duration: 700 }),
          ),
          -1,
          true,
        )
      : withTiming(0, TIMING.moderate);
  }, [isChaosCell]);

  useEffect(() => {
    if (isFocused) {
      focusPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 480 }),
          withTiming(0.3, { duration: 480 }),
        ),
        -1,
        true,
      );
    } else {
      focusPulse.value = withTiming(0, { duration: 150 });
    }
  }, [isFocused]);

  const markStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: rotation }],
    opacity: opacity.value,
  }));

  const winStyle = useAnimatedStyle(() => ({
    opacity: winPulse.value,
  }));

  const chaosStyle = useAnimatedStyle(() => ({
    opacity: chaosPulse.value,
  }));

  const focusStyle = useAnimatedStyle(() => ({
    opacity: focusPulse.value,
  }));

  const isMarkable = !disabled && value === null;
  const cellBorderColor = COLORS.rule;

  return (
    <AnimatedPressable
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      style={[
        styles.cell,
        {
          borderRightWidth: isLastCol ? 0 : 1,
          borderBottomWidth: isLastRow ? 0 : 1,
          borderColor: cellBorderColor,
          backgroundColor: isHovered && isMarkable ? COLORS.surfaceBright : 'transparent',
        },
        isChaosCell && !value && styles.chaosBg,
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
      {isFocused && (
        <Animated.View style={[styles.focusRing, focusStyle]} pointerEvents="none" />
      )}

      {isWinCell && (
        <Animated.View
          style={[styles.winBar, { backgroundColor: inkColor }, winStyle]}
          pointerEvents="none"
        />
      )}

      {value && (
        <Animated.Text
          style={[
            styles.mark,
            { color: inkColor, fontSize: markFontSize },
            markStyle,
          ]}
        >
          {value === 'X' ? '✕' : '◯'}
        </Animated.Text>
      )}

      {isChaosCell && !value && (
        <Animated.View style={[styles.chaosOrnament, chaosStyle]} pointerEvents="none">
          <Text style={[styles.chaosGlyph, { fontSize: Math.round(boardWidth * 0.06) }]}>✶</Text>
        </Animated.View>
      )}

      {isEvicting && value && (
        <View style={styles.evictMark} pointerEvents="none">
          <Text style={styles.evictMarkText}>†</Text>
        </View>
      )}

      {/* Empty-cell coordinate whisper (top-left, faint) */}
      {!value && !isChaosCell && (
        <Text style={styles.coord}>{coordLabel(index)}</Text>
      )}
    </AnimatedPressable>
  );
}

function coordLabel(index: number): string {
  const col = ['a', 'b', 'c'][index % 3];
  const row = Math.floor(index / 3) + 1;
  return `${col}${row}`;
}

const styles = StyleSheet.create({
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  chaosBg: {
    backgroundColor: 'rgba(212, 168, 71, 0.13)',
  },
  mark: {
    fontFamily: FONTS.display,
    fontWeight: '400',
    textAlign: 'center',
    textShadowColor: 'rgba(26, 22, 17, 0.18)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
  focusRing: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    right: 4,
    borderWidth: 1.5,
    borderColor: COLORS.textBrass,
    borderStyle: 'dashed',
  },
  winBar: {
    position: 'absolute',
    bottom: 0,
    left: '15%',
    right: '15%',
    height: 3,
  },
  chaosOrnament: {
    position: 'absolute',
    top: 6,
    right: 8,
  },
  chaosGlyph: {
    fontFamily: FONTS.display,
    color: COLORS.chaosDeep,
  },
  evictMark: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  evictMarkText: {
    fontFamily: FONTS.display,
    color: COLORS.textBrass,
    fontSize: 18,
    lineHeight: 18,
    opacity: 0.7,
  },
  coord: {
    position: 'absolute',
    top: 6,
    left: 8,
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.textMuted,
    opacity: 0.35,
    letterSpacing: 0.5,
  },
});
