/**
 * Rank calculator — rating changes, tier lookup, floor protection.
 */

import {
  TIERS,
  DIVISION_LABELS,
  BASE_POINTS,
  TIER_DIFF_POINTS,
  TIER_DIFF_CAP,
  STREAK_BONUS,
  STREAK_BONUS_CAP,
  AI_MATCH_POINTS,
  ABANDON_PENALTY,
  FLOOR_PROTECTION_FACTOR,
  GHOST_BOT_DIFFICULTY,
  TierDefinition,
} from '../constants/ranks';
import { TierInfo, RatingChange } from '../types/online';
import { Difficulty } from '../types/game';

/** Get the tier definition for a given rating */
export function getTierForRating(rating: number): TierDefinition {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (rating >= TIERS[i].ratingMin) return TIERS[i];
  }
  return TIERS[0];
}

/** Get full tier info (tier + division + display name + progress) */
export function getTierInfo(rating: number): TierInfo {
  const tier = getTierForRating(rating);

  if (tier.divisions === 0) {
    // Lich — no divisions
    return {
      tier,
      division: null,
      displayName: tier.name,
      progressInDivision: 0,
    };
  }

  const tierRange = tier.ratingMax - tier.ratingMin + 1;
  const divisionSize = tierRange / tier.divisions;
  const ratingWithinTier = rating - tier.ratingMin;
  const divisionIndex = Math.min(
    Math.floor(ratingWithinTier / divisionSize),
    tier.divisions - 1,
  );

  const division = tier.divisions === 3
    ? DIVISION_LABELS[divisionIndex]
    : DIVISION_LABELS[divisionIndex + 1]; // For 2-division tiers, use II and I

  const divisionStart = divisionIndex * divisionSize;
  const progressInDivision = (ratingWithinTier - divisionStart) / divisionSize;

  return {
    tier,
    division,
    displayName: `${tier.name} ${division}`,
    progressInDivision: Math.min(Math.max(progressInDivision, 0), 1),
  };
}

/** Format a tier info as a display string */
export function formatTierDisplay(info: TierInfo): string {
  return `${info.tier.icon} ${info.displayName}`;
}

/** Check if a rating is at the floor of its tier (within one division of the boundary) */
function isAtTierFloor(rating: number): boolean {
  const tier = getTierForRating(rating);
  if (tier.tier === 1) return false; // Can't floor-protect at the lowest tier
  const tierRange = tier.ratingMax - tier.ratingMin + 1;
  const divisionSize = tier.divisions > 0 ? tierRange / tier.divisions : tierRange;
  return (rating - tier.ratingMin) < divisionSize;
}

/** Get Ghost Bot difficulty based on player rating */
export function getGhostBotDifficulty(rating: number): Difficulty {
  if (rating <= GHOST_BOT_DIFFICULTY.easy.maxRating) return 'easy';
  if (rating <= GHOST_BOT_DIFFICULTY.medium.maxRating) return 'medium';
  return 'hard';
}

/** Calculate rating change after a match */
export function calculateRatingChange(params: {
  myRating: number;
  opponentRating: number;
  isWin: boolean;
  isDraw: boolean;
  isAIMatch: boolean;
  isAbandon: boolean;
  currentWinStreak: number;
  placementRemaining: number;
}): RatingChange {
  const {
    myRating,
    opponentRating,
    isWin,
    isDraw,
    isAIMatch,
    isAbandon,
    currentWinStreak,
    placementRemaining,
  } = params;

  const oldTier = getTierInfo(myRating);
  let pointsChange: number;
  let streakBonus = 0;

  if (isAbandon) {
    // Abandon penalty — always negative, no modifiers
    pointsChange = -ABANDON_PENALTY;
  } else if (isDraw) {
    // Draws give 0 points
    pointsChange = 0;
  } else if (isAIMatch) {
    // AI matches: flat points
    pointsChange = isWin ? AI_MATCH_POINTS : -AI_MATCH_POINTS;
  } else {
    // Human match: base ± tier difference
    const myTier = getTierForRating(myRating).tier;
    const oppTier = getTierForRating(opponentRating).tier;
    const tierDiff = oppTier - myTier; // positive = opponent is higher

    const tierBonus = Math.min(Math.max(tierDiff * TIER_DIFF_POINTS, -TIER_DIFF_CAP), TIER_DIFF_CAP);

    if (isWin) {
      streakBonus = Math.min(currentWinStreak * STREAK_BONUS, STREAK_BONUS_CAP);
      pointsChange = BASE_POINTS + tierBonus + streakBonus;
    } else {
      // Losing: base minus tier bonus (losing to higher tier costs less)
      pointsChange = -(BASE_POINTS - tierBonus);
    }
  }

  // Placement multiplier (2× during first 5 games)
  if (placementRemaining > 0) {
    pointsChange = Math.round(pointsChange * 2);
    streakBonus = Math.round(streakBonus * 2);
  }

  // Floor protection: losses at tier boundary cost 50%
  let floorProtectionApplied = false;
  if (pointsChange < 0 && isAtTierFloor(myRating)) {
    pointsChange = Math.round(pointsChange * FLOOR_PROTECTION_FACTOR);
    floorProtectionApplied = true;
  }

  // Clamp: rating can't go below 0
  const newRating = Math.max(0, myRating + pointsChange);
  const newTier = getTierInfo(newRating);

  return {
    pointsChange,
    newRating,
    oldRating: myRating,
    oldTier,
    newTier,
    isPromotion: newTier.tier.tier > oldTier.tier.tier,
    isDemotion: newTier.tier.tier < oldTier.tier.tier,
    streakBonus,
    floorProtectionApplied,
  };
}
