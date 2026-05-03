import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MarkEntry, Player } from '../../types/game';
import { useTranslation } from 'react-i18next';
import {
  COLORS,
  FONTS,
  FONT_SIZES,
  SPACING,
  BORDERS,
  ROMAN,
} from '../../constants/theme';
import { MAX_MARKS } from '../../constants/gameConfig';

interface GhostQueueProps {
  player: Player;
  marks: MarkEntry[];
  isVisible: boolean;
}

const AGE_OPACITIES = [0.32, 0.62, 1.0];
const COL_LABELS = ['a', 'b', 'c'];

function coordLabel(index: number): string {
  return `${COL_LABELS[index % 3]}${Math.floor(index / 3) + 1}`;
}

export function GhostQueue({ player, marks, isVisible }: GhostQueueProps) {
  const { t } = useTranslation();
  if (!isVisible) return null;

  const inkColor = player === 'X' ? COLORS.playerX : COLORS.playerO;
  const wash = player === 'X' ? COLORS.playerXDim : COLORS.playerODim;

  const slots = Array(MAX_MARKS).fill(null).map((_, i) => marks[i] ?? null);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.rule} />
        <Text style={styles.eyebrow}>STAMP CHRONICLE — STAMP {player}</Text>
        <View style={styles.rule} />
      </View>
      <Text style={styles.subtitle}>
        {t('game.nextToVanish')}
      </Text>

      <View style={styles.slots}>
        {slots.map((mark, i) => {
          const opacity = mark ? AGE_OPACITIES[i] : 1;
          const isOldest = i === 0 && marks.length >= MAX_MARKS;

          return (
            <View key={i} style={styles.slotColumn}>
              <Text style={styles.numeral}>{ROMAN[i]}</Text>
              <View
                style={[
                  styles.slot,
                  {
                    borderColor: mark ? inkColor : COLORS.border,
                    backgroundColor: mark ? wash : 'transparent',
                  },
                  isOldest && styles.slotEvicting,
                ]}
              >
                <Text
                  style={[
                    styles.markText,
                    { color: mark ? inkColor : COLORS.textMuted, opacity },
                  ]}
                >
                  {mark ? (player === 'X' ? '✕' : '◯') : '·'}
                </Text>
              </View>
              <Text
                style={[
                  styles.coord,
                  mark && { color: inkColor, opacity: 0.8 },
                ]}
              >
                {mark ? coordLabel(mark.index) : '—'}
              </Text>
              {isOldest && (
                <Text style={[styles.warn, { color: inkColor }]}>NEXT</Text>
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
    gap: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    width: '100%',
    justifyContent: 'center',
  },
  rule: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
    maxWidth: 60,
  },
  eyebrow: {
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textPrimary,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontStyle: 'italic',
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  slots: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: 4,
  },
  slotColumn: {
    alignItems: 'center',
    width: 56,
    gap: 2,
  },
  numeral: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textBrass,
    letterSpacing: 1.4,
  },
  slot: {
    width: 48,
    height: 48,
    borderWidth: BORDERS.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotEvicting: {
    borderWidth: BORDERS.rule,
    borderStyle: 'dashed',
  },
  markText: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.xl,
  },
  coord: {
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.xs - 1,
    color: COLORS.textMuted,
    letterSpacing: 0.6,
  },
  warn: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    letterSpacing: 1.6,
    marginTop: 1,
  },
});
