# Ghost Tac Toe — Project Plan

## Where we are

Ghost Tac Toe is a tic-tac-toe variant where each player can only have 3 marks on the board at once (FIFO eviction — placing a 4th mark vanishes the oldest one). The mechanic eliminates draws and produces dramatic reversals.

We previously expanded toward a Google Play release with online multiplayer (Supabase), Firebase Analytics, and Google Play Games Services achievements/leaderboards. **We've now pivoted away from that.**

## The pivot — web-first, iteration-first

The Play Store path was adding too much surface area (auth, schemas, native plugins, store assets) before we'd proven the core mechanic was fun. We're stripping that infrastructure and shipping a web build instead. When we find the fun, we'll re-add the Play Store path.

**Core principle:** every change should make "edit → save → playtest" faster.

## Current stack (after the pivot)

| Layer | Technology |
|---|---|
| Framework | Expo SDK 54 (managed) |
| Runtime | React Native 0.81.5 + react-native-web |
| UI | React 19, React Native Reanimated v4 |
| Navigation | Expo Router v6 (file-based) |
| Storage | AsyncStorage (mobile) / localStorage (web — same API via shim) |
| Build | `npx expo export -p web` → static `dist/` bundle |
| Hosting (dev) | Cloudflare Pages or GitHub Pages — push-to-deploy |
| Hosting (playtest) | itch.io HTML5 project page when we have something to share |

**No backend. No auth. No analytics. No Play Console. No EAS build queue.** Iteration loop is `npm run web` → save → reload.

## What we removed and why

| Removed | Why |
|---|---|
| Supabase (`@supabase/supabase-js`, all `src/services/*` for online) | Online play is a distribution/retention feature, not a fun-finding feature. Reintroduces as a Railway service when the mechanic is proven |
| Firebase Analytics (`@react-native-firebase/*`) | Analytics on a pre-product is noise. Use `console.log` during dev; add Plausible/Umami later if needed |
| GPGS (`react-native-google-leaderboards-and-achievements`, `withGPGS`) | Play Store-specific. Adds a native module + config plugin + service account flow |
| KeyEvent native module (`react-native-keyevent`) | Was only for Android key input. Web has `window.addEventListener('keydown')` if/when we want keyboard nav |
| Online routes (`online.tsx`, `matchmaking.tsx`, `online-game.tsx`, `leaderboard.tsx`, `profile.tsx`) | Backend-dependent |
| Achievements + ranks logic | Tied to GPGS leaderboards |
| `google-services.json`, `plugins/withFirebase.js`, `plugins/withGPGS.js` | Native config — not needed for web |

## Functionality we lost vs. how we handle it

| Lost capability | Replacement |
|---|---|
| Online multiplayer | Hotseat (pass-and-play) + AI opponents (already in the codebase) |
| Elo rating + global leaderboard | Local stats (win/loss/streak) in `statsStore` — already present |
| Cross-device profile sync | None during iteration; localStorage per-device |
| GPGS achievements | None — re-add when the mechanic is proven and we want retention hooks |
| Firebase event logging | `console.log` in dev. Add Plausible to the static site later if useful |
| Native keyboard/controller input | Skipped — add `window.addEventListener('keydown')` on web if we want it |
| Haptics | `expo-haptics` is a no-op on web — works automatically |

## What we kept

- Core game engine (`src/engine/*`) — pure reducer, AI, win detection
- All UI components (`src/components/*`)
- Stats persistence (`src/store/statsStore.ts`)
- Audio (`src/hooks/useSound.ts`) and haptics (`src/hooks/useHaptics.ts`)
- Localization (i18next)
- Layout/responsive logic (`src/hooks/useLayout.ts`)
- Theme + design system (`src/constants/theme.ts`)
- Three game modes screen-side: vs AI (easy/medium/hard), vs Friend (hotseat), with Ghost Mode and Chaos Mode toggles

## Game mechanics (unchanged)

- **Ghost Mode**: each player has a queue of 3 marks. Placing a 4th evicts the oldest BEFORE the win check. Marks visually age (full opacity → dim → ghostly).
- **Chaos Mode**: a random cell glows each turn; winning through it awards bonus points.
- **AI**: easy (random), medium (1-step lookahead with eviction), hard (minimax + alpha-beta, depth 6).

## Working directory after the cut

```
tictac/
├── app/                        # Expo Router screens
│   ├── _layout.tsx             # Root layout
│   ├── index.tsx               # Home (mode select)
│   ├── game.tsx                # Game screen
│   ├── scores.tsx              # Local stats
│   └── settings.tsx            # Audio, haptics, language
├── src/
│   ├── engine/                 # Pure game logic (unchanged)
│   ├── components/             # UI (unchanged)
│   ├── hooks/                  # useGameState, useAI, useHaptics, useSound, useLayout, useInput
│   ├── store/statsStore.ts     # Local stats (AsyncStorage)
│   ├── i18n/                   # Localization
│   ├── constants/              # theme.ts, gameConfig.ts
│   └── types/game.ts
├── assets/                     # Icons, splash, sounds
├── scripts/generate-assets.js  # Sharp-based asset gen
├── app.json                    # Expo config (stripped of native plugins)
├── package.json                # No Firebase, GPGS, Supabase, keyevent
└── PLAN.md                     # This file
```

## Next steps (in order)

1. **Get the web build clean** — `npm run web` boots without errors
2. **Set up Cloudflare Pages or GitHub Pages** — push-to-deploy on `main`
3. **Iterate on the mechanic** — Ghost Mode tuning, Chaos Mode variants, alternate win conditions, board sizes, mark counts
4. **First playtest URL** — share with 3–5 people, capture reactions
5. **itch.io page** — once a build is worth playtesting more broadly
6. **(Later) Online multiplayer on Railway** — single Node + WebSockets + SQLite/Postgres service when the mechanic is proven fun

## When we go back to mobile

The codebase is still Expo. To rebuild for Android/Play Store later we'll re-add:
- The native plugins we stripped (Firebase, GPGS) — these are recoverable from git history
- The EAS Build/Submit pipeline (eas.json is unchanged, the production profile still works)
- A new versionCode and store listing pass

Nothing in the web pivot blocks going back to mobile — we're just deferring the native integrations until we know what game we're shipping.
