import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS, FONT_SIZES, RADIUS, SPACING } from '../src/constants/theme';

const SOUND_KEY = '@ghost_tac_toe_sound';
const HAPTICS_KEY = '@ghost_tac_toe_haptics';

function SettingRow({
  emoji,
  title,
  description,
  value,
  onToggle,
  trackColor,
  thumbColor,
}: {
  emoji: string;
  title: string;
  description: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  trackColor?: { false: string; true: string };
  thumbColor?: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowEmoji}>{emoji}</Text>
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDesc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={trackColor ?? { false: COLORS.border, true: COLORS.playerXDim }}
        thumbColor={value ? (thumbColor ?? COLORS.playerX) : COLORS.textMuted}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  useEffect(() => {
    AsyncStorage.multiGet([SOUND_KEY, HAPTICS_KEY]).then((pairs) => {
      const soundVal = pairs.find(([k]) => k === SOUND_KEY)?.[1];
      const hapticsVal = pairs.find(([k]) => k === HAPTICS_KEY)?.[1];
      setSoundEnabled(soundVal !== 'false');
      setHapticsEnabled(hapticsVal !== 'false');
    });
  }, []);

  const handleSoundToggle = async (val: boolean) => {
    setSoundEnabled(val);
    await AsyncStorage.setItem(SOUND_KEY, val ? 'true' : 'false');
  };

  const handleHapticsToggle = async (val: boolean) => {
    setHapticsEnabled(val);
    await AsyncStorage.setItem(HAPTICS_KEY, val ? 'true' : 'false');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>⚙️ Settings</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Audio & Feel */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Audio & Feel</Text>
          <SettingRow
            emoji="🔊"
            title="Sound Effects"
            description="Placement, vanish, and win sounds"
            value={soundEnabled}
            onToggle={handleSoundToggle}
          />
          <View style={styles.divider} />
          <SettingRow
            emoji="📳"
            title="Haptic Feedback"
            description="Vibration on taps and game events"
            value={hapticsEnabled}
            onToggle={handleHapticsToggle}
          />
        </View>

        {/* About */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>About</Text>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Version</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>App</Text>
            <Text style={styles.aboutValue}>Ghost Tac Toe</Text>
          </View>
          <View style={styles.divider} />
          <Text style={styles.aboutDesc}>
            Classic Tic Tac Toe with a ghost twist — each player can only
            have 3 marks on the board at once. Your oldest mark vanishes
            when you place a 4th. Plan ahead or get haunted! 👻
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  container: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  backBtn: {
    padding: SPACING.xs,
    width: 60,
  },
  backText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  rowEmoji: {
    fontSize: FONT_SIZES.xl,
  },
  rowInfo: {
    flex: 1,
  },
  rowTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  rowDesc: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aboutLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  aboutValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  aboutDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});
