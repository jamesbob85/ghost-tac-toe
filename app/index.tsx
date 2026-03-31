import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { COLORS, FONT_SIZES, RADIUS, SPACING, SPRING, TIMING, PALETTE, glowShadow } from '../src/constants/theme';
import { Button } from '../src/components/ui/Button';
import { Difficulty, GameMode } from '../src/types/game';
import { useLayout } from '../src/hooks/useLayout';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function HomeScreen() {
  const router = useRouter();
  const layout = useLayout();
  const { t } = useTranslation();
  const [mode, setMode] = useState<GameMode>('ai');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [ghostMode, setGhostMode] = useState(true);
  const [chaosMode, setChaosMode] = useState(false);

  const contentWidth = layout.contentMaxWidth;

  // Floating ghost animation
  const ghostY = useSharedValue(0);
  useEffect(() => {
    ghostY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 1500 }),
        withTiming(0, { duration: 1500 }),
      ),
      -1,
      true,
    );
  }, []);

  const ghostAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: ghostY.value }],
  }));

  const handlePlay = () => {
    router.push({
      pathname: '/game',
      params: { mode, difficulty, ghostMode: ghostMode ? '1' : '0', chaosMode: chaosMode ? '1' : '0' },
    });
  };

  const difficultyLabel = (d: Difficulty) => t(`home.${d}`);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.container, { maxWidth: contentWidth, alignSelf: 'center', width: '100%' }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Animated.Text style={[styles.ghost, ghostAnimStyle]}>👻</Animated.Text>
          <Text style={styles.title}>{t('app.name')}</Text>
          <Text style={styles.subtitle}>{t('home.tagline')}</Text>
        </View>

        {/* Mode Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('home.gameMode')}</Text>
          <View style={styles.segmented}>
            <SegmentButton
              label={`🤖 ${t('home.vsAI')}`}
              isActive={mode === 'ai'}
              onPress={() => setMode('ai')}
            />
            <SegmentButton
              label={`👥 ${t('home.vsFriend')}`}
              isActive={mode === 'friend'}
              onPress={() => setMode('friend')}
            />
          </View>
        </View>

        {/* Difficulty (AI only) */}
        {mode === 'ai' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('home.difficulty')}</Text>
            <View style={styles.diffRow}>
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                <DifficultyButton key={d} difficulty={d} label={difficultyLabel(d)} isActive={difficulty === d} onPress={() => setDifficulty(d)} />
              ))}
            </View>
          </View>
        )}

        {/* Twist Toggles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('home.twists')}</Text>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleTitle}>👻 {t('home.ghostMode')}</Text>
                <Text style={styles.toggleDesc}>{t('home.ghostModeDesc')}</Text>
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
                <Text style={styles.toggleTitle}>⚡ {t('home.chaosMode')}</Text>
                <Text style={styles.toggleDesc}>{t('home.chaosModeDesc')}</Text>
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
          label={t('home.playNow')}
          onPress={handlePlay}
          variant="primary"
          fullWidth
          style={styles.playBtn}
        />

        {/* Online Play */}
        <TouchableOpacity
          style={styles.onlineBtn}
          onPress={() => router.push('/online')}
          activeOpacity={0.8}
        >
          <Text style={styles.onlineBtnText}>🌐 Play Online</Text>
          <Text style={styles.onlineBtnSub}>Ranked matches & leaderboards</Text>
        </TouchableOpacity>

        {/* Footer nav */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => router.push('/scores')} style={styles.footerBtn}>
            <Text style={styles.footerText}>📊 {t('home.scores')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/settings')} style={styles.footerBtn}>
            <Text style={styles.footerText}>⚙️ {t('home.settings')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────

function SegmentButton({ label, isActive, onPress }: { label: string; isActive: boolean; onPress: () => void }) {
  const tapScale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: tapScale.value }],
  }));

  return (
    <AnimatedTouchable
      style={[styles.segment, isActive && styles.segmentActive, isActive && glowShadow(COLORS.playerX, 0.2), animStyle]}
      onPress={onPress}
      onPressIn={() => { tapScale.value = withTiming(0.95, { duration: 80 }); }}
      onPressOut={() => { tapScale.value = withSpring(1, SPRING.bounce); }}
      activeOpacity={0.85}
    >
      <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
        {label}
      </Text>
    </AnimatedTouchable>
  );
}

function DifficultyButton({ difficulty, label, isActive, onPress }: { difficulty: Difficulty; label: string; isActive: boolean; onPress: () => void }) {
  const tapScale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: tapScale.value }],
  }));

  const emoji = difficulty === 'easy' ? '🌱' : difficulty === 'medium' ? '🔥' : '💀';
  const activeColor = difficulty === 'easy' ? COLORS.success : difficulty === 'medium' ? COLORS.chaos : COLORS.danger;

  return (
    <AnimatedTouchable
      style={[
        styles.diffBtn,
        isActive && { borderColor: activeColor, backgroundColor: COLORS.surface },
        isActive && glowShadow(activeColor, 0.2),
        animStyle,
      ]}
      onPress={onPress}
      onPressIn={() => { tapScale.value = withTiming(0.93, { duration: 80 }); }}
      onPressOut={() => { tapScale.value = withSpring(1, SPRING.bounce); }}
      activeOpacity={0.85}
    >
      <Text style={styles.diffEmoji}>{emoji}</Text>
      <Text style={[styles.diffText, isActive && styles.diffTextActive]}>
        {label}
      </Text>
    </AnimatedTouchable>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────

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
    fontSize: 72,
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
    paddingVertical: SPACING.sm + 2,
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
    paddingVertical: SPACING.sm + 2,
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
    marginBottom: SPACING.md,
  },
  onlineBtn: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderTopWidth: 3,
    borderTopColor: PALETTE.mint.full,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  onlineBtnText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: PALETTE.mint.full,
  },
  onlineBtnSub: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
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
