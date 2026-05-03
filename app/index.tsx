import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
import {
  COLORS,
  FONTS,
  FONT_SIZES,
  SPACING,
  SPRING,
  BORDERS,
  PAPER_SHADOW,
} from '../src/constants/theme';
import { Button } from '../src/components/ui/Button';
import { Difficulty, GameMode } from '../src/types/game';
import { useLayout } from '../src/hooks/useLayout';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const ISSUE_DATE = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

export default function HomeScreen() {
  const router = useRouter();
  const layout = useLayout();
  const { t } = useTranslation();
  const [mode, setMode] = useState<GameMode>('ai');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  const contentWidth = Math.min(layout.contentMaxWidth, 560);

  const ghostY = useSharedValue(0);
  const ghostRot = useSharedValue(0);
  useEffect(() => {
    ghostY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1700 }),
        withTiming(0, { duration: 1700 }),
      ),
      -1,
      true,
    );
    ghostRot.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 2200 }),
        withTiming(3, { duration: 2200 }),
      ),
      -1,
      true,
    );
  }, []);

  const ghostStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: ghostY.value }, { rotate: `${ghostRot.value}deg` }],
  }));

  const handlePlay = () => {
    router.push({
      pathname: '/game',
      params: { mode, difficulty, modifiers: 'ghost_eviction' },
    });
  };

  const difficultyLabel = (d: Difficulty) => t(`home.${d}`);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.container, { maxWidth: contentWidth }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── MASTHEAD ─────────────────────────────────────── */}
        <View style={styles.masthead}>
          <View style={styles.dateLine}>
            <Text style={styles.dateLineText}>VOL. I  ·  №1  ·  EST. MMXXVI</Text>
            <Text style={styles.dateLineText}>{ISSUE_DATE.toUpperCase()}</Text>
          </View>

          <View style={styles.doubleRule} />
          <View style={styles.singleRule} />

          <Animated.Text style={[styles.ghostMark, ghostStyle]}>👻</Animated.Text>

          <Text style={styles.titleSmall}>The</Text>
          <Text style={styles.titleHuge}>GHOST TIMES</Text>
          <Text style={styles.titleSubtitle}>Reports from the Three-Mark Parlour</Text>

          <View style={styles.singleRule} />
          <View style={styles.doubleRule} />

          <Text style={styles.deck}>
            A divination of <Text style={styles.deckEmph}>Tic-Tac-Toe</Text> wherein each duellist may keep but three marks aboard the page; the eldest fades, vanishes, and returns to the æther.
          </Text>
        </View>

        {/* ─── OPPONENT ─────────────────────────────────────── */}
        <Section eyebrow="I.  CHOOSE THINE OPPONENT">
          <View style={styles.choices}>
            <ChoiceTile
              ornament="✕"
              title={t('home.vsAI')}
              subtitle="Match wits with the apparition"
              isActive={mode === 'ai'}
              onPress={() => setMode('ai')}
            />
            <ChoiceTile
              ornament="◯"
              title={t('home.vsFriend')}
              subtitle="Pass the page betwixt mortals"
              isActive={mode === 'friend'}
              onPress={() => setMode('friend')}
            />
          </View>
        </Section>

        {/* ─── DIFFICULTY ───────────────────────────────────── */}
        {mode === 'ai' && (
          <Section eyebrow="II.  CALIBRE OF THE SPECTRE">
            <View style={styles.difficultyRow}>
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                <DifficultyTile
                  key={d}
                  difficulty={d}
                  label={difficultyLabel(d)}
                  isActive={difficulty === d}
                  onPress={() => setDifficulty(d)}
                />
              ))}
            </View>
          </Section>
        )}

        {/* ─── PLAY ─────────────────────────────────────────── */}
        <View style={styles.playSection}>
          <Button
            label="Begin the Séance"
            onPress={handlePlay}
            variant="primary"
            fullWidth
          />
        </View>

        {/* ─── FOOTER ───────────────────────────────────────── */}
        <View style={styles.footer}>
          <View style={styles.singleRule} />
          <View style={styles.footerRow}>
            <FooterLink
              ornament="✪"
              label="Registry"
              caption="Records of past duels"
              onPress={() => router.push('/scores')}
            />
            <Text style={styles.footerDivider}>·</Text>
            <FooterLink
              ornament="⚙"
              label="Provisions"
              caption="Audio, language, &c."
              onPress={() => router.push('/settings')}
            />
          </View>
          <Text style={styles.colophon}>
            ❦  An honest publication printed in the year of our discontent  ❦
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────

function Section({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.eyebrowRow}>
        <View style={styles.eyebrowRule} />
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <View style={styles.eyebrowRule} />
      </View>
      {children}
    </View>
  );
}

function ChoiceTile({
  ornament,
  title,
  subtitle,
  isActive,
  onPress,
}: {
  ornament: string;
  title: string;
  subtitle: string;
  isActive: boolean;
  onPress: () => void;
}) {
  const tap = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: tap.value }] }));
  return (
    <AnimatedTouchable
      style={[
        styles.choiceTile,
        isActive && styles.choiceTileActive,
        isActive && PAPER_SHADOW,
        animStyle,
      ]}
      onPress={onPress}
      onPressIn={() => { tap.value = withTiming(0.97, { duration: 80 }); }}
      onPressOut={() => { tap.value = withSpring(1, SPRING.snappy); }}
      activeOpacity={1}
    >
      <Text style={[styles.choiceOrnament, isActive && styles.choiceOrnamentActive]}>
        {ornament}
      </Text>
      <Text style={[styles.choiceTitle, isActive && styles.choiceTitleActive]}>
        {title}
      </Text>
      <Text style={styles.choiceSubtitle}>{subtitle}</Text>
    </AnimatedTouchable>
  );
}

function DifficultyTile({
  difficulty,
  label,
  isActive,
  onPress,
}: {
  difficulty: Difficulty;
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  const tap = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: tap.value }] }));
  const { stars, descriptor } = DIFF_META[difficulty];

  return (
    <AnimatedTouchable
      style={[
        styles.diffTile,
        isActive && styles.diffTileActive,
        animStyle,
      ]}
      onPress={onPress}
      onPressIn={() => { tap.value = withTiming(0.96, { duration: 80 }); }}
      onPressOut={() => { tap.value = withSpring(1, SPRING.snappy); }}
      activeOpacity={1}
    >
      <Text style={[styles.diffStars, isActive && styles.diffStarsActive]}>{stars}</Text>
      <Text style={[styles.diffLabel, isActive && styles.diffLabelActive]}>{label}</Text>
      <Text style={styles.diffDescriptor}>{descriptor}</Text>
    </AnimatedTouchable>
  );
}

function FooterLink({
  ornament,
  label,
  caption,
  onPress,
}: {
  ornament: string;
  label: string;
  caption: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.footerLink} activeOpacity={0.65}>
      <Text style={styles.footerOrnament}>{ornament}</Text>
      <Text style={styles.footerLinkLabel}>{label}</Text>
      <Text style={styles.footerLinkCaption}>{caption}</Text>
    </TouchableOpacity>
  );
}

const DIFF_META: Record<Difficulty, { stars: string; descriptor: string }> = {
  easy:   { stars: '✶ ✶',     descriptor: 'A novice spirit' },
  medium: { stars: '✶ ✶ ✶',   descriptor: 'A keen apparition' },
  hard:   { stars: '✶ ✶ ✶ ✶', descriptor: 'A vengeful poltergeist' },
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scroll: {
    flex: 1,
  },
  container: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    alignSelf: 'center',
    width: '100%',
  },

  // ─── Masthead ────────────────────────────────────────────
  masthead: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  dateLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 6,
  },
  dateLineText: {
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.xs - 1,
    color: COLORS.textSecondary,
    letterSpacing: 1.6,
  },
  doubleRule: {
    width: '100%',
    height: 3,
    backgroundColor: COLORS.rule,
  },
  singleRule: {
    width: '100%',
    height: 1,
    backgroundColor: COLORS.rule,
    marginTop: 3,
    marginBottom: 3,
  },
  ghostMark: {
    fontSize: 56,
    marginTop: SPACING.md,
    marginBottom: 4,
  },
  titleSmall: {
    fontFamily: FONTS.body,
    fontStyle: 'italic',
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
    marginBottom: -8,
  },
  titleHuge: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES['3xl'] + 4,
    lineHeight: FONT_SIZES['3xl'] + 6,
    letterSpacing: -1.5,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  titleSubtitle: {
    fontFamily: FONTS.body,
    fontStyle: 'italic',
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: SPACING.sm,
  },
  deck: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    lineHeight: FONT_SIZES.md * 1.55,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  deckEmph: {
    fontWeight: '700',
    fontStyle: 'italic',
  },

  // ─── Section ─────────────────────────────────────────────
  section: {
    marginBottom: SPACING.lg,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm + 2,
  },
  eyebrowRule: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.rule,
  },
  eyebrow: {
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textPrimary,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },

  // ─── Choices (mode tiles) ────────────────────────────────
  choices: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  choiceTile: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: BORDERS.hairline,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
  },
  choiceTileActive: {
    borderWidth: BORDERS.rule,
    borderColor: COLORS.rule,
    backgroundColor: COLORS.surfaceBright,
  },
  choiceOrnament: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  choiceOrnamentActive: {
    color: COLORS.playerX,
  },
  choiceTitle: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  choiceTitleActive: {
    color: COLORS.textPrimary,
  },
  choiceSubtitle: {
    fontFamily: FONTS.body,
    fontStyle: 'italic',
    fontSize: FONT_SIZES.xs + 1,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },

  // ─── Difficulty ──────────────────────────────────────────
  difficultyRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  diffTile: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: BORDERS.hairline,
    borderColor: COLORS.border,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.xs,
    alignItems: 'center',
  },
  diffTileActive: {
    borderWidth: BORDERS.rule,
    borderColor: COLORS.rule,
    backgroundColor: COLORS.surfaceBright,
  },
  diffStars: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  diffStarsActive: {
    color: COLORS.textBrass,
  },
  diffLabel: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  diffLabelActive: {
    color: COLORS.textPrimary,
  },
  diffDescriptor: {
    fontFamily: FONTS.body,
    fontStyle: 'italic',
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 1,
  },

  // ─── Toggles ─────────────────────────────────────────────
  toggleCard: {
    backgroundColor: COLORS.background,
    borderWidth: BORDERS.hairline,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    gap: SPACING.md,
  },
  toggleOrnament: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textBrass,
    width: 24,
    textAlign: 'center',
  },
  toggleInfo: {
    flex: 1,
  },
  toggleTitle: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.md + 2,
    color: COLORS.textPrimary,
    letterSpacing: 0.3,
  },
  toggleDesc: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs + 1,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    lineHeight: 17,
    marginTop: 1,
  },
  toggleBox: {
    width: 26,
    height: 26,
    borderWidth: BORDERS.rule,
    borderColor: COLORS.rule,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBoxOn: {
    backgroundColor: COLORS.playerX,
    borderColor: COLORS.playerX,
  },
  toggleCheck: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.md,
    color: 'transparent',
    lineHeight: FONT_SIZES.md,
  },
  toggleCheckOn: {
    color: COLORS.background,
  },
  toggleDivider: {
    height: 1,
    backgroundColor: COLORS.border,
  },

  // ─── Play button ─────────────────────────────────────────
  playSection: {
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },

  // ─── Footer ──────────────────────────────────────────────
  footer: {
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    marginTop: SPACING.md,
  },
  footerDivider: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textMuted,
  },
  footerLink: {
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
  },
  footerOrnament: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textBrass,
    marginBottom: 2,
  },
  footerLinkLabel: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  footerLinkCaption: {
    fontFamily: FONTS.body,
    fontStyle: 'italic',
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  colophon: {
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.xs - 1,
    color: COLORS.textMuted,
    letterSpacing: 1.4,
    marginTop: SPACING.lg,
    textAlign: 'center',
  },
});
