# Modifier Development — Methodology

How we generate, test, learn from, iterate on, and combine modifiers. Companion to `SIMULATION.md`.

---

## The three loops

Modifier development isn't a single "design then implement" phase. It's three nested loops:

### Loop 1 — Generate & curate (cheap, weekly)

Brainstorm wide. Most ideas die quickly. Goal: produce a **candidate batch** of 10–15 modifiers across categories, ready to implement and test.

1. Pull from existing list + new ideas (each design session adds 5–10 candidates).
2. Tag each by category (see below).
3. Filter out: too-much-engine-work, no-real-effect, sim-untestable.
4. Pick 10–15 to implement next.

### Loop 2 — Singular validation (medium cost, ~1 evening per batch)

For each candidate in the batch:

1. Implement as a `Modifier` object (composition hooks, see "Engine refactor" below).
2. Run the simulation with `ghost_only + this_modifier` against the standard strategy matrix.
3. Categorize the result into one of four buckets:
    - **PASS** — fun > 0.5, balanced, AI handles it. Promote to combination testing.
    - **TUNE** — close but failing one criterion. Try a parameter tweak (e.g., adjust queue size, threshold) and re-test.
    - **FAIL** — fundamentally broken. Kill it, log the learning.
    - **AI-BROKEN** — game might be fun for humans but our AI can't search this state space. Either build heuristic AI for it, or ship without sim validation.
4. Append to `simulation/learnings.md` — *why* each modifier passed or failed. This is the most valuable artifact: pattern recognition across batches.

### Loop 3 — Combination validation (expensive, overnight when needed)

Once we have ~10 PASS modifiers, ask which combinations work:

1. Test all pairs (`PASS_modifier_A + PASS_modifier_B`) — N(N−1)/2 combos.
2. Score each combination on the same fun-score axes.
3. Build a **compatibility matrix**: pairs that are safe, pairs that break, pairs that are unexpectedly synergistic.
4. (Eventually) test triples — but only the highest-promise pairs can extend to triples without explosion.

The combination matrix becomes the rulebook: when generating a daily edition, the seed picks 1 House Modifier + (rarely, on special days) a second one drawn from the compatibility matrix.

---

## Categorical structure

Every modifier is tagged with **exactly one category**. This both helps us cover the design space evenly and gives us a natural rule for combinations.

| Category | What it changes | Examples |
|---|---|---|
| **topology** | Spatial structure of the board | Smudge, Toroidal, Cracked Center |
| **marks** | Mark queue behavior | Quick Ink, Slow Ink, Inverted Possession, Mirror |
| **turns** | Whose turn / how many actions | Two Hands, Hesitation, Echo |
| **winCondition** | What counts as winning | Anti-Pattern, Diagonal Bias, Two Sides |
| **visibility** | What information players have | Fog, Inkblot |
| **scoring** | How points/penalties are awarded | Tarnished Stamp, Bonus Lines |
| **resource** | Powerup currency / energy | Block Credits |

**Combination rule (proposed):** at most one modifier per category in a single edition. Topology + marks compose freely; two topology modifiers don't.

---

## The candidate batch — first 14 to test

Spread across categories, mixing safe-bet modifiers with risky ones so we get real PASS/FAIL signal.

### Topology (3)

- **The Smudge** — one cell, picked by daily seed, is permanently blocked. Tests: does removing 1/9 of the board favor X or O? Does it kill draws or just shift them?
- **The Page Folds** — edges wrap (toroidal). Top connects to bottom, left to right. Adjacency changes; win lines may need redefinition. **Risk: AI-broken** because minimax doesn't know toroidal win-lines yet.
- **Cracked Center** — the center cell counts as a "wild" — part of any line through it, but can never be claimed. Tests: does removing the most-valuable cell create more strategic depth?

### Marks (4)

- **Quick Ink** — queue size 2 (eviction every other move). Tests: do faster cycles increase or decrease decision richness?
- **Slow Ink** — queue size 4 (one mark stays the whole game). Tests: does board crowding kill agency?
- **Inverted Possession** — eviction takes the newest mark, not the oldest. Tests: does this make placement irrelevant?
- **The Mirror** — each placement also auto-stamps the diagonally-opposite cell, if it's empty. Tests: does this make the game playable in fewer turns, or chaotic?

### Turns (2)

- **Two Hands** — each player places 2 marks per turn. **Risk: AI-broken** (search depth doubles).
- **The Hesitation** — X forfeits the first move (board starts with O having played centre). Tests: does this fix any first-mover imbalance we measure?

### Win conditions (2)

- **Anti-Pattern (Misère)** — 3-in-a-row LOSES. **Risk: AI-broken** (must invert minimax). Worth testing because it's a totally different game.
- **Diagonal Bias** — diagonal wins instantly end the game (and double the win value if scoring matters). Tests: does biasing one win family change opening play meaningfully?

### Visibility (2 — likely sim-untestable)

- **The Fog** — opponent's marks are invisible until they evict. Tests in human play only.
- **Inkblot** — middle row hidden; can place there but doesn't see opponent's marks there. Tests in human play only.

### Resource (1)

- **Block Credits** — placing on a cell that would have completed opponent's 3-in-a-row earns 1 credit. Credits enable powerups (separate test in Phase 2 of `SIMULATION.md`). Belongs here categorically because it's "always on" once enabled.

This batch covers all categories with at least 1 candidate (visibility doubles up since one will be deferred). 14 testable, ~3-5 likely to PASS based on gut.

---

## Pass/fail criteria (sharper than the generic fun score)

A modifier doesn't have to maximize fun score. It has to **maintain** it relative to baseline `ghost_only` (currently 0.89), with these specific guardrails:

| Criterion | Threshold | Why |
|---|---|---|
| Fun score | ≥ 0.50 | Below = ship-blocking |
| Solvedness | ≤ 0.40 | Higher = the modifier collapses the game tree |
| Skill gradient | ≥ 0.80 | Lower = strength stops mattering (random-feeling) |
| First-mover imbalance | ≤ 0.20 | Higher = unfair to one side |
| Avg turns | 8–35 | Outside this range = too short or too grindy |
| AI compatibility | All strategies must complete matches without errors | Else = AI-BROKEN |

A modifier that fails ONE of these is **TUNE** territory — try a parameter tweak. Failing TWO is **FAIL** territory — log learning, kill.

---

## Engine refactor (the prerequisite)

Today the engine has hardcoded ghost mode and chaos mode. To support 14+ modifiers we need a clean composition pattern. Proposed `Modifier` shape:

```ts
interface Modifier {
  id: string;
  name: string;
  category: 'topology' | 'marks' | 'turns' | 'winCondition' | 'visibility' | 'scoring' | 'resource';

  // Hooks (all optional). Engine calls them at well-defined lifecycle points.
  initBoard?:        (board: Board) => Board;                          // once at game start
  legalMoves?:       (state: GameState) => number[];                   // override default = empty cells
  applyPlacement?:   (state: GameState, cell: number) => GameState;    // alternative to default place
  customEviction?:   (marks: MarkEntry[]) => MarkEntry[];              // alternative to FIFO
  checkWin?:         (board: Board, player: Player) => number[]|null;  // alternative win check
  nextPlayer?:       (state: GameState) => Player;                     // override turn flip
  scoreAdjustment?:  (state: GameState, win: number[]) => number;      // bonus/penalty multiplier
}
```

Engine wraps `applyMove` in a pipeline: each hook either runs the modifier's version or the default. Multiple modifiers compose by running in category order with conflict resolution (max 1 per category — guaranteed safe).

This is **the** big piece of work. Phase 1 spends most of its hours here, then implementing modifiers becomes mechanical (each ~30 minutes of code + testing).

---

## What this DOESN'T solve (yet)

- **Visibility modifiers** can't be sim-tested because bots see the full state. They have to ship on intuition + human playtesting. Build them in Phase 2 once we know the daily loop works.
- **AI-broken modifiers** stay broken until we either generalize the AI (e.g., parameterize win-check, parameterize legal-move generation) or accept Greedy-only play for those modifiers. Either is fine — pick per modifier.
- **Combination explosion** is real. With 10 PASS modifiers, 45 pairs is ~5 hours of compute (at current speed). We'll need to either parallelize the harness (worker_threads) or accept overnight runs for combination testing.

---

## Calls I want you to make before I start coding

1. **AI strategy for modifiers that break minimax.** Two options:
    - (a) **Generalize the AI**: parameterize minimax so it accepts `customWinCheck` and `customMoves`. More upfront work, but every modifier gets full sim validation.
    - (b) **Accept Greedy-only**: AI-broken modifiers downgrade to greedy heuristic in sim, accept lower-fidelity validation. Less work, but we lose signal on those days.
    - **My lean: (a) for win-check** (cheap to parameterize), **(b) for legal-moves** (hard to parameterize, accept downgrade for now). Hybrid.

2. **Combination rule.**
    - (a) **Hard rule**: max 1 per category, period.
    - (b) **Empirical**: test pairs, build allow-list from data.
    - **My lean: (a) for daily editions** (clean, predictable), **(b) for special "double trouble" days** that we curate.

3. **Visibility modifiers.**
    - (a) **Defer entirely** until human playtesting; don't build now.
    - (b) **Build alongside, ship without sim validation** because they add daily-edition variety even if we can't measure them.
    - **My lean: (a)**. They're a Phase 2/3 thing. Don't muddy Phase 1 with stuff we can't measure.

4. **Batch size.**
    - 14 is my proposal. 8 would be lower-risk per cycle. 20 would fill more of the design space at once.
    - **My lean: start with 14**, plan to do 2–3 batches over a few weeks. After batch 1 we'll know the pace.

5. **What's the next concrete artifact?**
    - (a) Build the engine refactor (Modifier interface, composition pipeline, hook into existing engine).
    - (b) Author the candidate batch first (just data files; engine still hardcoded), so you can review/redesign the list before any code.
    - (c) Both in parallel — refactor the engine in one PR, draft the candidates in another.
    - **My lean: (a) first**. The list will change once you see it interact with the engine. Don't author content for an architecture that doesn't exist yet.

---

## Working artifacts

`simulation/learnings.md` (to be created) — append a row per modifier per cycle:

```
| Cycle | Modifier | Category | Result | Fun | Solv | Grad | Imb | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Quick Ink | marks | PASS | 0.81 | 0.18 | 0.95 | 0.06 | Faster than baseline, healthy |
| 1 | Anti-Pattern | winCondition | AI-BROKEN | n/a | — | — | — | Minimax inverted; need flag |
| 1 | The Mirror | marks | FAIL | -0.40 | 0.91 | 0.50 | 0.42 | Forces center bias; X always wins |
```

This file is the institutional memory. After 3 cycles, patterns become visible: "any modifier that doubles placements per turn correlates with first-mover imbalance > 0.30."

---

## Bottom line

The plan: refactor the engine to accept Modifier objects → implement 14 candidates → test → triage → log learnings → next batch. Once 8–10 modifiers PASS, run combination validation overnight. Combination matrix becomes the daily-edition rulebook.

Iteration cycle is roughly: design (1 hour) → implement (3 hours) → simulate (30 min) → triage + learnings (1 hour). Call it a week per batch with normal life happening.
