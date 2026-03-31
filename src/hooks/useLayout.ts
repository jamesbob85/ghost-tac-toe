import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPACING } from '../constants/theme';

export interface LayoutInfo {
  /** Current screen width */
  width: number;
  /** Current screen height */
  height: number;
  /** True when width > height */
  isLandscape: boolean;
  /** True when the smaller dimension is >= 600 (tablets, foldables unfolded) */
  isTablet: boolean;
  /** True when min dimension >= 600 AND max dimension >= 960 (PC, large tablet landscape) */
  isDesktop: boolean;
  /** Computed board size that fits the available space */
  boardSize: number;
  /** Max width for scrollable content screens (home, scores, settings) */
  contentMaxWidth: number;
  /** Safe area insets */
  insets: { top: number; bottom: number; left: number; right: number };
}

/**
 * Central layout hook for responsive behavior across all device types.
 * Recomputes on orientation change, window resize, fold/unfold.
 */
export function useLayout(): LayoutInfo {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return useMemo(() => {
    const isLandscape = width > height;
    const minDim = Math.min(width, height);
    const maxDim = Math.max(width, height);
    const isTablet = minDim >= 600;
    const isDesktop = minDim >= 600 && maxDim >= 960;

    // Available space after safe area and padding
    const availableWidth = width - SPACING.lg * 2 - insets.left - insets.right;
    const availableHeight = height - insets.top - insets.bottom;

    // Board sizing: fit within available space
    // In landscape, board gets ~50% width and most of the height
    // In portrait, board gets ~90% width and ~55% height
    // Chrome (badges, controls, etc.) needs ~200px in portrait, ~60px in landscape
    const chromeHeight = isLandscape ? 60 : 200;
    const boardSize = Math.min(
      isLandscape ? availableWidth * 0.5 : availableWidth * 0.9,
      (availableHeight - chromeHeight) * (isLandscape ? 0.9 : 0.7),
      600, // absolute max — comfortable on PC, not absurdly large
    );

    // Content max width for scrollable screens
    const contentMaxWidth = isDesktop ? 800 : isTablet ? 640 : 480;

    return {
      width,
      height,
      isLandscape,
      isTablet,
      isDesktop,
      boardSize: Math.max(boardSize, 200), // min 200 for very small screens
      contentMaxWidth,
      insets,
    };
  }, [width, height, insets.top, insets.bottom, insets.left, insets.right]);
}
