import { useEffect, useRef } from 'react';
import { GameState, Difficulty } from '../types/game';
import { getBestMove } from '../engine/aiEngine';
import { AI_THINK_DELAY_MS } from '../constants/gameConfig';

/**
 * Triggers the AI move after a short artificial delay.
 * Only fires when it's O's turn and the game is still active.
 */
export function useAI(
  state: GameState,
  isAIMode: boolean,
  difficulty: Difficulty,
  onMove: (cellIndex: number) => void,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clear any pending timer on state changes
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!isAIMode) return;
    if (state.phase !== 'playing') return;
    if (state.currentPlayer !== 'O') return;

    timerRef.current = setTimeout(() => {
      const move = getBestMove(state, difficulty);
      if (move >= 0) {
        onMove(move);
      }
    }, AI_THINK_DELAY_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state, isAIMode, difficulty, onMove]);
}
