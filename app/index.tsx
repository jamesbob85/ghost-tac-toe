import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS, FONT_SIZES, RADIUS, SPACING } from '../src/constants/theme';
import { Button } from '../src/components/ui/Button';
import { Difficulty, GameMode } from '../src/types/game';

/** Max content width for tablets / foldables — keeps UI comfortable */
const MAX_CONTENT_WIDTH = 480;

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [mode, setMode] = useState<GameMode>('ai');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [ghostMode, setGhostMode] = useState(true);
  const [chaosMode, setChaosMode] = useState(false);

  const contentWidth = Math.min(width, MAX_CONTENT_WIDTH);

  const handlePlay = () => {
    router.push({
      pathname: '/game',
      params: { mode, difficulty, ghostMode: ghostMode ? '1' : '0', chaosMode: chaosMode ? '1' : '0' },
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.container, { maxWidth: contentWidth, alignSelf: 'center', width: '100%' }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.ghost}>👻</Text>
          <Text style={styles.title}>Ghost Tac Toe</Text>
          <Text style={styles.subtitle}>Marks disappear. Strategies evolve.</Text>
        </View>

        {/* Mode Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game Mode</Text>
          <View style={styles.segmented}>
            <TouchableOpacity
              style={[styles.segment, mode === 'ai' && styles.segmentActive]}
              onPress={() => setMode('ai')}
              activeOpacity={0.75}
            >
              <Text style={[styles.segmentText, mode === 'ai' && styles.segmentTextActive]}>
                🤖 vs AI
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segment, mode === 'friend' && styles.segmentActive]}
              onPress={() => setMode('friend')}
              activeOpacity={0.75}
            >
              <Text style={[styles.segmentText, mode === 'friend' && styles.segmentTextActive]}>
                👥 vs Friend
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Difficulty (AI only) */}
        {mode === 'ai' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Difficulty</Text>
            <View style={styles.diffRow}>
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.diffBtn, difficulty === d && getDiffBtnActiveStyle(d)]}
                  onPress={() => setDifficulty(d)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.diffEmoji]}>
                    {d === 'easy' ? '🌱' : d === 'medium' ? '🔥' : '💀'}
                  </Text>
                  <Text style={[styles.diffText, difficulty === d && styles.diffTextActive]}>
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Twist Toggles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Twists</Text>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleTitle}>👻 Ghost Mode</Text>
                <Text style={styles.toggleDesc}>
                  Only 3 marks per player — oldest vanishes on 4th placement
                </Text>
              </View>
              <Switch
                value={ghostMode}
                onValueChange={setGhostMode}
                trackColor={{ false: COLORS.border, true: COLORS.playerXDim }}
                thumbColor={ghostMode ? COLORS.playerX : COLORS.textMuted}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleTitle}>⚡ Chaos Mode</Text>
                <Text style={styles.toggleDesc}>
                  Win through the glowing cell for bonus points
                </Text>
              </View>
              <Switch
                value={chaosMode}
                onValueChange={setChaosMode}
                trackColor={{ false: COLORS.border, true: COLORS.chaos + '60' }}
                thumbColor={chaosMode ? COLORS.chaos : COLORS.textMuted}
              />
            </View>
          </View>
        </View>

        {/* Play Button */}
        <Button
          label="Play Now"
          onPress={handlePlay}
          variant="primary"
          fullWidth
          style={styles.playBtn}
        />

        {/* Footer nav */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => router.push('/scores')} style={styles.footerBtn}>
            <Text style={styles.footerText}>📊 Scores</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/settings')} style={styles.footerBtn}>
            <Text style={styles.footerText}>⚙️ Settings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getDiffBtnActiveStyle(d: Difficulty) {
  return {
    borderColor: d === 'easy' ? COLORS.success : d === 'medium' ? COLORS.chaos : COLORS.danger,
    backgroundColor: COLORS.surface,
  };
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
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    paddingTop: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  ghost: {
    fontSize: 64,
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: FONT_SIZES['3xl'],
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: COLORS.playerX,
  },
  segmentText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  segmentTextActive: {
    color: COLORS.white,
  },
  diffRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  diffBtn: {
    flex: 1,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  diffEmoji: {
    fontSize: FONT_SIZES.xl,
  },
  diffText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  diffTextActive: {
    color: COLORS.textPrimary,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  toggleDesc: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  playBtn: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xl,
  },
  footerBtn: {
    padding: SPACING.sm,
  },
  footerText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});
