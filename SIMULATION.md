# The Solvedness Problem — A Plan to Test Fun via Simulation

The question: with our ghost-eviction mechanic, modifiers, and the proposed block-credit powerup economy, **is the game still solved?** And more importantly, **is it fun?**

This document plans the simulation harness, the strategies it needs, the metrics it produces, and a phased way to use it as a design tool.

---

## What we're actually asking

"Solved" has a precise meaning, and "fun" doesn't. We need both made measurable before we can simulate anything.

### Solved (technical)

A game is **strongly solved** if, from any position, perfect play by both sides produces a known outcome. Standard 3×3 tic-tac-toe is strongly solved: with optimal play, every game is a draw.

Our additions break the solved-ness in unknown ways:
- **Ghost eviction** — the state space grows (each cell now has more states; the move tree branches further because eviction reorders future possibilities)
- **Modifiers** — many of them invalidate the search algorithm itself (toroidal board changes adjacency; anti-pattern inverts win-condition)
- **Powerup economy** — adds a resource dimension orthogonal to spatial play; perfect play must now optimize across spatial AND resource decisions

The simulation's first job: **measure how solved the game still is** under each variant.

### Fun (operationalized)

You said it directly: *"fun means it should be possible to lose and possible to win depending on specific actions that you can take. it also needs to be the case that the game is not solved."*

I'd unpack that into five measurable properties:

1. **Outcome variance under strong play.** Two strong AIs playing each other should not always produce the same result. ≥ 30% variance feels right — some draws, some X wins, some O wins.
2. **Skill gradient.** Stronger AI should beat weaker AI more often, monotonically. If "Hard" AI doesn't beat "Easy" AI > 70% of the time, the skill ceiling is too low.
3. **First-mover balance.** |winsX − winsO| / total < 20%. A game where X always wins isn't fun for player O.
4. **Decision richness.** At each turn, the player should have multiple "viable" moves (within ~15% of best-move value). Few viable moves = "play the obvious one" = boring.
5. **Reachable swing.** Losing positions should be recoverable a meaningful fraction of the time via the right action (powerup, eviction trick). If once-behind-always-behind, comebacks don't exist.

A "fun score" is some weighted combination of these. Threshold to decide if a variant is shippable.

---

## Simulation architecture

Build a standalone harness that lives outside the production bundle. Lives in `simulation/` at project root, runnable via `npx tsx simulation/run.ts`. Imports the same engine code the game uses, so it tests what we ship.

```
simulation/
├── strategies/                   # AI policies of varying strength
│   ├── random.ts                 # Picks legal moves uniformly at random
│   ├── greedy.ts                 # 1-step: take wins; block losses; else random
│   ├── lookahead.ts              # N-ply minimax (parameterized depth)
│   ├── minimaxFull.ts            # Full search with eviction modeling
│   ├── heuristic.ts              # Hand-tuned: corners > center > edges + ghost-aware
│   ├── creditMaximizer.ts        # NEW: prioritizes earning block-credits
│   ├── powerupSpammer.ts         # NEW: uses powerups ASAP
│   ├── powerupHoarder.ts         # NEW: saves credits for late-game burst
│   └── balanced.ts               # NEW: weighs spatial value vs powerup value
├── runners/
│   ├── singleMatch.ts            # Runs one game, records full move tree
│   ├── tournament.ts             # Round-robin between all strategies
│   └── parallelRunner.ts         # Uses worker_threads for speed
├── analysis/
│   ├── solvedness.ts             # Outcome variance, decision branching
│   ├── balance.ts                # First-mover advantage
│   ├── gradient.ts               # Skill curve detection
│   ├── richness.ts               # Near-optimal move counts per turn
│   └── funScore.ts               # Weighted aggregation of all metrics
├── variants.ts                   # Defines the matrix of (modifier, powerup-set) to test
├── report.ts                     # Generates Markdown report from results
└── run.ts                        # Entry point: parse args, dispatch, write report
```

The harness imports from `src/engine/` so we never simulate a fictional version of the game.

---

## The strategies (the most important part)

Without a good range of strategies, the simulation tells us nothing. We need strategies that span weak → strong AND strategies that test specific behaviors.

### Strength tier (calibrate the gradient)

| Strategy | Behavior | Why include |
|---|---|---|
| **Random** | Pick any legal move uniformly | Floor — should always lose to skilled play |
| **Greedy** | Take wins; block losses; else random | Beginner-level competence |
| **Lookahead-2** | 2-ply minimax | Moderate skill |
| **Lookahead-4** | 4-ply minimax | Strong but not perfect |
| **MinimaxFull** | Full search, ghost-aware | Ceiling for spatial play |

If the game is fun, we should see a clean monotonic skill ladder when these face each other.

### Behavior tier (test the powerup economy)

| Strategy | Behavior | What it tells us |
|---|---|---|
| **CreditMax** | Always blocks if it earns credit, even at spatial cost | Is blocking too rewarding? |
| **PowerupSpammer** | Buys powerups the moment affordable, deploys ASAP | Is rushing powerups dominant? |
| **PowerupHoarder** | Saves credits until threshold N, then bursts | Is hoarding dominant? |
| **Balanced** | Weighs spatial value vs powerup value via tunable coefficient | Healthy strategy — should be competitive |
| **NoPowerups** | Plays optimal spatial, ignores powerup affordances | Baseline for "is the powerup layer needed?" |

If **PowerupSpammer** or **CreditMax** wins everything → the mechanic is broken (one strategy dominates → solved-shaped).
If **Balanced** wins or ties most matchups → the mechanic is healthy.
If **NoPowerups** wins → the powerup layer adds nothing.

---

## What to simulate (the variant matrix)

We don't simulate one game — we simulate variants and compare them. Each variant is a tuple:

```ts
type Variant = {
  name: string;
  ghostMode: boolean;
  modifier: ModifierId | null;
  powerupSystem: 'none' | 'block_credits' | 'free_picks';
  enabledPowerups: PowerupId[];
};
```

**Phase 1 — establish baselines (5 variants, 30 minutes runtime)**

1. `vanilla_ttt` — Standard tic-tac-toe (no ghost mode). Expect: solved → all draws.
2. `ghost_only` — Ghost mode, no modifier, no powerups. Expect: less solved than #1, draws probably impossible.
3. `ghost_plus_quick_ink` — Ghost mode + Quick Ink modifier (queue=2). Expect: faster, more aggressive.
4. `ghost_plus_two_hands` — Ghost mode + Two Hands (2 moves/turn). Expect: very different shape.
5. `ghost_plus_anti_pattern` — Ghost mode + Anti-Pattern (3-in-a-row LOSES). Expect: misère breaks current AI.

This phase tells us the baseline solved-ness of each modifier alone, before any powerup layer.

**Phase 2 — test the block-credit economy (5 variants)**

6. `ghost_credits_no_powerups` — Block-credits accumulate but powerups disabled. Sanity check.
7. `ghost_credits_one_powerup` — Just `Double Stamp` enabled. Smallest possible powerup test.
8. `ghost_credits_safe_set` — 4 powerups, all "moderate impact" tier.
9. `ghost_credits_full_set` — All 12 launch powerups enabled. The actual proposed game.
10. `ghost_credits_chaotic_set` — Includes the spicy ones (Anywhere Win, Inkwell Insurance).

This phase tells us if the credit economy works AT ALL, and which powerup combinations stay fun.

**Phase 3 — daily edition mix (10+ variants)**

Combinations of (ghost bias × modifier × powerup-set) that match planned daily editions. Ensures no daily setup is accidentally broken.

---

## Metrics — the fun score in detail

Each variant simulation produces a results bundle. Each metric is a function over those results.

### 1. Solvedness (lower is better)

Definition: With two **MinimaxFull** strategies playing 200 matches against each other (with random tie-breaking among equally-valued moves to introduce variation), what's the entropy of the outcome distribution?

```
solvedness = 1 - shannon_entropy(P(X_wins), P(O_wins), P(draw))
```

- All-draws: solvedness ≈ 1.0 → boring
- 33/33/33: solvedness ≈ 0 → maximally variable
- Target: solvedness < 0.4 (some predictability is fine)

**Tie-breaking note:** Standard minimax is deterministic, so vanilla self-play gives no signal. Add randomness to tie-breaking to expose where multiple equally-good moves exist. If there's only ever one best move → genuinely solved.

### 2. Skill gradient (higher is better)

Definition: Pearson correlation between strategy rank (Random=1 ... MinimaxFull=5) and win rate against the median opponent.

- Correlation > 0.85 → clean skill ladder (fun)
- Correlation < 0.5 → strength doesn't translate to wins (random-feeling)

### 3. First-mover balance (closer to 0 is better)

Definition: `|winrate(X) − winrate(O)| / total_matches` in self-play of MinimaxFull.

- < 0.10 → balanced
- > 0.25 → seriously unfair to one side; needs design fix

### 4. Decision richness (higher is better, to a point)

Definition: For each turn in a sample of 100 matches, count how many legal moves are within 15% of the best move's expected value. Average across all turns.

- < 1.5 → only one good move on average; play is forced (boring)
- 1.5–3.0 → meaningful choices, healthy
- > 4.0 → too many "fine" moves, decisions feel arbitrary

### 5. Recovery rate (higher is better)

Definition: Sample positions where the position is "losing" (full search says current player has < 30% expected value). What fraction can be recovered to a draw or win via optimal play (or a powerup)?

- < 5% → once-behind-always-behind (no comeback feel)
- 10–25% → comebacks exist but require effort (good)
- > 40% → blunders don't matter (also bad)

### 6. Powerup utilization (descriptive, not normative)

Per variant, what fraction of available powerups get used by Balanced strategy across 200 matches? If a powerup is used < 10% of the time → it's dead weight, design problem.

### Composite fun score

```ts
funScore =
    -2.0 * solvedness                    // unsolved is critical
   + 1.5 * skillGradient
   - 1.5 * firstMoverImbalance
   + 0.7 * normalize(decisionRichness, 1.5, 3.0)
   + 0.5 * normalize(recoveryRate, 0.10, 0.25)
```

Threshold: `funScore > 0.5` → ship-worthy. Below → iterate the design.

The weights are guesses. After running phase 1 we'll see which metrics are noisy vs informative and re-weight.

---

## The block-credit mechanic — specific test plan

You proposed: gain power by blocking the opponent. The game builds toward an end as players accumulate credits and deploy powerups.

This is a beautiful design instinct because it:
- Rewards reading opponent intent (you only earn by blocking *real* threats)
- Creates a tempo dimension (credits as a clock)
- Puts pressure on both attack AND defense

But it could fail in two ways we need to detect:

**Failure mode 1: Defense dominates.** If blocking is too lucrative, optimal play is "always block, never attack" → games stall, both players hoard credits, late-game becomes powerup spam. Tedious.

**Failure mode 2: First powerup wins.** If the first deployed powerup creates a position the opponent can't recover from, the game collapses to "race to first powerup."

How simulation tests these:

### Test A — does CreditMax beat Lookahead-4?

Setup: `ghost_credits_full_set` variant. **CreditMax** strategy plays defensively, prioritizing block-credit gain over board position. **Lookahead-4** plays standard ghost-tac-toe ignoring credits.

- If CreditMax wins > 60% → defense-only is dominant → failure mode 1. Need to nerf credit-per-block reward.
- If Lookahead-4 wins > 60% → credits aren't worth chasing → failure mode 2 (or powerups too weak).
- If 40/40/20 → healthy tension. The economy adds a real choice without dominating.

### Test B — first-powerup-wins detection

Sample 500 matches. For each match, find the turn the first powerup was deployed. Check the eventual winner.

- If "first to deploy a powerup wins" rate > 70% → game is solved-shaped, just by powerup race.
- 50–60% is fine (slight first-mover advantage on powerups makes sense).
- Below 50% means the second player's response to a powerup is strong → really good design.

### Test C — credit cost calibration

The cost of powerups (in credits) is a tuning parameter. Run the full simulation at 5 different cost levels:

| Cost per powerup | Expected behavior |
|---|---|
| 1 credit | Powerups deploy almost every turn; chaos |
| 2 credits | Common deployment; mid-game spam |
| 3 credits | Endgame deployment, builds tension (target?) |
| 4 credits | Rare deployment; powerups are clutch |
| 5 credits | Most matches end without a deployment; layer is dead |

Sweep this and watch the funScore. Pick the cost that maximizes funScore averaged across powerup sets.

### Test D — what counts as a block?

Block definition matters. Three candidates:

- **Strict**: placing on a cell that completes opponent's 3-in-a-row IF you hadn't placed there. Earns 1 credit.
- **Threat**: placing on a cell that disrupts opponent's 2-in-a-row. Earns 1 credit.
- **Eviction-aware**: under ghost mode, also earn credits when your move forces opponent's mark to a less useful position via eviction chain.

Run each definition through the simulation. Likely **Strict** is the cleanest (most legible to humans) but **Eviction-aware** might create the most interesting decisions. Let the data say.

---

## Scale and runtime

A single 3×3 ghost match with full minimax runs in 20–80ms. That informs how big a sweep we can do.

| Scope | Match count | Runtime estimate |
|---|---|---|
| Smoke test (1 variant, 5 strategies, self-play) | 25 × 100 = 2,500 matches | ~3 minutes |
| Phase 1 (5 variants, 5 strategies, round-robin) | 5 × 25 × 200 = 25,000 matches | ~25 minutes |
| Phase 2 (block-credit sweep, 5 variants, 8 strategies) | 5 × 64 × 200 = 64,000 matches | ~60 minutes |
| Cost sweep (Test C, 5 cost levels × full set) | 5 × 25,000 = 125,000 matches | ~2 hours |
| Full nightly run | All variants, all strategies | ~6 hours, run overnight |

These are sequential. If we use `worker_threads` (Node has them, free), we can parallelize across cores → ~4× speedup on a 4-core laptop.

For iteration we run phase-1 smoke tests in 3 minutes. For a deeper read after a design change, run phase 2 (~1 hour). Full nightly only when we've made big design changes and want comprehensive validation.

---

## Reporting

The simulation produces a Markdown report per run, dropped into `simulation/reports/YYYY-MM-DD-HHmm.md`. Format:

```markdown
# Simulation Report — 2026-05-04 14:32

## Summary
- 5 variants tested, 25,000 total matches, 28m runtime
- Best funScore: ghost_credits_safe_set (0.73)
- Worst funScore: vanilla_ttt (-1.20, fully solved as expected)

## Variant: ghost_credits_safe_set
| Metric | Value | Verdict |
|---|---|---|
| Solvedness | 0.18 | ✓ |
| Skill gradient | 0.91 | ✓ |
| First-mover balance | 0.08 | ✓ |
| Decision richness | 2.4 | ✓ |
| Recovery rate | 0.17 | ✓ |
| Fun score | 0.73 | SHIP |

### Strategy round-robin
[5×5 win matrix table]

### Powerup utilization
- Double Stamp: 78% used
- Wax Seal: 12% used  ← LOW, consider removing
- ...

### Notable replays
- [Tied games / unusual recoveries / interesting tactics worth reviewing]
```

The report goes into git so we can diff funScore across design iterations and see whether changes helped or hurt.

---

## What this is NOT

A few things this simulation explicitly cannot do:

- **It can't tell you if humans will think it's fun.** Bots are stand-ins; real playtest data is the gold standard. The simulation prevents shipping obviously-broken designs.
- **It can't model emotional payoff.** A game might score "fun = 0.4" but feel amazing because of the *moment* a powerup deploys. Simulation can't measure that.
- **It can't replace iteration.** It's a sanity check, not a designer.

The right loop is: design → simulate → if score > threshold → playtest with humans → iterate. Skip simulation and you risk burning a playtest on a known-broken design. Skip playtest and you risk shipping math that humans hate.

---

## Phased plan

### Phase 0 — minimal viable harness (~1 evening)

Build only what's needed to run **vanilla_ttt** and **ghost_only**, with **Random**, **Greedy**, **Lookahead-2**, and **MinimaxFull** strategies. Compute solvedness and skill gradient only. Goal: prove the harness actually catches "vanilla TTT is solved" and "ghost mode is less solved."

Acceptance criteria: report shows vanilla_ttt solvedness ≈ 1.0 and ghost_only solvedness < 0.6. If it doesn't, the harness has a bug.

### Phase 1 — variant matrix (~1 evening)

Add the modifier variants (Quick Ink, Two Hands, Anti-Pattern, etc.) and the rest of the strength-tier strategies. Compute all five metrics. Goal: rank modifiers by funScore so we know which are worth keeping for daily editions.

### Phase 2 — block-credit sweep (~2 evenings)

Implement the block-credit economy in the engine (behind a feature flag so the game still runs without it). Add the behavior-tier strategies. Run Tests A-D. Goal: validate or kill the block-credit design before building the daily UI for it.

### Phase 3 — daily edition validation (ongoing)

Each new daily edition (ghost × modifier × powerup-pool) gets a smoke-test simulation run. If funScore < 0.5, the edition is rejected and replaced. Becomes part of the "publishing" flow.

### Phase 4 — visual reports (optional)

If we end up using this a lot, build an HTML output with charts (recharts or similar) so trends across runs are visible. Probably overkill until we have ≥ 10 reports to compare.

---

## What I want you to weigh in on

1. **Block definition.** Strict / Threat / Eviction-aware? My instinct: **Strict** for v1 because it's most legible to players ("I see why I just got a credit"). Eviction-aware is more interesting strategically but invisible.

2. **Powerup cost target.** Do you want games to typically deploy 1, 2, or 3 powerups before ending? My instinct: **2 deployments** average — enough to feel meaningful, few enough to matter. That suggests cost ≈ 3 credits in our sweep.

3. **Scope of phase 0.** Build the absolute minimal harness this week (~3 hours), or skip phase 0 and go straight to phase 1 (~6 hours)? My instinct: **build phase 0** — it's cheap and the "does it catch known-solved games" sanity check is invaluable.

4. **Where simulation runs.** Local-only (you run `npx tsx simulation/run.ts` when you want results), or as a GitHub Action that runs on every PR and posts a fun-score report? My instinct: **local-only for now**, add CI later if we're iterating frequently enough that it pays off.

5. **Do we simulate the AI you ship to humans, or strictly stronger?** The "easy" AI shipped in the game is intentionally beatable. Simulation should test the strongest reasonable AI to ask "is the game solved at the ceiling?" — but we should also include the easier AIs to verify they actually feel easier.

---

## Bottom line

The simulation is the right tool to de-risk the design before we build it. The block-credit economy is a strong instinct that needs ~6 hours of harness work to validate or kill. Everything in this plan is reusable for every future design iteration — sunk cost amortized.

If you're in, the next move is **Phase 0** (~3 hours): minimal harness that catches known-solved games. After that we have a real testbed and can answer the bigger questions.
