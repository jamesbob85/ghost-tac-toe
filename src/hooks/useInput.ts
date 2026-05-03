import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { Board } from '../types/game';

export type InputMode = 'touch' | 'keyboard';

interface UseInputOptions {
  onCellSelect: (index: number) => void;
  onBack: () => void;
  onNewGame: () => void;
  board: Board;
  disabled: boolean;
}

interface UseInputResult {
  focusedCell: number | null;
  inputMode: InputMode;
  onTouchInteraction: () => void;
}

const KEY_MAP: Record<string, 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'CONFIRM' | 'BACK' | 'NEW_GAME'> = {
  ArrowUp: 'UP',
  ArrowDown: 'DOWN',
  ArrowLeft: 'LEFT',
  ArrowRight: 'RIGHT',
  w: 'UP', W: 'UP',
  a: 'LEFT', A: 'LEFT',
  s: 'DOWN', S: 'DOWN',
  d: 'RIGHT', D: 'RIGHT',
  Enter: 'CONFIRM',
  ' ': 'CONFIRM',
  Escape: 'BACK',
  r: 'NEW_GAME', R: 'NEW_GAME',
};

export function useInput({
  onCellSelect,
  onBack,
  onNewGame,
  board,
  disabled,
}: UseInputOptions): UseInputResult {
  const [focusedCell, setFocusedCell] = useState<number | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>('touch');

  const onCellSelectRef = useRef(onCellSelect);
  onCellSelectRef.current = onCellSelect;
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;
  const onNewGameRef = useRef(onNewGame);
  onNewGameRef.current = onNewGame;
  const boardRef = useRef(board);
  boardRef.current = board;
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const focusedCellRef = useRef(focusedCell);
  focusedCellRef.current = focusedCell;

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const action = KEY_MAP[event.key];
      if (!action) return;

      event.preventDefault();
      setInputMode('keyboard');

      if (action === 'BACK') {
        onBackRef.current();
        return;
      }

      if (action === 'NEW_GAME') {
        onNewGameRef.current();
        return;
      }

      if (action === 'CONFIRM') {
        const cell = focusedCellRef.current;
        if (cell !== null && !disabledRef.current && boardRef.current[cell] === null) {
          onCellSelectRef.current(cell);
        }
        return;
      }

      setFocusedCell((prev) => {
        const current = prev ?? 4;
        const row = Math.floor(current / 3);
        const col = current % 3;

        let newRow = row;
        let newCol = col;

        switch (action) {
          case 'UP':    newRow = Math.max(0, row - 1); break;
          case 'DOWN':  newRow = Math.min(2, row + 1); break;
          case 'LEFT':  newCol = Math.max(0, col - 1); break;
          case 'RIGHT': newCol = Math.min(2, col + 1); break;
        }

        return newRow * 3 + newCol;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const onTouchInteraction = useCallback(() => {
    if (inputMode !== 'touch') {
      setInputMode('touch');
      setFocusedCell(null);
    }
  }, [inputMode]);

  return {
    focusedCell: inputMode === 'keyboard' ? focusedCell : null,
    inputMode,
    onTouchInteraction,
  };
}
