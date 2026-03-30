import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { Player } from '../../types/game';
import { COLORS, FONT_SIZES, RADIUS, SPACING } from '../../constants/theme';

interface PlayerBadgeProps {
  player: Player;
  score: number;
  isActive: boolean;
  label: string; // e.g. "You" / "AI" / "Player X"
}

export function PlayerBadge({ player, score, isActive, label }: PlayerBadgeProps) {
  const color = player === 'X' ? COLORS.playerX : COLORS.playerO;
  const dimColor = player === 'X' ? COLORS.playerXDim : COLORS.playerODim;

  const scale = useSharedValue(1);
  const borderOpacity = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      scale.value = withSequence(
        withTiming(1.04, { duration: 150 }),
        withTiming(1, { duration: 150 }),
      );
      borderOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 600 }),
          withTiming(0.3, { duration: 600 }),
        ),
        -1,
        false,
      );
    } else {
      borderOpacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(1, { duration: 200 });
    }
  }, [isActive]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderColor: `rgba(${player === 'X' ? '139, 92, 246' : '6, 182, 212'}, ${borderOpacity.value})`,
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: isActive ? dimColor : COLORS.surfaceElevated },
        containerStyle,
      ]}
    >
      <Text style={[styles.mark, { color }]}>{player}</Text>
      <View style={styles.info}>
        <Text style={[styles.label, { color: isActive ? COLORS.textPrimary : COLORS.textSecondary }]}>
          {label}
        </Text>
        <Text style={[styles.score, { color }]}>{score}</Text>
      </View>
      {isActive && (
        <View style={[styles.activeDot, { backgroundColor: color }]} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
    flex: 1,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  mark: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '900',
  },
  info: {
    flex: 1,
  },
  label: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  score: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: 8,
    right: 8,
  },
});
