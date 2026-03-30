import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS, FONT_SIZES, RADIUS, SPACING } from '../src/constants/theme';
import { AppStats, Difficulty } from '../src/types/game';
import { loadStats, resetStats, createEmptyStats } from '../src/store/statsStore';

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function DifficultyRow({
  difficulty,
  stats,
}: {
  difficulty: Difficulty;
  stats: { wins: number; losses: number; draws: number };
}) {
  const total = stats.wins + stats.losses + stats.draws;
  const winRate = total > 0 ? Math.round((stats.wins / total) * 100) : 0;
  const emoji = difficulty === 'easy' ? '🌱' : difficulty === 'medium' ? '🔥' : '💀';

  return (
    <View style={styles.diffRow}>
      <Text style={styles.diffLabel}>
        {emoji} {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
      </Text>
      <View style={styles.diffStats}>
        <Text style={[styles.diffStat, { color: COLORS.success }]}>{stats.wins}W</Text>
        <Text style={[styles.diffStat, { color: COLORS.danger }]}>{stats.losses}L</Text>
        <Text style={[styles.diffStat, { color: COLORS.textSecondary }]}>{stats.draws}D</Text>
        <Text style={[styles.diffStat, { color: COLORS.playerX }]}>{winRate}%</Text>
      </View>
    </View>
  );
}

export default function ScoresScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<AppStats>(createEmptyStats());

  useEffect(() => {
    loadStats().then(setStats);
  }, []);

  const handleReset = () => {
    Alert.alert(
      'Reset Stats',
      'Are you sure you want to reset all stats? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            const fresh = await resetStats();
            setStats(fresh);
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>📊 Stats</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Overview */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Overview</Text>
          <View style={styles.statsRow}>
            <StatBox label="Total Games" value={stats.totalGames} color={COLORS.textPrimary} />
            <StatBox label="Win Streak" value={stats.winStreak} color={COLORS.playerX} />
            <StatBox label="Best Streak" value={stats.bestWinStreak} color={COLORS.chaos} />
          </View>
        </View>

        {/* vs AI */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🤖 vs AI</Text>
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
            <DifficultyRow key={d} difficulty={d} stats={stats.ai[d]} />
          ))}
        </View>

        {/* vs Friend */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>👥 vs Friend</Text>
          <View style={styles.statsRow}>
            <StatBox label="X Wins" value={stats.friend.wins} color={COLORS.playerX} />
            <StatBox label="O Wins" value={stats.friend.losses} color={COLORS.playerO} />
            <StatBox label="Draws" value={stats.friend.draws} color={COLORS.textSecondary} />
          </View>
        </View>

        {/* Reset */}
        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <Text style={styles.resetText}>🗑️ Reset All Stats</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  container: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  backBtn: {
    padding: SPACING.xs,
    width: 60,
  },
  backText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '900',
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
    textAlign: 'center',
  },
  diffRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  diffLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  diffStats: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  diffStat: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  resetBtn: {
    alignItems: 'center',
    padding: SPACING.md,
    marginTop: SPACING.sm,
  },
  resetText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.danger,
    fontWeight: '600',
  },
});
