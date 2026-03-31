/**
 * Player profile service — CRUD operations against Supabase players table.
 */

import { supabase } from './supabase';
import { PlayerProfile, LeaderboardEntry } from '../types/online';
import { STARTING_RATING } from '../constants/ranks';

/** Upsert player on GPGS sign-in. Creates if new, returns existing if already exists. */
export async function upsertPlayer(
  playerId: string,
  displayName: string,
  avatarUrl?: string | null,
): Promise<PlayerProfile> {
  const { data, error } = await supabase
    .from('players')
    .upsert(
      {
        id: playerId,
        display_name: displayName,
        avatar_url: avatarUrl ?? null,
      },
      { onConflict: 'id', ignoreDuplicates: true },
    )
    .select()
    .single();

  if (error) {
    // If upsert with ignoreDuplicates doesn't return data, fetch it
    const { data: existing, error: fetchError } = await supabase
      .from('players')
      .select()
      .eq('id', playerId)
      .single();

    if (fetchError || !existing) throw fetchError ?? new Error('Player not found');

    // Update display name if changed
    if (existing.display_name !== displayName) {
      await supabase
        .from('players')
        .update({ display_name: displayName, avatar_url: avatarUrl ?? existing.avatar_url })
        .eq('id', playerId);
      existing.display_name = displayName;
    }

    return existing as PlayerProfile;
  }

  return data as PlayerProfile;
}

/** Get a player's profile */
export async function getPlayer(playerId: string): Promise<PlayerProfile | null> {
  const { data, error } = await supabase
    .from('players')
    .select()
    .eq('id', playerId)
    .single();

  if (error || !data) return null;
  return data as PlayerProfile;
}

/** Get the global leaderboard */
export async function getLeaderboard(limit = 100): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('leaderboard')
    .select()
    .order('global_rank', { ascending: true })
    .limit(limit);

  if (error || !data) return [];
  return data as LeaderboardEntry[];
}

/** Get a player's rank on the leaderboard */
export async function getPlayerRank(playerId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('global_rank')
    .eq('id', playerId)
    .single();

  if (error || !data) return null;
  return (data as { global_rank: number }).global_rank;
}

/** Get recent matches for a player */
export async function getRecentMatches(playerId: string, limit = 20): Promise<any[]> {
  const { data, error } = await supabase
    .from('matches')
    .select()
    .or(`player_x_id.eq.${playerId},player_o_id.eq.${playerId}`)
    .neq('status', 'playing')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data;
}
