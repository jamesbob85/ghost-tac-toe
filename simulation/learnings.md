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

## Cycle 2 — TBD
