import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  I18nManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { COLORS, FONT_SIZES, RADIUS, SPACING, glowShadow } from '../src/constants/theme';
import { useLayout } from '../src/hooks/useLayout';
import { getPlayer, getRecentMatches } from '../src/services/playerService';
import { getTierInfo, formatTierDisplay } from '../src/services/rankCalculator';
import { PlayerProfile, MatchData } from '../src/types/online';

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MatchRow({ match, playerId }: { match: MatchData; playerId: string }) {
  const isPlayerX = match.player_x_id === playerId;
  const playerSide = isPlayerX ? 'X' : 'O';

  let result: string;
  let resultColor: string;
  if (match.status === 'draw') {
    result = 'Draw';
    resultColor = COLORS.textSecondary;
  } else if (match.status === 'abandoned') {
    result = 'Abandoned';
    resultColor = COLORS.danger;
  } else if (match.winner === playerSide) {
    result = 'Win';
    resultColor = COLORS.success;
  } else {
    result = 'Loss';
    resultColor = COLORS.danger;
  }

  const ratingChange = isPlayerX ? match.rating_x_change : match.rating_o_change;
  const ratingText = ratingChange != null
    ? `${ratingChange >= 0 ? '+' : ''}${ratingChange}`
    : '';

  const opponentLabel = match.is_ai_match ? 'Ghost Bot' : 'Player';

  return (
    <View style={styles.matchRow}>
      <View style={styles.matchInfo}>
        <Text style={[styles.matchResult, { color: resultColor }]}>{result}</Text>
        <Text style={styles.matchOpponent}>vs {opponentLabel}</Text>
      </View>
      {ratingText !== '' && (
        <Text style={[styles.matchRating, { color: ratingChange != null && ratingChange >= 0 ? COLORS.success : COLORS.danger }]}>
          {ratingText} SR
        </Text>
      )}
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const layout = useLayout();
  const { t } = useTranslation();
  const backArrow = I18nManager.isRTL ? '\u2192' : '\u2190';

  const params = useLocalSearchParams<{ playerId: string }>();
  const playerId = params.playerId ?? '';

  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!playerId) return;
    setLoading(true);
    Promise.all([getPlayer(playerId), getRecentMatches(playerId, 20)])
      .then(([p, m]) => {
        setPlayer(p);
        setMatches(m as MatchData[]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [playerId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={COLORS.textSecondary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!player) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <View style={[styles.containerPadded, { maxWidth: layout.contentMaxWidth, alignSelf: 'center' as const, width: '100%' }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>{backArrow} Back</Text>
            </TouchableOpacity>
            <View style={{ width: 60 }} />
          </View>
          <View style={styles.loadingContainer}>
            <Text style={styles.emptyText}>Player not found</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const tierInfo = getTierInfo(player.rating);
  const winRate = player.games_played > 0
    ? Math.round((player.wins / player.games_played) * 100)
    : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { maxWidth: layout.contentMaxWidth, alignSelf: 'center' as const, width: '100%' }]}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>{backArrow} Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Profile</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Tier Badge */}
        <View
          style={[
            styles.tierBadge,
            { borderColor: tierInfo.tier.color },
            glowShadow(tierInfo.tier.color, 0.4),
          ]}
        >
          <Text style={styles.tierIcon}>{tierInfo.tier.icon}</Text>
          <Text style={[styles.tierName, { color: tierInfo.tier.color }]}>
            {tierInfo.displayName}
          </Text>
          <Text style={styles.tierRating}>{player.rating} SR</Text>
        </View>

        {/* Player Name */}
        <Text style={styles.playerName}>{player.display_name}</Text>

        {/* Division Progress */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Division Progress</Text>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.round(tierInfo.progressInDivision * 100)}%`,
                  backgroundColor: tierInfo.tier.color,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(tierInfo.progressInDivision * 100)}% to next division
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={[styles.card, styles.cardAccented]}>
          <Text style={styles.cardTitle}>Stats</Text>
          <View style={styles.statsGrid}>
            <StatCard label="Games" value={player.games_played} color={COLORS.textPrimary} />
            <StatCard label="Wins" value={player.wins} color={COLORS.success} />
            <StatCard label="Losses" value={player.losses} color={COLORS.danger} />
            <StatCard label="Draws" value={player.draws} color={COLORS.textSecondary} />
          </View>
          <View style={styles.statsGrid}>
            <StatCard label="Win Rate" value={`${winRate}%`} color={COLORS.playerX} />
            <StatCard label="Streak" value={player.win_streak} color={COLORS.warning} />
            <StatCard label="Best Streak" value={player.best_win_streak} color={COLORS.warning} />
            <StatCard label="Placement" value={player.placement_remaining > 0 ? `${player.placement_remaining} left` : 'Done'} color={COLORS.textMuted} />
          </View>
        </View>

        {/* Recent Matches */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Matches</Text>
          {matches.length === 0 ? (
            <Text style={styles.emptyText}>No matches played yet</Text>
          ) : (
            matches.map((m) => (
              <MatchRow key={m.id} match={m} playerId={playerId} />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  scrollContent: { padding: SPACING.lg, paddingBottom: SPACING.xl },
  containerPadded: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
  },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: FONT_SIZES.md, color: COLORS.textMuted, fontWeight: '600', paddingVertical: SPACING.md },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  backBtn: { padding: SPACING.xs, width: 60 },
  backText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, fontWeight: '600' },
  title: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.textPrimary },

  // Tier badge
  tierBadge: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 2,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  tierIcon: { fontSize: FONT_SIZES['4xl'] },
  tierName: { fontSize: FONT_SIZES['2xl'], fontWeight: '900', marginTop: SPACING.sm },
  tierRating: { fontSize: FONT_SIZES.lg, color: COLORS.textSecondary, fontWeight: '700', marginTop: SPACING.xs },

  playerName: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },

  // Cards
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  cardAccented: { borderTopWidth: 3, borderTopColor: COLORS.playerX },
  cardTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },

  // Progress bar
  progressBarBg: {
    height: 8,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  progressText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginTop: SPACING.xs,
    textAlign: 'center',
  },

  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.sm,
  },
  statCard: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: FONT_SIZES.xl, fontWeight: '900' },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
    textAlign: 'center',
  },

  // Match rows
  matchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  matchInfo: { flex: 1 },
  matchResult: { fontSize: FONT_SIZES.md, fontWeight: '700' },
  matchOpponent: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: '600', marginTop: 1 },
  matchRating: { fontSize: FONT_SIZES.md, fontWeight: '800' },
});
