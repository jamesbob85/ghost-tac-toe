/**
 * Ghost Tac Toe — GPGS Achievement Definitions
 *
 * 25 achievements designed so the first unlocks on your very first game.
 * IDs must match what's configured in Google Play Console.
 */

export interface AchievementDefinition {
  id: string;
  name: string;           // English name (localized via i18n key `achievements.${id}`)
  description: string;    // English description (localized via `achievements.${id}_desc`)
  icon: string;           // Emoji for in-app display
  category: 'beginner' | 'solo' | 'volume' | 'streak' | 'chaos' | 'social' | 'ranked';
  /** If true, this is an incremental achievement tracked by count */
  incremental: boolean;
  /** For incremental achievements, the target count to unlock */
  target?: number;
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // ─── Beginner (first session) ────────────────────────────────────
  {
    id: 'first_steps',
    name: 'First Steps',
    description: 'Complete your first game',
    icon: '👣',
    category: 'beginner',
    incremental: false,
  },
  {
    id: 'ghostbuster',
    name: 'Ghostbuster',
    description: 'Win your first game',
    icon: '🏆',
    category: 'beginner',
    incremental: false,
  },
  {
    id: 'vanishing_act',
    name: 'Vanishing Act',
    description: 'Win a game in Ghost Mode',
    icon: '👻',
    category: 'beginner',
    incremental: false,
  },

  // ─── Solo Mastery ────────────────────────────────────────────────
  {
    id: 'brain_over_brawn',
    name: 'Brain Over Brawn',
    description: 'Beat the Hard AI',
    icon: '🧠',
    category: 'solo',
    incremental: false,
  },
  {
    id: 'ai_slayer',
    name: 'AI Slayer',
    description: 'Beat the Hard AI 10 times',
    icon: '⚔️',
    category: 'solo',
    incremental: true,
    target: 10,
  },
  {
    id: 'blitz',
    name: 'Blitz',
    description: 'Win in the minimum number of moves',
    icon: '💨',
    category: 'solo',
    incremental: false,
  },

  // ─── Volume ──────────────────────────────────────────────────────
  {
    id: 'double_digits',
    name: 'Double Digits',
    description: 'Win 10 games',
    icon: '🔟',
    category: 'volume',
    incremental: true,
    target: 10,
  },
  {
    id: 'quarter_century',
    name: 'Quarter Century',
    description: 'Win 25 games',
    icon: '🥈',
    category: 'volume',
    incremental: true,
    target: 25,
  },
  {
    id: 'half_century',
    name: 'Half Century',
    description: 'Win 50 games',
    icon: '🥇',
    category: 'volume',
    incremental: true,
    target: 50,
  },
  {
    id: 'centurion',
    name: 'Centurion',
    description: 'Win 100 games',
    icon: '💯',
    category: 'volume',
    incremental: true,
    target: 100,
  },
  {
    id: 'marathon',
    name: 'Marathon',
    description: 'Play 200 games',
    icon: '🏃',
    category: 'volume',
    incremental: true,
    target: 200,
  },

  // ─── Streaks & Skill ─────────────────────────────────────────────
  {
    id: 'hat_trick',
    name: 'Hat Trick',
    description: 'Win 3 games in a row',
    icon: '🎩',
    category: 'streak',
    incremental: false,
  },
  {
    id: 'on_fire',
    name: 'On Fire',
    description: 'Win 5 games in a row',
    icon: '🔥',
    category: 'streak',
    incremental: false,
  },
  {
    id: 'unstoppable',
    name: 'Unstoppable',
    description: 'Win 10 games in a row',
    icon: '⚡',
    category: 'streak',
    incremental: false,
  },

  // ─── Chaos Mode ──────────────────────────────────────────────────
  {
    id: 'lightning_strike',
    name: 'Lightning Strike',
    description: 'Win through the Chaos Cell',
    icon: '⚡',
    category: 'chaos',
    incremental: false,
  },
  {
    id: 'chaos_master',
    name: 'Chaos Master',
    description: 'Win through the Chaos Cell 5 times',
    icon: '🌩️',
    category: 'chaos',
    incremental: true,
    target: 5,
  },

  // ─── Social ──────────────────────────────────────────────────────
  {
    id: 'friendly_ghost',
    name: 'Friendly Ghost',
    description: 'Complete a local 2-player game',
    icon: '🤝',
    category: 'social',
    incremental: false,
  },

  // ─── Ranked / Online ─────────────────────────────────────────────
  {
    id: 'into_the_arena',
    name: 'Into the Arena',
    description: 'Play your first ranked match',
    icon: '🏟️',
    category: 'ranked',
    incremental: false,
  },
  {
    id: 'first_blood',
    name: 'First Blood',
    description: 'Win your first ranked match',
    icon: '🩸',
    category: 'ranked',
    incremental: false,
  },
  {
    id: 'ghost_hunter',
    name: 'Ghost Hunter',
    description: 'Win 25 ranked matches',
    icon: '🎯',
    category: 'ranked',
    incremental: true,
    target: 25,
  },
  {
    id: 'rising_spirit',
    name: 'Rising Spirit',
    description: 'Reach Spirit tier',
    icon: '👻',
    category: 'ranked',
    incremental: false,
  },
  {
    id: 'phantom_force',
    name: 'Phantom Force',
    description: 'Reach Phantom tier',
    icon: '🔮',
    category: 'ranked',
    incremental: false,
  },
  {
    id: 'wraith_awakened',
    name: 'Wraith Awakened',
    description: 'Reach Wraith tier',
    icon: '⚡',
    category: 'ranked',
    incremental: false,
  },
  {
    id: 'beyond_death',
    name: 'Beyond Death',
    description: 'Reach Revenant tier',
    icon: '💀',
    category: 'ranked',
    incremental: false,
  },
  {
    id: 'eternal_lich',
    name: 'Eternal Lich',
    description: 'Reach Lich tier',
    icon: '👑',
    category: 'ranked',
    incremental: false,
  },
];

/** Lookup achievement by ID */
export const ACHIEVEMENT_MAP = Object.fromEntries(
  ACHIEVEMENTS.map((a) => [a.id, a]),
) as Record<string, AchievementDefinition>;
