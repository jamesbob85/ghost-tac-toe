/**
 * Achievement service — checks and unlocks achievements after every game.
 *
 * Achievements earned before GPGS sign-in are queued locally in AsyncStorage
 * and synced on first sign-in.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ACHIEVEMENTS } from '../constants/achievements';
import { AppStats, GameMode, Difficulty, Player } from '../types/game';

const UNLOCKED_KEY = '@ghost_tac_toe_achievements_unlocked';
const PENDING_KEY = '@ghost_tac_toe_achievements_pending';
const COUNTERS_KEY = '@ghost_tac_toe_achievement_counters';

/** Counters for incremental achievements */
interface AchievementCounters {
  hardAIWins: number;
  chaosWins: number;
  totalWins: number;
  totalGames: number;
  onlineWins: number;
}

function emptyCounters(): AchievementCounters {
  return { hardAIWins: 0, chaosWins: 0, totalWins: 0, totalGames: 0, onlineWins: 0 };
}

/** Context passed to the achievement checker after each game */
export interface GameResult {
  mode: GameMode | 'online';
  difficulty?: Difficulty;
  winner: Player | null;       // null = draw
  playerSide: Player;          // which side the human was on
  ghostMode: boolean;
  chaosMode: boolean;
  chaosCellInWinLine: boolean; // true if win line includes chaos cell
  turnNumber: number;          // total turns when game ended
  winStreak: number;           // current streak AFTER this game
  isAIMatch?: boolean;         // online: was this a Ghost Bot match?
  playerRating?: number;       // online: current rating after change
}

/** Load which achievements have been unlocked */
async function loadUnlocked(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(UNLOCKED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

/** Save unlocked set */
async function saveUnlocked(unlocked: Set<string>): Promise<void> {
  await AsyncStorage.setItem(UNLOCKED_KEY, JSON.stringify([...unlocked]));
}

/** Load pending (queued for GPGS sync) */
export async function loadPending(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Save pending queue */
async function savePending(pending: string[]): Promise<void> {
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(pending));
}

/** Clear pending after GPGS sync */
export async function clearPending(): Promise<void> {
  await AsyncStorage.removeItem(PENDING_KEY);
}

/** Load counters */
async function loadCounters(): Promise<AchievementCounters> {
  try {
    const raw = await AsyncStorage.getItem(COUNTERS_KEY);
    return raw ? { ...emptyCounters(), ...JSON.parse(raw) } : emptyCounters();
  } catch {
    return emptyCounters();
  }
}

/** Save counters */
async function saveCounters(counters: AchievementCounters): Promise<void> {
  await AsyncStorage.setItem(COUNTERS_KEY, JSON.stringify(counters));
}

/**
 * Check and unlock achievements after a game ends.
 * Returns the list of newly unlocked achievement IDs.
 *
 * @param gpgsUnlock - callback to unlock via GPGS (null if not signed in → queues locally)
 */
export async function checkAchievements(
  result: GameResult,
  gpgsUnlock: ((achievementId: string) => void) | null,
): Promise<string[]> {
  const unlocked = await loadUnlocked();
  const pending = await loadPending();
  const counters = await loadCounters();
  const newlyUnlocked: string[] = [];

  const isWin = result.winner === result.playerSide;
  const isLoss = result.winner !== null && result.winner !== result.playerSide;

  // Update counters
  counters.totalGames += 1;
  if (isWin) {
    counters.totalWins += 1;
    if (result.mode === 'ai' && result.difficulty === 'hard') {
      counters.hardAIWins += 1;
    }
    if (result.chaosMode && result.chaosCellInWinLine) {
      counters.chaosWins += 1;
    }
    if (result.mode === 'online') {
      counters.onlineWins += 1;
    }
  }

  function tryUnlock(id: string): void {
    if (unlocked.has(id)) return;
    unlocked.add(id);
    newlyUnlocked.push(id);
    if (gpgsUnlock) {
      gpgsUnlock(id);
    } else {
      pending.push(id);
    }
  }

  // ─── Beginner ──────────────────────────────────────────────────
  tryUnlock('first_steps'); // Complete any game

  if (isWin) {
    tryUnlock('ghostbuster'); // First win
  }

  if (isWin && result.ghostMode) {
    tryUnlock('vanishing_act');
  }

  // ─── Solo Mastery ──────────────────────────────────────────────
  if (isWin && result.mode === 'ai' && result.difficulty === 'hard') {
    tryUnlock('brain_over_brawn');
  }

  if (counters.hardAIWins >= 10) {
    tryUnlock('ai_slayer');
  }

  // Blitz: win in minimum moves. Player X wins in 5 total turns (3 X moves + 2 O moves).
  // turnNumber at game end = total moves placed.
  if (isWin && result.turnNumber <= 5) {
    tryUnlock('blitz');
  }

  // ─── Volume ────────────────────────────────────────────────────
  if (counters.totalWins >= 10) tryUnlock('double_digits');
  if (counters.totalWins >= 25) tryUnlock('quarter_century');
  if (counters.totalWins >= 50) tryUnlock('half_century');
  if (counters.totalWins >= 100) tryUnlock('centurion');
  if (counters.totalGames >= 200) tryUnlock('marathon');

  // ─── Streaks ───────────────────────────────────────────────────
  if (result.winStreak >= 3) tryUnlock('hat_trick');
  if (result.winStreak >= 5) tryUnlock('on_fire');
  if (result.winStreak >= 10) tryUnlock('unstoppable');

  // ─── Chaos Mode ────────────────────────────────────────────────
  if (isWin && result.chaosMode && result.chaosCellInWinLine) {
    tryUnlock('lightning_strike');
  }
  if (counters.chaosWins >= 5) {
    tryUnlock('chaos_master');
  }

  // ─── Social ────────────────────────────────────────────────────
  if (result.mode === 'friend') {
    tryUnlock('friendly_ghost');
  }

  // ─── Ranked / Online ──────────────────────────────────────────
  if (result.mode === 'online') {
    tryUnlock('into_the_arena');

    if (isWin) {
      tryUnlock('first_blood');
    }

    if (counters.onlineWins >= 25) {
      tryUnlock('ghost_hunter');
    }

    // Tier achievements
    const rating = result.playerRating ?? 0;
    if (rating >= 1000) tryUnlock('rising_spirit');
    if (rating >= 1500) tryUnlock('phantom_force');
    if (rating >= 2000) tryUnlock('wraith_awakened');
    if (rating >= 2500) tryUnlock('beyond_death');
    if (rating >= 3000) tryUnlock('eternal_lich');
  }

  // Persist
  await saveUnlocked(unlocked);
  await savePending(pending);
  await saveCounters(counters);

  return newlyUnlocked;
}

/** Get all unlocked achievement IDs */
export async function getUnlockedAchievements(): Promise<Set<string>> {
  return loadUnlocked();
}

/** Get achievement progress (counters) for display */
export async function getAchievementCounters(): Promise<AchievementCounters> {
  return loadCounters();
}
