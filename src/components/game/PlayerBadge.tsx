import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { Player } from '../../types/game';
import {
  COLORS,
  FONTS,
  FONT_SIZES,
  SPACING,
  SPRING,
  BORDERS,
  PAPER_SHADOW,
} from '../../constants/theme';

interface PlayerBadgeProps {
  player: Player;
  score: number;
  isActive: boolean;
  label: string;
}

export function PlayerBadge({ player, score, isActive, label }: PlayerBadgeProps) {
  const inkColor = player === 'X' ? COLORS.playerX : COLORS.playerO;
  const wash = player === 'X' ? COLORS.playerXDim : COLORS.playerODim;

  const scale = useSharedValue(1);
  const cursor = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      scale.value = withSequence(
        withTiming(1.02, { duration: 130 }),
        withSpring(1, SPRING.gentle),
      );
      cursor.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 540 }),
          withTiming(0, { duration: 540 }),
        ),
        -1,
        false,
      );
    } else {
      cursor.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(1, { duration: 200 });
    }
  }, [isActive]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const cursorStyle = useAnimatedStyle(() => ({
    opacity: cursor.value,
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: isActive ? wash : COLORS.surfaceBright,
          borderColor: isActive ? inkColor : COLORS.border,
        },
        isActive && PAPER_SHADOW,
        containerStyle,
      ]}
    >
      <View style={styles.eyebrowRow}>
        <Text style={[styles.eyebrow, { color: inkColor }]} numberOfLines={1}>
          {label}
        </Text>
        <Animated.Text style={[styles.cursor, { color: inkColor }, cursorStyle]}>▍</Animated.Text>
      </View>
      <Text style={[styles.name, { color: COLORS.textPrimary }]} numberOfLines={1}>
        {player === 'X' ? 'duellist' : 'apparition'}
      </Text>
      <View style={styles.divider} />
      <View style={styles.scoreRow}>
        <Text style={styles.scoreCaption}>VICTORIES</Text>
        <Text style={[styles.score, { color: inkColor }]}>{score}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.md - 2,
    paddingVertical: SPACING.sm,
    borderWidth: BORDERS.hairline,
    position: 'relative',
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  eyebrow: {
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.xs,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  cursor: {
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.sm,
    lineHeight: FONT_SIZES.sm,
  },
  name: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 6,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  scoreCaption: {
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.xs - 1,
    color: COLORS.textMuted,
    letterSpacing: 1.4,
  },
  score: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.xl,
    fontVariant: ['tabular-nums'],
  },
});
