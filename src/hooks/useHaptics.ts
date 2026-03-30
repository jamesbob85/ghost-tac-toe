import * as Haptics from 'expo-haptics';
import { useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HAPTICS_KEY = '@ghost_tac_toe_haptics';

export function useHaptics() {
  const enabledRef = useRef<boolean>(true);

  const loadEnabled = useCallback(async () => {
    try {
      const val = await AsyncStorage.getItem(HAPTICS_KEY);
      enabledRef.current = val !== 'false';
    } catch {
      enabledRef.current = true;
    }
  }, []);

  const placeMark = useCallback(() => {
    if (!enabledRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const evictMark = useCallback(() => {
    if (!enabledRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const win = useCallback(() => {
    if (!enabledRef.current) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const draw = useCallback(() => {
    if (!enabledRef.current) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, []);

  const tap = useCallback(() => {
    if (!enabledRef.current) return;
    Haptics.selectionAsync();
  }, []);

  return { loadEnabled, enabledRef, placeMark, evictMark, win, draw, tap };
}
