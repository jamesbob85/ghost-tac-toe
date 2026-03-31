import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GameState, Player } from '../../types/game';
import { Cell } from './Cell';
import { WinLine } from './WinLine';
import { COLORS, RADIUS, LIFT_SHADOW } from '../../constants/theme';
import { MAX_MARKS } from '../../constants/gameConfig';

interface BoardProps {
  state: GameState;
  onCellPress: (index: number) => void;
  disabled: boolean;
  boardWidth: number;
  /** Keyboard/controller focused cell index, null if none */
  focusedCell?: number | null;
  /** Called when a touch event occurs on any cell (to switch input mode) */
  onTouchInteraction?: () => void;
}

export function Board({
  state,
  onCellPress,
  disabled,
  boardWidth,
  focusedCell = null,
  onTouchInteraction,
}: BoardProps) {
  const { board, players, winLine, chaosCell, currentPlayer, phase, ghostMode } = state;

  const markAgeMap = new Map<number, number>();
  (['X', 'O'] as Player[]).forEach((p) => {
    players[p].marks.forEach((entry, i) => {
      markAgeMap.set(entry.index, i);
    });
  });

  const currentPlayerMarks = players[currentPlayer].marks;
  const evictingIndex =
    ghostMode && currentPlayerMarks.length >= MAX_MARKS
      ? currentPlayerMarks[0].index
      : null;

  const rows = [0, 1, 2];
  const cols = [0, 1, 2];

  return (
    <View style={[styles.container, { width: boardWidth }]}>
      <View style={[styles.grid, LIFT_SHADOW]}>
        {rows.map((row) => (
          <View key={row} style={styles.row}>
            {cols.map((col) => {
              const index = row * 3 + col;
              const cell = board[index];
              return (
                <Cell
                  key={index}
                  index={index}
                  value={cell}
                  markAge={cell !== null && ghostMode ? (markAgeMap.get(index) ?? null) : null}
                  isWinCell={winLine ? winLine.includes(index) : false}
                  isChaosCell={chaosCell === index}
                  isEvicting={evictingIndex === index}
                  isFocused={focusedCell === index}
                  onPress={onCellPress}
                  onTouchStart={onTouchInteraction}
                  disabled={disabled || phase !== 'playing'}
                  boardWidth={boardWidth}
                />
              );
            })}
          </View>
        ))}
      </View>

      <WinLine
        winLine={winLine}
        winner={state.winner}
        boardSize={boardWidth}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    aspectRatio: 1,
  },
  grid: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    padding: 3,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
  },
});
