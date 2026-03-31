import { useCallback, useEffect, useRef, useState } from 'react';
import { Board } from '../types/game';

// Android KeyEvent key codes
const KEY_MAP: Record<number, string> = {
  // Arrow keys / D-pad (same codes)
  19: 'UP',
  20: 'DOWN',
  21: 'LEFT',
  22: 'RIGHT',
  // WASD
  51: 'UP',     // W
  29: 'LEFT',   // A
  47: 'DOWN',   // S
  32: 'RIGHT',  // D
  // Confirm
  66: 'CONFIRM', // Enter
  62: 'CONFIRM', // Space
  96: 'CONFIRM', // Gamepad A / Cross
  // Back
  111: 'BACK',   // Escape
  97: 'BACK',    // Gamepad B / Circle
  // New game
  46: 'NEW_GAME', // R
  100: 'NEW_GAME', // Gamepad Y / Triangle
};

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
  /** Call this on any touch/press event to switch back to touch mode */
  onTouchInteraction: () => void;
}

/**
 * Unified input hook for keyboard, controller, and touch.
 *
 * Manages a cursor (focusedCell) for keyboard/controller navigation.
 * Cursor is invisible until the first key press, and hides on touch.
 */
export function useInput({
  onCellSelect,
  onBack,
  onNewGame,
  board,
  disabled,
}: UseInputOptions): UseInputResult {
  const [focusedCell, setFocusedCell] = useState<number | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>('touch');

  // Use refs for callbacks to avoid re-registering the listener
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
    let KeyEvent: any = null;
    try {
      KeyEvent = require('react-native-keyevent').default;
    } catch {
      // Module not available (e.g., Expo Go). Input will be touch-only.
      return;
    }

    const handleKeyDown = (event: { keyCode: number }) => {
      const action = KEY_MAP[event.keyCode];
      if (!action) return;

      // Switch to keyboard mode on any mapped key
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

      // Directional navigation
      setFocusedCell((prev) => {
        const current = prev ?? 4; // start at center if no focus
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

    KeyEvent.onKeyDownListener(handleKeyDown);

    return () => {
      KeyEvent.removeKeyDownListener(handleKeyDown);
    };
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
