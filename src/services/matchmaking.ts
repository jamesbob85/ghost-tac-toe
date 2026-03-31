/**
 * Matchmaking service — queue management, progressive search, Ghost Bot fallback.
 */

import { supabase } from './supabase';
import { QueueEntry } from '../types/online';

/** Join the matchmaking queue */
export async function joinQueue(playerId: string, rating: number): Promise<QueueEntry> {
  // Clean up any stale entries for this player first
  await supabase
    .from('match_queue')
    .delete()
    .eq('player_id', playerId)
    .is('match_id', null);

  const { data, error } = await supabase
    .from('match_queue')
    .insert({ player_id: playerId, rating })
    .select()
    .single();

  if (error || !data) throw error ?? new Error('Failed to join queue');
  return data as QueueEntry;
}

/** Leave the matchmaking queue */
export async function leaveQueue(playerId: string): Promise<void> {
  await supabase
    .from('match_queue')
    .delete()
    .eq('player_id', playerId)
    .is('match_id', null);
}

/** Try to find a match within a rating range. Returns match ID or null. */
export async function findMatch(
  playerId: string,
  rating: number,
  range: number,
): Promise<string | null> {
  const { data, error } = await supabase.rpc('find_match', {
    p_player_id: playerId,
    p_rating: rating,
    p_range: range,
  });

  if (error) {
    console.warn('findMatch error:', error);
    return null;
  }

  return data as string | null;
}

/** Subscribe to queue entry changes (to detect when matched) */
export function subscribeToQueue(
  queueEntryId: string,
  onMatched: (matchId: string) => void,
) {
  const channel = supabase
    .channel(`queue:${queueEntryId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'match_queue',
        filter: `id=eq.${queueEntryId}`,
      },
      (payload) => {
        const matchId = payload.new?.match_id;
        if (matchId) {
          onMatched(matchId);
        }
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/** Create an AI match directly (Ghost Bot fallback) */
export async function createAIMatch(
  playerId: string,
  rating: number,
): Promise<string> {
  const { data, error } = await supabase
    .from('matches')
    .insert({
      player_x_id: playerId,
      player_o_id: null,
      is_ai_match: true,
      rating_x_before: rating,
      rating_o_before: null,
      turn_deadline: new Date(Date.now() + 30000).toISOString(),
    })
    .select('id')
    .single();

  if (error || !data) throw error ?? new Error('Failed to create AI match');

  // Clean up queue entry
  await leaveQueue(playerId);

  return (data as { id: string }).id;
}
