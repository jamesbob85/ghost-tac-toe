import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GameState, Player } from '../../types/game';
import { Cell } from './Cell';
import { WinLine } from './WinLine';
import { COLORS, BORDERS, PAPER_SHADOW } from '../../constants/theme';
import { MAX_MARKS } from '../../constants/gameConfig';

interface BoardProps {
  state: GameState;
  onCellPress: (index: number) => void;
  disabled: boolean;
  boardWidth: number;
  focusedCell?: number | null;
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

  return (
    <View style={[styles.frame, { width: boardWidth, height: boardWidth }]}>
      {/* Outer double-rule frame: thick line, paper gap, thin line */}
      <View style={[styles.outerRule, { width: boardWidth, height: boardWidth }]}>
        <View style={[styles.innerRule, PAPER_SHADOW]}>
          <View style={styles.grid}>
            {[0, 1, 2].map((row) => (
              <View key={row} style={styles.row}>
                {[0, 1, 2].map((col) => {
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
                      isLastRow={row === 2}
                      isLastCol={col === 2}
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
        </View>
      </View>

      <WinLine winLine={winLine} winner={state.winner} boardSize={boardWidth} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    position: 'relative',
  },
  outerRule: {
    borderWidth: BORDERS.thick,
    borderColor: COLORS.rule,
    padding: BORDERS.doubleGap,
    backgroundColor: COLORS.background,
  },
  innerRule: {
    flex: 1,
    borderWidth: BORDERS.hairline,
    borderColor: COLORS.rule,
    backgroundColor: COLORS.background,
  },
  grid: {
    flex: 1,
    flexDirection: 'column',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
  },
});
