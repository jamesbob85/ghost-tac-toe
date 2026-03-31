/**
 * Types for online multiplayer, ranked play, and player profiles.
 */

import { TierDefinition } from '../constants/ranks';

/** Player profile stored in Supabase */
export interface PlayerProfile {
  id: string;              // GPGS Player ID
  display_name: string;
  avatar_url: string | null;
  rating: number;
  games_played: number;
  wins: number;
  losses: number;
  draws: number;
  win_streak: number;
  best_win_streak: number;
  placement_remaining: number;
  created_at: string;
  updated_at: string;
}

/** Computed tier info from a rating */
export interface TierInfo {
  tier: TierDefinition;
  division: string | null;   // 'III', 'II', 'I', or null for Lich
  displayName: string;       // e.g., "Spirit II"
  progressInDivision: number; // 0.0–1.0 progress toward next division
}

/** Match data stored in Supabase */
export interface MatchData {
  id: string;
  player_x_id: string;
  player_o_id: string | null;  // null for AI
  is_ai_match: boolean;
  board: (string | null)[];    // 9-cell array
  marks_x: { index: number; turn: number }[];
  marks_o: { index: number; turn: number }[];
  current_turn: 'X' | 'O';
  turn_number: number;
  status: 'playing' | 'won' | 'draw' | 'abandoned';
  winner: 'X' | 'O' | null;
  win_line: number[] | null;
  rating_x_before: number | null;
  rating_o_before: number | null;
  rating_x_change: number | null;
  rating_o_change: number | null;
  turn_deadline: string | null;
  created_at: string;
  updated_at: string;
}

/** Queue entry for matchmaking */
export interface QueueEntry {
  id: string;
  player_id: string;
  rating: number;
  queued_at: string;
  match_id: string | null;
}

/** Leaderboard entry */
export interface LeaderboardEntry {
  id: string;
  display_name: string;
  avatar_url: string | null;
  rating: number;
  wins: number;
  losses: number;
  games_played: number;
  global_rank: number;
}

/** Rating change result after a match */
export interface RatingChange {
  pointsChange: number;      // positive for gain, negative for loss
  newRating: number;
  oldRating: number;
  oldTier: TierInfo;
  newTier: TierInfo;
  isPromotion: boolean;
  isDemotion: boolean;
  streakBonus: number;
  floorProtectionApplied: boolean;
}

/** Matchmaking state */
export type MatchmakingPhase =
  | 'idle'
  | 'searching_tight'      // 0–3s, ±200 rating
  | 'searching_wide'       // 3–6s, ±500 rating
  | 'searching_any'        // 6–9s, any human
  | 'summoning_bot'        // 9s+, Ghost Bot
  | 'matched'              // opponent found
  | 'cancelled';

/** Online game connection state */
export type ConnectionState = 'connected' | 'reconnecting' | 'opponent_disconnected' | 'disconnected';
