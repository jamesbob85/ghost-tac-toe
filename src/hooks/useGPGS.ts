/**
 * Google Play Games Services hook.
 *
 * Handles auto sign-in, manual sign-in, achievements, and leaderboards.
 * Falls back gracefully when GPGS is not available (e.g., Expo Go, emulator without Play Services).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadPending, clearPending } from '../services/achievements';

const GPGS_PLAYER_KEY = '@ghost_tac_toe_gpgs_player';

interface GPGSPlayer {
  playerId: string;
  displayName: string;
}

interface UseGPGSResult {
  isSignedIn: boolean;
  isLoading: boolean;
  player: GPGSPlayer | null;
  signIn: () => Promise<void>;
  unlockAchievement: (achievementId: string) => void;
  incrementAchievement: (achievementId: string, steps: number) => void;
  showAchievements: () => void;
  submitScore: (leaderboardId: string, score: number) => void;
  showLeaderboard: (leaderboardId: string) => void;
}

let gpgsModule: any = null;
try {
  gpgsModule = require('react-native-google-leaderboards-and-achievements');
} catch {
  // Module not available
}

export function useGPGS(): UseGPGSResult {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [player, setPlayer] = useState<GPGSPlayer | null>(null);
  const syncedRef = useRef(false);

  // Try to restore cached player info immediately
  useEffect(() => {
    AsyncStorage.getItem(GPGS_PLAYER_KEY).then((cached) => {
      if (cached) {
        const parsed = JSON.parse(cached) as GPGSPlayer;
        setPlayer(parsed);
        setIsSignedIn(true);
      }
    }).finally(() => {
      // Then attempt silent auto sign-in
      autoSignIn();
    });
  }, []);

  const parseLoginResult = useCallback((result: string): GPGSPlayer | null => {
    try {
      const parsed = JSON.parse(result);
      if (parsed.playerId || parsed.id) {
        return {
          playerId: parsed.playerId || parsed.id,
          displayName: parsed.displayName || parsed.display_name || 'Player',
        };
      }
    } catch {}
    return null;
  }, []);

  const autoSignIn = useCallback(async () => {
    if (!gpgsModule) {
      setIsLoading(false);
      return;
    }

    try {
      // checkAuth does a silent sign-in attempt (GPGS v2 auto sign-in)
      const result = await gpgsModule.checkAuth();
      const playerData = parseLoginResult(result);
      if (playerData) {
        setPlayer(playerData);
        setIsSignedIn(true);
        await AsyncStorage.setItem(GPGS_PLAYER_KEY, JSON.stringify(playerData));
        syncPendingAchievements();
      }
    } catch {
      // Silent sign-in failed — user hasn't signed in before or opted out
    } finally {
      setIsLoading(false);
    }
  }, [parseLoginResult]);

  const signIn = useCallback(async () => {
    if (!gpgsModule) {
      // Fallback for development: generate a mock player
      const mockPlayer: GPGSPlayer = {
        playerId: `dev_${Date.now()}`,
        displayName: 'Dev Player',
      };
      setPlayer(mockPlayer);
      setIsSignedIn(true);
      await AsyncStorage.setItem(GPGS_PLAYER_KEY, JSON.stringify(mockPlayer));
      return;
    }

    try {
      setIsLoading(true);
      const result = await gpgsModule.login();
      const playerData = parseLoginResult(result);
      if (playerData) {
        setPlayer(playerData);
        setIsSignedIn(true);
        await AsyncStorage.setItem(GPGS_PLAYER_KEY, JSON.stringify(playerData));
        syncPendingAchievements();
      } else {
        throw new Error('No player data returned');
      }
    } catch (error) {
      console.warn('GPGS sign-in failed, using dev fallback:', error);
      // Fallback: create a dev player so the app is still usable
      const devPlayer: GPGSPlayer = {
        playerId: `dev_${Date.now()}`,
        displayName: 'Dev Player',
      };
      setPlayer(devPlayer);
      setIsSignedIn(true);
      await AsyncStorage.setItem(GPGS_PLAYER_KEY, JSON.stringify(devPlayer));
    } finally {
      setIsLoading(false);
    }
  }, [parseLoginResult]);

  // Sync achievements that were earned before sign-in
  const syncPendingAchievements = useCallback(async () => {
    if (syncedRef.current || !gpgsModule) return;
    syncedRef.current = true;

    const pending = await loadPending();
    for (const achievementId of pending) {
      try {
        await gpgsModule.unlockAchievement(achievementId);
      } catch {}
    }
    if (pending.length > 0) {
      await clearPending();
    }
  }, []);

  const unlockAchievement = useCallback((achievementId: string) => {
    if (!gpgsModule) return;
    gpgsModule.unlockAchievement(achievementId).catch(() => {});
  }, []);

  const incrementAchievement = useCallback((achievementId: string, steps: number) => {
    if (!gpgsModule) return;
    gpgsModule.incrementAchievement(achievementId, steps).catch(() => {});
  }, []);

  const showAchievements = useCallback(() => {
    if (!gpgsModule) return;
    gpgsModule.showAchievements().catch(() => {});
  }, []);

  const submitScore = useCallback((leaderboardId: string, score: number) => {
    if (!gpgsModule) return;
    gpgsModule.submitScore(leaderboardId, score).catch(() => {});
  }, []);

  const showLeaderboard = useCallback((leaderboardId: string) => {
    if (!gpgsModule) return;
    gpgsModule.showLeaderboard(leaderboardId).catch(() => {});
  }, []);

  return {
    isSignedIn,
    isLoading,
    player,
    signIn,
    unlockAchievement,
    incrementAchievement,
    showAchievements,
    submitScore,
    showLeaderboard,
  };
}
