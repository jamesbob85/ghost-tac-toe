import React, { useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { GameState, Player } from '../../types/game';
import { Cell } from './Cell';
import { WinLine } from './WinLine';
import { COLORS, RADIUS } from '../../constants/theme';
import { MAX_MARKS } from '../../constants/gameConfig';

interface BoardProps {
  state: GameState;
  onCellPress: (index: number) => void;
  disabled: boolean;
  boardWidth: number;
}

export function Board({ state, onCellPress, disabled, boardWidth }: BoardProps) {
  const { board, players, winLine, chaosCell, currentPlayer, phase, ghostMode } = state;

  // Build a lookup: cellIndex → markAge (0=oldest, MAX_MARKS-1=newest)
  const markAgeMap = new Map<number, number>();
  (['X', 'O'] as Player[]).forEach((p) => {
    players[p].marks.forEach((entry, i) => {
      markAgeMap.set(entry.index, i);
    });
  });

  // The oldest mark of the current player will vanish on their next placement
  const currentPlayerMarks = players[currentPlayer].marks;
  const evictingIndex =
    ghostMode && currentPlayerMarks.length >= MAX_MARKS
      ? currentPlayerMarks[0].index
      : null;

  // Render as 3 explicit rows of 3 cells each — reliable on all RN versions
  const rows = [0, 1, 2];
  const cols = [0, 1, 2];

  return (
    <View style={[styles.container, { width: boardWidth }]}>
      <View style={styles.grid}>
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
                  markAge={cell !== null ? (markAgeMap.get(index) ?? null) : null}
                  isWinCell={winLine ? winLine.includes(index) : false}
                  isChaosCell={chaosCell === index}
                  isEvicting={evictingIndex === index}
                  onPress={onCellPress}
                  disabled={disabled || phase !== 'playing'}
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
