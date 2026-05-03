# Modifier Learnings

Append-only log of what each tested modifier taught us. Patterns across rows are the gold — they inform what to author next.

## Cycle 1 — Marks category (2026-05-03)

`--matches 30 --variants ghost_only,quick_ink,slow_ink,inverted,mirror`

| Modifier | Category | Result | Fun | Solv | Grad | Imb | Avg turns | Notes |
|---|---|---|---:|---:|---:|---:|---:|---|
| Ghost Only (baseline) | marks | PASS | 0.68 | 0.24 | 0.99 | — | — | Baseline holds with smaller sample (was 0.89 at N=100) |
| **Quick Ink** (queue=2) | marks | **FAIL** | -2.00 | 1.00 | 0.00 | — | — | Game collapses to a single solved outcome. Skill doesn't matter (gradient=0). Hypothesis: queue=2 means each turn evicts immediately, so threats can't build — board never accumulates enough state for strategy to matter |
| **Slow Ink** (queue=4) | marks | PASS* | 0.93 | 0.01 | 0.76 | — | — | Highest fun score yet — but gradient dropped to 0.76 (vs ghost's 0.99). Skill matters less. Hypothesis: more crowded board lets weaker AI stumble into wins; needs human playtest to confirm |
| **Inverted Possession** | marks | **FAIL** | -0.88 | 1.00 | 0.75 | — | — | Solvedness 1.00 — fully solved. Newest-evicts means latest placements are throwaway, dominant strategy emerges (probably "always play to set up next turn's eviction") |
| **Mirror** | marks | TUNE | 0.24 | 0.37 | 0.65 | — | — | Right at threshold (solv 0.37 vs 0.40 max). Gradient drop to 0.65 suggests the mirror placement creates random-feeling outcomes. Tune candidate: maybe restrict mirror to non-corner placements only |

### Patterns

1. **Reducing queue size kills the game.** Quick Ink (queue=2) → fully solved with no skill differentiation. Probably true for any queue<3 modifier — eviction-per-turn means no state accumulation.

2. **Increasing queue size keeps fun but blunts skill.** Slow Ink (queue=4) had the highest fun score we've measured but the lowest gradient (0.76 vs 0.99 baseline). Crowded boards = more random outcomes. Worth shipping but not an "always-on" daily.

3. **Inverting eviction direction is broken.** Inverted Possession (newest evicts first) collapsed to a solved game. Lesson: eviction direction is not a parameter to tune — FIFO is structurally important.

4. **Compound-effect modifiers (Mirror) are fragile.** Mirror's afterPlace adds a second mark, which interacts with eviction in ways that hurt the gradient. Future compound modifiers (Two Hands, Echo) likely have the same risk — author with care.

### Decisions for next batch

- Drop Inverted Possession entirely (kill the line, not worth tuning).
- Keep Quick Ink in the registry but mark it "do not ship" — useful as a stress test only.
- Slow Ink ships, but only as a "Bonus Edition" or special day, not a default — it dilutes skill.
- Try a tuned Mirror: only mirror to non-corner cells, or only mirror once per match.
- Next batch should be **topology** (Smudge, Toroidal, Cracked Center) — unrelated mechanics, fresh signal.

### Open questions raised

- Why does Quick Ink solve so cleanly? Worth a closer look at the move trees — is X always winning, always drawing, or always losing?
- Is Mirror's gradient hit because of the mirror itself, or because of the eviction-loop interaction we built? Could test by adding a "no-eviction" Mirror variant.
- Slow Ink's high fun + low gradient combo is interesting. Does this mean "fun for casual humans, frustrating for skilled players"? Worth a human playtest before shipping.

## Cycle 2 — Topology category (2026-05-03)

`--matches 50 --variants ghost_only,ghost_smudge,ghost_cracked`

| Modifier | Category | Result | Fun | Solv | Grad | Avg turns | Notes |
|---|---|---|---:|---:|---:|---:|---|
| Ghost Only (baseline) | marks | PASS | 0.70 | 0.26 | 0.99 | — | Stable across cycles |
| **Ghost + Smudge** | topology | **FAIL** | -0.45 | 0.95 | 0.97 | — | One blocked cell collapses the game tree to near-fully-solved (0.95). Skill ladder still clean (gradient=0.97) but outcomes are deterministic |
| **Ghost + Cracked Centre** | topology | **FAIL** | -0.53 | 1.00 | 0.98 | — | Fully solved. The wild-centre mechanic makes lines through centre too easy and the 8-cell space too tight. Strategy ladder healthy but result is preordained |

### Patterns

1. **Topology modifiers + ghost eviction = solved game.** Removing even one cell from the 9-cell space collapses the strategic variance that ghost eviction normally generates. Both Smudge (random cell) and Cracked Centre (specific cell) hit solvedness ≥ 0.95.

2. **Skill gradient stays healthy when game collapses.** Both modifiers had gradient ~0.97 — the AIs still rank correctly, the game's just deterministic at the top. This is why "skill matters" isn't sufficient on its own — gradient must be paired with low solvedness.

3. **The 9-cell space is structurally load-bearing.** Ghost eviction's variance depends on having enough alternative cells per turn. 8 cells is below threshold.

### Bug discovered + fixed

Sim strategies were calling `getEmptyCells(state.board)` which returns all `null` cells — including topology-blocked ones. Strategies would pick a blocked cell, applyMove returned the same state (rejected), the runner re-tried, infinite loop, stack overflow. Fixed: all strategies now use `getLegalMoves(state)` which respects topology filters.

### Decisions

- **Topology may be a dead category for ghost mode.** Tabling it pending a "standalone topology without ghost eviction" test to confirm whether topology is broken globally or just incompatible with ghost.
- The wild-cell mechanic in Cracked Centre is interesting independently — could revisit as a winCondition modifier (e.g., "any line through centre counts as 2 cells = win") on a 9-cell board.

### Next batch options

- **Standalone topology test** (5 min): re-run Smudge / Cracked without ghost eviction. Confirms whether topology is fundamentally broken or only broken-with-ghost.
- **Win-condition batch**: Diagonal Bias (safe, no AI generalization needed), Anti-Pattern (needs AI generalization).
- **Resource batch (Block Credits)**: the high-stakes one — answers the powerup-economy question.

## Cycle 2.5 — Standalone topology (2026-05-03)

`--matches 50 --variants vanilla_ttt,smudge_alone,cracked_alone`

| Modifier | Category | Result | Fun | Solv | Grad | Notes |
|---|---|---|---:|---:|---:|---|
| Vanilla TTT (baseline) | — | FAIL | -0.90 | 1.00 | 0.73 | Solved-game baseline |
| Smudge (no ghost) | topology | FAIL | -0.85 | 1.00 | 0.77 | Same shape as vanilla — fully solved, slightly cleaner gradient |
| Cracked Centre (no ghost) | topology | FAIL | -1.31 | 1.00 | 0.46 | **Actively worse than vanilla** — gradient drops to 0.46. Wild centre favours random play |

### Conclusion

Topology category is **broken globally**, not just incompatible with ghost. These modifiers don't help un-solve the game — and Cracked Centre actively makes things worse by introducing a "wild" mechanic that creates randomness without strategy.

**Lesson:** before testing a modifier WITH ghost eviction, sanity-check that it works (or at least doesn't make things worse) STANDALONE. Topology candidates may be a dead category for our purposes; revisit only with radically different mechanics (e.g., dynamic topology like Hot Cell that rotates each turn).

## Cycle 3 — Resource: Block Credits + Double Stamp powerup (2026-05-03)

`--matches 50 --variants ghost_only,ghost_blockcredits --resource`

### Headline numbers

| Variant | Fun | Solv | Grad | Imb |
|---|---:|---:|---:|---:|
| Ghost Only (no credits) | 0.51 | 0.26 | 0.86 | — |
| Ghost + Block Credits | 0.49 | 0.26 | 0.85 | 0.18 |

Composite metrics barely budge — but they hide the real story.

### The actual signal: Powerup Spammer's win rate explodes

Win rate of **Powerup Spammer** vs each opponent, across the two variants:

| Opponent | Ghost Only | Ghost + Credits | Δ |
|---|---:|---:|:---:|
| Random | 100% | 99% | — |
| Greedy | 20% | **76%** | **+56pp** |
| Lookahead-4 | 15% | **67%** | **+52pp** |
| Minimax (depth 9) | 0% | **29%** | **+29pp** |
| Powerup Hoarder | 18% | **66%** | **+48pp** |
| Powerup Balanced | 17% | **56%** | **+39pp** |

Spammer goes from "loses to almost everything" without credits to "wins or ties most matchups" with credits. **Test A from SIMULATION.md failed cleanly: rushing powerups IS dominant** at the current cost (2 credits).

### Diagnosis

Block Credits + Double Stamp at cost 2 is too cheap. The economy:
- Block earns 1 credit
- 2 credits = 1 free placement (Double Stamp)
- So 2 blocks → 1 free move → ~3–4 free moves per 10-turn match

That's ~30–40% more placements than your opponent — and there's no defensive counter to a Double Stamp deployment. Once Spammer accumulates credits, every turn shifts the board by 2 cells while opponent only shifts 1. Compounds.

### Why fun score didn't catch it

Solvedness, gradient, and imbalance all measure properties of the OUTCOME distribution. None of them detect "one specific behavior pattern dominates." Spammer + Minimax tied roughly 1:1 in self-play (54/46), so solvedness stayed low and gradient stayed clean. The metric system is missing a "behavior diversity" axis.

### Decisions

- **Lower the cost of Double Stamp is wrong** (it's already too cheap). Run Test C from SIMULATION.md: sweep cost from 2 → 5 credits and find the value where Spammer's win rate vs Lookahead-4 drops below 50%.
- **Or weaken Double Stamp itself**: second placement must be in a different win-line than the first, or can't be the cell that completes 3-in-a-row. Constrains where it can be deployed.
- **Add a "behavior diversity" axis to fun score**: max(strategy_win_rate) shouldn't exceed some threshold (e.g., no single non-Minimax strategy beats >60% of others on average).
- The credit-earning logic itself looks fine — it's the powerup cost that's broken.

### Next batch

**Cost sweep (Test C)**: re-run ghost_blockcredits at Double Stamp costs 3, 4, 5. Find the cost where Spammer is no longer dominant. That's where the economy "lands."

## Cycle 4 — TBD
