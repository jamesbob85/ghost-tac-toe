/**
 * Ghost Tac Toe — "Occult Times" theme
 *
 * A haunted 1920s tabloid newspaper. Cream parchment, ink stamps, brass leaf.
 * Marks fade like ink on aging paper. Earnest seriousness about silly subjects.
 */

// ─── Palette ─────────────────────────────────────────────────────────
// Newspaper paper, hand-mixed inks, tarnished brass.
const INK = {
  paper:        '#f0e6d2',
  paperDeep:    '#e6d8b8',
  paperShade:   '#d9c89b',
  paperDark:    '#c8b890',

  inkBlack:     '#1a1611',
  inkFaded:     '#5a4a35',
  inkGhost:     '#9a8a6a',
  inkHairline:  '#b5a473',

  oxblood:      '#8b1e2d',
  oxbloodDeep:  '#5e1320',
  oxbloodPale:  '#c89a9f',

  inkTeal:      '#1a4754',
  inkTealDeep:  '#0d2e38',
  inkTealPale:  '#9eb6bc',

  brass:        '#b8924d',
  brassDeep:    '#8b6b30',
  brassPale:    '#d9c08a',

  chaosGold:    '#d4a847',
  chaosBurnt:   '#a3471f',
};

export const PALETTE = {
  oxblood:  { full: INK.oxblood,   pale: INK.oxbloodPale,   deep: INK.oxbloodDeep },
  inkTeal:  { full: INK.inkTeal,   pale: INK.inkTealPale,   deep: INK.inkTealDeep },
  brass:    { full: INK.brass,     pale: INK.brassPale,     deep: INK.brassDeep },
  chaos:    { full: INK.chaosGold, pale: '#e8cf85',         deep: INK.chaosBurnt },
} as const;

export const COLORS = {
  // Foundation — the page itself
  background:      INK.paper,
  surface:         INK.paperDeep,
  surfaceElevated: INK.paperDeep,
  surfaceBright:   '#f6efdc',
  surfaceSunken:   INK.paperShade,
  border:          INK.inkHairline,
  borderFocus:     INK.brassDeep,
  rule:            INK.inkBlack,

  // Player inks
  playerX:      INK.oxblood,
  playerXLight: INK.oxbloodPale,
  playerXDim:   '#e8d5d3',

  playerO:      INK.inkTeal,
  playerOLight: INK.inkTealPale,
  playerODim:   '#cfdcde',

  chaos:      INK.chaosGold,
  chaosLight: '#ecd28a',
  chaosDeep:  INK.chaosBurnt,

  // Ink hierarchy
  white:         INK.paper,
  textPrimary:   INK.inkBlack,
  textSecondary: INK.inkFaded,
  textMuted:     INK.inkGhost,
  textInverse:   INK.paper,
  textBrass:     INK.brassDeep,

  // Semantic
  success: '#2d5a3d',
  danger:  INK.oxblood,
  warning: INK.brassDeep,
  overlay: 'rgba(26, 22, 17, 0.62)',
};

// ─── Typography ──────────────────────────────────────────────────────
// Three voices: dramatic display serif, refined body serif, typewriter eyebrow.
export const FONTS = {
  display: '"Yeseva One", "Times New Roman", serif',     // mastheads, marks, scores
  body:    '"Crimson Pro", "Iowan Old Style", serif',    // descriptions, paragraphs
  mono:    '"Special Elite", "Courier New", monospace',  // eyebrows, labels, dates
} as const;

export const FONT_SIZES = {
  xs:    11,
  sm:    13,
  md:    16,
  lg:    20,
  xl:    26,
  '2xl': 36,
  '3xl': 56,
  '4xl': 80,
};

// ─── Spacing (8px grid) ──────────────────────────────────────────────
export const SPACING = {
  xs:    4,
  sm:    8,
  md:    16,
  lg:    24,
  xl:    32,
  '2xl': 48,
  '3xl': 64,
};

// ─── Border Radii (newspapers are square; very mild rounding) ────────
export const RADIUS = {
  none: 0,
  sm:   2,
  md:   3,
  lg:   4,
  xl:   6,
  full: 9999,
};

// ─── Borders (hairlines, like printed rules) ─────────────────────────
export const BORDERS = {
  hairline:  1,
  rule:      2,
  thick:     3,
  doubleGap: 3,
};

// ─── Shadows (paper depth, soft warm) ────────────────────────────────
export const PAPER_SHADOW = {
  shadowColor: '#3d2a1a',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.12,
  shadowRadius: 6,
  elevation: 2,
};

export const STAMP_SHADOW = {
  shadowColor: '#3d2a1a',
  shadowOffset: { width: 1, height: 1 },
  shadowOpacity: 0.25,
  shadowRadius: 0,
  elevation: 1,
};

export const PRESSED_SHADOW = {
  shadowColor: '#3d2a1a',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.18,
  shadowRadius: 2,
  elevation: 1,
};

export function inkShadow(color: string, opacity = 0.3) {
  return {
    shadowColor: color,
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: opacity,
    shadowRadius: 0,
    elevation: 1,
  };
}

// Backwards-compat shim: some old call sites still import these names.
export const LIFT_SHADOW = PAPER_SHADOW;
export function glowShadow(color: string, opacity = 0.3) {
  return inkShadow(color, opacity);
}
export const SHADOWS = {
  playerX: inkShadow(INK.oxblood),
  playerO: inkShadow(INK.inkTeal),
};

// ─── Animation (more measured — ink doesn't bounce) ──────────────────
export const SPRING = {
  bounce:  { damping: 14, stiffness: 200 },
  gentle:  { damping: 20, stiffness: 110 },
  snappy:  { damping: 18, stiffness: 280 },
  stamp:   { damping: 16, stiffness: 320 },
} as const;

export const TIMING = {
  fadeIn:   { duration: 220 },
  fadeOut:  { duration: 180 },
  quick:    { duration: 120 },
  moderate: { duration: 320 },
  slow:     { duration: 600 },
} as const;

// ─── Decorative ornaments (used between sections) ────────────────────
export const ORNAMENTS = {
  fleuron:    '❦',  // ❦
  asterism:   '⁂',  // ⁂
  bullet:     '•',
  emDash:     '—',
  doubleAst:  '✱',  // ✱
  trefoil:    '❧',
  star:       '✶',
} as const;

// ─── Roman numerals for the stamp chronicle ──────────────────────────
export const ROMAN = ['I', 'II', 'III', 'IV', 'V'] as const;
