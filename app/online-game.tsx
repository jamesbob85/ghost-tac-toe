import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  I18nManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { COLORS, FONT_SIZES, RADIUS, SPACING, SPRING, glowShadow } from '../src/constants/theme';
import { useLayout } from '../src/hooks/useLayout';
import { useOnlineGame } from '../src/hooks/useOnlineGame';
import { getTierInfo, formatTierDisplay } from '../src/services/rankCalculator';
import { Board } from '../src/components/board/Board';
import { PlayerBadge } from '../src/components/game/PlayerBadge';
import { GameState, Player } from '../src/types/game';
import { ConnectionState } from '../src/types/online';

function connectionLabel(state: ConnectionState): string | null {
  switch (state) {
    case 'reconnecting':
      return 'Reconnecting...';
    case 'opponent_disconnected':
      return 'Opponent disconnected';
    case 'disconnected':
      return 'Connection lost';
    default:
      return null;
  }
}

export default function OnlineGameScreen() {
  const router = useRouter();
  const layout = useLayout();
  const { t } = useTranslation();
  const backArrow = I18nManager.isRTL ? '\u2192' : '\u2190';

  const params = useLocalSearchParams<{
    matchId: string;
    playerId: string;
    playerRating: string;
    opponentRating: string;
    isAIMatch: string;
    winStreak: string;
    placementRemaining: string;
  }>();

  const matchId = params.matchId ?? '';
  const playerId = params.playerId ?? '';
  const playerRating = parseInt(params.playerRating ?? '750', 10);
  const opponentRating = parseInt(params.opponentRating ?? '750', 10);
  const isAIMatch = params.isAIMatch === '1';
  const winStreak = parseInt(params.winStreak ?? '0', 10);
  const placementRemaining = parseInt(params.placementRemaining ?? '5', 10);

  const {
    match,
    playerSide,
    isMyTurn,
    turnTimeRemaining,
    connectionState,
    ratingChange,
    makeMove,
    abandon,
  } = useOnlineGame({
    matchId,
    playerId,
    playerRating,
    opponentRating,
    isAIMatch,
    playerWinStreak: winStreak,
    placementRemaining,
  });

  const [showResultModal, setShowResultModal] = useState(false);
  const resultScale = useSharedValue(0);

  // Show result modal when match ends
  useEffect(() => {
    if (match && match.status !== 'playing' && ratingChange) {
      const timer = setTimeout(() => {
        setShowResultModal(true);
        resultScale.value = withSequence(
          withTiming(1.1, { duration: 200 }),
          withSpring(1, SPRING.bounce),
        );
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [match?.status, ratingChange]);

  const resultModalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: resultScale.value }],
  }));

  // Convert MatchData to GameState for the Board component
  const gameState: GameState | null = match
    ? {
        board: match.board.map((c) => (c === 'X' ? 'X' : c === 'O' ? 'O' : null)),
        players: {
          X: { marks: match.marks_x || [], score: 0 },
          O: { marks: match.marks_o || [], score: 0 },
        },
        currentPlayer: match.current_turn as Player,
        phase: match.status === 'won' ? 'won' : match.status === 'draw' ? 'draw' : 'playing',
        winner: match.winner as Player | null,
        winLine: match.win_line,
        turnNumber: match.turn_number,
        chaosCell: null,
        ghostMode: true,
        chaosMode: false,
      }
    : null;

  const handleCellPress = useCallback(
    (index: number) => {
      if (!isMyTurn) return;
      makeMove(index);
    },
    [isMyTurn, makeMove],
  );

  const handleBack = useCallback(() => {
    if (match && match.status === 'playing') {
      Alert.alert(
        'Leave Match?',
        'Leaving will count as an abandon and you will lose rating points.',
        [
          { text: 'Stay', style: 'cancel' },
          {
            text: 'Abandon',
            style: 'destructive',
            onPress: async () => {
              await abandon();
              router.back();
            },
          },
        ],
      );
    } else {
      router.back();
    }
  }, [match, abandon, router]);

  const handleResultDismiss = useCallback(() => {
    setShowResultModal(false);
    router.back();
  }, [router]);

  const { isLandscape, boardSize } = layout;
  const connectionText = connectionLabel(connectionState);
  const playerTier = getTierInfo(playerRating);
  const opponentTier = getTierInfo(opponentRating);

  const getPlayerLabel = (side: 'X' | 'O') => {
    if (side === playerSide) return 'You';
    return isAIMatch ? 'Ghost Bot' : 'Opponent';
  };

  const getTurnText = () => {
    if (!match) return 'Loading...';
    if (match.status === 'won') {
      return match.winner === playerSide ? 'You win!' : isAIMatch ? 'Ghost Bot wins!' : 'Opponent wins!';
    }
    if (match.status === 'draw') return 'Draw!';
    if (match.status === 'abandoned') return 'Match abandoned';
    return isMyTurn ? 'Your turn' : isAIMatch ? 'Ghost Bot thinking...' : 'Opponent\'s turn';
  };

  // ─── Render ────────────────────────────────────────────────────────

  const header = (
    <View style={styles.header}>
      <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
        <Text style={styles.backText}>{backArrow} Back</Text>
      </TouchableOpacity>
      <View style={styles.modeBadges}>
        <Text style={styles.modeBadge}>Ranked</Text>
        {isAIMatch && <Text style={styles.modeBadge}>vs Bot</Text>}
      </View>
    </View>
  );

  const badges = (
    <View style={[styles.badges, isLandscape && styles.badgesLandscape]}>
      <View style={isLandscape ? styles.badgeWrapLandscape : styles.badgeWrapPortrait}>
        <PlayerBadge
          player="X"
          score={gameState?.players.X.score ?? 0}
          isActive={gameState?.currentPlayer === 'X' && gameState?.phase === 'playing'}
          label={getPlayerLabel('X')}
        />
        {match?.current_turn === 'X' && match?.status === 'playing' && (
          <Text style={[styles.timerText, playerSide === 'X' && styles.timerTextActive]}>
            {turnTimeRemaining}s
          </Text>
        )}
      </View>
      <View style={isLandscape ? styles.badgeWrapLandscape : styles.badgeWrapPortrait}>
        <PlayerBadge
          player="O"
          score={gameState?.players.O.score ?? 0}
          isActive={gameState?.currentPlayer === 'O' && gameState?.phase === 'playing'}
          label={getPlayerLabel('O')}
        />
        {match?.current_turn === 'O' && match?.status === 'playing' && (
          <Text style={[styles.timerText, playerSide === 'O' && styles.timerTextActive]}>
            {turnTimeRemaining}s
          </Text>
        )}
      </View>
    </View>
  );

  const turnIndicator = (
    <Text style={styles.turnText}>{getTurnText()}</Text>
  );

  const connectionBanner = connectionText ? (
    <View style={styles.connectionBanner}>
      <Text style={styles.connectionText}>{connectionText}</Text>
    </View>
  ) : null;

  const board = gameState ? (
    <View style={styles.boardContainer}>
      <Board
        state={gameState}
        onCellPress={handleCellPress}
        disabled={!isMyTurn || gameState.phase !== 'playing'}
        boardWidth={boardSize}
      />
    </View>
  ) : (
    <View style={styles.boardContainer}>
      <Text style={styles.loadingText}>Loading match...</Text>
    </View>
  );

  // ─── Result Modal ──────────────────────────────────────────────────
  const resultModal = showResultModal && ratingChange ? (
    <Modal transparent animationType="fade" visible>
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.modalContent, resultModalStyle]}>
          {/* Result header */}
          <Text style={styles.resultEmoji}>
            {ratingChange.isPromotion ? '🎉' : ratingChange.isDemotion ? '💀' : match?.winner === playerSide ? '👻' : match?.status === 'draw' ? '🤝' : '😵'}
          </Text>
          <Text style={styles.resultTitle}>
            {match?.winner === playerSide ? 'Victory!' : match?.status === 'draw' ? 'Draw!' : 'Defeat'}
          </Text>

          {/* Rating change */}
          <Text style={[styles.ratingChange, { color: ratingChange.pointsChange >= 0 ? COLORS.success : COLORS.danger }]}>
            {ratingChange.pointsChange >= 0 ? '+' : ''}{ratingChange.pointsChange} SR
          </Text>

          {/* New tier badge */}
          <View style={[styles.resultTierBadge, { borderColor: ratingChange.newTier.tier.color }, glowShadow(ratingChange.newTier.tier.color, 0.3)]}>
            <Text style={styles.resultTierIcon}>{ratingChange.newTier.tier.icon}</Text>
            <Text style={[styles.resultTierName, { color: ratingChange.newTier.tier.color }]}>
              {ratingChange.newTier.displayName}
            </Text>
            <Text style={styles.resultTierRating}>{ratingChange.newRating} SR</Text>
          </View>

          {/* Promotion / Demotion notice */}
          {ratingChange.isPromotion && (
            <Text style={[styles.promotionText, { color: COLORS.success }]}>
              Promoted to {ratingChange.newTier.tier.name}!
            </Text>
          )}
          {ratingChange.isDemotion && (
            <Text style={[styles.promotionText, { color: COLORS.danger }]}>
              Demoted to {ratingChange.newTier.tier.name}
            </Text>
          )}

          {/* Dismiss */}
          <TouchableOpacity style={styles.resultDismissBtn} onPress={handleResultDismiss}>
            <Text style={styles.resultDismissText}>Continue</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  ) : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      {connectionBanner}
      {isLandscape ? (
        <View style={styles.landscapeContainer}>
          {header}
          <View style={styles.landscapeBody}>
            <View style={styles.landscapeLeft}>{board}</View>
            <View style={styles.landscapeRight}>
              {badges}
              {turnIndicator}
              <View style={styles.landscapeSpacer} />
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.container}>
          {header}
          {badges}
          {turnIndicator}
          {board}
        </View>
      )}
      {resultModal}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  // Portrait
  container: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
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
    minWidth: 200,
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
  },
  landscapeSpacer: { flex: 1 },

  // Shared
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  backBtn: { padding: SPACING.xs },
  backText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, fontWeight: '600' },
  modeBadges: { flexDirection: 'row', gap: SPACING.xs },
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
  badgeWrapPortrait: { flex: 1 },
  badgeWrapLandscape: {},

  timerText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  timerTextActive: {
    color: COLORS.warning,
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
  loadingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    fontWeight: '600',
  },

  connectionBanner: {
    backgroundColor: COLORS.danger,
    paddingVertical: SPACING.xs,
    alignItems: 'center',
  },
  connectionText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    fontWeight: '700',
  },

  // Result modal
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
  },
  resultEmoji: { fontSize: FONT_SIZES['4xl'] },
  resultTitle: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
  },
  ratingChange: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    marginTop: SPACING.md,
  },
  resultTierBadge: {
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.lg,
  },
  resultTierIcon: { fontSize: FONT_SIZES['2xl'] },
  resultTierName: { fontSize: FONT_SIZES.lg, fontWeight: '800', marginTop: SPACING.xs },
  resultTierRating: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, fontWeight: '700', marginTop: SPACING.xs },
  promotionText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '800',
    marginTop: SPACING.md,
  },
  resultDismissBtn: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.playerX,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    width: '100%',
    alignItems: 'center',
  },
  resultDismissText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
    color: COLORS.textInverse,
  },
});
