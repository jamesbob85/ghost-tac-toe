import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppStats, Difficulty, GameMode, Player } from '../types/game';

const STATS_KEY = '@ghost_tac_toe_stats';

export function createEmptyStats(): AppStats {
  return {
    ai: {
      easy: { wins: 0, losses: 0, draws: 0 },
      medium: { wins: 0, losses: 0, draws: 0 },
      hard: { wins: 0, losses: 0, draws: 0 },
    },
    friend: { wins: 0, losses: 0, draws: 0 },
    totalGames: 0,
    winStreak: 0,
    bestWinStreak: 0,
  };
}

export async function loadStats(): Promise<AppStats> {
  try {
    const raw = await AsyncStorage.getItem(STATS_KEY);
    if (!raw) return createEmptyStats();
    return JSON.parse(raw) as AppStats;
  } catch {
    return createEmptyStats();
  }
}

export async function saveStats(stats: AppStats): Promise<void> {
  try {
    await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    // Silently fail — stats are non-critical
  }
}

/**
 * Record the result of a completed game and persist.
 * In AI mode: winner='X' means human won, winner='O' means AI won.
 * In friend mode: we track player X wins as 'wins' for symmetry.
 */
export async function recordGameResult(
  mode: GameMode,
  difficulty: Difficulty,
  winner: Player | null, // null = draw
): Promise<AppStats> {
  const stats = await loadStats();
  stats.totalGames += 1;

  if (mode === 'ai') {
    const bucket = stats.ai[difficulty];
    if (winner === null) {
      bucket.draws += 1;
      stats.winStreak = 0;
    } else if (winner === 'X') {
      bucket.wins += 1;
      stats.winStreak += 1;
      if (stats.winStreak > stats.bestWinStreak) {
        stats.bestWinStreak = stats.winStreak;
      }
    } else {
      bucket.losses += 1;
      stats.winStreak = 0;
    }
  } else {
    const bucket = stats.friend;
    if (winner === null) {
      bucket.draws += 1;
    } else if (winner === 'X') {
      bucket.wins += 1;
    } else {
      bucket.losses += 1;
    }
  }

  await saveStats(stats);
  return stats;
}

export async function resetStats(): Promise<AppStats> {
  const fresh = createEmptyStats();
  await saveStats(fresh);
  return fresh;
}
