import { useCallback, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOUND_KEY = '@ghost_tac_toe_sound';

/**
 * Sound hook — loads & plays short sound effects.
 * Falls back silently if sounds fail to load (they require actual audio files).
 */
export function useSound() {
  const enabledRef = useRef<boolean>(true);
  const soundsRef = useRef<{ [key: string]: Audio.Sound | null }>({
    place: null,
    vanish: null,
    win: null,
    draw: null,
  });

  useEffect(() => {
    // Configure audio session
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: false,
      staysActiveInBackground: false,
    }).catch(() => {});

    // Load enabled state
    AsyncStorage.getItem(SOUND_KEY)
      .then((val) => {
        enabledRef.current = val !== 'false';
      })
      .catch(() => {});

    return () => {
      // Cleanup all loaded sounds
      Object.values(soundsRef.current).forEach((s) => s?.unloadAsync().catch(() => {}));
    };
  }, []);

  const play = useCallback(async (key: 'place' | 'vanish' | 'win' | 'draw') => {
    if (!enabledRef.current) return;
    try {
      const sound = soundsRef.current[key];
      if (sound) {
        await sound.setPositionAsync(0);
        await sound.playAsync();
      }
    } catch {
      // Sounds are optional — fail silently
    }
  }, []);

  return { enabledRef, play };
}
