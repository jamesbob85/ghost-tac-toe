import React, { useCallback, useEffect } from 'react';
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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { COLORS, FONT_SIZES, RADIUS, SPACING, glowShadow } from '../src/constants/theme';
import { useLayout } from '../src/hooks/useLayout';
import { useMatchmaking } from '../src/hooks/useMatchmaking';
import { getTierInfo } from '../src/services/rankCalculator';
import { MatchmakingPhase } from '../src/types/online';

function getPhaseText(phase: MatchmakingPhase): string {
  switch (phase) {
    case 'searching_tight':
      return 'Searching the spirit realm...';
    case 'searching_wide':
      return 'Widening the search...';
    case 'searching_any':
      return 'Calling all spirits...';
    case 'summoning_bot':
      return 'Summoning Ghost Bot...';
    case 'matched':
      return 'Opponent found!';
    case 'cancelled':
      return 'Search cancelled';
    default:
      return 'Preparing...';
  }
}

export default function MatchmakingScreen() {
  const router = useRouter();
  const layout = useLayout();
  const { t } = useTranslation();
  const backArrow = I18nManager.isRTL ? '\u2192' : '\u2190';

  const params = useLocalSearchParams<{
    playerId: string;
    rating: string;
    winStreak: string;
    placementRemaining: string;
  }>();

  const playerId = params.playerId ?? '';
  const rating = parseInt(params.rating ?? '750', 10);
  const winStreak = parseInt(params.winStreak ?? '0', 10);
  const placementRemaining = parseInt(params.placementRemaining ?? '5', 10);
  const tierInfo = getTierInfo(rating);

  // Pulse animation for tier badge
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 800 }),
        withTiming(1, { duration: 800 }),
      ),
      -1,
      false,
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const handleMatchFound = useCallback(
    (matchId: string, isAI: boolean) => {
      router.replace({
        pathname: '/online-game',
        params: {
          matchId,
          playerId,
          playerRating: String(rating),
          opponentRating: String(isAI ? rating : rating), // Server would provide real opponent rating
          isAIMatch: isAI ? '1' : '0',
          winStreak: String(winStreak),
          placementRemaining: String(placementRemaining),
        },
      });
    },
    [router, playerId, rating, winStreak, placementRemaining],
  );

  const { phase, elapsedSeconds, startSearch, cancelSearch } = useMatchmaking({
    playerId,
    rating,
    onMatchFound: handleMatchFound,
  });

  // Auto-start search on mount
  useEffect(() => {
    startSearch();
  }, []);

  const handleCancel = useCallback(() => {
    cancelSearch();
    router.back();
  }, [cancelSearch, router]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={[styles.container, { maxWidth: layout.contentMaxWidth, alignSelf: 'center' as const, width: '100%' }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.backBtn}>
            <Text style={styles.backText}>{backArrow} Cancel</Text>
          </TouchableOpacity>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.content}>
          {/* Pulsing Tier Badge */}
          <Animated.View
            style={[
              styles.tierBadge,
              { borderColor: tierInfo.tier.color },
              glowShadow(tierInfo.tier.color, 0.5),
              pulseStyle,
            ]}
          >
            <Text style={styles.tierIcon}>{tierInfo.tier.icon}</Text>
            <Text style={[styles.tierName, { color: tierInfo.tier.color }]}>
              {tierInfo.displayName}
            </Text>
          </Animated.View>

          {/* Phase Text */}
          <Text style={styles.phaseText}>{getPhaseText(phase)}</Text>

          {/* Elapsed Timer */}
          <Text style={styles.timer}>{elapsedSeconds}s</Text>

          {/* Cancel Button */}
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
            <Text style={styles.cancelBtnText}>Cancel Search</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
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
    marginBottom: SPACING.xl,
  },
  backBtn: { padding: SPACING.xs, width: 60 },
  backText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, fontWeight: '600' },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: SPACING['2xl'],
  },

  tierBadge: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 2,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING['2xl'],
  },
  tierIcon: { fontSize: FONT_SIZES['4xl'] },
  tierName: { fontSize: FONT_SIZES.xl, fontWeight: '900', marginTop: SPACING.sm },

  phaseText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: SPACING.xl,
    textAlign: 'center',
  },

  timer: {
    fontSize: FONT_SIZES['3xl'],
    color: COLORS.textMuted,
    fontWeight: '900',
    marginTop: SPACING.md,
  },

  cancelBtn: {
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  cancelBtnText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.danger,
    fontWeight: '700',
  },
});
