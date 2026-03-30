import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, FONT_SIZES, SPACING } from '../src/constants/theme';
import { GameSettings, Difficulty, GameMode } from '../src/types/game';
import { useGameState } from '../src/hooks/useGameState';
import { useAI } from '../src/hooks/useAI';
import { useHaptics } from '../src/hooks/useHaptics';
import { useSound } from '../src/hooks/useSound';
import { Board } from '../src/components/board/Board';
import { PlayerBadge } from '../src/components/game/PlayerBadge';
import { GhostQueue } from '../src/components/game/GhostQueue';
import { GameOverModal } from '../src/components/ui/Modal';
import { recordGameResult } from '../src/store/statsStore';

export default function GameScreen() {
  const router = useRouter();
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
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Responsive board: fit within available space minus chrome (badges, queue, controls)
  // Reserve ~280px for UI chrome in portrait, use shorter dimension for landscape/foldables
  const availableWidth = width - SPACING.lg * 2 - insets.left - insets.right;
  const availableHeight = height - insets.top - insets.bottom - 280;
  const boardWidth = Math.min(availableWidth, availableHeight, 400);

  // Stable refs so callbacks don't change identity on every render
  const makeMoveRef = useRef(makeMove);
  makeMoveRef.current = makeMove;
  const hapticsRef = useRef(haptics);
  hapticsRef.current = haptics;
  const soundRef = useRef(sound);
  soundRef.current = sound;

  const isAIMode = settings.mode === 'ai';

  // Clear timers on unmount to avoid setState on unmounted component
  useEffect(() => {
    return () => {
      if (modalTimerRef.current) clearTimeout(modalTimerRef.current);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  // Load haptics setting once
  useEffect(() => {
    haptics.loadEnabled();
  }, []);

  // Detect game over
  useEffect(() => {
    if (state.phase !== 'playing' && prevPhaseRef.current === 'playing') {
      // Haptics & sound
      if (state.phase === 'won') {
        hapticsRef.current.win();
        soundRef.current.play('win');
      } else {
        hapticsRef.current.draw();
        soundRef.current.play('draw');
      }

      // Record stats
      recordGameResult(settings.mode, settings.difficulty, state.winner).catch(() => {});

      // Show modal after brief delay so win animation plays
      if (modalTimerRef.current) clearTimeout(modalTimerRef.current);
      modalTimerRef.current = setTimeout(() => setShowModal(true), 600);
    }
    prevPhaseRef.current = state.phase;
  }, [state.phase, state.winner]);

  const handleCellPress = useCallback(
    (index: number) => {
      if (state.phase !== 'playing') return;
      if (isAIMode && state.currentPlayer === 'O') return; // AI's turn

      makeMoveRef.current(index);
      hapticsRef.current.placeMark();
      soundRef.current.play('place');
    },
    [state.phase, state.currentPlayer, isAIMode],
  );

  // Stable AI move handler — uses refs so identity never changes
  const handleAIMove = useCallback((index: number) => {
    makeMoveRef.current(index);
    hapticsRef.current.placeMark();
    soundRef.current.play('place');
  }, []);

  // AI hook
  useAI(state, isAIMode, settings.difficulty, handleAIMove);

  const handlePlayAgain = () => {
    setShowModal(false);
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => resetGame(), 100);
  };

  const handleGoHome = () => {
    setShowModal(false);
    router.back();
  };

  const isAIThinking = isAIMode && state.currentPlayer === 'O' && state.phase === 'playing';
  const isDisabled = isAIThinking || state.phase !== 'playing';

  const getPlayerLabel = (player: 'X' | 'O') => {
    if (isAIMode) return player === 'X' ? 'You' : 'AI';
    return `Player ${player}`;
  };

  const getTurnText = () => {
    if (state.phase === 'won') {
      if (isAIMode) return state.winner === 'X' ? 'You won! 🏆' : 'AI wins! 🤖';
      return `Player ${state.winner} wins! 🎉`;
    }
    if (state.phase === 'draw') return "It's a draw! 🤝";
    if (isAIThinking) return 'AI is thinking... 🤔';
    if (isAIMode) return "Your turn!";
    return `Player ${state.currentPlayer}'s turn`;
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.modeBadges}>
            {settings.ghostMode && <Text style={styles.modeBadge}>👻 Ghost</Text>}
            {settings.chaosMode && <Text style={styles.modeBadge}>⚡ Chaos</Text>}
          </View>
        </View>

        {/* Player Badges */}
        <View style={styles.badges}>
          <PlayerBadge
            player="X"
            score={state.players.X.score}
            isActive={state.currentPlayer === 'X' && state.phase === 'playing'}
            label={getPlayerLabel('X')}
          />
          <PlayerBadge
            player="O"
            score={state.players.O.score}
            isActive={state.currentPlayer === 'O' && state.phase === 'playing'}
            label={getPlayerLabel('O')}
          />
        </View>

        {/* Turn indicator */}
        <Text style={styles.turnText}>{getTurnText()}</Text>

        {/* Board */}
        <View style={styles.boardContainer}>
          <Board
            state={state}
            onCellPress={handleCellPress}
            disabled={isDisabled}
            boardWidth={boardWidth}
          />
        </View>

        {/* Ghost Queue */}
        {settings.ghostMode && (
          <View style={styles.queueRow}>
            <GhostQueue
              player={state.currentPlayer}
              marks={state.players[state.currentPlayer].marks}
              isVisible={state.phase === 'playing'}
            />
          </View>
        )}

        {/* Bottom controls */}
        <View style={styles.controls}>
          <TouchableOpacity onPress={resetGame} style={styles.controlBtn}>
            <Text style={styles.controlText}>🔄 New Game</Text>
          </TouchableOpacity>
        </View>
      </View>

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
  container: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
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
    borderRadius: 20,
    overflow: 'hidden',
  },
  badges: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
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
});
