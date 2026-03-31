/**
 * Online game hook — subscribes to match state, handles moves, turn timer.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { MatchData, ConnectionState } from '../types/online';
import { Player } from '../types/game';
import {
  getMatch,
  subscribeToMatch,
  submitMove as submitMoveService,
  abandonMatch as abandonMatchService,
  updatePlayerRating,
  recordMatchRatings,
} from '../services/onlineMatch';
import { calculateRatingChange, getGhostBotDifficulty } from '../services/rankCalculator';
import { getBestMove } from '../engine/aiEngine';
import { createInitialState, applyMove } from '../engine/gameEngine';
import { GameState } from '../types/game';
import { RatingChange } from '../types/online';

interface UseOnlineGameOptions {
  matchId: string;
  playerId: string;
  playerRating: number;
  opponentRating: number;
  isAIMatch: boolean;
  playerWinStreak: number;
  placementRemaining: number;
}

interface UseOnlineGameResult {
  match: MatchData | null;
  playerSide: Player;
  isMyTurn: boolean;
  turnTimeRemaining: number;
  connectionState: ConnectionState;
  ratingChange: RatingChange | null;
  makeMove: (cellIndex: number) => Promise<void>;
  abandon: () => Promise<void>;
}

export function useOnlineGame({
  matchId,
  playerId,
  playerRating,
  opponentRating,
  isAIMatch,
  playerWinStreak,
  placementRemaining,
}: UseOnlineGameOptions): UseOnlineGameResult {
  const [match, setMatch] = useState<MatchData | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('connected');
  const [turnTimeRemaining, setTurnTimeRemaining] = useState(30);
  const [ratingChange, setRatingChange] = useState<RatingChange | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const matchRef = useRef<MatchData | null>(null);

  // Determine player side from match data
  const playerSide: Player = match?.player_x_id === playerId ? 'X' : 'O';
  const isMyTurn = match?.status === 'playing' && match?.current_turn === playerSide;

  // Load initial match state
  useEffect(() => {
    getMatch(matchId).then((m) => {
      if (m) {
        setMatch(m);
        matchRef.current = m;
      }
    });
  }, [matchId]);

  // Subscribe to match updates (for human opponent moves)
  useEffect(() => {
    if (isAIMatch) return; // AI matches don't need Realtime

    const unsubscribe = subscribeToMatch(matchId, (updated) => {
      setMatch(updated);
      matchRef.current = updated;
    });

    return unsubscribe;
  }, [matchId, isAIMatch]);

  // Turn timer countdown
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (match?.status === 'playing' && match?.turn_deadline) {
      const updateTimer = () => {
        const deadline = new Date(match.turn_deadline!).getTime();
        const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
        setTurnTimeRemaining(remaining);
      };

      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [match?.turn_deadline, match?.status]);

  // AI move logic (Ghost Bot)
  useEffect(() => {
    if (!isAIMatch || !match || match.status !== 'playing') return;
    if (match.current_turn === playerSide) return; // It's the human's turn

    // AI needs to make a move
    const delay = 800 + Math.random() * 700; // 0.8-1.5s delay

    aiTimerRef.current = setTimeout(() => {
      const currentMatch = matchRef.current;
      if (!currentMatch || currentMatch.status !== 'playing') return;

      // Build a GameState from match data for the AI engine
      const board = currentMatch.board.map((c: string | null) =>
        c === 'X' ? 'X' : c === 'O' ? 'O' : null,
      );
      const gameState: GameState = {
        board,
        players: {
          X: { marks: currentMatch.marks_x || [], score: 0 },
          O: { marks: currentMatch.marks_o || [], score: 0 },
        },
        currentPlayer: currentMatch.current_turn as Player,
        phase: 'playing',
        winner: null,
        winLine: null,
        turnNumber: currentMatch.turn_number,
        chaosCell: null,
        ghostMode: true,
        chaosMode: false,
      };

      const difficulty = getGhostBotDifficulty(playerRating);
      const aiMove = getBestMove(gameState, difficulty);

      if (aiMove !== null) {
        // For AI matches, apply move locally then update Supabase
        const newState = applyMove(gameState, aiMove);
        const updatedMatch: MatchData = {
          ...currentMatch,
          board: newState.board as (string | null)[],
          marks_x: newState.players.X.marks,
          marks_o: newState.players.O.marks,
          current_turn: newState.currentPlayer,
          turn_number: newState.turnNumber,
          status: newState.phase === 'won' ? 'won' : newState.phase === 'draw' ? 'draw' : 'playing',
          winner: newState.winner,
          win_line: newState.winLine,
          turn_deadline: newState.phase === 'playing'
            ? new Date(Date.now() + 30000).toISOString()
            : null,
        };
        setMatch(updatedMatch);
        matchRef.current = updatedMatch;

        // Persist to Supabase (non-blocking for AI matches)
        submitMoveService(matchId, currentMatch.player_o_id ?? playerId, aiMove).catch(() => {});
      }
    }, delay);

    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    };
  }, [match?.current_turn, match?.status, isAIMatch, playerSide, playerId, matchId, playerRating]);

  // Handle game over — calculate and persist rating changes
  useEffect(() => {
    if (!match || (match.status !== 'won' && match.status !== 'draw' && match.status !== 'abandoned')) return;
    if (ratingChange) return; // Already calculated

    const isWin = match.winner === playerSide;
    const isDraw = match.status === 'draw';
    const isAbandon = match.status === 'abandoned';

    const change = calculateRatingChange({
      myRating: playerRating,
      opponentRating: opponentRating,
      isWin,
      isDraw,
      isAIMatch,
      isAbandon: isAbandon && match.winner !== playerSide, // I abandoned
      currentWinStreak: isWin ? playerWinStreak : 0,
      placementRemaining,
    });

    setRatingChange(change);

    // Persist rating change
    updatePlayerRating(playerId, change.pointsChange, isWin, isDraw).catch(() => {});

    // Record on match row
    const myChange = change.pointsChange;
    const oppChange = isAIMatch ? 0 : -myChange; // Simplified: opponent gets inverse
    if (playerSide === 'X') {
      recordMatchRatings(matchId, myChange, oppChange).catch(() => {});
    } else {
      recordMatchRatings(matchId, oppChange, myChange).catch(() => {});
    }
  }, [match?.status]);

  const makeMove = useCallback(async (cellIndex: number) => {
    if (!match || match.status !== 'playing' || match.current_turn !== playerSide) return;

    if (isAIMatch) {
      // For AI matches, apply locally first for instant feedback
      const board = match.board.map((c: string | null) =>
        c === 'X' ? 'X' : c === 'O' ? 'O' : null,
      );
      const gameState: GameState = {
        board,
        players: {
          X: { marks: match.marks_x || [], score: 0 },
          O: { marks: match.marks_o || [], score: 0 },
        },
        currentPlayer: playerSide,
        phase: 'playing',
        winner: null,
        winLine: null,
        turnNumber: match.turn_number,
        chaosCell: null,
        ghostMode: true,
        chaosMode: false,
      };

      const newState = applyMove(gameState, cellIndex);
      const updatedMatch: MatchData = {
        ...match,
        board: newState.board as (string | null)[],
        marks_x: newState.players.X.marks,
        marks_o: newState.players.O.marks,
        current_turn: newState.currentPlayer,
        turn_number: newState.turnNumber,
        status: newState.phase === 'won' ? 'won' : newState.phase === 'draw' ? 'draw' : 'playing',
        winner: newState.winner,
        win_line: newState.winLine,
        turn_deadline: newState.phase === 'playing'
          ? new Date(Date.now() + 30000).toISOString()
          : null,
      };
      setMatch(updatedMatch);
      matchRef.current = updatedMatch;

      // Persist to Supabase (non-blocking)
      submitMoveService(matchId, playerId, cellIndex).catch(() => {});
    } else {
      // Human opponent: submit to server, wait for Realtime update
      const result = await submitMoveService(matchId, playerId, cellIndex);
      if (!result.success) {
        console.warn('Move rejected:', result.error);
      }
      // Match state will update via Realtime subscription
    }
  }, [match, playerSide, playerId, matchId, isAIMatch]);

  const abandon = useCallback(async () => {
    await abandonMatchService(matchId, playerId);
  }, [matchId, playerId]);

  return {
    match,
    playerSide,
    isMyTurn,
    turnTimeRemaining,
    connectionState,
    ratingChange,
    makeMove,
    abandon,
  };
}
