/**
 * The Haunting Ranks — Ghost Tac Toe tier system
 *
 * Seven tiers themed as spirit evolution, using Arcade Night palette colors.
 * Each tier (except Lich) has 3 divisions: III (lowest), II, I (highest).
 */

import { PALETTE } from './theme';

export interface TierDefinition {
  tier: number;
  name: string;
  icon: string;
  color: string;
  colorLight: string;
  colorDim: string;
  ratingMin: number;
  ratingMax: number;
  divisions: number; // 3 for most, 2 for Revenant, 0 for Lich
}

export const TIERS: TierDefinition[] = [
  {
    tier: 1,
    name: 'Wisp',
    icon: '✨',
    color: '#94a3b8',
    colorLight: '#cbd5e1',
    colorDim: '#334155',
    ratingMin: 0,
    ratingMax: 499,
    divisions: 3,
  },
  {
    tier: 2,
    name: 'Shade',
    icon: '🌘',
    color: PALETTE.sky.full,
    colorLight: PALETTE.sky.light,
    colorDim: PALETTE.sky.dim,
    ratingMin: 500,
    ratingMax: 999,
    divisions: 3,
  },
  {
    tier: 3,
    name: 'Spirit',
    icon: '👻',
    color: PALETTE.violet.full,
    colorLight: PALETTE.violet.light,
    colorDim: PALETTE.violet.dim,
    ratingMin: 1000,
    ratingMax: 1499,
    divisions: 3,
  },
  {
    tier: 4,
    name: 'Phantom',
    icon: '🔮',
    color: PALETTE.mint.full,
    colorLight: PALETTE.mint.light,
    colorDim: PALETTE.mint.dim,
    ratingMin: 1500,
    ratingMax: 1999,
    divisions: 3,
  },
  {
    tier: 5,
    name: 'Wraith',
    icon: '⚡',
    color: PALETTE.marigold.full,
    colorLight: PALETTE.marigold.light,
    colorDim: PALETTE.marigold.dim,
    ratingMin: 2000,
    ratingMax: 2499,
    divisions: 3,
  },
  {
    tier: 6,
    name: 'Revenant',
    icon: '💀',
    color: PALETTE.coral.full,
    colorLight: PALETTE.coral.light,
    colorDim: PALETTE.coral.dim,
    ratingMin: 2500,
    ratingMax: 2999,
    divisions: 2,
  },
  {
    tier: 7,
    name: 'Lich',
    icon: '👑',
    color: PALETTE.rose.full,
    colorLight: PALETTE.rose.light,
    colorDim: PALETTE.rose.dim,
    ratingMin: 3000,
    ratingMax: 99999,
    divisions: 0, // Top 50 only, no divisions
  },
];

/** Division labels — III is lowest within a tier, I is highest */
export const DIVISION_LABELS = ['III', 'II', 'I'] as const;

/** Starting rating for new players (Shade II) */
export const STARTING_RATING = 750;

/** Number of placement games with 2× point multiplier */
export const PLACEMENT_GAMES = 5;

/** Base points for a win/loss */
export const BASE_POINTS = 25;

/** Points per tier difference (capped) */
export const TIER_DIFF_POINTS = 5;
export const TIER_DIFF_CAP = 15;

/** Win streak bonus per consecutive win (capped) */
export const STREAK_BONUS = 3;
export const STREAK_BONUS_CAP = 12;

/** Flat points for AI matches */
export const AI_MATCH_POINTS = 10;

/** Abandon penalty */
export const ABANDON_PENALTY = 40;

/** Floor protection: losses at tier boundary cost this fraction */
export const FLOOR_PROTECTION_FACTOR = 0.5;

/** Ghost Bot difficulty thresholds */
export const GHOST_BOT_DIFFICULTY = {
  easy: { maxRating: 999 },      // Wisp, Shade
  medium: { maxRating: 1999 },   // Spirit, Phantom
  hard: { minRating: 2000 },     // Wraith+
} as const;
