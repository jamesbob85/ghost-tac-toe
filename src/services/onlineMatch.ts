/**
 * Online match service — Realtime subscription, move submission, abandonment.
 */

import { supabase } from './supabase';
import { MatchData } from '../types/online';

/** Get a match by ID */
export async function getMatch(matchId: string): Promise<MatchData | null> {
  const { data, error } = await supabase
    .from('matches')
    .select()
    .eq('id', matchId)
    .single();

  if (error || !data) return null;
  return data as MatchData;
}

/** Subscribe to match state changes (opponent moves, game over) */
export function subscribeToMatch(
  matchId: string,
  onUpdate: (match: MatchData) => void,
) {
  const channel = supabase
    .channel(`match:${matchId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'matches',
        filter: `id=eq.${matchId}`,
      },
      (payload) => {
        onUpdate(payload.new as MatchData);
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/** Submit a move via server-side RPC */
export async function submitMove(
  matchId: string,
  playerId: string,
  cellIndex: number,
): Promise<{ success: boolean; error?: string; [key: string]: any }> {
  const { data, error } = await supabase.rpc('submit_move', {
    p_match_id: matchId,
    p_player_id: playerId,
    p_cell_index: cellIndex,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return data as { success: boolean; error?: string };
}

/** Abandon a match (forfeit) */
export async function abandonMatch(
  matchId: string,
  playerId: string,
): Promise<{ success: boolean; winner?: string; error?: string }> {
  const { data, error } = await supabase.rpc('abandon_match', {
    p_match_id: matchId,
    p_player_id: playerId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return data as { success: boolean; winner?: string };
}

/** Update ratings after match ends (called by client after computing rating change) */
export async function updatePlayerRating(
  playerId: string,
  ratingChange: number,
  isWin: boolean,
  isDraw: boolean,
): Promise<void> {
  const { error } = await supabase.rpc('update_player_rating', {
    p_player_id: playerId,
    p_rating_change: ratingChange,
    p_is_win: isWin,
    p_is_draw: isDraw,
  });

  if (error) {
    console.warn('Failed to update rating:', error);
  }
}

/** Record rating changes on the match row (for history display) */
export async function recordMatchRatings(
  matchId: string,
  ratingXChange: number,
  ratingOChange: number,
): Promise<void> {
  await supabase
    .from('matches')
    .update({
      rating_x_change: ratingXChange,
      rating_o_change: ratingOChange,
    })
    .eq('id', matchId);
}
