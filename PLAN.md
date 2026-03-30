# Ghost Tac Toe — Project Plan

## Overview

Ghost Tac Toe is a mobile tic-tac-toe game with a twist: each player can only have **3 marks on the board at once**. When you place your 4th mark, your oldest one vanishes (FIFO eviction). This eliminates draws and creates dramatic reversals.

Built with **Expo SDK 54** (managed workflow), targeting **Android** via **Google Play Store**.

---

## Game Mechanics

### Ghost Mode (Core Twist)
- Each player has a mark queue (max 3 marks)
- When placing a 4th mark, the oldest mark is evicted BEFORE the win check
- Marks visually age: full opacity → dim → ghostly (opacity levels: 1.0 → 0.65 → 0.35)
- Eviction happens with a fade animation

### Chaos Mode (Bonus)
- A random cell glows with a lightning indicator each turn
- Winning through that cell awards bonus points (+2)
- Adds risk/reward layer on top of Ghost Mode

### AI Opponents
- **Easy**: Random moves from available cells
- **Medium**: 1-step lookahead — checks for winning moves, then blocks opponent wins, accounts for ghost eviction
- **Hard**: Minimax with alpha-beta pruning, depth 6, full ghost eviction simulation

### Game Modes
- **vs AI**: Play against Easy/Medium/Hard AI
- **vs Friend**: Local 2-player pass-and-play

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Expo (managed) | SDK 54 (~54.0.33) |
| Runtime | React Native | 0.81.5 |
| UI Library | React | 19.1.0 |
| Navigation | Expo Router | ~6.0.23 (v3, file-based) |
| Animations | React Native Reanimated | ~4.1.1 (v4) |
| Haptics | expo-haptics | ~15.0.8 |
| Audio | expo-av | ~16.0.8 |
| Storage | @react-native-async-storage | ^2.2.0 |
| SVG | react-native-svg | ^15.12.1 |
| Safe Areas | react-native-safe-area-context | ~5.6.0 |
| Build/Deploy | EAS Build + EAS Submit | CLI ~15.x |

---

## Architecture

### Directory Structure

```
tictac/
├── app/                        # Expo Router screens (file-based routing)
│   ├── _layout.tsx             # Root layout (SafeAreaProvider, GestureHandler, Stack)
│   ├── index.tsx               # Home screen (mode select, difficulty, toggles)
│   ├── game.tsx                # Game screen (board, AI, win detection)
│   ├── scores.tsx              # Stats/scores screen
│   └── settings.tsx            # Settings screen (haptics, sound toggles)
├── src/
│   ├── types/
│   │   └── game.ts             # TypeScript types (Player, Board, GameState, etc.)
│   ├── constants/
│   │   ├── theme.ts            # Colors, spacing, typography
│   │   └── gameConfig.ts       # MAX_MARKS=3, WIN_LINES, AI_THINK_DELAY_MS
│   ├── engine/
│   │   ├── gameEngine.ts       # Pure reducer: createInitialState, applyMove
│   │   ├── aiEngine.ts         # AI: easy/medium/hard (minimax w/ alpha-beta)
│   │   └── winDetector.ts      # checkWin, isBoardFull
│   ├── hooks/
│   │   ├── useGameState.ts     # useReducer wrapper for game state
│   │   ├── useAI.ts            # AI move scheduling (setTimeout + cleanup)
│   │   ├── useHaptics.ts       # Haptic feedback patterns
│   │   └── useSound.ts         # Sound effects
│   ├── store/
│   │   └── statsStore.ts       # AsyncStorage persistence for win/loss stats
│   └── components/
│       ├── board/
│       │   ├── Board.tsx        # 3x3 grid with explicit row containers
│       │   ├── Cell.tsx         # Individual cell with age-based opacity + animations
│       │   └── WinLine.tsx      # Animated SVG win line overlay
│       ├── game/
│       │   ├── PlayerBadge.tsx  # Current player indicator with glow
│       │   └── GhostQueue.tsx   # Visual mark queue showing eviction order
│       └── ui/
│           ├── Button.tsx       # Reusable styled button
│           └── Modal.tsx        # Game over modal
├── assets/
│   ├── icon.png                # App icon (1024x1024)
│   ├── adaptive-icon.png       # Android adaptive icon foreground
│   ├── splash.png              # Splash screen (1284x2778)
│   ├── feature-graphic.png     # Play Store feature graphic (1024x500)
│   ├── play-store-icon.png     # Play Store icon (512x512, no alpha)
│   └── privacy-policy.html     # Privacy policy (no data collection)
├── scripts/
│   └── generate-assets.js      # Sharp-based SVG→PNG asset generator
├── app.json                    # Expo config
├── eas.json                    # EAS Build + Submit config
├── babel.config.js             # Babel with reanimated plugin
├── store-listing.md            # Google Play Store listing copy
├── .npmrc                      # legacy-peer-deps=true (required for EAS builds)
└── google-play-key.json        # Google Play API key (DO NOT COMMIT)
```

### Design Patterns

1. **Pure Reducer Engine**: Game logic is a pure function (`applyMove`) with no side effects. State transitions are deterministic and testable.

2. **Stable Refs for AI**: The game screen uses `useRef` for `makeMove`, haptics, and sound callbacks to prevent AI timer resets when state changes.

3. **Explicit Grid Layout**: Board uses 3 explicit `<View>` row containers instead of `flexWrap` (which doesn't reliably produce 3 columns in RN).

4. **Unconditional Hooks**: All hooks are called before any conditional returns to satisfy React's rules of hooks.

---

## Build & Deploy

### EAS Configuration
- **Project ID**: 005595bc-73ad-48c6-a977-cc8f874b1e98
- **Expo Account**: jamesbob85
- **Android Package**: com.ghosttactoe.app

### Build Profiles (eas.json)
- `development`: Dev client, internal distribution
- `preview`: APK for internal testing
- `production`: AAB (app-bundle) for Play Store

### Build Commands
```bash
# Production build
EXPO_TOKEN="<token>" npx eas-cli build --platform android --profile production --non-interactive

# Submit to Play Store (after first manual upload)
EXPO_TOKEN="<token>" npx eas-cli submit --platform android --profile production --latest --non-interactive
```

### Current Build Status
- **Successful build**: 40461e20-12b3-46d0-bab4-2e61dd9d70a1
- **AAB artifact**: https://expo.dev/artifacts/eas/8WkrPmZfNH4B6yBwQXFSsM.aab
- **Version**: 1.0.0, versionCode 1

---

## Google Play Store Submission

### Completed
- [x] Production AAB built
- [x] App icon generated (1024x1024 + adaptive + 512x512 Play Store)
- [x] Feature graphic generated (1024x500)
- [x] Store listing copy written (store-listing.md)
- [x] Privacy policy created (assets/privacy-policy.html)
- [x] Google Play API key configured (google-play-key.json)

### Pending (Manual Steps)
- [ ] Upload AAB manually in Google Play Console (first submission must be manual)
- [ ] Fill store listing in Play Console
- [ ] Upload feature graphic + take/upload phone screenshots
- [ ] Host privacy-policy.html (e.g., GitHub Pages) and set URL in Play Console
- [ ] Complete content rating questionnaire (all "no" — no objectionable content)
- [ ] Set pricing: Free
- [ ] Submit for review

### For Future Updates
After the first manual submission, updates can be automated:
1. Bump `version` and `versionCode` in app.json
2. Run `eas build --platform android --profile production`
3. Run `eas submit --platform android --profile production --latest`

---

## Visual Design

- **Theme**: Dark (background #0f0f23)
- **Player X**: Purple (#8b5cf6)
- **Player O**: Cyan (#06b6d4)
- **Chaos Cell**: Amber (#f59e0b)
- **Animations**: Spring placement, fade eviction, win glow, chaos pulse
- **Safe Areas**: react-native-safe-area-context on all screens (handles camera cutouts)
- **Max Content Width**: 480px (for tablets/foldables)
