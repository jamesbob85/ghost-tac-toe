import React, { useEffect } from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import {
  COLORS,
  FONTS,
  SPACING,
  FONT_SIZES,
  SPRING,
  TIMING,
  BORDERS,
  PAPER_SHADOW,
} from '../../constants/theme';
import { Button } from './Button';
import { Player } from '../../types/game';

interface GameOverModalProps {
  visible: boolean;
  winner: Player | null;
  scoreX: number;
  scoreO: number;
  ghostName: string;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

export function GameOverModal({
  visible,
  winner,
  scoreX,
  scoreO,
  ghostName,
  onPlayAgain,
  onGoHome,
}: GameOverModalProps) {
  const { t } = useTranslation();
  const translateY = useSharedValue(40);
  const opacity = useSharedValue(0);
  const sealScale = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, TIMING.fadeIn);
      translateY.value = withSpring(0, SPRING.gentle);
      sealScale.value = withSpring(1, SPRING.stamp);
    } else {
      opacity.value = withTiming(0, TIMING.fadeOut);
      translateY.value = withTiming(40, TIMING.fadeIn);
      sealScale.value = withTiming(0, TIMING.fadeOut);
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));
  const sealStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sealScale.value }, { rotate: '-7deg' }],
  }));

  const inkColor = winner === null
    ? COLORS.textBrass
    : winner === 'X' ? COLORS.playerX : COLORS.playerO;

  const headline = winner === null
    ? 'AN UNRESOLVED MATTER'
    : winner === 'X'
      ? `${ghostName.toUpperCase()} BANISHED`
      : `${ghostName.toUpperCase()} PREVAILS`;

  const sealGlyph = winner === null ? '⁂' : winner === 'X' ? '✕' : '◯';

  return (
    <RNModal visible={visible} transparent animationType="none" onRequestClose={onGoHome}>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onPlayAgain} />
        <Animated.View style={[styles.sheet, PAPER_SHADOW, sheetStyle]}>
          <View style={styles.frame}>
            <View style={styles.eyebrowRow}>
              <View style={styles.rule} />
              <Text style={styles.eyebrow}>EXTRA · DISPATCH FROM THE PARLOR</Text>
              <View style={styles.rule} />
            </View>

            <Text style={[styles.headline, { color: inkColor }]}>
              {headline}
            </Text>

            <Animated.Text style={[styles.seal, { color: inkColor }, sealStyle]}>
              {sealGlyph}
            </Animated.Text>

            <View style={styles.scoreboard}>
              <View style={styles.scoreCol}>
                <Text style={[styles.scoreLabel, { color: COLORS.playerX }]}>
                  YOU
                </Text>
                <Text style={[styles.scoreValue, { color: COLORS.playerX }]}>
                  {scoreX}
                </Text>
              </View>
              <Text style={styles.scoreVs}>vs.</Text>
              <View style={styles.scoreCol}>
                <Text style={[styles.scoreLabel, { color: COLORS.playerO }]}>
                  THE GHOST
                </Text>
                <Text style={[styles.scoreValue, { color: COLORS.playerO }]}>
                  {scoreO}
                </Text>
              </View>
            </View>

            <View style={styles.ornamentRow}>
              <View style={styles.rule} />
              <Text style={styles.ornament}>❦</Text>
              <View style={styles.rule} />
            </View>

            <View style={styles.buttons}>
              <Button
                label={t('modal.playAgain')}
                onPress={onPlayAgain}
                variant="primary"
                fullWidth
              />
              <Button
                label={t('modal.mainMenu')}
                onPress={onGoHome}
                variant="secondary"
                fullWidth
              />
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  sheet: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: COLORS.background,
    borderWidth: BORDERS.thick,
    borderColor: COLORS.rule,
    padding: BORDERS.doubleGap,
  },
  frame: {
    borderWidth: BORDERS.hairline,
    borderColor: COLORS.rule,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    width: '100%',
    marginBottom: SPACING.md,
  },
  rule: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.rule,
  },
  eyebrow: {
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.xs - 1,
    letterSpacing: 2.4,
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
  },
  headline: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES['2xl'],
    lineHeight: FONT_SIZES['2xl'] * 1.05,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: SPACING.md,
  },
  seal: {
    fontFamily: FONTS.display,
    fontSize: 64,
    lineHeight: 64,
    marginBottom: SPACING.md,
    opacity: 0.85,
  },
  scoreboard: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.lg,
    marginBottom: SPACING.md,
  },
  scoreCol: {
    alignItems: 'center',
    minWidth: 80,
  },
  scoreLabel: {
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.xs,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  scoreValue: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES['3xl'],
    fontVariant: ['tabular-nums'],
    lineHeight: FONT_SIZES['3xl'],
  },
  scoreVs: {
    fontFamily: FONTS.body,
    fontStyle: 'italic',
    fontSize: FONT_SIZES.lg,
    color: COLORS.textMuted,
  },
  ornamentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    width: '100%',
    marginBottom: SPACING.md,
  },
  ornament: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.md,
    color: COLORS.textBrass,
  },
  buttons: {
    width: '100%',
    gap: SPACING.sm,
  },
});
