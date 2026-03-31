import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { I18nManager } from 'react-native';
import { COLORS, FONT_SIZES, RADIUS, SPACING } from '../src/constants/theme';
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
import { checkAchievements, GameResult } from '../src/services/achievements';

export default function GameScreen() {
  const router = useRouter();
  const layout = useLayout();
  const { t } = useTranslation();
  const backArrow = I18nManager.isRTL ? '→' : '←';
  const params = useLocalSearchParams<{
    mode: string;
    difficulty: string;
    ghostMode: string;
    chaosMode: string;
  }>();

  const settings: GameSettings = {
    mode: (params.mode ?? 'ai') as GameMode,
    difficulty: (params.difficulty ?? 'medium') as Difficulty,
    ghostMode: params.ghostMode === '1',
    chaosMode: params.chaosMode === '1',
  };

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

  // ─── Input handling ────────────────────────────────────────────────
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

  // Keyboard/controller input
  const { focusedCell, inputMode, onTouchInteraction } = useInput({
    onCellSelect: handleCellPress,
    onBack: handleBack,
    onNewGame: handleNewGame,
    board: state.board,
    disabled: isDisabled,
  });

  // ─── Lifecycle ─────────────────────────────────────────────────────
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

  // Detect game over
  useEffect(() => {
    if (state.phase !== 'playing' && prevPhaseRef.current === 'playing') {
      if (state.phase === 'won') {
        hapticsRef.current.win();
        soundRef.current.play('win');
      } else {
        hapticsRef.current.draw();
        soundRef.current.play('draw');
      }

      recordGameResult(settings.mode, settings.difficulty, state.winner).then((stats) => {
        // Check achievements after recording stats
        const gameResult: GameResult = {
          mode: settings.mode,
          difficulty: settings.difficulty,
          winner: state.winner,
          playerSide: 'X',
          ghostMode: settings.ghostMode,
          chaosMode: settings.chaosMode,
          chaosCellInWinLine: !!(state.winLine && state.chaosCell !== null && state.winLine.includes(state.chaosCell)),
          turnNumber: state.turnNumber,
          winStreak: stats.winStreak,
        };
        checkAchievements(gameResult, null).catch(() => {});
      }).catch(() => {});

      if (modalTimerRef.current) clearTimeout(modalTimerRef.current);
      modalTimerRef.current = setTimeout(() => setShowModal(true), 600);
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

  // ─── Labels ────────────────────────────────────────────────────────
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
    if (isAIThinking) return t('game.aiThinking');
    if (isAIMode) return t('game.yourTurn');
    return t('game.playerTurn', { player: state.currentPlayer });
  };

  // ─── Render ────────────────────────────────────────────────────────
  const { isLandscape, boardSize } = layout;

  const header = (
    <View style={styles.header}>
      <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
        <Text style={styles.backText}>{backArrow} {t('game.back')}</Text>
      </TouchableOpacity>
      <View style={styles.modeBadges}>
        {settings.ghostMode && <Text style={styles.modeBadge}>👻 {t('game.ghost')}</Text>}
        {settings.chaosMode && <Text style={styles.modeBadge}>⚡ {t('game.chaos')}</Text>}
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
    <Text style={styles.turnText}>{getTurnText()}</Text>
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

  const ghostQueue = settings.ghostMode ? (
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
      <TouchableOpacity onPress={handleNewGame} style={styles.controlBtn}>
        <Text style={styles.controlText}>🔄 {t('game.newGame')}</Text>
      </TouchableOpacity>
    </View>
  );

  // Input mode hint (shown briefly when keyboard is detected)
  const inputHint = inputMode === 'keyboard' ? (
    <Text style={styles.inputHint}>⌨️ {t('game.keyboardHint')}</Text>
  ) : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      {isLandscape ? (
        // ─── Landscape: side-by-side ───────────────────────────────
        <View style={styles.landscapeContainer}>
          {header}
          <View style={styles.landscapeBody}>
            {/* Left: Board */}
            <View style={styles.landscapeLeft}>
              {board}
            </View>
            {/* Right: Game info */}
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
        // ─── Portrait: stacked ─────────────────────────────────────
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
    backgroundColor: COLORS.background,
  },

  // ─── Portrait layout ─────────────────────────────────────────────
  container: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
  },

  // ─── Landscape layout ────────────────────────────────────────────
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
    minWidth: 200,
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
  },
  landscapeSpacer: {
    flex: 1,
  },

  // ─── Shared styles ───────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  backBtn: {
    padding: SPACING.xs,
  },
  backText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  modeBadges: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  modeBadge: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  badges: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  badgesLandscape: {
    flexDirection: 'column',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  badgeWrapPortrait: {
    flex: 1,
  },
  badgeWrapLandscape: {
    // No flex — badge takes natural height in column layout
  },
  turnText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: SPACING.md,
    minHeight: 22,
  },
  boardContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  queueRow: {
    marginTop: SPACING.md,
    minHeight: 80,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  controlBtn: {
    padding: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  controlText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  inputHint: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
});
