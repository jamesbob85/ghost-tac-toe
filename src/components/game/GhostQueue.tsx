import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MarkEntry, Player } from '../../types/game';
import { COLORS, FONT_SIZES, RADIUS, SPACING } from '../../constants/theme';
import { MAX_MARKS } from '../../constants/gameConfig';

interface GhostQueueProps {
  player: Player;
  marks: MarkEntry[];
  isVisible: boolean;
}

const AGE_OPACITIES = [0.35, 0.65, 1.0]; // oldest → newest
const ROW_COL_LABELS = ['A1','B1','C1','A2','B2','C2','A3','B3','C3'];

export function GhostQueue({ player, marks, isVisible }: GhostQueueProps) {
  if (!isVisible) return null;

  const color = player === 'X' ? COLORS.playerX : COLORS.playerO;
  const dimColor = player === 'X' ? COLORS.playerXDim : COLORS.playerODim;

  // Pad to MAX_MARKS slots
  const slots = Array(MAX_MARKS).fill(null).map((_, i) => marks[i] ?? null);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {player === 'X' ? '🟣' : '🔵'} Next to vanish →
      </Text>
      <View style={styles.slots}>
        {slots.map((mark, i) => {
          const opacity = mark ? AGE_OPACITIES[i] : 0.15;
          const isOldest = i === 0 && marks.length >= MAX_MARKS;

          return (
            <View
              key={i}
              style={[
                styles.slot,
                { borderColor: color, backgroundColor: mark ? dimColor : COLORS.surface, opacity },
              ]}
            >
              {isOldest && mark && (
                <View style={[styles.vanishIndicator, { backgroundColor: color }]} />
              )}
              <Text style={[styles.markText, { color }]}>
                {mark ? player : '·'}
              </Text>
              {mark && (
                <Text style={[styles.posLabel, { color }]}>
                  {ROW_COL_LABELS[mark.index]}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  label: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  slots: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  slot: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  markText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '900',
  },
  posLabel: {
    fontSize: FONT_SIZES.xs - 1,
    fontWeight: '600',
    position: 'absolute',
    bottom: 2,
    right: 4,
    opacity: 0.7,
  },
  vanishIndicator: {
    position: 'absolute',
    top: -4,
    left: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
