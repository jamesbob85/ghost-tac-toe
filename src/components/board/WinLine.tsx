import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
} from 'react-native-reanimated';
import { Player } from '../../types/game';
import { COLORS } from '../../constants/theme';

const AnimatedLine = Animated.createAnimatedComponent(Line);

const GRID_PADDING = 3;
const CELL_MARGIN = 3;

interface WinLineProps {
  winLine: number[] | null;
  winner: Player | null;
  boardSize: number;
}

// Map cell index to [col, row] (0-indexed)
function cellToGrid(index: number): [number, number] {
  return [index % 3, Math.floor(index / 3)];
}

function cellCenter(col: number, row: number, boardSize: number): [number, number] {
  const cellSize = (boardSize - GRID_PADDING * 2 - CELL_MARGIN * 2 * 3) / 3;
  const cellStep = cellSize + CELL_MARGIN * 2;
  const x = GRID_PADDING + CELL_MARGIN + col * cellStep + cellSize / 2;
  const y = GRID_PADDING + CELL_MARGIN + row * cellStep + cellSize / 2;
  return [x, y];
}

export function WinLine({ winLine, winner, boardSize }: WinLineProps) {
  const progress = useSharedValue(0);

  // Compute line endpoints (safe to run even when winLine is null — values unused)
  const [c1, r1] = winLine ? cellToGrid(winLine[0]) : [0, 0];
  const [c2, r2] = winLine ? cellToGrid(winLine[2]) : [2, 2];
  const [x1, y1] = cellCenter(c1, r1, boardSize);
  const [x2, y2] = cellCenter(c2, r2, boardSize);

  // ALL hooks must be called before any conditional return
  useEffect(() => {
    if (winLine) {
      progress.value = 0;
      progress.value = withTiming(1, { duration: 400 });
    } else {
      progress.value = 0;
    }
  }, [winLine]);

  const animatedProps = useAnimatedProps(() => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    return {
      strokeDashoffset: len * (1 - progress.value),
      strokeDasharray: [len],
    } as { strokeDashoffset: number; strokeDasharray: number[] };
  });

  // Conditional render AFTER all hooks
  if (!winLine || !winner) return null;

  const stroke = winner === 'X' ? COLORS.playerX : COLORS.playerO;

  return (
    <View style={[styles.overlay, { width: boardSize, height: boardSize }]} pointerEvents="none">
      <Svg width={boardSize} height={boardSize}>
        <AnimatedLine
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={stroke}
          strokeWidth={6}
          strokeLinecap="round"
          animatedProps={animatedProps}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
