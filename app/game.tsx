import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  I18nManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  COLORS,
  FONTS,
  FONT_SIZES,
  SPACING,
  BORDERS,
} from '../src/constants/theme';
import { GameSettings, Difficulty, GameMode } from '../src/types/game';
import { useGameState } from '../src/hooks/useGameState';
import { useAI } from '../src/hooks/useAI';
import { useHaptics } from '../src/hooks/useHaptics';
import { useSound } from '../src/hooks/useSound';
import { useLayout } from '../src/hooks/useLayout';
import { useInput } from '../src/hooks/useInput';
import { Board } from '../src/components/board/Board';
import { PlayerBadge } from '../src/components/game/PlayerBadge';
import { GhostQueue } from '../src/components/game/GhostQueue';
import { GameOverModal } from '../src/components/ui/Modal';
import { recordGameResult } from '../src/store/statsStore';

export default function GameScreen() {
  const router = useRouter();
  const layout = useLayout();
  const { t } = useTranslation();
  const backArrow = I18nManager.isRTL ? '→' : '←';
  const params = useLocalSearchParams<{
    mode: string;
    difficulty: string;
    modifiers: string;
  }>();

  const modifierIds = params.modifiers
    ? params.modifiers.split(',').filter(Boolean)
    : ['ghost_eviction'];

  const settings: GameSettings = {
    mode: (params.mode ?? 'ai') as GameMode,
    difficulty: (params.difficulty ?? 'medium') as Difficulty,
    modifiers: modifierIds,
  };

  const ghostActive = modifierIds.includes('ghost_eviction');
  const chaosActive = modifierIds.includes('chaos_cell');

  const { state, makeMove, resetGame } = useGameState(settings);
  const haptics = useHaptics();
  const sound = useSound();
  const [showModal, setShowModal] = useState(false);
  const prevPhaseRef = useRef(state.phase);
  const modalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const makeMoveRef = useRef(makeMove);
  makeMoveRef.current = makeMove;
  const hapticsRef = useRef(haptics);
  hapticsRef.current = haptics;
  const soundRef = useRef(sound);
  soundRef.current = sound;

  const isAIMode = settings.mode === 'ai';
  const isAIThinking = isAIMode && state.currentPlayer === 'O' && state.phase === 'playing';
  const isDisabled = isAIThinking || state.phase !== 'playing';

  const handleCellPress = useCallback(
    (index: number) => {
      if (state.phase !== 'playing') return;
      if (isAIMode && state.currentPlayer === 'O') return;

      makeMoveRef.current(index);
      hapticsRef.current.placeMark();
      soundRef.current.play('place');
    },
    [state.phase, state.currentPlayer, isAIMode],
  );

  const handleAIMove = useCallback((index: number) => {
    makeMoveRef.current(index);
    hapticsRef.current.placeMark();
    soundRef.current.play('place');
  }, []);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleNewGame = useCallback(() => {
    resetGame();
  }, [resetGame]);

  const { focusedCell, inputMode, onTouchInteraction } = useInput({
    onCellSelect: handleCellPress,
    onBack: handleBack,
    onNewGame: handleNewGame,
    board: state.board,
    disabled: isDisabled,
  });

  useEffect(() => {
    return () => {
      if (modalTimerRef.current) clearTimeout(modalTimerRef.current);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  useEffect(() => {
    haptics.loadEnabled();
  }, []);

  useAI(state, isAIMode, settings.difficulty, handleAIMove);

  useEffect(() => {
    if (state.phase !== 'playing' && prevPhaseRef.current === 'playing') {
      if (state.phase === 'won') {
        hapticsRef.current.win();
        soundRef.current.play('win');
      } else {
        hapticsRef.current.draw();
        soundRef.current.play('draw');
      }

      recordGameResult(settings.mode, settings.difficulty, state.winner).catch(() => {});

      if (modalTimerRef.current) clearTimeout(modalTimerRef.current);
      modalTimerRef.current = setTimeout(() => setShowModal(true), 700);
    }
    prevPhaseRef.current = state.phase;
  }, [state.phase, state.winner]);

  const handlePlayAgain = () => {
    setShowModal(false);
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => resetGame(), 100);
  };

  const handleGoHome = () => {
    setShowModal(false);
    router.back();
  };

  const getPlayerLabel = (player: 'X' | 'O') => {
    if (isAIMode) return player === 'X' ? t('game.you') : t('game.ai');
    return player === 'X' ? t('game.playerX') : t('game.playerO');
  };

  const getTurnText = () => {
    if (state.phase === 'won') {
      if (isAIMode) return state.winner === 'X' ? t('game.youWon') : t('game.aiWins');
      return t('game.playerWins', { player: state.winner });
    }
    if (state.phase === 'draw') return t('game.draw');
    if (isAIThinking) return 'The spectre considers…';
    if (isAIMode) return 'Your stamp awaits';
    return `Stamp ${state.currentPlayer} to play`;
  };

  const { isLandscape, boardSize } = layout;

  const header = (
    <View style={styles.header}>
      <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
        <Text style={styles.backText}>{backArrow}  Return</Text>
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>The Ghost Times</Text>
        <Text style={styles.headerSub}>DUEL IN PROGRESS</Text>
      </View>
      <View style={styles.headerBadges}>
        {ghostActive && <Text style={styles.modeBadge}>❦ Ghost</Text>}
        {chaosActive && <Text style={styles.modeBadge}>✶ Chaos</Text>}
      </View>
    </View>
  );

  const badges = (
    <View style={[styles.badges, isLandscape && styles.badgesLandscape]}>
      <View style={isLandscape ? styles.badgeWrapLandscape : styles.badgeWrapPortrait}>
        <PlayerBadge
          player="X"
          score={state.players.X.score}
          isActive={state.currentPlayer === 'X' && state.phase === 'playing'}
          label={getPlayerLabel('X')}
        />
      </View>
      <View style={isLandscape ? styles.badgeWrapLandscape : styles.badgeWrapPortrait}>
        <PlayerBadge
          player="O"
          score={state.players.O.score}
          isActive={state.currentPlayer === 'O' && state.phase === 'playing'}
          label={getPlayerLabel('O')}
        />
      </View>
    </View>
  );

  const turnIndicator = (
    <View style={styles.turnRow}>
      <Text style={styles.turnDash}>—</Text>
      <Text style={styles.turnText}>{getTurnText()}</Text>
      <Text style={styles.turnDash}>—</Text>
    </View>
  );

  const board = (
    <View style={styles.boardContainer}>
      <Board
        state={state}
        onCellPress={handleCellPress}
        disabled={isDisabled}
        boardWidth={boardSize}
        focusedCell={focusedCell}
        onTouchInteraction={onTouchInteraction}
      />
    </View>
  );

  const ghostQueue = ghostActive ? (
    <View style={styles.queueRow}>
      <GhostQueue
        player={state.currentPlayer}
        marks={state.players[state.currentPlayer].marks}
        isVisible={state.phase === 'playing'}
      />
    </View>
  ) : null;

  const controls = (
    <View style={styles.controls}>
      <TouchableOpacity onPress={handleNewGame} style={styles.controlBtn} activeOpacity={0.7}>
        <Text style={styles.controlOrnament}>↻</Text>
        <Text style={styles.controlText}>Begin Anew</Text>
      </TouchableOpacity>
    </View>
  );

  const inputHint = inputMode === 'keyboard' ? (
    <Text style={styles.inputHint}>⌨︎  Arrow keys to navigate · Enter to stamp · R to reset</Text>
  ) : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      {isLandscape ? (
        <View style={styles.landscapeContainer}>
          {header}
          <View style={styles.landscapeBody}>
            <View style={styles.landscapeLeft}>{board}</View>
            <View style={styles.landscapeRight}>
              {badges}
              {turnIndicator}
              {ghostQueue}
              <View style={styles.landscapeSpacer} />
              {inputHint}
              {controls}
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.container}>
          {header}
          {badges}
          {turnIndicator}
          {board}
          {ghostQueue}
          {inputHint}
          {controls}
        </View>
      )}

      <GameOverModal
        visible={showModal}
        winner={state.winner}
        scoreX={state.players.X.score}
        scoreO={state.players.O.score}
        isAIMode={isAIMode}
        onPlayAgain={handlePlayAgain}
        onGoHome={handleGoHome}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  container: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  },

  // Landscape
  landscapeContainer: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.xs,
  },
  landscapeBody: {
    flex: 1,
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  landscapeLeft: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  landscapeRight: {
    flex: 0.45,
    minWidth: 220,
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  landscapeSpacer: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: SPACING.sm,
    borderBottomWidth: BORDERS.hairline,
    borderBottomColor: COLORS.rule,
  },
  backBtn: {
    paddingVertical: SPACING.xs,
    paddingRight: SPACING.sm,
    minWidth: 80,
  },
  backText: {
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textBrass,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.md + 2,
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.xs - 2,
    color: COLORS.textSecondary,
    letterSpacing: 1.6,
    marginTop: 1,
  },
  headerBadges: {
    flexDirection: 'row',
    gap: SPACING.sm,
    minWidth: 80,
    justifyContent: 'flex-end',
  },
  modeBadge: {
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.xs - 1,
    color: COLORS.textBrass,
    letterSpacing: 1.2,
  },

  // Badges row
  badges: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  badgesLandscape: {
    flexDirection: 'column',
  },
  badgeWrapPortrait: {
    flex: 1,
  },
  badgeWrapLandscape: {
    width: '100%',
  },

  // Turn indicator
  turnRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  turnDash: {
    fontFamily: FONTS.body,
    fontStyle: 'italic',
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
  },
  turnText: {
    fontFamily: FONTS.body,
    fontStyle: 'italic',
    fontSize: FONT_SIZES.md + 1,
    color: COLORS.textPrimary,
    textAlign: 'center',
    minHeight: 22,
  },

  // Board
  boardContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },

  // Ghost queue area
  queueRow: {
    minHeight: 110,
    justifyContent: 'center',
  },

  // Controls
  controls: {
    alignItems: 'center',
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  controlOrnament: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textBrass,
  },
  controlText: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },

  inputHint: {
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.xs - 1,
    color: COLORS.textMuted,
    textAlign: 'center',
    letterSpacing: 1.2,
  },
});
