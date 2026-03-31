/**
 * Ghost Tac Toe — PlayHunter "Arcade Night" Theme
 *
 * Warm, tactile, alive. Based on the shared PlayHunter design system.
 * Game accent pair: Violet (player X) + Mint (player O)
 * Special accent: Marigold (chaos mode)
 */

// ─── Foundation Colors ───────────────────────────────────────────────
const FOUNDATION = {
  background:      '#110f1a',
  surface:         '#1c1929',
  surfaceElevated: '#282438',
  surfaceBright:   '#332e47',
  border:          '#352f48',
  borderFocus:     '#4a3f6b',
};

// ─── PlayHunter Palette ──────────────────────────────────────────────
export const PALETTE = {
  coral:    { full: '#ff6b6b', light: '#ff9b9b', dim: '#3d1c1c' },
  mint:     { full: '#4ecdc4', light: '#7eddd6', dim: '#163532' },
  marigold: { full: '#ffd93d', light: '#ffe680', dim: '#3d3510' },
  violet:   { full: '#a78bfa', light: '#c4b5fd', dim: '#2d2152' },
  sky:      { full: '#38bdf8', light: '#7dd3fc', dim: '#132f42' },
  rose:     { full: '#f472b6', light: '#f9a8d4', dim: '#3d1530' },
} as const;

// ─── Flat COLORS (for easy migration) ────────────────────────────────
export const COLORS = {
  // Foundation
  ...FOUNDATION,

  // Game accent mapping
  playerX:      PALETTE.violet.full,
  playerXLight: PALETTE.violet.light,
  playerXDim:   PALETTE.violet.dim,

  playerO:      PALETTE.mint.full,
  playerOLight: PALETTE.mint.light,
  playerODim:   PALETTE.mint.dim,

  chaos:      PALETTE.marigold.full,
  chaosLight: PALETTE.marigold.light,

  // Text
  white:         '#ffffff',
  textPrimary:   '#f4f0ff',
  textSecondary: '#9b8fb8',
  textMuted:     '#5e5278',
  textInverse:   '#110f1a',

  // Semantic
  success: '#34d399',
  danger:  '#fb7185',
  warning: '#fbbf24',
  overlay: 'rgba(8, 6, 14, 0.82)',
};

// ─── Typography ──────────────────────────────────────────────────────
export const FONT_SIZES = {
  xs:   11,
  sm:   13,
  md:   16,
  lg:   20,
  xl:   24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
};

// ─── Spacing (8px grid) ──────────────────────────────────────────────
export const SPACING = {
  xs:   4,
  sm:   8,
  md:   16,
  lg:   24,
  xl:   32,
  '2xl': 48,
};

// ─── Border Radii (chunky & tactile) ─────────────────────────────────
export const RADIUS = {
  sm:   10,
  md:   14,
  lg:   20,
  xl:   28,
  full: 9999,
};

// ─── Glow & Shadow Utilities ─────────────────────────────────────────
export function glowShadow(color: string, intensity = 0.35) {
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: intensity,
    shadowRadius: 12,
    elevation: 8,
  };
}

export const LIFT_SHADOW = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 4,
};

export const SHADOWS = {
  playerX: glowShadow(PALETTE.violet.full),
  playerO: glowShadow(PALETTE.mint.full),
};

// ─── Animation Presets (for react-native-reanimated) ─────────────────
export const SPRING = {
  bounce:  { damping: 12, stiffness: 180 },
  gentle:  { damping: 18, stiffness: 120 },
  snappy:  { damping: 15, stiffness: 250 },
} as const;

export const TIMING = {
  fadeIn:   { duration: 200 },
  fadeOut:  { duration: 150 },
  quick:    { duration: 100 },
  moderate: { duration: 300 },
} as const;
