# The Ghost Times — Daily Edition Roguelite

A design doc for taking Ghost Tac Toe in a daily-puzzle / roguelite direction, leaning hard into the newspaper conceit. **Pre-implementation**: this document is for alignment, not a spec. The recommendations are mine; many of the calls below should be yours.

---

## Vision

Every day at midnight, **The Ghost Times** publishes a new edition. The edition introduces a named **Ghost** (the day's antagonist), a **House Modifier** that twists the rules, and a small **Powerup Inventory** the player can draft between matches. The reader's job is to banish the ghost across a short escalating run.

Three properties hold the design together:

1. **A daily ritual.** One edition per day, same for everyone on the planet (deterministic from the date). Like Wordle, Connections, NYT Mini — a shared cultural beat. Comes back tomorrow because tomorrow's edition exists.
2. **A run, not a match.** The unit of play is a 3-match arc against the ghost, not a single board. Players make build choices (powerups) between matches. Permadeath: lose any match, the daily run is over.
3. **A newspaper, not a menu.** The whole UI is the newspaper. Today's edition fills the front page. The home screen IS the masthead with the day's headline. The codex is the morgue file. The settings are the colophon. The aesthetic earns the conceit.

Why this works for *Ghost* Tac Toe specifically: the existing 3-mark eviction mechanic creates real strategic depth despite the tiny board. Modifiers and powerups stack on top of that without needing to grow the grid. A 9-cell game is fast (under 2 minutes per match), so a 3-match daily run fits in 5–10 minutes — perfect daily-puzzle pacing.

---

## Run structure

### What a daily run looks like (recommended)

```
Open the paper  →  read today's headline  →  begin séance
   ↓
MATCH I — APPRENTICE
   The ghost plays at "easy" difficulty + the day's modifier is on
   Win: continue. Lose: run ends.
   ↓
DRAFT — pick 1 powerup from 3 offered cards
   ↓
MATCH II — COMPANION
   The ghost plays at "medium" + modifier + a small twist appears
   (e.g., chaos cell turns on, or board takes a small change)
   Win: continue. Lose: run ends.
   ↓
DRAFT — pick 1 powerup from 3 offered cards
   ↓
MATCH III — MASTER
   The ghost plays at "hard" + modifier + the twist intensifies
   Win: GHOST BANISHED. Lose: run ends.
   ↓
Result splash → shareable card → back to today's edition
```

Total session: **5–10 minutes**. One shot per day (Wordle rule).

### Alternatives I considered

- **Best-of-3 single-difficulty match.** Simpler, but flat — no escalation, less roguelite feel. Reject: the build-choice loop is the whole point.
- **Single hyper-modified match.** Tight and pure but fragile — one bad opening and the day is over in 90 seconds. Worse retention.
- **Tournament bracket of 4–8 ghosts.** Too long for daily; better as a mode for endless/marathon play. Defer.

### Why 3 matches with escalation

- Three matches is the smallest number that supports a meaningful build arc (2 powerup picks).
- Escalating difficulty per match means the powerups *matter* — you're handed power, then asked to use it.
- Three is also a thematic echo of the 3-mark eviction rule — the design rhymes.

---

## The three components per edition

Each daily edition is a **(Ghost × Modifier × PowerupPool)** tuple. Three independently authored systems combine into a fresh feeling each day.

### Component 1 — The Ghost

A named antagonist with a portrait, a flavor blurb in newspaper voice, and a small **AI bias** that shapes its play style without breaking strategy.

Examples to give the flavor (these are sketches, not final):

| Name | Title | Bias |
|---|---|---|
| **The Wailing Cartographer** | "His maps end where the cliffs begin." | Weights corners higher in AI evaluation |
| **Mrs. Plumtree** | "She would rather you didn't, dear." | Defensive — blocks before attacking |
| **The Hammer of Heath** | "Strikes once, hard, never twice." | Aggressive — never blocks until forced |
| **Old Mackey, Lighthouse Keeper** | "Sees you coming for miles." | Uses one-difficulty-tier-harder algorithm |
| **The Kitten in the Wall** | "She's not stuck. She's waiting." | Plays randomly first 2 turns, then sharpens |
| **Phineas, the Census Taker** | "Counted you twice. Never makes mistakes." | Picks WHICH of its marks to evict, not always oldest |
| **The Twin of Twin** | "There were two of them. Now there is two of them." | Mirrors your previous move when legal |

**Authoring goal:** ~12 ghosts at launch (covers ~2 weeks before repeat at 1 ghost/day; or 12 weeks if we rotate). Each ghost is ~30 minutes of design + 1 line of bias code + 2 sentences of flavor. Tractable.

**Tone:** dead-earnest Victorian newspaper reportage about silly supernatural occurrences. Never edgy, never wink-wink, never cute. The humor is in the deadpan.

### Component 2 — The House Modifier

A rule twist that's active for the entire daily run. Always exactly one (keeps cognitive load low).

| Modifier | Effect |
|---|---|
| **Quick Ink** | Mark queue is 2 instead of 3 (faster eviction) |
| **Slow Ink** | Mark queue is 4 (more crowded board) |
| **The Page Folds** | Edges wrap (toroidal — top connects to bottom, left to right) |
| **The Smudge** | One random cell is permanently blocked this edition |
| **Inverted Possession** | Eviction takes the *newest* mark, not the oldest |
| **The Soul Lingers** | Evicted cells stay blocked for 1 turn after eviction |
| **The Mirror** | Each mark also stamps the diagonally opposite cell (if empty) |
| **Diagonal Bias** | Diagonal wins count as instant victory; rows/cols still 1 point |
| **Two Hands** | Each player makes 2 moves per turn |
| **Anti-Pattern** *(misère)* | First to make 3 in a row LOSES |

**Authoring goal:** ~10 at launch. Each modifier is a small change to the engine. Some interact poorly with our minimax AI (toroidal, anti-pattern, two-hands) — these would need a heuristic AI fallback for affected difficulties. Worth doing because variety is the daily's lifeblood.

### Component 3 — The Powerup Inventory

Drafted between matches in the run. Each draft offers 3 powerups (single-use unless noted), pick 1.

**Stamp powers** (alter your stamping)
- **Double Stamp** — once per match, place 2 marks in one turn
- **Pre-Inked** — start the next match with 1 free mark on a cell of your choice
- **Wax Seal** — once per match, lock a cell so opponent can't place there for 2 turns
- **Permanent Press** — your first mark of next match never evicts

**Eviction powers**
- **Selective Memory** *(passive, lasts the run)* — choose which of your marks evicts on the 4th
- **Forced Recall** — once per match, force opponent's oldest mark to evict immediately
- **Soul Catcher** — once per match, when one of your marks evicts you may relocate it instead

**Information powers**
- **Premonition** — see opponent's next move before placing
- **Spectral Audit** *(passive)* — chaos cell movement is revealed in advance for the run

**Defensive / second-chance**
- **Inkwell Insurance** — survive one losing position (board resets, your turn)
- **Last Rites** — if you lose the next match, you get a one-time retry

**Score / win**
- **Lucky Stamp** — your win in next match counts as 2 toward today's score
- **Anywhere Win** — once per match, your "3 in a row" can include any 2-cell line plus 1 free cell

**Authoring goal:** ~15 at launch. Each is a small additive piece of state in the game state plus a hook in the engine. Some are trivial (Pre-Inked = setup state). Some are spicy (Anywhere Win = win-condition mod). Build in tiers of complexity.

**Draft balance philosophy:** powerups should *enable strategies*, not break the game. A drafted powerup should usually swing 1–2 cells worth of advantage, not auto-win.

---

## Match arc (in detail)

Within a single match, the daily structure adds two new things on top of the existing game loop:

1. **Powerup HUD.** Across the top of the game screen during a match, a strip shows your active powerups for this match (1 from each draft). Each is a tappable card; using a powerup consumes it and the card flips to "spent."
2. **Modifier banner.** Above the board, a thin newspaper-style banner reminds you what the day's modifier is doing ("THE PAGE FOLDS — top edge meets bottom").

Otherwise the moment-to-moment is the same Ghost Tac Toe game we already have. **Critical**: the daily must not feel like a different game. It feels like *today's haunting* of the same game.

---

## Daily mechanics

### Seed

The edition is determined by the date in **UTC**. Same edition globally; no time-zone arbitrage. UTC is friendlier than tying to the server because the site is static — no server clock to trust. Local-midnight invites cheating ("I'll just change my system clock"); UTC removes that ambiguity.

```
seed = SHA256("ghost-times-" + YYYY-MM-DD-UTC).slice(0, 16)
```

The seed deterministically picks (ghost, modifier, powerup pool of 6 candidates) from the authored components. **Phase 1**: hand-curated daily for the first ~30 editions (we author the schedule). **Phase 2**: switch to seed-based procedural with a curated weighting.

### One shot per day

Lose the run → can't replay until tomorrow's edition publishes. This creates the tension. **Practice Mode** (separate route) lets people play any past edition without affecting their streak — important escape valve so curious players aren't blocked.

### Streak

Consecutive daily completions. Resets to 0 on a miss or a loss. Visible on the home screen masthead as "STREAK: 7 DAYS."

### Persistence (all in `localStorage`)

```ts
{
  history: { [date: string]: DailyResult },  // every edition you've engaged
  currentStreak: number,
  longestStreak: number,
  codex: { ghosts: Set<string>, modifiers: Set<string>, powerups: Set<string> },
  todaysRun: RunState | null,                // in-progress run state if mid-day
}
```

`todaysRun` lets a refresh resume the current run mid-flight (drafts and matches survive page reload).

### Shareable result

On completion (win or loss), a shareable text card. Wordle taught us this is the discovery engine.

```
👻 The Ghost Times №73 — 03 May 2026
✕ The Wailing Cartographer
■ ■ ■  Banished in 22 turns
Streak: 8 days

ghosttimes.app
```

For a loss:

```
👻 The Ghost Times №73 — 03 May 2026
✕ The Wailing Cartographer  
■ ■ □  Outwitted (Match III)
Streak ended at 7 days

ghosttimes.app
```

The squares represent matches won. Spoiler-free (no ghost moves leaked). One-tap copy to clipboard.

### Calendar / archive

A `/archive` route showing a calendar grid. Each day is a small newspaper-front thumbnail. Tap a past day → enter Practice Mode for that edition. Days you completed are sealed with a wax stamp.

---

## Architecture sketch

This is a sketch, not a final structure. Open to redesign.

### Data model

```ts
// src/types/daily.ts

export interface Ghost {
  id: string;                    // 'wailing_cartographer'
  name: string;                  // 'The Wailing Cartographer'
  epithet: string;               // 'His maps end where the cliffs begin.'
  flavor: string;                // 1-3 sentences for the opening dispatch
  bias: GhostBias;               // structured AI bias config
  portrait: string;              // emoji or asset path
}

export interface Modifier {
  id: string;
  name: string;
  blurb: string;                 // shown in banner during play
  apply: (ctx: GameContext) => GameContext;  // pure function on game state
}

export interface Powerup {
  id: string;
  name: string;
  rarity: 'common' | 'uncommon' | 'rare';
  description: string;
  scope: 'one_match' | 'whole_run' | 'instant';
  trigger: PowerupTrigger;       // when/how it activates
}

export interface DailyEdition {
  date: string;                  // YYYY-MM-DD
  editionNumber: number;         // count from launch day
  ghost: Ghost;
  modifier: Modifier;
  powerupPool: Powerup[];        // size 6, draft pulls 3 random per pick
  headline: string;              // generated newspaper headline
}

export interface RunState {
  date: string;
  matchIndex: 0 | 1 | 2;          // 0=apprentice, 1=companion, 2=master
  status: 'awaiting_match' | 'in_match' | 'drafting' | 'complete';
  outcome: ('win' | 'loss')[];   // results so far
  draftedPowerups: Powerup[];    // chosen this run
  draftOffer: Powerup[] | null;  // currently offered
  totalTurns: number;
}

export type DailyResult = {
  outcome: 'banished' | 'outwitted';
  matchesWon: number;            // 0–3
  totalTurns: number;
  endedAtMatch: 0 | 1 | 2 | null;
};
```

### File layout

```
src/
├── daily/
│   ├── ghosts.ts             # Authored Ghost[] roster
│   ├── modifiers.ts          # Authored Modifier[] roster
│   ├── powerups.ts           # Authored Powerup[] roster
│   ├── seed.ts               # seedFromDate(), deterministic edition picker
│   ├── editionFor.ts         # editionFor(date): DailyEdition
│   ├── runEngine.ts          # State machine for the 3-match run
│   ├── shareCard.ts          # Shareable text generator
│   └── codex.ts              # Lifetime-collection helpers
├── store/
│   ├── statsStore.ts         # (existing) lifetime W/L
│   └── dailyStore.ts         # NEW: history, streak, codex, todaysRun
└── engine/
    └── modifierApply.ts      # NEW: apply Modifier to GameContext

app/
├── index.tsx                 # NEW: home = today's edition front page
├── classic.tsx               # NEW: extracted "play vs AI / friend" (the current home)
├── daily.tsx                 # NEW: daily run flow (matches + drafts)
├── archive.tsx               # NEW: calendar of past editions
├── codex.tsx                 # NEW: collection of banished ghosts
├── game.tsx                  # (modified) takes powerups + modifier props
└── ...
```

The `game.tsx` change is the deepest: it needs to accept active modifiers and powerups, and the engine needs to honor them. The current engine is pure (`applyMove`) which is good — modifiers can wrap or compose with `applyMove`.

### Engine change

The existing `gameEngine.applyMove(state, settings, cellIndex)` becomes:

```ts
applyMove(state, settings, cellIndex, context: { modifier?: Modifier, powerups?: ActivePowerup[] })
```

Modifiers slot in BEFORE the standard rules (e.g., toroidal modifier rewrites adjacency before win-check runs). Powerups are checked AT specific lifecycle points (on-place, on-evict, on-turn-end). Each powerup defines its trigger and effect.

This is the riskiest piece architecturally. Worth a short prototype on one modifier + one powerup before committing to the API.

---

## Phased rollout

### Phase 1 — "MVP Daily" (~1–2 weeks of evening work)

Ship the daily structure with minimal but real content.

- Seed system + deterministic edition picker
- 7 ghosts, 5 modifiers, 0 powerups (skip drafting in MVP — match arc is just 3 escalating difficulty matches against the ghost with modifier on)
- New home screen = today's front page (with "Begin Today's Edition" as the primary action)
- Daily run state machine (win/loss tracking, persistence)
- Shareable result card with copy-to-clipboard
- Streak counter on the masthead
- "Classic" mode preserved at `/classic` (play vs AI / friend, same as current home)

**Why no powerups yet:** the engine refactor is the riskiest part. Get the daily *shape* right with content alone first; add powerup architecture in phase 2 when we know the loop works.

### Phase 2 — "Roguelite Layer" (~1 week)

- Powerup system (draft between matches)
- 12 starter powerups across rarity tiers
- Powerup HUD during matches
- Codex page for collected ghosts/modifiers/powerups
- Bump ghost roster to ~12, modifier roster to ~10

### Phase 3 — "Meta & Variety" (ongoing)

- Archive/calendar of past editions
- Practice Mode (replay any past edition, doesn't affect streak)
- Procedural daily generation kicks in after the curated month
- Endless Mode (play random combinations off-daily)
- More content (ongoing authoring)
- Spice the share card with subtle ASCII art per ghost

### What we explicitly DO NOT build (yet)

- Online multiplayer
- Accounts / cloud sync (everything is localStorage; sharing is the social layer)
- Leaderboards
- Premium tier / payments
- Push notifications

If we want any of these later, they're additive. Keep the iteration speed bias.

---

## Risks & open questions

### Risks I'm weighing

1. **Tic-tac-toe is solved.** Without ghost mode, perfect play is always a draw. Powerups risk trivializing matches. Mitigation: ghost mode is mandatory for daily; AI difficulty + modifier should keep optimal play from being trivial. We'll know after playtesting.

2. **AI × modifier compatibility.** The current minimax doesn't know about toroidal boards or anti-pattern wins. Modifiers that change the search space need either: (a) heuristic AI for those days, or (b) a more general engine. I'd start with (a) — accept that some modifiers downgrade AI to "decent heuristic" and lean into the chaos.

3. **Authoring fatigue.** Hand-curating daily editions is real ongoing work. After ~30 days the procedural fallback HAS to be good. Build the procedural engine alongside the curated days, not after.

4. **Daily-only feels lonely.** Players who play 5 times in a session need a non-daily mode. Classic mode (current AI/friend) covers this. Endless Mode (later) covers the "I beat today's, give me more" crowd.

5. **The newspaper conceit constrains UX.** Some patterns (modal sheets, big buttons, neon highlights) won't fit. We've already proven the type/color system holds up; powerup HUDs and draft cards still need to be designed within the language.

### Calls I want you to make before we touch code

1. **Run shape: 3 escalating matches with drafts (my recommendation), or something else?** I considered single-shot, best-of-N, and tournament. The 3-with-drafts feels best for a 5–10 minute daily. Push back if you want a different feel.

2. **Skip powerups for MVP, or include them from day one?** I lean toward skipping in phase 1 because the engine refactor is risky and the daily loop's value is testable without them. The counter-argument: the daily without powerups is "play 3 matches against a themed AI," which might not feel meaningfully different from the current game. You'd know better.

3. **One shot per day (Wordle), or unlimited retries?** I lean Wordle. Unlimited retries kills the tension and makes the daily a grind. But it's the punishing call.

4. **UTC reset, or local midnight?** I lean UTC for static-site honesty. Local midnight is friendlier but cheatable.

5. **Classic mode lives where?** Today the home screen IS the classic mode. With the daily, the home screen becomes the front page. Classic moves to `/classic`. Are you OK with that hierarchy shift, or should classic stay primary and daily live elsewhere?

6. **Ghost roster — 12 launch ghosts or fewer?** 12 covers 2 weeks before repeat (1 per day). Smaller (e.g., 7, one per day of the week) is less work and creates a "Tuesday is always Mrs. Plumtree" cadence which has its own charm. I'd default to 12 random-feeling but could be talked into 7.

7. **What's your time budget?** Phase 1 as scoped is ~1–2 weeks of focused evening work. If that's too much, I can carve a smaller "Phase 0.5" that ships the home-page-as-newspaper change and a single hand-authored daily ghost without the run state machine — basically a teaser for the direction.

---

## What I'd build first if you green-light this

Given the open questions, the cleanest "next step" before committing to phase 1 in full is:

**A 2–3 hour spike**: implement *one* hand-authored ghost (Mrs. Plumtree, defensive bias) + *one* modifier (Quick Ink, queue=2) + the seeded date picker, and replace the home screen with a static "today's front page" view. No drafts, no powerups, no streak — just see if the newspaper-front-page feels right and if the modified game holds up.

If it does, we commit to phase 1. If it doesn't, we've spent 3 hours and learned something.

Up to you whether the spike is worth running first or you want to commit straight to phase 1 once the open questions above are settled.
