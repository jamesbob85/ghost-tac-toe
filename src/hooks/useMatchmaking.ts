/**
 * Matchmaking hook — manages queue lifecycle, progressive widening, Ghost Bot fallback.
 *
 * Flow: 0-3s ±200 → 3-6s ±500 → 6-9s any → 9s Ghost Bot
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { MatchmakingPhase } from '../types/online';
import {
  joinQueue,
  leaveQueue,
  findMatch,
  subscribeToQueue,
  createAIMatch,
} from '../services/matchmaking';

interface UseMatchmakingOptions {
  playerId: string;
  rating: number;
  onMatchFound: (matchId: string, isAI: boolean) => void;
}

interface UseMatchmakingResult {
  phase: MatchmakingPhase;
  elapsedSeconds: number;
  startSearch: () => void;
  cancelSearch: () => void;
}

const SEARCH_INTERVALS = [
  { durationMs: 3000, range: 200, phase: 'searching_tight' as const },
  { durationMs: 3000, range: 500, phase: 'searching_wide' as const },
  { durationMs: 3000, range: 99999, phase: 'searching_any' as const },
];
const POLL_INTERVAL = 1500; // How often to poll for matches within each phase

export function useMatchmaking({
  playerId,
  rating,
  onMatchFound,
}: UseMatchmakingOptions): UseMatchmakingResult {
  const [phase, setPhase] = useState<MatchmakingPhase>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const cleanupRef = useRef<(() => void) | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const matchFoundRef = useRef(false);
  const onMatchFoundRef = useRef(onMatchFound);
  onMatchFoundRef.current = onMatchFound;

  const cleanup = useCallback(() => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
      // Best-effort leave queue
      leaveQueue(playerId).catch(() => {});
    };
  }, [playerId, cleanup]);

  const startSearch = useCallback(async () => {
    if (phase !== 'idle' && phase !== 'cancelled') return;

    matchFoundRef.current = false;
    setPhase('searching_tight');
    setElapsedSeconds(0);

    // Elapsed time counter
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    try {
      // Join queue
      const queueEntry = await joinQueue(playerId, rating);

      // Subscribe to queue updates (in case another player's search finds us)
      const unsubscribe = subscribeToQueue(queueEntry.id, (matchId) => {
        if (matchFoundRef.current) return;
        matchFoundRef.current = true;
        cleanup();
        setPhase('matched');
        onMatchFoundRef.current(matchId, false);
      });
      cleanupRef.current = unsubscribe;

      // Progressive search phases
      let totalDelay = 0;
      for (const interval of SEARCH_INTERVALS) {
        if (matchFoundRef.current) return;

        setPhase(interval.phase);

        // Poll for matches during this phase
        const phaseEnd = totalDelay + interval.durationMs;
        const pollCount = Math.floor(interval.durationMs / POLL_INTERVAL);

        for (let i = 0; i < pollCount; i++) {
          if (matchFoundRef.current) return;

          await new Promise<void>((resolve) => {
            searchTimerRef.current = setTimeout(resolve, POLL_INTERVAL);
          });

          if (matchFoundRef.current) return;

          const matchId = await findMatch(playerId, rating, interval.range);
          if (matchId) {
            matchFoundRef.current = true;
            cleanup();
            setPhase('matched');
            onMatchFoundRef.current(matchId, false);
            return;
          }
        }

        totalDelay = phaseEnd;
      }

      // No human found — summon Ghost Bot
      if (!matchFoundRef.current) {
        setPhase('summoning_bot');
        await new Promise<void>((resolve) => {
          searchTimerRef.current = setTimeout(resolve, 1000); // Brief dramatic pause
        });

        if (!matchFoundRef.current) {
          const matchId = await createAIMatch(playerId, rating);
          matchFoundRef.current = true;
          cleanup();
          setPhase('matched');
          onMatchFoundRef.current(matchId, true);
        }
      }
    } catch (error) {
      console.warn('Matchmaking error:', error);
      cleanup();
      setPhase('idle');
    }
  }, [playerId, rating, phase, cleanup]);

  const cancelSearch = useCallback(async () => {
    matchFoundRef.current = true; // Prevent any pending callbacks
    cleanup();
    setPhase('cancelled');
    await leaveQueue(playerId).catch(() => {});
    setPhase('idle');
  }, [playerId, cleanup]);

  return { phase, elapsedSeconds, startSearch, cancelSearch };
}
