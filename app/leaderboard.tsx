import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  I18nManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { COLORS, FONT_SIZES, RADIUS, SPACING } from '../src/constants/theme';
import { useLayout } from '../src/hooks/useLayout';
import { getLeaderboard } from '../src/services/playerService';
import { getTierInfo } from '../src/services/rankCalculator';
import { LeaderboardEntry } from '../src/types/online';

function LeaderboardRow({
  entry,
  isCurrentPlayer,
  isFirst,
}: {
  entry: LeaderboardEntry;
  isCurrentPlayer: boolean;
  isFirst: boolean;
}) {
  const tierInfo = getTierInfo(entry.rating);

  return (
    <View
      style={[
        styles.row,
        isFirst && styles.rowFirst,
        isCurrentPlayer && styles.rowHighlight,
      ]}
    >
      {/* Rank number */}
      <View style={styles.rankCol}>
        <Text style={[styles.rankNumber, entry.global_rank <= 3 && { color: COLORS.warning }]}>
          {entry.global_rank <= 3
            ? entry.global_rank === 1 ? '1st' : entry.global_rank === 2 ? '2nd' : '3rd'
            : `#${entry.global_rank}`}
        </Text>
      </View>

      {/* Player info */}
      <View style={styles.playerCol}>
        <Text style={styles.playerName} numberOfLines={1}>
          {entry.display_name}
        </Text>
        <View style={styles.tierRow}>
          <Text style={[styles.tierIcon]}>{tierInfo.tier.icon}</Text>
          <Text style={[styles.tierName, { color: tierInfo.tier.color }]}>
            {tierInfo.displayName}
          </Text>
        </View>
      </View>

      {/* Rating */}
      <View style={styles.ratingCol}>
        <Text style={styles.ratingValue}>{entry.rating}</Text>
        <Text style={styles.ratingLabel}>SR</Text>
      </View>
    </View>
  );
}

export default function LeaderboardScreen() {
  const router = useRouter();
  const layout = useLayout();
  const { t } = useTranslation();
  const backArrow = I18nManager.isRTL ? '\u2192' : '\u2190';

  const params = useLocalSearchParams<{ playerId: string }>();
  const playerId = params.playerId ?? '';

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getLeaderboard(100)
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, []);

  // Count players per tier for distribution header
  const tierDistribution = entries.reduce<Record<string, number>>((acc, e) => {
    const tier = getTierInfo(e.rating);
    const key = `${tier.tier.icon} ${tier.tier.name}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={[styles.container, { maxWidth: layout.contentMaxWidth, alignSelf: 'center' as const, width: '100%' }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>{backArrow} Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Leaderboard</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Tier Distribution */}
        {entries.length > 0 && (
          <View style={styles.distributionRow}>
            {Object.entries(tierDistribution).map(([label, count]) => (
              <View key={label} style={styles.distItem}>
                <Text style={styles.distLabel}>{label}</Text>
                <Text style={styles.distCount}>{count}</Text>
              </View>
            ))}
          </View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={COLORS.textSecondary} size="large" />
          </View>
        ) : entries.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.emptyText}>No players on the leaderboard yet</Text>
          </View>
        ) : (
          <FlatList
            data={entries}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <LeaderboardRow
                entry={item}
                isCurrentPlayer={item.id === playerId}
                isFirst={index === 0}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
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
    marginBottom: SPACING.lg,
  },
  backBtn: { padding: SPACING.xs, width: 60 },
  backText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, fontWeight: '600' },
  title: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.textPrimary },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: FONT_SIZES.md, color: COLORS.textMuted, fontWeight: '600' },

  // Distribution header
  distributionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
    justifyContent: 'center',
  },
  distItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  distLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, fontWeight: '600' },
  distCount: { fontSize: FONT_SIZES.xs, color: COLORS.textPrimary, fontWeight: '800' },

  // List
  listContent: { paddingBottom: SPACING.lg },
  row: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowFirst: {
    borderTopWidth: 3,
    borderTopColor: COLORS.playerX,
  },
  rowHighlight: {
    borderColor: COLORS.playerX,
    backgroundColor: COLORS.surfaceElevated,
  },

  rankCol: { width: 48, alignItems: 'center' },
  rankNumber: {
    fontSize: FONT_SIZES.md,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },

  playerCol: { flex: 1, marginLeft: SPACING.sm },
  playerName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: 2,
  },
  tierIcon: { fontSize: FONT_SIZES.sm },
  tierName: { fontSize: FONT_SIZES.xs, fontWeight: '600' },

  ratingCol: { alignItems: 'flex-end', marginLeft: SPACING.sm },
  ratingValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  ratingLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
});
