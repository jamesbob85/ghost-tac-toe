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
import { COLORS, FONT_SIZES, RADIUS, SPACING, SPRING, glowShadow } from '../../constants/theme';

interface PlayerBadgeProps {
  player: Player;
  score: number;
  isActive: boolean;
  label: string;
}

export function PlayerBadge({ player, score, isActive, label }: PlayerBadgeProps) {
  const color = player === 'X' ? COLORS.playerX : COLORS.playerO;
  const dimColor = player === 'X' ? COLORS.playerXDim : COLORS.playerODim;

  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const dotScale = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      scale.value = withSequence(
        withTiming(1.04, { duration: 150 }),
        withSpring(1, SPRING.bounce),
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 600 }),
          withTiming(0.3, { duration: 600 }),
        ),
        -1,
        false,
      );
      dotScale.value = withSpring(1, SPRING.bounce);
    } else {
      glowOpacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(1, { duration: 200 });
      dotScale.value = withTiming(0, { duration: 150 });
    }
  }, [isActive]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderColor: `rgba(${player === 'X' ? '167, 139, 250' : '78, 205, 196'}, ${glowOpacity.value * 0.7})`,
  }));

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
    opacity: dotScale.value,
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: isActive ? dimColor : COLORS.surfaceElevated,
        },
        isActive && glowShadow(color, 0.25),
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
      <Animated.View style={[styles.activeDot, { backgroundColor: color }, dotStyle]} />
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
    width: 10,
    height: 10,
    borderRadius: 5,
    position: 'absolute',
    top: 8,
    right: 8,
  },
});
