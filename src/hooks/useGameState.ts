import { useCallback, useReducer } from 'react';
import { GameState, GameSettings } from '../types/game';
import { createInitialState, applyMove, resetScores } from '../engine/gameEngine';

type Action =
  | { type: 'MOVE'; cellIndex: number }
  | { type: 'RESET_GAME' }
  | { type: 'RESET_SCORES' };

function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'MOVE':
      return applyMove(state, action.cellIndex);
    case 'RESET_GAME':
      return {
        ...createInitialState(state.ghostMode, state.chaosMode),
        players: {
          X: { marks: [], score: state.players.X.score },
          O: { marks: [], score: state.players.O.score },
        },
      };
    case 'RESET_SCORES':
      return resetScores(createInitialState(state.ghostMode, state.chaosMode));
    default:
      return state;
  }
}

export function useGameState(settings: GameSettings) {
  const [state, dispatch] = useReducer(
    gameReducer,
    null,
    () => createInitialState(settings.ghostMode, settings.chaosMode),
  );

  const makeMove = useCallback((cellIndex: number) => {
    dispatch({ type: 'MOVE', cellIndex });
  }, []);

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
  }, []);

  const resetScoresAction = useCallback(() => {
    dispatch({ type: 'RESET_SCORES' });
  }, []);

  return { state, makeMove, resetGame, resetScores: resetScoresAction };
}
