# Where we left off

Read this first when resuming the project.

**Date paused:** 2026-05-03
**Last commit:** `da83228` — "Cycle 2-3: topology dead, Block Credits broken at cost 2"
**Live build:** https://jamesbob85.github.io/ghost-tac-toe/

---

## What's working and shipped

- **Engine:** modifier composition pipeline in `src/engine/modifiers/` with 7 categories. Each modifier is an object with optional hooks (initState, legalMoves, maxMarks, afterPlace, pickEviction, checkWin, scoreFor, nextPlayer, afterTurn). Max one modifier per category enforced.
- **Two PASS modifiers:** Ghost Eviction (default, ships), Chaos Cell (scoring category, fun=0.91).
- **Live game:** uses `[GhostEviction]` only. Home screen is "The Ghost Times" front page with one stub ghost rotating by day-of-year. No user-selectable difficulty or mode.
- **Sim harness:** `npx tsx simulation/run.ts` runs round-robin tournaments, writes markdown reports to `simulation/reports/`. Phase 0 baseline reproduces consistently (vanilla solv≈1.0, ghost_only solv≈0.24, fun≈0.89).

## What we found and what failed

See `simulation/learnings.md` for the full log. Headlines:

| Modifier | Category | Result | Notes |
|---|---|---|---|
| Ghost Eviction | marks | **PASS** | Baseline, ships in live game |
| Chaos Cell | scoring | **PASS** | fun=0.91, deterministic via threaded RNG |
| Slow Ink (queue=4) | marks | PASS but held | fun=0.93 but gradient drops to 0.76 — skill matters less. Ship as special-edition only |
| Quick Ink (queue=2) | marks | FAIL | Game fully solves; no state accumulation |
| Inverted Possession | marks | FAIL | Newest-evicts produces dominant strategy |
| Mirror | marks | TUNE | Right at threshold; compound effect hurts gradient |
| Smudge | topology | FAIL | Removing 1 cell collapses ghost variance |
| Cracked Centre | topology | FAIL | Wild centre favors random play |
| Block Credits + Double Stamp (cost 2) | resource | **BROKEN** | Surface metrics fine but Powerup Spammer goes from losing everything to dominating (29-76% win rate vs strong opponents) |

**Category-level conclusions:**
- **Marks** category produces good base modifiers (Ghost Eviction, possibly Slow Ink); aggressive variants (Quick Ink, Inverted) collapse the game.
- **Topology** category is a dead end with current candidates — the 9-cell space is structurally load-bearing.
- **Resource** category works in principle but Double Stamp at cost 2 is too cheap.

## The next concrete actions (pick one to resume)

### Option A — Cost sweep (~30 min)
Re-test `ghost_blockcredits` at Double Stamp costs 3, 4, 5. Find the cost where Powerup Spammer's win rate vs Lookahead-4 drops below 50%. That's where the powerup economy lands. Edit `DOUBLE_STAMP_COST` in `src/engine/modifiers/blockCredits.ts` and re-run `npx tsx simulation/run.ts --matches 50 --variants ghost_blockcredits --resource`.

### Option B — Improve the fun-score formula (~1 hour)
Add a "behavior diversity" axis to fun score. The current solvedness/gradient/imbalance trio missed Block Credits' problem (Spammer dominance) because they only measure outcome distribution. Add: `max(non-Minimax-strategy-win-rate) > 0.55 → penalty`. See cycle 3 in `simulation/learnings.md` for context.

### Option C — Win-condition batch (~1 evening)
Author Diagonal Bias (safe, no AI generalization) + Anti-Pattern (the AI generalization moment — needs parameterized win-check in minimax). Per the methodology in `MODIFIERS.md`. This is the natural next category since topology is dead and marks is mostly explored.

### Option D — Daily seed system (~1 evening)
The full daily edition pipeline: deterministic seed from UTC date, ghost roster, modifier picker, shareable result, streak counter. Per `DAILY.md` Phase 1. Defers powerup work entirely. This is the "make it look like a daily" UX-forward path.

### Option E — Tune Mirror + retest (~30 min)
Mirror was at 0.24 fun, close to threshold. Add a "no-corner-mirroring" constraint and retest. Either it climbs or confirms compound modifiers are fragile.

## Reading order to catch up

1. This file (you're reading it)
2. `simulation/learnings.md` — the full iteration log, last section is most recent
3. `MODIFIERS.md` — methodology for authoring/testing
4. `SIMULATION.md` — methodology for the harness itself
5. `DAILY.md` — design vision for the eventual daily-edition roguelite
6. `PLAN.md` — high-level project state and pivot rationale

## Important constraints to honor

- Don't reintroduce: Supabase, Firebase, GPGS, native plugins, Vercel, online multiplayer. The web pivot pruned them for a reason. They're recoverable from git history before commit `7c296dd` if needed.
- Don't add user-selectable difficulty or game modes (Friend mode is gone; AI is implicit via the ghost). Settings are theme/audio only.
- Stick with the "Occult Times" newspaper aesthetic. It earns the conceit.

## Open questions worth a moment of thought before resuming

1. Is the daily-edition direction still the right strategic call, or has anything changed about how you want to use the project?
2. Are we still committed to "no backend ever (except maybe Railway later)" or is Cloudflare Workers / Supabase Edge Functions back on the table for the social/sharing layer?
3. Do you want to keep using Claude Code for this, or shift to manual coding for some stages?

These don't have to be answered before resuming — but they shape which option above is the right next move.
