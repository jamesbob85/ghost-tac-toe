import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
} from 'react-native-reanimated';
import { Player } from '../../types/game';
import { COLORS } from '../../constants/theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const FRAME_BORDER = 3;
const FRAME_GAP = 3;
const INNER_BORDER = 1;
const TOTAL_INSET = FRAME_BORDER + FRAME_GAP + INNER_BORDER;

interface WinLineProps {
  winLine: number[] | null;
  winner: Player | null;
  boardSize: number;
}

function cellToGrid(index: number): [number, number] {
  return [index % 3, Math.floor(index / 3)];
}

function cellCenter(col: number, row: number, boardSize: number): [number, number] {
  const inner = boardSize - TOTAL_INSET * 2;
  const cellSize = inner / 3;
  const x = TOTAL_INSET + col * cellSize + cellSize / 2;
  const y = TOTAL_INSET + row * cellSize + cellSize / 2;
  return [x, y];
}

/** Build a hand-wobbled path from start to end. */
function wobblyPath(x1: number, y1: number, x2: number, y2: number): { d: string; length: number } {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const segments = 8;

  // Perpendicular unit vector for wobble offsets
  const px = -dy / length;
  const py = dx / length;

  const points: [number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    // Deterministic wobble: small sinusoidal + slight random-feel offset
    const wob =
      i === 0 || i === segments
        ? 0
        : (Math.sin(t * Math.PI * 1.4 + 0.7) + Math.cos(t * Math.PI * 2.2)) * 1.6;
    const x = x1 + dx * t + px * wob;
    const y = y1 + dy * t + py * wob;
    points.push([x, y]);
  }

  // Build a smooth quadratic curve through the points
  let d = `M ${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)}`;
  for (let i = 1; i < points.length; i++) {
    const [x, y] = points[i];
    const [px2, py2] = points[i - 1];
    const cx = (px2 + x) / 2;
    const cy = (py2 + y) / 2;
    d += ` Q ${px2.toFixed(2)} ${py2.toFixed(2)} ${cx.toFixed(2)} ${cy.toFixed(2)}`;
  }
  d += ` T ${points[points.length - 1][0].toFixed(2)} ${points[points.length - 1][1].toFixed(2)}`;

  return { d, length: length * 1.18 }; // slightly longer than straight to account for wobble
}

export function WinLine({ winLine, winner, boardSize }: WinLineProps) {
  const progress = useSharedValue(0);

  const path = useMemo(() => {
    if (!winLine) return null;
    const [c1, r1] = cellToGrid(winLine[0]);
    const [c2, r2] = cellToGrid(winLine[2]);
    const [x1, y1] = cellCenter(c1, r1, boardSize);
    const [x2, y2] = cellCenter(c2, r2, boardSize);
    return wobblyPath(x1, y1, x2, y2);
  }, [winLine, boardSize]);

  useEffect(() => {
    if (winLine) {
      progress.value = 0;
      progress.value = withTiming(1, { duration: 520 });
    } else {
      progress.value = 0;
    }
  }, [winLine]);

  const animatedProps = useAnimatedProps(() => {
    if (!path) return { strokeDashoffset: 0, strokeDasharray: '0' } as any;
    return {
      strokeDashoffset: path.length * (1 - progress.value),
      strokeDasharray: `${path.length}`,
    } as any;
  });

  if (!winLine || !winner || !path) return null;

  const stroke = winner === 'X' ? COLORS.playerX : COLORS.playerO;

  return (
    <View
      style={[styles.overlay, { width: boardSize, height: boardSize }]}
      pointerEvents="none"
    >
      <Svg width={boardSize} height={boardSize}>
        {/* Soft ink bleed underlay */}
        <AnimatedPath
          d={path.d}
          stroke={stroke}
          strokeWidth={9}
          strokeLinecap="round"
          fill="none"
          opacity={0.18}
          animatedProps={animatedProps}
        />
        {/* Main hand-drawn stroke */}
        <AnimatedPath
          d={path.d}
          stroke={stroke}
          strokeWidth={4}
          strokeLinecap="round"
          fill="none"
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
