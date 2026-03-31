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
import { COLORS, RADIUS, SPACING, FONT_SIZES, SPRING, TIMING, glowShadow } from '../../constants/theme';
import { Button } from './Button';
import { Player } from '../../types/game';

interface GameOverModalProps {
  visible: boolean;
  winner: Player | null;
  scoreX: number;
  scoreO: number;
  isAIMode: boolean;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

export function GameOverModal({
  visible,
  winner,
  scoreX,
  scoreO,
  isAIMode,
  onPlayAgain,
  onGoHome,
}: GameOverModalProps) {
  const { t } = useTranslation();
  const translateY = useSharedValue(300);
  const opacity = useSharedValue(0);
  const emojiScale = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, TIMING.fadeIn);
      translateY.value = withSpring(0, SPRING.gentle);
      emojiScale.value = withSpring(1, SPRING.bounce);
    } else {
      opacity.value = withTiming(0, TIMING.fadeOut);
      translateY.value = withTiming(300, TIMING.fadeIn);
      emojiScale.value = withTiming(0, TIMING.fadeOut);
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: emojiScale.value }],
  }));

  const getTitle = () => {
    if (winner === null) return t('modal.itsADraw');
    if (isAIMode) return winner === 'X' ? t('modal.youWin') : t('modal.aiWins');
    return t('modal.playerWins', { player: winner });
  };

  const getTitleColor = () => {
    if (winner === null) return COLORS.textSecondary;
    return winner === 'X' ? COLORS.playerX : COLORS.playerO;
  };

  const getEmoji = () => {
    if (winner === null) return '🤝';
    if (isAIMode) return winner === 'X' ? '🏆' : '💀';
    return winner === 'X' ? '🟣' : '🟢';
  };

  const getGlow = () => {
    if (winner === 'X') return glowShadow(COLORS.playerX, 0.4);
    if (winner === 'O') return glowShadow(COLORS.playerO, 0.4);
    return {};
  };

  return (
    <RNModal visible={visible} transparent animationType="none">
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onPlayAgain} />
        <Animated.View style={[styles.sheet, getGlow(), sheetStyle]}>
          <Animated.Text style={[styles.emoji, emojiStyle]}>{getEmoji()}</Animated.Text>
          <Text style={[styles.title, { color: getTitleColor() }]}>
            {getTitle()}
          </Text>

          <View style={styles.scoreRow}>
            <View style={styles.scoreBox}>
              <Text style={[styles.scoreLabel, { color: COLORS.playerX }]}>
                {isAIMode ? t('game.you') : t('game.playerX')}
              </Text>
              <Text style={[styles.scoreValue, { color: COLORS.playerX }]}>
                {scoreX}
              </Text>
            </View>
            <Text style={styles.scoreDivider}>{t('modal.vs')}</Text>
            <View style={styles.scoreBox}>
              <Text style={[styles.scoreLabel, { color: COLORS.playerO }]}>
                {isAIMode ? t('game.ai') : t('game.playerO')}
              </Text>
              <Text style={[styles.scoreValue, { color: COLORS.playerO }]}>
                {scoreO}
              </Text>
            </View>
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
              style={styles.menuButton}
            />
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
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.xl,
    paddingBottom: SPACING.xl + 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: COLORS.borderFocus,
  },
  emoji: {
    fontSize: 64,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: SPACING.lg,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  scoreBox: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: FONT_SIZES['3xl'],
    fontWeight: '900',
  },
  scoreDivider: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  buttons: {
    width: '100%',
    gap: SPACING.sm,
  },
  menuButton: {
    marginTop: 0,
  },
});
